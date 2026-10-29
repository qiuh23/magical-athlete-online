import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { CHARACTERS } from '../../src/shared/characters.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address();
  if (!address || typeof address === 'string') throw Error('Missing fixture address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => app.close());

for (const phone of [false, true]) test(`opponent dice cues survive refresh and collapsed choices on ${phone ? 'phone' : 'desktop'}`, async ({ browser }) => {
  for (const kind of ['critic', 'fox'] as const) {
    const made = app.rooms.create('投骰选手', 3, 120), code = made.identity.roomCode;
    const peer = app.rooms.join(code, '技能选手'), third = app.rooms.join(code, '拦截选手');
    const room = app.rooms.get(code), game = createGame(room.game.players, 123, 'multiplayer', 'mixed');
    const ids = kind === 'critic' ? ['banana', 'critic', 'banana'] : ['banana', 'party-pooper', 'extra-mile-mr-fox'];
    game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
    game.racers = ids.map((characterId, index) => ({ id: `r${index}`, playerId: game.players[index]!.id, characterId, position: [10, 2, 25][index]!, tripped: false, finished: false, eliminated: false, flags: {} }));
    game.baseTurnOrder = game.racers.map(racer => racer.id); game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(game);
    game.flags.thirds = { id: 'duelist', round: 1, held: {}, extraCards: [] };
    game.lastRoll = { racerId: 'r2', face: 1, distance: 1 }; game.flags.testDice = kind === 'critic' ? [5, 2] : [6];
    room.game = game; room.version++; app.store.save(room);
    expect(app.rooms.act(code, made.identity.playerId, { actionId: crypto.randomUUID(), expectedVersion: room.version, action: { type: 'roll' } }).ok).toBe(true);
    expect(app.rooms.get(code).game.pending?.kind).toBe(kind === 'critic' ? 'critic' : 'em-fox');
    const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
    await context.addInitScript(identity => {
      localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`, JSON.stringify({ ...identity, backendId: 'cloudflare' }));
      for (const key of ['low-quality', 'reduced-motion', 'muted']) localStorage.setItem(`magical-athlete:${key}`, 'true');
    }, kind === 'critic' ? peer.identity : third.identity);
    const page = await context.newPage(), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(`${url}/room/C-${code}`);
      const hint = page.getByTestId('choice-dice-hint'), choice = page.getByTestId('skill-choice');
      const face = kind === 'critic' ? '5 点' : '6 点';
      await expect(hint).toContainText('1号 投骰选手的香蕉'); await expect(hint).toContainText(face);
      await page.reload(); await expect(hint).toContainText(face);
      await choice.getByRole('button', { name: '收起选项', exact: true }).click(); await expect(hint).toContainText(face);
      await choice.getByRole('button', { name: '展开选项', exact: true }).click(); await expect(hint).toContainText(face);
      await expect(page.getByTestId('board-minimap')).toBeVisible();
      const related = page.getByTestId('choice-related-racers');
      await expect(related).toBeVisible();
      expect((await related.boundingBox())!.height).toBeLessThan(105);
      const target = related.locator('[data-related-racer="r0"]');
      await expect(target).toContainText(CHARACTERS.find(card => card.id === 'banana')!.ability);
      const version = app.rooms.get(code).version, pendingId = app.rooms.get(code).game.pending!.id;
      await target.click();
      const dialog = page.getByRole('dialog', { name: '香蕉', exact: true });
      await expect(dialog).toBeVisible(); await expect(dialog.locator('.full-ability')).toContainText(CHARACTERS.find(card => card.id === 'banana')!.ability);
      expect(app.rooms.get(code).version).toBe(version); expect(app.rooms.get(code).game.pending!.id).toBe(pendingId);
      if (!process.env.CI && phone && kind === 'critic') {
        mkdirSync('docs/qa/mobile-event-countdown', { recursive: true });
        await page.screenshot({ path: 'docs/qa/mobile-event-countdown/related-card-phone.png' });
      }
      await dialog.getByRole('button', { name: '关闭', exact: true }).click();
      if (kind === 'fox') await expect(related.locator('[data-related-racer="r1"]')).toContainText(CHARACTERS.find(card => card.id === 'party-pooper')!.ability);
      const option = choice.locator('.choice-options .button').first();
      await option.scrollIntoViewIfNeeded();
      expect(await option.evaluate(element => {
        const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      })).toBe(true);
      if (!process.env.CI) {
        mkdirSync('docs/qa/mobile-event-countdown', { recursive: true });
        await page.screenshot({ path: `docs/qa/mobile-event-countdown/${kind}-${phone ? 'phone' : 'desktop'}.png` });
      }
      await option.click();
      await expect(choice).toHaveCount(0);
      const saved = app.rooms.get(code).game;
      expect(saved.randomLog.map(entry => entry.value)).toEqual(kind === 'critic' ? [5, 2] : [6]);
      expect(saved.racers[0]!.position).toBe(kind === 'critic' ? 12 : 16);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  }
});
