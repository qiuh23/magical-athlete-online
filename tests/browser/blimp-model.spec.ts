import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { pawnWorldPoint } from '../../src/client/scene/camera.js';

test.skip(process.env.BLIMP_MODEL_QA !== '1', 'Local visual check requires scripts/art-qa-build.mjs');
let app: ReturnType<typeof createApplication>, url: string;
const output = 'docs/qa/blimp-choice-skills';
test.beforeAll(async () => {
  app = createApplication(':memory:'); await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address(); if (!address || typeof address === 'string') throw Error('Missing address');
  url = `http://127.0.0.1:${address.port}`; mkdirSync(output, { recursive: true });
});
test.afterAll(async () => app.close());

for (const phone of [false, true]) test(`Blender Blimp renders as a racer and event marker, moves and reloads on ${phone ? 'phone economy' : 'desktop high'}`, async ({ browser }) => {
  const made = app.rooms.create('飞艇模型验收', 3, 0);
  app.rooms.join(made.identity.roomCode, '选手甲'); app.rooms.join(made.identity.roomCode, '选手乙');
  const room = app.rooms.get(made.identity.roomCode), game = createGame(room.game.players, 73);
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
  game.racers = ['blimp', 'alchemist', 'coach'].map((characterId, i) => ({ id: `r${i}`, playerId: game.players[i]!.id, characterId, position: [5, 20, 25][i]!, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = ['r0', 'r1', 'r2']; game.flags.testDice = [2];
  game.flags.thirds = { id: 'blimp', round: 1, held: {}, extraCards: [], npc: { id: 'blimp', position: 14 } };
  game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game);
  room.game = game; room.version++; app.store.save(room);
  const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  await context.addInitScript(({ identity, phone }) => {
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
    for (const [key, value] of Object.entries({ 'low-quality': phone, 'reduced-motion': true, muted: true })) localStorage.setItem(`magical-athlete:${key}`, String(value));
  }, { identity: made.identity, phone });
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const device = phone ? 'phone' : 'desktop';
  try {
    await page.goto(`${url}/room/${room.code}`);
    const board = page.getByTestId('board-3d');
    await expect(board).toHaveAttribute('data-loaded-models', '4'); await expect(board).toHaveAttribute('data-model-fallbacks', '0');
    await page.waitForFunction(() => !!(window as any).__ART_QA_SCENE__);
    const stats = await page.evaluate(() => (window as any).__ART_QA_SCENE__.stats());
    expect(stats.loadedModelNames.filter((name: string) => name === 'toy_blimp')).toHaveLength(2);
    const point = pawnWorldPoint(game.racers[0]!, game.racers, 5, phone, 'mild');
    const target = [point[0], point[1] + .23, point[2]];
    await page.getByTestId('special-event').locator('summary').click();
    for (const [view, offset] of [['front', [-4, 2, 7]], ['side', [-7, 1, 0]], ['rear', [4, 2, -7]]] as const) {
      await page.evaluate(({ target, offset, zoom }) => (window as any).__ART_QA_SCENE__.setCamera({ position: target.map((n, i) => n + offset[i]), target, zoom, up: [0, 1, 0] }), { target, offset, zoom: phone ? 330 : 520 });
      await page.screenshot({ path: `${output}/blimp-${device}-${view}.png` });
    }
    await page.getByTestId('roll-button').click();
    // Before the second corner Blimp adds 3 to the physical 2, moving 5 → 10.
    await expect.poll(() => app.rooms.get(room.code).game.racers[0]!.position).toBe(10);
    await expect(board).toHaveAttribute('data-phase', 'idle');
    const randomCount = app.rooms.get(room.code).game.randomLog.length;
    await page.reload(); await expect(board).toHaveAttribute('data-loaded-models', '4');
    await expect(board).toHaveAttribute('data-model-fallbacks', '0');
    expect(app.rooms.get(room.code).game.randomLog.length).toBe(randomCount);
    expect(errors).toEqual([]);
    writeFileSync(`.local/blimp-choice/model-${device}.json`, JSON.stringify({ stats, position: app.rooms.get(room.code).game.racers[0]!.position, refreshRetainsRandomCount: true, errors }, null, 2));
  } finally { await context.close(); }
});
