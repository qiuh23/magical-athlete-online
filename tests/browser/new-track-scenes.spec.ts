import { test, expect } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { boardPoint, trackNodeIds } from '../../src/client/scene/math.js';
import type { TrackId } from '../../src/shared/tracks.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address(); if (!address || typeof address === 'string') throw Error('No test address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await app.close(); });

const courses: { track: TrackId; reversed?: boolean }[] = [
  { track: 'squiggle' }, { track: 'boardwalks' }, { track: 'bridges' }, { track: 'twisty-twirl' }, { track: 'twisty-twirl', reversed: true }, { track: 'whirly-world' },
];
for (const { track, reversed = false } of courses) test(`${track}${reversed ? ' Mirror' : ''} actual 3D course, mobile rotation and overview`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const made = app.rooms.create('地图检查', 2, 0), code = made.identity.roomCode;
  app.rooms.join(code, '另一名选手');
  const room = app.rooms.get(code), game = createGame(room.game.players, 731);
  game.phase = 'race'; game.round = 1; game.track = track; game.currentRacerId = 'r0'; game.baseTurnOrder = ['r0', 'r1'];
  const positions = track === 'boardwalks' ? [31, 50] : track === 'bridges' ? [3, 8] : [19, 23];
  game.racers = game.players.map((player, i) => ({ id: `r${i}`, playerId: player.id, characterId: 'coach', position: positions[i]!, tripped: false, finished: false, eliminated: false, flags: { awaitRoll: true } }));
  if (track === 'twisty-twirl') game.flags.twist = { triggered: true, deck: [], drawn: ['alchemy-lab', 'pinata'], chips: [10, 20], monster: { position: 7 } };
  if (reversed) game.flags.twistReversed = true;
  room.game = game; room.version++; app.store.save(room);
  await page.addInitScript(identity => {
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
    for (const [key, value] of Object.entries({ 'reduced-motion': 'true', 'low-quality': 'true', muted: 'true' })) localStorage.setItem(`magical-athlete:${key}`, value);
  }, made.identity);
  await page.setViewportSize({ width: 1280, height: 900 }); await page.goto(`${url}/room/${code}`);
  const board = page.getByTestId('board-3d'); await expect(board).toBeVisible();
  await expect(board).toHaveAttribute('data-track', track); await expect(board).toHaveAttribute('data-node-count', String(trackNodeIds(track).length));
  if (track === 'twisty-twirl') {
    await expect(board).toHaveAttribute('data-twist-boundary', '13-14');
    await expect(board).toHaveAttribute('data-neutral-monster', '7');
    await expect(board).toHaveAttribute('data-twist-chips', '10,20');
  }
  for (const compact of [false, true]) {
    if (compact) await page.setViewportSize({ width: 390, height: 844 });
    await board.getByRole('button', { name: '总览', exact: true }).click();
    await expect(board).toHaveAttribute('data-camera-state', 'overview');
    for (let i = 0; i < positions.length; i++) {
      const expected = boardPoint(positions[i]!, compact, track), label = board.locator(`.pawn-seat[data-racer-id="r${i}"]`);
      await expect.poll(async () => Number(await label.getAttribute('data-world-x'))).toBeCloseTo(expected[0], 3);
      await expect.poll(async () => Number(await label.getAttribute('data-world-z'))).toBeCloseTo(expected[2], 3);
      await expect.poll(async () => Number(await label.getAttribute('data-world-y'))).toBeCloseTo(expected[1] + .005, 3);
    }
    await expect(board.locator('.scene-fallback')).toHaveCount(0);
    const minimap = board.getByTestId('board-minimap');
    await expect(minimap.locator('[data-map-node="0"] text')).toHaveText(reversed ? '终点' : '起点');
    await expect(minimap.locator('[data-map-node="30"] text')).toHaveText(reversed ? '起点' : '终点');
    if (reversed) await expect(minimap).toContainText('反向赛道');
    const positionLabel = board.getByTestId('minimap-own-position');
    expect(await positionLabel.locator('strong').evaluate(element => element.getBoundingClientRect().right <= element.closest('.minimap-own-position')!.getBoundingClientRect().right)).toBe(true);
    if (track === 'boardwalks') await expect(positionLabel).toContainText('距终点 23 格');
    if (track === 'bridges') {
      await page.getByTestId('bridges-rules').locator('summary').click();
      await expect(page.getByTestId('bridges-rules')).toContainText('交叉处不能换层');
      await expect(positionLabel).toContainText('桥上');
    }
    if (track === 'twisty-twirl') {
      await expect(page.getByTestId('twist-cards')).toContainText('炼金实验室泄漏');
      await expect(page.getByTestId('twist-cards')).toContainText('皮纳塔漏宝');
    }
    if (track === 'whirly-world') {
      await expect(board).toHaveAttribute('data-track-model', 'whirly-world');
      await expect(page.getByTestId('whirly-rules')).toContainText('3↔5、7↔12、10↔15');
      await expect(page.getByTestId('whirly-rules')).toContainText('20↔23');
      await expect(page.getByTestId('whirly-rules')).toContainText('18↔22');
      await expect(page.getByTestId('whirly-rules')).toContainText('24↔27');
      await page.getByTestId('whirly-rules').locator('summary').click();
      await expect(page.getByTestId('whirly-rules')).toContainText('其余格子为普通格');
      await page.getByTestId('whirly-rules').locator('summary').click();
    }
    await board.screenshot({ path: info.outputPath(`${track}-${compact ? 'mobile' : 'desktop'}.png`) });
    await board.getByRole('button', { name: '自己', exact: true }).click();
    await expect(board).toHaveAttribute('data-camera-state', 'self');
    const ownPoint = boardPoint(positions[0]!, compact, track);
    await expect.poll(async () => Number(await board.getAttribute('data-camera-x'))).toBeCloseTo(ownPoint[0], 1);
    await expect.poll(async () => Number(await board.getAttribute('data-camera-z'))).toBeCloseTo(ownPoint[2], 1);
    if (track === 'bridges') await page.getByTestId('bridges-rules').locator('summary').click();
  }
  expect(errors).toEqual([]);
});

test('all six fork directions are clickable on the board, including opponent-controlled backward movement and refresh', async ({ page, browser }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const forks = [[8, 1, 31], [17, 1, 37], [18, 1, 19], [13, -1, 36], [24, -1, 49], [26, -1, 58]] as const;
  for (const [from, distance, destination] of forks) {
    const made = app.rooms.create('选路者', 2, 0), code = made.identity.roomCode, guest = app.rooms.join(code, '另一位玩家');
    const room = app.rooms.get(code), game = createGame(room.game.players, 731), actor = distance < 0 ? 1 : 0;
    game.phase = 'race'; game.round = 1; game.track = 'boardwalks'; game.currentRacerId = `r${actor}`;
    game.racers = game.players.map((p, i) => ({ id: `r${i}`, playerId: p.id, characterId: 'banana', position: i === actor ? from : 0, tripped: false, finished: false, eliminated: false, flags: {} }));
    game.flags.awaitRoll = true; game.queue = [{ kind: 'move', racerId: `r${actor}`, distance, controllerId: made.identity.playerId }]; resolveTasks(game);
    expect(game.pending?.kind).toBe('track-branch'); const choiceId = game.pending!.id;
    room.game = game; room.version++; app.store.save(room);
    await page.addInitScript(identity => { localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity)); for (const key of ['reduced-motion', 'low-quality', 'muted']) localStorage.setItem(`magical-athlete:${key}`, 'true'); }, made.identity);
    await page.setViewportSize({ width: from === 8 ? 1280 : 390, height: 844 }); await page.goto(`${url}/room/${code}`);
    const arrows = page.locator('.route-arrow'); await expect(arrows).toHaveCount(2);
    if (from === 8) {
      const before = await page.getByTestId('route-arrow-31').locator('svg').getAttribute('style');
      await page.setViewportSize({ width: 390, height: 844 });
      await expect.poll(() => page.getByTestId('route-arrow-31').locator('svg').getAttribute('style')).not.toBe(before);
      await page.reload(); await expect(arrows).toHaveCount(2); expect(app.rooms.get(code).game.pending!.id).toBe(choiceId);
      const otherContext = await browser.newContext(), other = await otherContext.newPage();
      try { await other.addInitScript(identity => localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity)), guest.identity); await other.goto(`${url}/room/${code}`); await expect(other.getByTestId('board-3d')).toBeVisible(); await expect(other.locator('.route-arrow')).toHaveCount(0); } finally { await otherContext.close(); }
    }
    await expect(page.getByTestId('board-3d')).toHaveAttribute('data-camera-state', 'choice');
    for (const arrow of await arrows.all()) {
      await expect(arrow).toHaveAttribute('data-from', String(from));
      await expect.poll(() => arrow.evaluate(element => { const r = element.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') === element; })).toBe(true);
    }
    if (from === 8 || from === 13) await page.screenshot({ path: info.outputPath(`fork-${from}-mobile.png`) });
    await page.getByTestId(`route-arrow-${destination}`).click();
    await expect.poll(() => app.rooms.get(code).game.racers[actor]!.position).toBe(destination);
    await expect(arrows).toHaveCount(0); expect(app.rooms.get(code).game.pending).toBeUndefined();
  }
  expect(errors).toEqual([]);
});

test('crossing 13-14 reveals the actual Twist and its effect to both players and survives refresh', async ({ browser }, info) => {
  const made = app.rooms.create('跨线者', 2, 0), code = made.identity.roomCode, guest = app.rooms.join(code, '观看者');
  const room = app.rooms.get(code), game = createGame(room.game.players, 731);
  game.phase = 'race'; game.round = 1; game.track = 'twisty-twirl'; game.currentRacerId = 'r0'; game.baseTurnOrder = ['r0', 'r1'];
  game.racers = game.players.map((p, i) => ({ id: `r${i}`, playerId: p.id, characterId: 'banana', position: i ? 4 : 12, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.flags.twist = { triggered: false, deck: ['conveyor'], drawn: [] }; game.flags.testDice = [2];
  game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game); room.game = game; room.version++; app.store.save(room);
  const contexts = await Promise.all([made, guest].map(() => browser.newContext({ viewport: { width: 390, height: 844 } })));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  try {
    for (const [i, p] of pages.entries()) { await p.addInitScript(identity => { localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity)); for (const key of ['reduced-motion', 'low-quality', 'muted']) localStorage.setItem(`magical-athlete:${key}`, 'true'); }, [made, guest][i]!.identity); await p.goto(`${url}/room/${code}`); await expect(p.getByTestId('board-3d')).toBeVisible(); await expect(p.getByTestId('twist-cards')).toHaveCount(0); }
    await pages[0]!.getByTestId('roll-button').click();
    for (const p of pages) { await expect(p.getByTestId('twist-cards')).toContainText('传送带启动'); await expect(p.getByTestId('twist-cards')).toContainText('主移动增加3格'); }
    expect(app.rooms.get(code).game.racers.map(r => r.position)).toEqual([1, 1]);
    const randoms = app.rooms.get(code).game.randomLog.length;
    await pages[0]!.reload(); await expect(pages[0]!.getByTestId('twist-cards')).toContainText('传送带启动');
    await expect(pages[0]!.getByTestId('board-3d')).toBeVisible();
    await expect(pages[0]!.getByTestId('board-3d')).toHaveAttribute('data-loaded-models', /[1-9]/);
    expect(app.rooms.get(code).game.randomLog.length).toBe(randoms);
    await pages[0]!.screenshot({ path: info.outputPath('twist-card-mobile.png') });
    await pages[0]!.getByRole('button', { name: /变化卡 · 1 张/ }).click(); await expect(pages[0]!.locator('[data-twist-card]')).toHaveCount(0);
    await pages[0]!.getByRole('button', { name: /变化卡 · 1 张/ }).click(); await expect(pages[0]!.locator('[data-twist-card="conveyor"]')).toBeVisible();
  } finally { await Promise.all(contexts.map(context => context.close())); }
});

test('setup exposes real new-map thumbnails and the schedule character restriction', async ({ page }) => {
  await page.goto(url); await page.getByRole('tab', { name: '创建房间', exact: true }).click();
  await page.locator('.schedule-settings > summary').click();await page.locator('.map-library > summary').click();
  await page.getByRole('button', { name: '添加 Boardwalks', exact: true }).click();
  await expect(page.locator('.map-options svg[data-track="boardwalks"]')).toHaveAttribute('data-node-count', '59');
  await expect(page.locator('.rotation-list')).toContainText('Boardwalks');
  await expect(page.getByRole('note').filter({ hasText: '当前地图禁用' })).toContainText('飞艇、葛洛斯、关系宝宝');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
