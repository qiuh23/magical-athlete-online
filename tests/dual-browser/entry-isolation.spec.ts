import {test,expect,type BrowserContext} from '@playwright/test';
import {createApplication} from '../../src/server/index.js';

const previewCf='https://127.0.0.1:8798',previewAli='http://game.http.test:3323';
const productionCf='https://127.0.0.1:8797',productionAli='http://game.http.test:3322';
const registry={backends:[
  {id:'cloudflare',origin:previewCf,transport:'worker',enabled:true},
  {id:'aliyun',origin:previewAli,transport:'socketio',enabled:true,allowInsecureHttp:true},
]};
let application:ReturnType<typeof createApplication>;
const originalEnv={BACKEND_ID:process.env.BACKEND_ID,PUBLIC_ORIGINS:process.env.PUBLIC_ORIGINS};
test.beforeAll(async()=>{
  process.env.BACKEND_ID='aliyun';process.env.PUBLIC_ORIGINS=[previewCf,previewAli].join(',');
  application=createApplication(':memory:');
  await new Promise<void>(resolve=>application.http.listen(3323,'127.0.0.1',resolve));
});
test.afterAll(async()=>{
  await application.close();
  for(const [key,value] of Object.entries(originalEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
});
const productionKey='magical-athlete:identity:aliyun:ABC234';
const productionIdentity=JSON.stringify({roomCode:'ABC234',backendId:'aliyun',playerId:'production-only',token:'private-production-token'});
async function configure(context:BrowserContext){
  await context.route('**/backends.json',route=>route.fulfill({json:registry}));
  await context.route('**/deployment.json',route=>route.fulfill({json:{target:'preview',commit:'a'.repeat(40),prNumber:123,runId:1}}));
  await context.addInitScript(()=>localStorage.setItem('magical-athlete:muted','true'));
}

for(const backend of ['cloudflare','aliyun'] as const){
  test(`preview ${backend}: switch, invitation and saved identity never use production`,async({browser})=>{
    const contexts=await Promise.all([browser.newContext({storageState:{cookies:[],origins:[
      {origin:productionCf,localStorage:[{name:productionKey,value:productionIdentity}]},
      {origin:productionAli,localStorage:[{name:productionKey,value:productionIdentity}]},
    ]}}),browser.newContext()]);
    const requests:string[]=[],errors:string[]=[];
    try {
      await Promise.all(contexts.map(configure));
      for(const context of contexts)context.on('request',request=>requests.push(request.url()));
      const host=await contexts[0]!.newPage(),guest=await contexts[1]!.newPage();
      for(const page of [host,guest])page.on('pageerror',error=>errors.push(error.message));
      const target=backend==='cloudflare'?previewCf:previewAli,other=backend==='cloudflare'?previewAli:previewCf;
      await host.goto(other);
      const server=host.getByRole('radio',{name:backend==='cloudflare'?'Cloudflare':'阿里云内地',exact:true});
      await expect(server).toBeEnabled();await server.click();await expect(host).toHaveURL(target+'/');
      await expect(host.getByRole('complementary',{name:'测试环境'})).toBeVisible();
      expect(await host.evaluate(key=>localStorage.getItem(key),productionKey)).toBeNull();
      await host.getByRole('tab',{name:'创建房间',exact:true}).click();
      await host.getByLabel('你的昵称').fill('预览房主');
      await host.getByLabel('房间人数上限').selectOption('2');
      await host.getByLabel('每次操作时限').selectOption('0');
      await host.getByRole('button',{name:'创建房间，召集朋友',exact:true}).click();
      await expect(host.locator('.connection.is-online')).toBeVisible();
      const route=new URL(host.url()).pathname;
      await expect(host.locator('.selectable-link')).toHaveAttribute('href',target+route);
      await guest.goto(other+route+'?token=must-not-transfer');await expect(guest).toHaveURL(target+route);
      await guest.getByLabel('你的昵称').fill('预览访客');
      await guest.getByRole('button',{name:'加入这场胡闹',exact:true}).click();
      await expect(guest.locator('.connection.is-online')).toBeVisible();
      await expect(host.locator('.lobby-seats')).toContainText('预览访客');
      const key=`magical-athlete:identity:${backend}:${route.split('-').at(-1)}`;
      const saved=await guest.evaluate(key=>localStorage.getItem(key),key);expect(saved).toBeTruthy();
      await guest.reload();await expect(guest.locator('.connection.is-online')).toBeVisible();
      expect(await guest.evaluate(key=>localStorage.getItem(key),key)).toBe(saved);
      const state=await contexts[0]!.storageState();
      for(const origin of [productionCf,productionAli])expect(state.origins.find(item=>item.origin===origin)?.localStorage).toEqual([{name:productionKey,value:productionIdentity}]);
      expect(requests.some(value=>[productionCf,productionAli].includes(new URL(value).origin))).toBe(false);
      expect(errors).toEqual([]);
      await host.getByRole('button',{name:'结束房间',exact:true}).click();
      await host.getByRole('button',{name:'确认结束',exact:true}).click();
      await expect(guest.locator('[data-room-closed="true"]')).toBeVisible();
    }finally{await Promise.all(contexts.map(context=>context.close()));}
  });
}
