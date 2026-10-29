import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame } from '../../src/engine/index.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address();
  if (!address || typeof address === 'string') throw Error('Missing fixture address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => app.close());

test('mobile event controls stay below the live countdown for hosts and guests, including wrapped status and dice playback', async ({ browser }) => {
  const made = app.rooms.create('事件布局房主', 3, 120), code = made.identity.roomCode;
  const guest = app.rooms.join(code, '事件布局选手'); app.rooms.join(code, '第三位');
  const room = app.rooms.get(code), game = createGame(room.game.players, 123);
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0'; game.flags.awaitRoll = true;
  game.racers = Array.from({ length: 6 }, (_, index) => ({ id: `r${index}`, playerId: game.players[Math.floor(index / 2)]!.id, characterId: 'banana', position: index * 4, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer => racer.id);
  game.flags.thirds = { id: 'duelist', round: 1, held: {}, extraCards: [] };
  game.flags.testDice = [2]; room.game = game; room.version++; room.deadline = Date.now() + 120_000; app.store.save(room);
  const errors: string[] = [], contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
  let owner: Page | undefined;
  try {
    for (const [role, identity] of [['host', made.identity], ['guest', guest.identity]] as const) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      contexts.push(context);
      await context.addInitScript(identity => {
        localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`, JSON.stringify({ ...identity, backendId: 'cloudflare' }));
        for (const key of ['low-quality', 'muted']) localStorage.setItem(`magical-athlete:${key}`, 'true');
        localStorage.setItem('magical-athlete:reduced-motion', 'false');
      }, identity);
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      if (role === 'host') owner = page;
      await page.goto(`${url}/room/C-${code}`);
      const status = page.getByTestId('animation-phase'), event = page.getByTestId('special-event'), summary = event.locator('summary');
      await expect(status.locator('.countdown')).toBeVisible();
      await expect(page.getByTestId('board-minimap')).toBeVisible();
      const layout = async () => {
        await expect.poll(() => page.evaluate(() => {
          const status = document.querySelector('.race-status-pill')!.getBoundingClientRect();
          const event = document.querySelector('[data-testid="special-event"] summary')!.getBoundingClientRect();
          const map = document.querySelector('[data-testid="board-minimap"]')!.getBoundingClientRect();
          const overlap = (a: DOMRect, b: DOMRect) => Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
          return { status: overlap(status, event), map: overlap(map, event), overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        })).toEqual({ status: false, map: false, overflow: false });
        expect(await summary.evaluate(element => {
          const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
        })).toBe(true);
      };
      for (const width of role === 'host' ? [1440, 430, 390, 320] : [390]) {
        await page.setViewportSize({ width, height: width === 320 ? 667 : width <= 430 ? 844 : 900 });
        await layout();
        await summary.click(); await expect(event).not.toHaveAttribute('open', '');
        await layout(); await summary.click(); await expect(event).toHaveAttribute('open', '');
        if (!process.env.CI && (width === 390 || width === 320 || width === 1440)) {
          mkdirSync('docs/qa/mobile-event-countdown', { recursive: true });
          await page.screenshot({ path: `docs/qa/mobile-event-countdown/${role}-${width}.png` });
        }
      }
    }
    await owner!.setViewportSize({ width: 390, height: 844 });
    await owner!.getByTestId('special-event').locator('summary').click();
    await owner!.getByTestId('roll-button').click(); await expect(owner!.getByTestId('skip-animation')).toBeVisible();
    await expect(owner!.locator('.dice-spotlight')).toHaveAttribute('data-up-face', '2');
    const status = (await owner!.getByTestId('animation-phase').boundingBox())!;
    const event = (await owner!.getByTestId('special-event').boundingBox())!;
    expect(event.y).toBeGreaterThanOrEqual(status.y + status.height + 8);
    if (!process.env.CI) await owner!.screenshot({ path: 'docs/qa/mobile-event-countdown/host-playback.png' });
    await owner!.getByTestId('skip-animation').click({ scroll: 'none' });
    await expect(owner!.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
    expect(errors).toEqual([]);
  } finally { await Promise.all(contexts.map(context => context.close())); }
});
