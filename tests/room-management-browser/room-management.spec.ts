import { test, expect, type BrowserContext, type Dialog, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import type { Identity } from '../../src/shared/types.js';

const nodeOrigin='http://127.0.0.1:3321',workerOrigin='https://127.0.0.1:8797';
const deployment={backends:[{id:'cloudflare',origin:workerOrigin,transport:'worker',enabled:true},{id:'aliyun',origin:nodeOrigin,transport:'socketio',enabled:true}]};
let app:ReturnType<typeof createApplication>;
const previousEnv={BACKEND_ID:process.env.BACKEND_ID,BACKENDS_CONFIG_JSON:process.env.BACKENDS_CONFIG_JSON};
test.beforeAll(async()=>{
  process.env.BACKEND_ID='aliyun';process.env.BACKENDS_CONFIG_JSON=JSON.stringify(deployment);app=createApplication(':memory:');
  await new Promise<void>(resolve=>app.http.listen(3321,'127.0.0.1',resolve));
});
test.afterAll(async()=>{await app.close();for(const [key,value] of Object.entries(previousEnv))if(value===undefined)delete process.env[key];else process.env[key]=value;});

async function connect(context:BrowserContext,identity:Identity,backend:'cloudflare'|'aliyun',origin:string){
  await context.route('**/backends.json',route=>route.fulfill({json:deployment}));
  await context.addInitScript(({identity,backend})=>{
    localStorage.setItem(`magical-athlete:identity:${backend}:${identity.roomCode}`,JSON.stringify({...identity,backendId:backend}));
    localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:muted','true');
  },{identity,backend});
  const page=await context.newPage();await page.goto(`${origin}/room/${backend==='cloudflare'?'C':'A'}-${identity.roomCode}`);await expect(page.locator('.connection.is-online')).toBeVisible();return page;
}
async function confirm(page:Page,button:ReturnType<Page['getByRole']>,accept:boolean,pattern:RegExp){
  const dialog=page.waitForEvent('dialog');const click=button.click();const prompt=await dialog;expect(prompt.message()).toMatch(pattern);if(accept)await prompt.accept();else await prompt.dismiss();await click;
}
async function togglePause(page:Page,paused:boolean){
  const dialogs:string[]=[],onDialog=(dialog:Dialog)=>{dialogs.push(dialog.message());void dialog.dismiss();};page.on('dialog',onDialog);
  try{
    await page.getByRole('button',{name:paused?'暂停比赛':'恢复比赛',exact:true}).click();
    if(paused)await expect(page.getByTestId('room-pause-notice')).toBeVisible();else await expect(page.getByTestId('room-pause-notice')).toHaveCount(0);expect(dialogs).toEqual([]);
  }finally{page.off('dialog',onDialog);}
}

for(const backend of ['cloudflare','aliyun'] as const)for(const device of ['desktop','mobile'] as const)test(`${backend} ${device}: kick confirmation, invalid credentials, pause/leave/reconnect and resume`,async({browser},info)=>{
  const contexts:BrowserContext[]=[],pages:Page[]=[],errors:string[]=[];const origin=backend==='cloudflare'?workerOrigin:nodeOrigin,prefix=backend==='cloudflare'?'/api/browser/rooms':'/api/rooms';
  const viewport=device==='mobile'?{width:390,height:844}:{width:1440,height:1000};
  try{
    for(let i=0;i<4;i++)contexts.push(await browser.newContext({viewport,ignoreHTTPSErrors:true}));
    const created=await contexts[0]!.request.post(origin+prefix,{data:{name:'房主',maxPlayers:2,timeoutSeconds:30}});expect(created.status()).toBe(201);const hostReply=await created.json(),code=hostReply.identity.roomCode;
    const joined=await contexts[1]!.request.post(`${origin}${prefix}/${code}/join`,{data:{name:'准备离开的同学'}});expect(joined.status()).toBe(201);const guestReply=await joined.json();
    const watch=await contexts[2]!.request.post(`${origin}${prefix}/${code}/join`,{data:{name:'观众',role:'spectator'}});expect(watch.status()).toBe(201);const watchReply=await watch.json();
    const host=await connect(contexts[0]!,hostReply.identity,backend,origin),guest=await connect(contexts[1]!,guestReply.identity,backend,origin),viewer=await connect(contexts[2]!,watchReply.identity,backend,origin);pages.push(host,guest,viewer);
    for(const page of pages)page.on('pageerror',e=>errors.push(e.message));
    await expect(guest.locator('.seat-kick')).toHaveCount(0);await expect(viewer.locator('.seat-kick')).toHaveCount(0);await expect(host.locator('.seat-kick')).toHaveCount(1);
    await guest.getByRole('button',{name:'我准备好了',exact:true}).click();const kick=host.getByRole('button',{name:'踢出 准备离开的同学',exact:true});
    await confirm(host,kick,false,/席位和准备状态/);await expect(host.locator('.lobby-count')).toContainText('2');await expect(guest.getByRole('button',{name:'取消准备',exact:true})).toBeVisible();
    await expect(kick).toHaveCSS('color','rgb(142, 48, 43)');expect(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await host.screenshot({path:info.outputPath('lobby.png'),fullPage:true});
    await confirm(host,kick,true,/踢出房间/);await expect(guest.getByTestId('room-kicked')).toBeVisible();await expect(host.locator('.seat-kick')).toHaveCount(0);await expect(viewer.getByText(/准备离开的同学 已被房主踢出房间/).first()).toBeVisible();
    const status=await contexts[1]!.request.post(`${origin}${prefix}/${code}/resume-status`,{data:guestReply.identity});expect(status.status()).toBe(401);
    expect(await guest.evaluate(({backend,code})=>localStorage.getItem(`magical-athlete:identity:${backend}:${code}`),{backend,code})).toBeNull();await guest.screenshot({path:info.outputPath('kicked.png'),fullPage:true});
    const replacement=await contexts[3]!.request.post(`${origin}${prefix}/${code}/join`,{data:{name:'新同学'}});expect(replacement.status()).toBe(201);const replacementReply=await replacement.json();expect(replacementReply.identity.playerId).not.toBe(guestReply.identity.playerId);
    const peer=await connect(contexts[3]!,replacementReply.identity,backend,origin);pages.push(peer);peer.on('pageerror',e=>errors.push(e.message));
    for(const page of [host,peer])await page.getByRole('button',{name:'我准备好了',exact:true}).click();await host.getByRole('button',{name:'开始选秀',exact:true}).click();await expect(host.getByRole('button',{name:'暂停比赛',exact:true})).toBeEnabled();await expect(host.locator('.seat-kick')).toHaveCount(0);
    await expect(host.locator('.room-pause-description')).toHaveText('操作、计时与动画将暂停暂停后离线保留 4 小时');
    await expect(host.getByRole('button',{name:'暂停比赛',exact:true})).toHaveAccessibleDescription(/操作、计时与动画将暂停.*4 小时/);
    await togglePause(host,true);for(const page of [host,peer,viewer])await expect(page.getByTestId('room-pause-notice')).toContainText('4 小时');
    await expect(host.locator('.room-pause-description')).toContainText('已暂停');await host.screenshot({path:info.outputPath('paused.png'),fullPage:true});
    await host.getByRole('button',{name:'退出房间',exact:true}).click();const leaving=host.getByRole('dialog',{name:'离开这个房间？'});await expect(leaving).toContainText('4 小时');await expect(leaving).toContainText('60 秒');await expect(leaving).toContainText('原浏览器');expect(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await leaving.screenshot({path:info.outputPath('paused-leave.png')});
    await leaving.getByRole('button',{name:'确认退出房间',exact:true}).click();await expect(host.getByRole('button',{name:'返回刚才创建的房间',exact:true})).toBeVisible();await expect(peer.getByTestId('room-pause-notice')).toContainText('重连不顺延');
    await host.getByRole('button',{name:'返回刚才创建的房间',exact:true}).click();await expect(host.locator('.connection.is-online')).toBeVisible();await expect(host.getByTestId('room-pause-notice')).toContainText('重连不顺延');await togglePause(host,false);await expect(peer.getByTestId('room-pause-notice')).toHaveCount(0);expect(errors).toEqual([]);
    await host.getByRole('button',{name:'结束房间',exact:true}).click();await host.getByRole('button',{name:'确认结束',exact:true}).click();await expect(host.locator('[data-room-closed="true"]')).toBeVisible();
  }finally{await Promise.all(contexts.map(c=>c.close()));}
});

for(const backend of ['cloudflare','aliyun'] as const)for(const mode of ['ai','practice'] as const)test(`${backend} ${mode}: direct pause shows the original retention beside the button`,async({browser},info)=>{
  const origin=backend==='cloudflare'?workerOrigin:nodeOrigin,prefix=backend==='cloudflare'?'/api/browser/rooms':'/api/rooms';
  const context=await browser.newContext({viewport:mode==='ai'?{width:390,height:844}:{width:1440,height:1000},ignoreHTTPSErrors:true}),errors:string[]=[];
  const label=mode==='ai'?'30 分钟':'10 分钟';
  try{
    const created=await context.request.post(origin+prefix,{data:{name:'暂停房主',maxPlayers:2,timeoutSeconds:30,mode,aiCount:1}});expect(created.status()).toBe(201);
    const reply=await created.json(),page=await connect(context,reply.identity,backend,origin);page.on('pageerror',e=>errors.push(e.message));
    await expect(page.locator('.room-pause-description')).toContainText(`暂停后离线保留 ${label}`);
    await togglePause(page,true);await expect(page.getByTestId('room-pause-notice')).toContainText(label);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:info.outputPath('paused.png')});
    await page.getByRole('button',{name:'退出房间',exact:true}).click();const leaving=page.getByRole('dialog',{name:'离开这个房间？'});await expect(leaving).toContainText(label);
    await leaving.getByRole('button',{name:'继续留在房间',exact:true}).click();await togglePause(page,false);await expect(page.locator('.room-pause-description')).toContainText('将暂停');expect(errors).toEqual([]);
    await page.getByRole('button',{name:'结束房间',exact:true}).click();await page.getByRole('button',{name:'确认结束',exact:true}).click();await expect(page.locator('[data-room-closed="true"]')).toBeVisible();
  }finally{await context.close();}
});
