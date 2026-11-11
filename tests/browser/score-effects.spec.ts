import { mkdirSync } from 'node:fs';
import { test, expect, type Browser, type Page, type Locator } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame, enqueueMove, resolveTasks } from '../../src/engine/index.js';
import { CHARACTERS } from '../../src/shared/characters.js';
import { SITE_NICKNAMES } from '../../src/shared/site-policy.js';
import type { GameEvent, Identity, Room } from '../../src/shared/types.js';

const edition = process.env.SITE_EDITION === 'cn' ? 'cn' : 'global';
const backend = edition === 'cn' ? 'aliyun' : 'cloudflare';
const prefix = edition === 'cn' ? 'A' : 'C';
const output = '.local/qa/score-effects';
let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  mkdirSync(output, { recursive: true });
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address();
  if (!address || typeof address === 'string') throw Error('Missing fixture address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => app.close());

function publish(room: Room, event?: Omit<GameEvent, 'id'>) {
  if (event) room.game.logs.push({ ...event, id: (room.game.logs.at(-1)?.id ?? 0) + 1 });
  // Connecting another client may have advanced the authoritative version.
  room.version = Math.max(room.version, app.rooms.get(room.code).version) + 1;
  app.rooms.rooms.set(room.code, room); app.store.save(room);
  for (const socket of app.io.sockets.sockets.values()) if (socket.data.identity?.roomCode === room.code) socket.emit('snapshot', app.rooms.view(room, socket.data.identity.playerId));
}
function seed(choice = false) {
  const names = edition === 'cn' ? SITE_NICKNAMES.slice(0, 5).map(entry => entry.name) : ['积分验收', '第二位', '第三位', '第四位', '观众'];
  const host = app.rooms.create(names[0]!, 4, 0), code = host.identity.roomCode;
  for (const nickname of names.slice(1, 4)) app.rooms.join(code, nickname);
  const watcher = app.rooms.join(code, names[4]!, 'spectator');
  const room = app.rooms.get(code), game = createGame(room.game.players, 312);
  game.phase = 'race'; game.round = 2; game.currentRacerId = 'r0'; game.flags.awaitRoll = true;
  game.players.forEach((player, i) => { player.score = [0, 7, -2, 12][i]!; });
  game.racers = ['hypnotist', 'egg', 'coach', 'blimp', 'banana', 'legs', 'copycat', 'hare'].map((characterId, i) => ({ id: `r${i}`, playerId: game.players[Math.floor(i / 2)]!.id, characterId, position: [4, 4, 8, 11, 14, 18, 28, 25][i]!, tripped: false, finished: i === 6, rank: i === 6 ? 1 : undefined, eliminated: i === 7, flags: {} }));
  game.baseTurnOrder = game.racers.map(racer => racer.id);
  game.results = [{ round: 1, placements: [{ racerId: 'old', playerId: game.players[0]!.id, characterId: 'banana', rank: 1, points: 5 }] }];
  if (choice) {
    game.racers[0]!.characterId = 'duelist';
    game.racers[1]!.position = game.racers[2]!.position = 5;
    delete game.flags.awaitRoll;
    enqueueMove(game, 'r0', 1); resolveTasks(game);
    expect(game.pending?.options.length).toBeGreaterThanOrEqual(2);
  }
  room.game = game; room.deadline = null; publish(room);
  return { room, host: host.identity, watcher: watcher.identity };
}
async function open(browser: Browser, identity: Identity, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width < 900, hasTouch: viewport.width < 900 });
  await context.addInitScript(({ identity, backend }) => {
    localStorage.setItem(`magical-athlete:identity:${backend}:${identity.roomCode}`, JSON.stringify({ ...identity, backendId: backend }));
    localStorage.setItem('magical-athlete:low-quality', 'true'); localStorage.setItem('magical-athlete:muted', 'true');
    localStorage.setItem('magical-athlete:reduced-motion', 'false');
  }, { identity, backend });
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/room/${prefix}-${identity.roomCode}`);
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
  return { context, page, errors };
}
async function fits(page: Page, card: Locator) {
  await expect(card).toBeVisible();
  expect(await card.evaluate(element => {
    const box = element.getBoundingClientRect();
    const intersects = (other: DOMRect) => Math.min(box.right, other.right) > Math.max(box.left, other.left) && Math.min(box.bottom, other.bottom) > Math.max(box.top, other.top);
    const protectedAreas = ['.floating-racers', '.floating-roll', '[data-testid="board-minimap"]', '.race-hud-buttons', '.race-status-stack'];
    const overlaps = protectedAreas.filter(selector => {
      const other = document.querySelector(selector); return other && intersects(other.getBoundingClientRect());
    });
    const scrollableChoice = element.matches('[data-testid="skill-choice"]') && element.scrollHeight > element.clientHeight + 1;
    const clipped = [...element.querySelectorAll('button, .moment-number, .moment-heading, .ability-reveal-heading, .ability-reveal-duration')].filter(child => {
      const bounds = child.getBoundingClientRect();
      return bounds.left < box.left + 3 || bounds.right > box.right - 3 || !scrollableChoice && (bounds.top < box.top || bounds.bottom > box.bottom + 1);
    }).map(child => child.className);
    return { overlaps, clipped, inside: box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight, overflow: document.documentElement.scrollWidth > innerWidth + 1, ...(overlaps.length ? { geometry: { top: box.top, height: box.height, maxHeight: getComputedStyle(element).maxHeight, minimap: document.querySelector('[data-testid="board-minimap"]')!.getBoundingClientRect().bottom, measured: getComputedStyle(document.documentElement).getPropertyValue('--race-minimap-bottom') } } : {}) };
  })).toEqual({ overlaps: [], clipped: [], inside: true, overflow: false });
  const sizes = await card.locator('.moment-racer>.avatar,.moment-origin>.avatar,.ability-reveal-flow .avatar').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  if (sizes.length > 1) expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThan(1);
}
async function capture(page: Page, name: string, room?: Room) {
  // Use the real pause/resume mechanism to inspect stable geometry, then take
  // the screenshot during normal playback so its pause notice is absent.
  const paused = !!room?.pause;
  if (paused) { delete room!.pause; publish(room!); await expect(page.getByTestId('room-pause-notice')).toHaveCount(0); }
  await page.screenshot({ path: `${output}/${edition}-${name}.png` });
  if (paused) { freeze(room!); publish(room!); }
}
function freeze(room: Room) { room.pause = { at: Date.now(), playerId: room.hostId, remainingMs: null }; }
async function clearEffect(page: Page, room: Room) {
  delete room.pause; publish(room);
  await expect(page.getByTestId('room-pause-notice')).toHaveCount(0);
  const skip = page.getByTestId('skip-animation');
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
}

test('confirmed totals match the trophy through gains, deductions, controller swaps, spectating and the next race', async ({ browser }) => {
  const f = seed(), owner = await open(browser, f.host, { width: 1440, height: 900 }), watcher = await open(browser, f.watcher, { width: 390, height: 844 });
  const clients = [owner, watcher];
  try {
    const verify = async (expected: string[]) => {
      for (const { page } of clients) {
        await expect(page.locator('.floating-racer-score')).toHaveText(expected);
        await page.getByRole('button', { name: '累计积分', exact: true }).click();
        await expect(page.locator('.scoreboard>div>div>b')).toHaveText([...f.room.game.players].sort((a, b) => b.score - a.score).map(player => `${player.score}分`));
        await page.getByRole('button', { name: '关闭', exact: true }).click();
      }
    };
    await verify(['1号0分', '1号0分', '2号7分', '2号7分', '3号-2分', '3号-2分', '4号12分', '4号12分']);
    await expect(owner.page.locator('[data-racer-id="r6"].floating-racer')).toHaveAccessibleName(/累计12分，第1名/);
    await expect(owner.page.locator('[data-racer-id="r7"].floating-racer')).toHaveAccessibleName(/累计12分，出局/);
    f.room.game.players[0]!.score = 6; freeze(f.room);
    publish(f.room, { type: 'score', source: 'r0', cause: 'streaker', text: '选手 +6分（技能）' });
    await verify(['1号6分', '1号6分', '2号7分', '2号7分', '3号-2分', '3号-2分', '4号12分', '4号12分']);
    await clearEffect(owner.page, f.room);
    f.room.game.players[0]!.score = -1;
    f.room.game.racers[0]!.playerId = f.room.game.players[1]!.id;
    f.room.game.racers[2]!.playerId = f.room.game.players[0]!.id;
    publish(f.room);
    await verify(['2号7分', '1号-1分', '1号-1分', '2号7分', '3号-2分', '3号-2分', '4号12分', '4号12分']);
    await owner.page.locator('.floating-racer[data-racer-id="r0"]').click();
    await expect(owner.page.getByRole('dialog')).toContainText(f.room.game.players[1]!.name);
    await owner.page.getByRole('button', { name: '关闭', exact: true }).click();
    f.room.game.round++;
    f.room.game.racers = f.room.game.racers.map((racer, i) => ({ ...racer, id: `next${i}`, playerId: f.room.game.players[Math.floor(i / 2)]!.id, position: 0, finished: false, eliminated: false, rank: undefined, flags: {} }));
    f.room.game.baseTurnOrder = f.room.game.racers.map(racer => racer.id); f.room.game.currentRacerId = 'next0'; publish(f.room);
    await expect(owner.page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
    await verify(['1号-1分', '1号-1分', '2号7分', '2号7分', '3号-2分', '3号-2分', '4号12分', '4号12分']);
    for (const client of clients) expect(client.errors).toEqual([]);
  } finally { await Promise.all(clients.map(client => client.context.close())); }
});

for (const [device, viewport] of [
  ['desktop', { width: 1440, height: 900 }], ['portrait', { width: 390, height: 844 }], ['small-portrait', { width: 320, height: 667 }],
  ['landscape', { width: 667, height: 375 }], ['small-landscape', { width: 568, height: 320 }],
] as const) {
  test(`ordinary, multiple-target, long-name and copied ability cards fit ${device}`, async ({ browser }) => {
    const f = seed(), client = await open(browser, f.host, viewport), { page } = client;
    try {
      freeze(f.room); f.room.game.racers[0]!.position = 3;
      publish(f.room, { type: 'warp', source: 'r0', targets: ['r0'], before: [4], after: [3], cause: 'hypnotist', text: '传送4→3' });
      const card = page.getByTestId('skill-banner');
      await expect(card).toContainText('4→3'); await fits(page, card); await capture(page, `${device}-warp`, f.room);
      await clearEffect(page, f.room);
      freeze(f.room);
      const targets = ['r1', 'r2', 'r3', 'r4', 'r5'];
      const before = targets.map(id => f.room.game.racers.find(racer => racer.id === id)!.position);
      targets.forEach(id => { f.room.game.racers.find(racer => racer.id === id)!.position = 3; });
      publish(f.room, { type: 'warp', actor: { name: '催眠师', characterId: 'hypnotist' }, targets, before, after: targets.map(() => 3), cause: 'thirds-hypnotist', text: '赛事传送' });
      await expect(card.locator('.moment-more')).toHaveText('另3人');
      await expect(card.locator('.moment-more')).toHaveAccessibleName(/飞艇.*11→3格.*香蕉.*14→3格.*大长腿.*18→3格/);
      await fits(page, card); await capture(page, `${device}-multi`, f.room);
      await clearEffect(page, f.room);
      const longest = [...CHARACTERS].filter(card => card.id.startsWith('wurstii-')).sort((a, b) => b.nameZh.length - a.nameZh.length)[0]!;
      freeze(f.room);
      publish(f.room, { type: 'power', source: 'r0', cause: longest.id, text: '公开发动技能' });
      await expect(card.locator('.moment-heading')).toContainText(longest.nameZh); await fits(page, card);
      await clearEffect(page, f.room);
      freeze(f.room);
      publish(f.room, { type: 'copy', source: 'r1', cause: 'egg', grantedPowerIds: ['legs', longest.id], grantDuration: 'race', text: '已确认复制' });
      const reveal = page.getByTestId('ability-reveal');
      await expect(reveal).toContainText('抽到新能力'); await expect(reveal).toContainText(longest.nameZh);
      await fits(page, reveal); await capture(page, `${device}-ability`, f.room);
      const key = await reveal.getAttribute('data-event-id'); publish(f.room);
      await expect(reveal).toHaveAttribute('data-event-id', key!);
      await clearEffect(page, f.room); await expect(reveal).toHaveCount(0);
      await page.reload(); await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle'); await expect(reveal).toHaveCount(0);
      expect(client.errors).toEqual([]);
    } finally { await client.context.close(); }
  });

  test(`target choices remain interactive and private on ${device}`, async ({ browser }) => {
    const f = seed(true), client = await open(browser, f.host, viewport), { page } = client;
    try {
      const panel = page.getByTestId('skill-choice'), pending = structuredClone(f.room.game.pending), version = app.rooms.get(f.room.code).version;
      await fits(page, panel);
      if (device === 'small-portrait') for (const target of await panel.locator('.choice-character>.button').all()) await expect(target).toBeInViewport({ ratio: 1 });
      await capture(page, `${device}-choice`);
      const detail = panel.locator('.choice-character-detail').first();
      await detail.click(); await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: '关闭', exact: true }).click();
      expect(app.rooms.get(f.room.code).game.pending).toEqual(pending); expect(app.rooms.get(f.room.code).version).toBe(version);
      publish(f.room); await expect(panel).toBeVisible();
      await panel.getByRole('button', { name: '收起选项', exact: true }).click();
      await fits(page, panel);
      await page.locator('.floating-racer[data-racer-id="r0"]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: '关闭', exact: true }).click();
      await panel.getByRole('button', { name: '展开选项', exact: true }).click();
      expect(app.rooms.get(f.room.code).game.pending).toEqual(pending);
      const spectator = await open(browser, f.watcher, viewport);
      try { await expect(spectator.page.getByTestId('skill-choice')).toHaveCount(0); expect(spectator.errors).toEqual([]); }
      finally { await spectator.context.close(); }
      await panel.locator('.choice-character>.button').first().click();
      await expect.poll(() => app.rooms.get(f.room.code).game.pending?.kind).toBe('duel-roll');
      expect(client.errors).toEqual([]);
    } finally { await client.context.close(); }
  });
}
