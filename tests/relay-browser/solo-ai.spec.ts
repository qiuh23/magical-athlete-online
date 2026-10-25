import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { RoomView } from '../../src/shared/types.js';

const url = process.env.RELAY_URL ?? 'http://127.0.0.1:8787';
const output = 'test-results/solo-ai';
type PublicSnapshot={version:number;game:RoomView};
const snapshots=new WeakMap<Page,RoomView>();
async function saved(page:Page,_code:string):Promise<PublicSnapshot>{
  await expect.poll(()=>snapshots.has(page)).toBe(true);
  const game=snapshots.get(page)!;return {version:game.version,game};
}
async function setup(page: Page, mode: 'practice' | 'ai', aiCount = 3) {
  page.on('websocket',socket=>socket.on('framereceived',frame=>{try{const message=JSON.parse(String(frame.payload));if(message.type==='snapshot')snapshots.set(page,message.room as RoomView);}catch{/* ping */}}));
  await page.addInitScript(() => { try {
    localStorage.setItem('magical-athlete:muted', 'true');
    localStorage.setItem('magical-athlete:low-quality', 'true');
    localStorage.setItem('magical-athlete:animation-speed', '4');
    localStorage.setItem('magical-athlete:reduced-motion', 'true');
  } catch { /* Opaque initial page. */ } });
  await page.goto(url);await page.getByRole('tab',{name:'创建房间',exact:true}).click(); await page.getByLabel('你的昵称').fill(mode === 'practice' ? '独自练习' : '人机验收玩家');
  await page.getByRole('tab', { name: mode === 'practice' ? '自己练习' : '人机对战', exact: true }).click();
  if (mode === 'ai') await page.getByLabel('AI 人数', { exact: true }).selectOption(String(aiCount));
  await page.getByRole('button', { name: mode === 'practice' ? '开始自己练习' : '开始人机对战', exact: true }).click();
  await expect(page).toHaveURL(/\/room\/[CA]-[A-Z2-9]{6}$/);
  await expect(page.locator('.connection.is-online')).toBeVisible();
  const code = page.url().split('/').at(-1)!.replace(/^[CA]-/,'');
  const selfId = await page.evaluate(code => JSON.parse(localStorage.getItem(`magical-athlete:identity:cloudflare:${code}`)!).playerId as string, code);
  return { code, selfId };
}
async function viewport(page: Page) {
  await expect(page.getByTestId('board-3d')).toBeVisible();
  await expect.poll(async () => Number(await page.getByTestId('board-3d').getAttribute('data-triangles'))).toBeGreaterThan(100);
  const result = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, board: document.querySelector('[data-testid="board-3d"]')?.getBoundingClientRect().toJSON() }));
  expect(result.scrollWidth).toBeLessThanOrEqual(result.width + 1);
  expect(result.scrollHeight).toBeLessThanOrEqual(result.height + 1);
  expect(result.board?.width).toBeGreaterThanOrEqual(result.width - 2);
  expect(result.board?.height).toBeGreaterThanOrEqual(result.height - 2);
}
// Reads only determine who can act and what the UI already exposes. Every
// submitted pick, selection, choice, throw and next-round action is a UI click.
async function actAsHuman(page: Page, room: PublicSnapshot, selfId: string) {
  await expect.poll(async () => Number(await page.locator('.game-shell').getAttribute('data-room-version'))).toBeGreaterThanOrEqual(room.version);
  const game = room.game;
  if (game.phase === 'race' && !game.pending && ['starting','resolving'].includes(game.turnStage??'')) return false;
  if(game.waitingFor&&game.waitingFor!==selfId)return false;
  if (game.pending) {
    if (game.pending.playerId !== selfId) return false;
    const option = game.pending.options.find(option => ['skip', 'pass', 'decline'].includes(option.id)) ?? game.pending.options[0]!;
    await page.getByRole('region', { name: '待处理技能' }).getByRole('button', { name: option.label, exact: true }).click(); return true;
  }
  if (game.phase === 'draft') {
    if (game.draft?.order[game.draft.cursor] !== selfId) return false;
    if (game.mode === 'practice') {
      const pool=page.getByRole('region',{name:'练习角色牌池'});
      await expect(pool.locator('.character-card')).toHaveCount(72);
      for(let index=0;index<4;index++)await pool.locator('.character-card .character-art').nth(index).click();
      await expect(pool.getByRole('status')).toHaveText('已选 4 / 4 张 · 完整牌池 72 张');
      await pool.getByRole('button',{name:'确认练习阵容',exact:true}).click();return true;
    }
    await page.locator('.character-card .character-art').first().click();
    const confirm = page.getByRole('button', { name: /确认选择/ }); if (await confirm.count()) await confirm.click(); return true;
  }
  if (game.phase === 'selection') {
    const own = game.players.find(player => player.id === selfId)!; if (own.selected) return false;
    const count = game.players.length === 2 ? 2 : 1;
    for (let index = 0; index < count; index++) await page.locator('.hand-selection .character-card').filter({ has: page.getByRole('button', { name: /选择/ }) }).nth(index).getByRole('button', { name: /选择/ }).click();
    await page.getByRole('button', { name: '锁定上场角色', exact: true }).click(); return true;
  }
  if (game.phase === 'results') { await page.getByRole('button', { name: '前往下一场', exact: true }).click(); return true; }
  if (game.phase === 'race' && game.racers.find(racer => racer.id === game.currentRacerId)?.playerId === selfId) {
    await page.getByRole('button', { name: '掷骰子', exact: true }).click(); return true;
  }
  if (game.phase === 'lobby') {
    const ready = page.getByRole('button', { name: '我准备好了', exact: true }); if (await ready.count()) await ready.click();
    const start = page.getByRole('button', { name: '开始选秀', exact: true }); if (await start.count() && await start.isEnabled()) await start.click(); return true;
  }
  if (game.phase === 'paused') throw Error(`Unexpected authoritative pause: ${game.rulesStatus}`);
  return false;
}

test('practice starts with one human and no waiting room, plays skills and movement on mobile', async ({ browser }) => {
  mkdirSync(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await context.newPage(), errors: string[] = []; page.on('pageerror', error => errors.push(error.stack ?? error.message));
  try {
    const { code, selfId } = await setup(page, 'practice');
    let turns = 0, hasRaced = false, actions = 0;
    while (actions++ < 180) {
      const room = await saved(page, code);
      expect(room.game.players).toHaveLength(1);
      if (room.game.phase === 'race') {
        hasRaced = true; await viewport(page);
        expect(room.game.racers.every(racer => racer.playerId === selfId)).toBe(true);
        turns = room.game.logs.filter(event=>event.type==='turn').length;
        if (turns >= 4 || room.game.logs.filter(event => event.type === 'move').length >= 4) break;
      }
      if (['results', 'finished'].includes(room.game.phase)) break;
      const acted = await actAsHuman(page, room, selfId);
      if (acted) await expect.poll(async () => (await saved(page, code)).version).toBeGreaterThan(room.version);
      else await expect.poll(async () => (await saved(page, code)).version).toBeGreaterThan(room.version);
    }
    const final = await saved(page, code); expect(hasRaced).toBe(true);
    expect(final.game.logs.some(event => event.type === 'die')).toBe(true);
    expect(final.game.logs.some(event => event.type === 'move')).toBe(true);
    expect(final.game.phase).not.toBe('paused');
    await page.screenshot({ path: `${output}/practice-mobile.png` }); expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test('three AI complete all four official races with autonomous draft, deployment, throws and choices', async ({ browser }) => {
  test.setTimeout(900_000); mkdirSync(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage(), errors: string[] = []; page.on('pageerror', error => errors.push(error.stack ?? error.message));
  await page.addInitScript(()=>{
    const qa={animationSkipClicks:0,phases:[] as string[],renderedEvents:[] as number[]};
    (window as typeof window&{__soloQA:typeof qa}).__soloQA=qa;
    document.addEventListener('click',event=>{if((event.target as Element|null)?.closest('[data-testid="skip-animation"]'))qa.animationSkipClicks++;},true);
    new MutationObserver(()=>{const board=document.querySelector('[data-testid="board-3d"]');if(!board)return;const phase=board.getAttribute('data-phase')??'idle';if(qa.phases.at(-1)!==phase)qa.phases.push(phase);for(const id of (board.getAttribute('data-event-ids')??'').split(',').map(Number).filter(Boolean))if(!qa.renderedEvents.includes(id))qa.renderedEvents.push(id);}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-phase','data-event-ids']});
  });
  const started = Date.now();
  try {
    const { code, selfId } = await setup(page, 'ai', 3);
    let actions = 0, aiAdvances = 0, lastRound = -1, captured = false;
    const observedAI = { draft: 0, selection: 0, choice: 0, roll: 0 };
    while (true) {
      const room = await saved(page, code), game = room.game;
      expect(game.players).toHaveLength(4);
      if (game.phase === 'finished') break;
      if (++actions > 3000) throw Error(`Exceeded human action budget: phase=${game.phase} round=${game.round}`);
      if (game.round !== lastRound || actions % 50 === 0) { lastRound = game.round; console.log(`[solo-ai] round=${game.round} phase=${game.phase} humanActions=${actions} version=${room.version} elapsedMs=${Date.now() - started}`); }
      if (game.waitingFor && game.waitingFor !== selfId) observedAI.choice++;
      else if (game.phase === 'draft' && game.draft?.order[game.draft.cursor] !== selfId) observedAI.draft++;
      else if (game.phase === 'selection' && game.players.find(player => player.id === selfId)?.selected) observedAI.selection++;
      else if (game.phase === 'race' && game.racers.find(racer => racer.id === game.currentRacerId)?.playerId !== selfId) observedAI.roll++;
      if (game.phase === 'race' && !captured) {
        await expect(page.getByTestId('board-3d')).toBeVisible(); await viewport(page);
        await page.screenshot({ path: `${output}/ai-desktop.png` }); captured = true;
      }
      const acted = await actAsHuman(page, room, selfId);
      await expect.poll(async () => (await saved(page, code)).version, { timeout: 30000 }).toBeGreaterThan(room.version);
      if (!acted) aiAdvances++;
    }
    const final = await saved(page, code);
    // Authority completion may precede the final local dice/skill/finish beats.
    // Keep the page open until the sequential presentation reaches its result.
    await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase','idle',{timeout:120000});
    await expect(page.locator('.race-results-overlay .results-panel')).toBeVisible({timeout:120000});
    expect(final.game.results).toHaveLength(4); expect(aiAdvances).toBeGreaterThan(0); expect(captured).toBe(true);
    expect(observedAI.draft).toBeGreaterThan(0); expect(observedAI.roll).toBeGreaterThan(0);
    const aiIds = final.game.players.filter(player => player.id !== selfId).map(player => player.id);
    for (const result of final.game.results) expect(result.placements.some(place => aiIds.includes(place.playerId))).toBe(true);
    expect(final.game.logs.some(event=>event.type==='die')).toBe(true); expect(errors).toEqual([]);
    const playback=await page.evaluate(()=>(window as typeof window&{__soloQA:{animationSkipClicks:number;phases:string[];renderedEvents:number[]}}).__soloQA);
    expect(playback.animationSkipClicks).toBe(0);expect(playback.phases).toContain('dice');
    expect(playback.phases.at(-1)).toBe('idle');
    await page.screenshot({ path: `${output}/ai-four-race-final.png` });
    writeFileSync(`${output}/ai-four-race-result.json`, JSON.stringify({ elapsedMs: Date.now() - started, actions, aiAdvances, observedAI, errors, finalPlaybackPhase:await page.getByTestId('board-3d').getAttribute('data-phase'),playback, results: final.game.results, scores: final.game.players.map(({ id, name, score }) => ({ id, name, score })) }, null, 2));
  } finally { await context.close(); }
});
