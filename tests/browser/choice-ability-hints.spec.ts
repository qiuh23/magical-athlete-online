import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { CHARACTERS } from '../../src/shared/characters.js';
import type { GameState, Identity, Room } from '../../src/shared/types.js';

let app: ReturnType<typeof createApplication>, url: string;
const output = 'docs/qa/blimp-choice-skills';
const card = (id: string) => CHARACTERS.find(value => value.id === id)!;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address(); if (!address || typeof address === 'string') throw Error('Missing address');
  url = `http://127.0.0.1:${address.port}`; mkdirSync(output, { recursive: true });
});
test.afterAll(async () => app.close());

function fixture(configure: (game: GameState) => void) {
  const made = app.rooms.create('技能提示验收', 2, 0, 'multiplayer', 0, 'mixed');
  const other = app.rooms.join(made.identity.roomCode, '另一位选手');
  const watcher = app.rooms.join(made.identity.roomCode, '观众', 'spectator');
  const room = structuredClone(app.rooms.get(made.identity.roomCode));
  const game = createGame(room.game.players, 73, 'multiplayer', 'mixed');
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0';
  game.racers = ['coach', 'legs', 'blimp', 'banana'].map((characterId, i) => ({ id: `r${i}`, playerId: game.players[Math.floor(i / 2)]!.id, characterId, position: [2, 8, 16, 24][i]!, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer => racer.id);
  configure(game); resolveTasks(game); room.game = game;
  room.version++; room.updatedAt = Date.now() + 60_000; room.deadline = null;
  app.rooms.rooms.set(room.code, room); app.store.save(room);
  return { room, identity: made.identity, other: other.identity, watcher: watcher.identity };
}
async function open(browser: Browser, identity: Identity, phone: boolean, low = phone) {
  const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  await context.addInitScript(({ identity, low }) => {
    localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
    for (const [key, value] of Object.entries({ 'low-quality': low, 'reduced-motion': true, muted: true })) localStorage.setItem(`magical-athlete:${key}`, String(value));
  }, { identity, low });
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/room/${identity.roomCode}`);
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-loaded-models', '4');
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-model-fallbacks', '0');
  return { context, page, errors };
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  const panel = page.getByTestId('skill-choice'), bounds = await panel.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await expect(panel).toHaveClass(/character-choice-panel/);
  const scrolls = await panel.evaluate(element => element.scrollHeight > element.clientHeight + 1);
  if (scrolls) expect(bounds!.height).toBeGreaterThan(page.viewportSize()!.height * .44);
}
async function inspect(page: Page, id: string) {
  await page.getByTestId('skill-choice').getByRole('button', { name: `查看${card(id).nameZh}详情`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: card(id).nameZh, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(card(id).ability);
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
}

for (const phone of [false, true]) {
  const device = phone ? 'phone' : 'desktop';
  test(`Swap Meet compares the new card with both current racers, keeps private choices and permits replacement on ${device}`, async ({ browser }) => {
    const f = fixture(game => {
      game.racers[0]!.flags.acquiredPowers = ['genius'];
      game.flags.twist = { triggered: true, deck: [], drawn: ['swap-meet'], swap: [{ playerId: game.players[0]!.id, cardId: 'sisyphus', decided: false }, { playerId: game.players[1]!.id, cardId: 'hypnotist', decided: false }] };
      game.queue = [{ kind: 'twist', step: 'swap-prompt' }];
    });
    const owner = await open(browser, f.identity, phone), other = await open(browser, f.other, phone), watcher = await open(browser, f.watcher, phone);
    try {
      const pending = app.rooms.get(f.room.code).game.pending!, version = app.rooms.get(f.room.code).version;
      const panel = owner.page.getByTestId('skill-choice');
      await expect(panel.getByTestId('offered-character')).toContainText(card('sisyphus').ability);
      for (const id of ['coach', 'legs', 'genius']) await expect(panel.locator(`[data-choice-power="${id}"]`)).toContainText(card(id).ability);
      for (const peer of [other, watcher]) { await expect(peer.page.getByTestId('skill-choice')).toHaveCount(0); await expect(peer.page.getByTestId('offered-character')).toHaveCount(0); }
      await inspect(owner.page, 'sisyphus'); await inspect(owner.page, 'coach');
      expect(app.rooms.get(f.room.code).version).toBe(version); expect(app.rooms.get(f.room.code).game.pending!.id).toBe(pending.id);
      await panel.getByRole('button', { name: '收起选项', exact: true }).click();
      await expect(panel).toHaveClass(/is-collapsed/);
      await expect(panel.getByTestId('offered-character')).toHaveCount(0);
      await expect(panel.getByRole('button', { name: '展开选项', exact: true })).toHaveAttribute('aria-expanded', 'false');
      const collapsedBounds = await panel.boundingBox(); expect(collapsedBounds!.height).toBeLessThan(130);
      await owner.page.locator('.floating-racers').getByRole('button', { name: /^教练，/ }).click();
      const currentDetail = owner.page.getByRole('dialog', { name: '教练', exact: true });
      await expect(currentDetail.getByRole('region', { name: '现在拥有的能力' })).toContainText(card('genius').ability);
      await currentDetail.getByRole('button', { name: '关闭', exact: true }).click();
      await expect(panel).toHaveClass(/is-collapsed/);
      expect(app.rooms.get(f.room.code).version).toBe(version); expect(app.rooms.get(f.room.code).game.pending!.id).toBe(pending.id);
      await owner.page.screenshot({ path: `${output}/collapsed-${device}.png` });
      await panel.getByRole('button', { name: '展开选项', exact: true }).click();
      await expect(panel.getByTestId('offered-character')).toContainText(card('sisyphus').ability);
      await owner.page.reload(); await expect(owner.page.getByTestId('offered-character')).toContainText(card('sisyphus').ability);
      await expect(owner.page.getByTestId('board-3d')).toHaveAttribute('data-loaded-models', '4');
      await fits(owner.page);
      await panel.evaluate(element => { element.scrollTop = 0; });
      await owner.page.screenshot({ path: `${output}/swap-${device}.png` });
      await panel.getByRole('button', { name: pending.options.find(option => option.id === 'swap:r1')!.label, exact: true }).click();
      await expect(other.page.getByTestId('offered-character')).toContainText(card('hypnotist').ability);
      expect(app.rooms.get(f.room.code).game.racers[1]!.characterId).toBe('legs');
      await other.page.getByTestId('skill-choice').getByRole('button', { name: '保留原角色', exact: true }).click();
      await expect.poll(() => app.rooms.get(f.room.code).game.racers[1]!.characterId).toBe('sisyphus');
      expect([...owner.errors, ...other.errors, ...watcher.errors]).toEqual([]);
    } finally { await owner.context.close(); await other.context.close(); await watcher.context.close(); }
  });

  test(`Egg, film cards and repeated Twin champions show the ability before committing on ${device}`, async ({ browser }) => {
    for (const kind of ['egg', 'leaf-film-card', 'twin']) {
      const f = fixture(game => {
        const racer = game.racers[0]!;
        racer.characterId = kind === 'leaf-film-card' ? 'leaf-filmmaker' : kind;
        game.deck = ['genius', 'gunk', 'romantic', 'hare', 'sisyphus', 'magician', 'alchemist'];
        if (kind === 'leaf-film-card') { racer.flags.secretLeafHand = ['genius', 'romantic']; game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; }
        else {
          if (kind === 'twin') {
            game.round = 3;
            game.results = [1, 2].map(round => ({ round, placements: [{ racerId: `old-${round}`, playerId: game.players[0]!.id, characterId: 'egg', rank: 1, points: 3 }] }));
            game.flags.championPowers = [1, 2].map(round => ({ round, racerId: `old-${round}`, characterId: 'egg', power: round === 1 ? 'genius' : 'romantic' }));
          }
          game.queue = [{ kind: 'beforeRace', racerId: 'r0' }];
        }
      });
      const owner = await open(browser, f.identity, phone);
      try {
        const pending = app.rooms.get(f.room.code).game.pending!; expect(pending.kind).toBe(kind);
        const version = app.rooms.get(f.room.code).version;
        const expected = kind === 'egg' ? ['genius', 'gunk', 'romantic'] : ['genius', 'romantic'];
        for (const id of expected) {
          await expect(owner.page.getByTestId('skill-choice').locator(`[data-choice-power="${id}"]`)).toContainText(card(id).ability);
          await inspect(owner.page, id);
        }
        expect(app.rooms.get(f.room.code).version).toBe(version); expect(app.rooms.get(f.room.code).game.pending!.id).toBe(pending.id);
        await fits(owner.page);
        await owner.page.getByTestId('skill-choice').evaluate(element => { element.scrollTop = 0; });
        if (kind === 'egg') await owner.page.screenshot({ path: `${output}/draw-${device}.png` });
        await owner.page.getByTestId('skill-choice').getByRole('button', { name: pending.options[0]!.label, exact: true }).click();
        await expect.poll(() => app.rooms.get(f.room.code).game.pending?.id).not.toBe(pending.id);
        expect(owner.errors).toEqual([]);
      } finally { await owner.context.close(); }
    }
  });
}
