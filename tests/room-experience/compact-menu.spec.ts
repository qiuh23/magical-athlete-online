import { test, expect } from './fixtures.js';
import { presetCompetition, createMatchPlan } from '../../src/shared/competition.js';

// Explicit local browser regression; no CI matrix or deployment changes.
for (const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]) test(`race menu stays compact and reachable at ${width}x${height}`,async({page,application},info)=>{
  await page.setViewportSize({width:width!,height:height!});
  const made=application.rooms.create('菜单检查',3,0),code=made.identity.roomCode;
  application.rooms.join(code,'第二位');application.rooms.join(code,'第三位');
  const room=application.rooms.get(code),game=room.game;
  game.phase='race';game.round=1;game.currentRacerId='r0';game.flags.awaitRoll=true;
  game.config!.competition=presetCompetition('official');game.matchPlan=createMatchPlan(game.config);
  game.racers=['coach','banana','genius'].map((characterId,i)=>({id:`r${i}`,playerId:game.players[i]!.id,characterId,position:0,tripped:false,finished:false,eliminated:false,flags:{}}));
  game.baseTurnOrder=game.racers.map(r=>r.id);room.version++;room.deadline=null;application.store.save(room);
  await page.addInitScript(identity=>{
    localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`,JSON.stringify({...identity,backendId:'cloudflare'}));
    localStorage.setItem('magical-athlete:reduced-motion','true');
  },made.identity);
  await page.goto(`/room/C-${code}`);await expect(page.getByTestId('board-3d')).toBeVisible();
  const trigger=page.getByTestId('presentation-settings'),panel=page.locator('#presentation-settings-panel');
  await trigger.click();await expect(panel).toBeVisible();await expect(panel.locator('details[open]')).toHaveCount(0);
  await expect(panel.locator('.race-menu-shortcuts button')).toHaveCount(3);
  await page.screenshot({path:info.outputPath(`menu-${width}.png`)});
  for(const title of ['画面与声音','比赛设置','选手与队伍','更多操作']){
    const summary=panel.locator('summary').filter({hasText:title});await summary.click();
    await expect(panel.locator('details[open]')).toHaveCount(1);
    expect(await panel.evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
    expect(await panel.locator('.race-menu-panel-scroll').evaluate(node=>node.scrollWidth<=node.clientWidth+1)).toBe(true);
    const box=await summary.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
    for(const control of await panel.locator('button:visible,select:visible').all()){
      await control.scrollIntoViewIfNeeded();const rect=await control.boundingBox(),bounds=await panel.boundingBox();
      expect(rect!.x).toBeGreaterThanOrEqual(bounds!.x-1);expect(rect!.x+rect!.width).toBeLessThanOrEqual(bounds!.x+bounds!.width+1);
      expect(rect!.height).toBeGreaterThanOrEqual(44);
    }
  }
  await panel.getByRole('button',{name:'关闭比赛菜单'}).click();await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();
  await trigger.focus();await page.keyboard.press('Enter');await panel.locator('summary').filter({hasText:'画面与声音'}).focus();await page.keyboard.press('Enter');
  await panel.getByLabel('场景光照').selectOption('day');await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();
  for(const label of ['累计积分','事件记录','本场赛事与地图']){
    await trigger.click();await panel.getByRole('button',{name:label,exact:true}).click();await expect(panel).toHaveCount(0);
    await expect(page.getByRole('dialog',{name:label,exact:true})).toBeVisible();await page.keyboard.press('Escape');
  }
  await trigger.click();await panel.locator('summary').filter({hasText:'更多操作'}).click();await panel.getByRole('button',{name:'返回游戏大厅',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'返回游戏大厅？',exact:true})).toBeVisible();await page.getByRole('button',{name:'继续留在房间',exact:true}).click();
  await expect(page.getByTestId('board-3d')).toBeVisible();expect(new URL(page.url()).pathname).toBe(`/room/C-${code}`);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
