import { test, expect, type Browser } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { portalConnections, portalEndpoints } from '../../src/client/portal-guide.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address(); if (!address || typeof address === 'string') throw Error('No test address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await app.close(); });

async function openBoard(browser: Browser, width: number, height: number, candidate: boolean, reduced: boolean) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<650});
  const page=await context.newPage(),made=app.rooms.create('传送指示检查',8,0),code=made.identity.roomCode;
  for(let i=1;i<8;i++)app.rooms.join(code,`标识检查${i}`);
  const room=app.rooms.get(code),game=createGame(room.game.players,731);
  Object.assign(game,{phase:'race',round:1,track:'whirly-world',currentRacerId:'r0',baseTurnOrder:game.players.map((_,i)=>`r${i}`)});
  game.racers=game.players.map((player,i)=>({id:`r${i}`,playerId:player.id,characterId:'banana',position:i?3:2,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.flags.testDice=[1];game.queue=[{kind:'beginTurn',racerId:'r0'}];resolveTasks(game);room.game=game;room.version++;app.store.save(room);
  await page.addInitScript(({identity,reduced,width})=>{
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`,JSON.stringify(identity));
    for(const [key,value]of Object.entries({'reduced-motion':String(reduced),'low-quality':'false',muted:'true','scene-appearance':width<900?'night':'day'}))localStorage.setItem(`magical-athlete:${key}`,value);
  },{identity:made.identity,reduced,width});
  await page.goto(`${url}/room/${code}${candidate?'?mechanisms=1&environment=1':''}`);
  await expect(page.getByTestId('board-3d')).toBeVisible();
  return{context,page,code};
}

for(const [width,height,candidate]of[[1280,900,true],[390,844,true],[844,390,true],[390,844,false]]as const)test(`portal key before activation ${width}x${height}, candidate=${candidate}`,async({browser},info)=>{
  const {context,page}=await openBoard(browser,width,height,candidate,true);
  try{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const guide=page.getByTestId('portal-legend'),summary=guide.locator('summary');
    await expect(summary).toBeVisible();expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator('.portal-sign')).toHaveCount(12);await expect(page.locator('.minimap-portals [data-portal-node]')).toHaveCount(12);
    for(const edge of portalEndpoints('whirly-world'))await expect(page.locator(`.portal-sign[data-portal-node="${edge.from}"]`)).toHaveAttribute('data-portal-to',String(edge.to));
    if(width<900)await summary.tap();else await summary.click();
    await expect(guide).toHaveAttribute('open','');
    for(const pair of portalConnections('whirly-world'))await expect(guide.locator(`[data-portal-pair="${pair.key}"]`)).toContainText(`${pair.from}↔${pair.to}`);
    const panel=guide.locator('.portal-pair-panel'),box=(await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.y+box.height).toBeLessThanOrEqual(height);
    expect(await panel.locator('li').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
    await page.screenshot({path:info.outputPath('portal-key.png')});
    // Repeated touch toggles must not move the page, arm a game action or leave a stale overlay.
    for(let i=0;i<3;i++){await summary.click();await expect(guide).not.toHaveAttribute('open','');await summary.click();await expect(guide).toHaveAttribute('open','');}
    await summary.click();await expect(guide).not.toHaveAttribute('open','');
    await page.reload();await expect(page.getByTestId('portal-legend')).not.toHaveAttribute('open','');
    expect(errors).toEqual([]);
  }finally{await context.close();}
});

test('the actual confirmed warp route is temporary and keeps its original one-hop result',async({browser})=>{
  const {context,page,code}=await openBoard(browser,1280,900,true,false);
  try{
    await expect(page.locator('.portal-active-route')).toHaveCount(0);
    await page.getByTestId('roll-button').click();
    await expect(page.locator('.portal-active-route')).toHaveText('传送 3→5');
    await expect(page.locator('.portal-active-route')).toHaveCount(0);
    expect(app.rooms.get(code).game.racers[0]!.position).toBe(5);
    expect(app.rooms.get(code).game.logs.filter(log=>log.cause==='track-whirl')).toHaveLength(1);
    await expect(page.locator('.portal-sign')).toHaveCount(12);
  }finally{await context.close();}
});
