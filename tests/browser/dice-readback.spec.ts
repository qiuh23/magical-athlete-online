import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';

type Frame = { at: number; phase: string; key: string; face: string; readMs: number; triangle: string };
declare global { interface Window { __DICE_READBACK__?: { frames: Frame[]; blocked: boolean } } }
let application: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('Missing test address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await application.close(); });

for (const reduced of [false, true]) {
  test(`a stalled ${reduced ? 'reduced-motion fast' : 'normal'} die still paints its result before the reading clock starts`, async ({ browser }, testInfo) => {
    const created = application.rooms.create('结果阅读时钟', 1, 0, 'practice');
    const room = application.rooms.get(created.identity.roomCode), game = createGame(room.game.players, 123, 'practice');
    game.phase = 'race'; game.round = 1; game.currentRacerId = 'roller';
    game.racers = ['coach', 'leaf-triangle-man'].map((characterId, index) => ({ id: index ? 'triangle' : 'roller', playerId: room.hostId, characterId, position: index ? 8 : 0, tripped: false, finished: false, eliminated: false, flags: {} }));
    game.baseTurnOrder = ['roller', 'triangle']; game.flags.testDice = [3];
    game.queue = [{ kind: 'beginTurn', racerId: 'roller' }]; resolveTasks(game);
    room.game = game; room.updatedAt = Date.now() + 60_000; room.version++; application.store.save(room);
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(({ identity, reduced }) => {
      localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
      localStorage.setItem('magical-athlete:animation-speed', reduced ? '8' : '1');
      localStorage.setItem('magical-athlete:reduced-motion', String(reduced));
      localStorage.setItem('magical-athlete:low-quality', 'true');
      localStorage.setItem('magical-athlete:muted', 'true');
    }, { identity: created.identity, reduced });
    const page = await context.newPage();
    try {
      await page.goto(`${url}/room/${room.code}`);
      await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
      await page.evaluate(() => {
        const state: NonNullable<Window['__DICE_READBACK__']> = { frames: [], blocked: false };
        window.__DICE_READBACK__ = state;
        let queuedBlock = false, previous = '';
        const capture = () => {
          const board = document.querySelector<HTMLElement>('[data-testid="board-3d"]');
          const dice = document.querySelector<HTMLElement>('.dice-spotlight');
          const visible = !!dice && !dice.hidden;
          const frame = { at: performance.now(), phase: board?.dataset.phase ?? '', key: visible ? dice.dataset.diceEventKey ?? '' : '', face: visible ? dice.dataset.upFace ?? '' : '', readMs: Number(dice?.dataset.resultReadMs ?? 0), triangle: document.querySelector<HTMLElement>('[data-racer-id="triangle"][data-testid="scene-racer"]')?.dataset.position ?? '' };
          const signature = JSON.stringify({ ...frame, at: 0 });
          if (signature !== previous) { state.frames.push(frame); previous = signature; }
          if (frame.phase === 'dice' && !queuedBlock) {
            queuedBlock = true;
            setTimeout(() => {
              const end = performance.now() + 3000;
              while (performance.now() < end) { /* Cross both original dice deadlines. */ }
              state.blocked = true;
            }, 50);
          }
        };
        new MutationObserver(capture).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-phase', 'data-up-face', 'data-dice-event-key', 'data-result-read-ms', 'data-position', 'hidden'] });
        capture();
      });
      await page.getByTestId('roll-button').click();
      await expect.poll(() => page.evaluate(() => window.__DICE_READBACK__?.blocked)).toBe(true);
      await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle', { timeout: 20000 });
      const frames = await page.evaluate(() => window.__DICE_READBACK__!.frames);
      const resultIndex = frames.findIndex(frame => frame.phase === 'dice' && frame.face === '3' && frame.triangle === '8');
      expect(resultIndex, JSON.stringify(frames)).toBeGreaterThanOrEqual(0);
      const result = frames[resultIndex]!;
      expect(result.key).not.toBe(''); expect(result.readMs).toBeGreaterThanOrEqual(1000);
      const reaction = frames.slice(resultIndex + 1).find(frame => frame.phase !== 'dice');
      expect(reaction, JSON.stringify(frames)).toBeTruthy();
      expect(reaction!.at - result.at).toBeGreaterThanOrEqual(result.readMs);
      await expect(page.locator('[data-testid="scene-racer"][data-racer-id="triangle"]')).toHaveAttribute('data-position', '9');
      expect(application.rooms.get(room.code).game.randomLog).toHaveLength(1);
    } catch (error) {
      try {
        const path = testInfo.outputPath('dice-readback.json');
        writeFileSync(path, JSON.stringify({ browser: await page.evaluate(() => window.__DICE_READBACK__).catch(() => null), events: application.rooms.get(room.code).game.logs }));
        await testInfo.attach('dice-readback', { path, contentType: 'application/json' });
      } catch { /* Diagnostics must preserve the original failure. */ }
      throw error;
    } finally {
      await context.close();
    }
  });
}
