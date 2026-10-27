import { test,expect,type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { CHARACTERS } from '../../src/shared/characters.js';
import type { Room } from '../../src/shared/types.js';

let app:ReturnType<typeof createApplication>,url:string;
test.beforeAll(async()=>{app=createApplication(':memory:');await new Promise<void>(resolve=>app.http.listen(0,'127.0.0.1',resolve));const address=app.http.address();if(!address||typeof address==='string')throw Error('no server address');url=`http://127.0.0.1:${address.port}`;});
test.afterAll(async()=>{await app.close();});
test.use({actionTimeout:20000});

function publish(room:Room){for(const socket of app.io.sockets.sockets.values())if(socket.data.identity?.roomCode===room.code)socket.emit('snapshot',app.rooms.view(room,socket.data.identity.playerId));}
const name=(id:string)=>CHARACTERS.find(c=>c.id===id)!.nameZh;
async function pick(page:Page,ids:string[]){for(const id of ids)await page.getByRole('button',{name:`选择${name(id)}`,exact:true}).click();}

for(const [capacity,mode] of [[3,'single'],[8,'double']] as const)test(`three actual players in ${capacity}-seat room choose ${mode}, restore ordered selection and fit desktop/mobile`,async({browser})=>{
  const host=app.rooms.create('三人房主',capacity,0),code=host.identity.roomCode;
  const members=[host,app.rooms.join(code,'朋友甲'),app.rooms.join(code,'朋友乙')];
  const contexts=await Promise.all(members.map(()=>browser.newContext({viewport:{width:1440,height:1000}}))),pages:Page[]=[],errors:string[]=[];
  const evidence='docs/qa/three-player-mode';mkdirSync(evidence,{recursive:true});
  try{
    for(const [i,context] of contexts.entries()){
      await context.addInitScript(identity=>{localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`,JSON.stringify({...identity,backendId:'cloudflare'}));localStorage.setItem('magical-athlete:low-quality','true');localStorage.setItem('magical-athlete:reduced-motion','true');localStorage.setItem('magical-athlete:animation-speed','4');},members[i]!.identity);
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));pages.push(page);await page.goto(`${url}/room/C-${code}`);await expect(page.locator('.connection.is-online')).toBeVisible();
    }
    for(const page of pages)await page.getByRole('button',{name:'我准备好了',exact:true}).click();
    const h=pages[0]!,dialog=h.getByRole('dialog',{name:'选择三人玩法'}),confirm=dialog.getByRole('button',{name:'确认玩法并开始选秀'});
    await h.getByRole('button',{name:'开始选秀',exact:true}).click();await expect(dialog).toBeVisible();await expect(confirm).toBeDisabled();await expect(pages[1]!.getByRole('dialog')).toHaveCount(0);
    await dialog.getByRole('button',{name:'返回大厅'}).click();await expect(dialog).toHaveCount(0);expect(app.rooms.get(code).game.phase).toBe('lobby');
    await h.getByRole('button',{name:'开始选秀',exact:true}).click();
    if(capacity===8){
      const fourth=app.rooms.join(code,'临时第四人');publish(app.rooms.get(code));await expect(dialog).toHaveCount(0);
      app.rooms.leave(fourth.identity);publish(app.rooms.get(code));await h.getByRole('button',{name:'开始选秀',exact:true}).click();await expect(dialog).toBeVisible();
    }
    await dialog.getByRole('radio',{name:mode==='single'?/每人单角色/:/每人双角色/}).check();await expect(confirm).toBeEnabled();
    await h.screenshot({path:`${evidence}/${mode}-desktop.png`,fullPage:true});await h.setViewportSize({width:390,height:844});
    expect(await h.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await h.screenshot({path:`${evidence}/${mode}-mobile.png`,fullPage:true});
    await confirm.click();await expect.poll(()=>app.rooms.get(code).game.phase).toBe('draft');expect(app.rooms.get(code).game.config!.threePlayerMode).toBe(mode);
    while(app.rooms.get(code).game.phase==='draft'){
      const current=app.rooms.get(code),draft=current.game.draft!;
      expect(app.rooms.act(code,draft.order[draft.cursor]!,{actionId:crypto.randomUUID(),expectedVersion:current.version,action:{type:'draft',characterId:draft.market[0]!}}).ok).toBe(true);
    }
    publish(app.rooms.get(code));await h.reload();await expect(h.getByRole('button',{name:'锁定上场角色',exact:true})).toBeVisible();
    const n=mode==='double'?2:1,chosen=app.rooms.get(code).game.players[0]!.hand.slice(0,n);
    expect(app.rooms.get(code).game.players.every(p=>p.hand.length===4*n)).toBe(true);
    await pick(h,chosen);
    if(n===2){await expect(h.getByRole('region',{name:'本场行动顺序'})).toBeVisible();await h.getByRole('button',{name:'交换行动顺序',exact:true}).click();chosen.reverse();await h.screenshot({path:`${evidence}/double-selection-mobile.png`,fullPage:true});}
    await h.getByRole('button',{name:'锁定上场角色',exact:true}).click();await expect.poll(()=>app.rooms.get(code).game.players[0]!.selection).toEqual(chosen);
    await h.reload();await expect(h.getByText('你已锁定，等大家选好就揭示')).toBeVisible();
    expect(app.rooms.view(app.rooms.get(code),members[1]!.identity.playerId).players[0]!.selection).toBeUndefined();
    for(let i=1;i<3;i++){const ids=app.rooms.get(code).game.players[i]!.hand.slice(0,n);await pick(pages[i]!,ids);await pages[i]!.getByRole('button',{name:'锁定上场角色',exact:true}).click();}
    await expect.poll(()=>app.rooms.get(code).game.racers.length).toBe(3*n);expect(app.rooms.get(code).game.players.every(p=>p.used.length===n)).toBe(true);expect(errors).toEqual([]);
  }finally{for(const context of contexts)await context.close();}
});
