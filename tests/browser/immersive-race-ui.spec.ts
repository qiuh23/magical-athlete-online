import { mkdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test, expect, type Browser, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import { createGame, resolveTasks } from '../../src/engine/index.js';
import { THIRD_EVENTS } from '../../src/shared/special-events.js';
import { TWIST_CARDS } from '../../src/shared/twists.js';
import { CHARACTERS } from '../../src/shared/characters.js';
import type { GameEvent, Room } from '../../src/shared/types.js';
import { EventArt, eventVisual } from '../../src/client/EventArt.js';

let app: ReturnType<typeof createApplication>, url: string;
test.beforeAll(async () => {
  app = createApplication(':memory:');
  await new Promise<void>(resolve => app.http.listen(0, '127.0.0.1', resolve));
  const address = app.http.address();
  if (!address || typeof address === 'string') throw Error('Missing fixture address');
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => app.close());

function publish(room: Room) {
  app.rooms.rooms.set(room.code, room); app.store.save(room);
  for (const socket of app.io.sockets.sockets.values()) if (socket.data.identity?.roomCode === room.code) socket.emit('snapshot', app.rooms.view(room, socket.data.identity.playerId));
}
async function fixture(browser: Browser, viewport: { width: number; height: number }) {
  const made = app.rooms.create('图形提示房主', 3, 0), code = made.identity.roomCode;
  app.rooms.join(code, '第二位'); app.rooms.join(code, '第三位');
  const room = app.rooms.get(code), game = createGame(room.game.players, 312);
  game.phase = 'race'; game.round = 1; game.currentRacerId = 'r0'; game.flags.awaitRoll = true;
  game.racers = ['hypnotist', 'coach', 'blimp'].map((characterId, index) => ({ id: `r${index}`, playerId: game.players[index]!.id, characterId, position: [3, 7, 13][index]!, tripped: false, finished: false, eliminated: false, flags: {} }));
  game.baseTurnOrder = ['r0', 'r1', 'r2']; game.flags.thirds = { id: 'hypnotist', round: 1, held: {}, extraCards: [] };
  room.game = game; room.version++; room.deadline = null; publish(room);
  const context = await browser.newContext({ viewport });
  await context.addInitScript(identity => {
    localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`, JSON.stringify({ ...identity, backendId: 'cloudflare' }));
    localStorage.setItem('magical-athlete:low-quality', 'true'); localStorage.setItem('magical-athlete:muted', 'true');
    localStorage.setItem('magical-athlete:reduced-motion', 'false');
  }, made.identity);
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}/room/C-${code}`);
  await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
  return { context, page, room, errors };
}
async function screenshot(page: Page, name: string) {
  if (process.env.CI) return;
  mkdirSync('docs/qa/immersive-race-ui', { recursive: true });
  await page.screenshot({ path: `docs/qa/immersive-race-ui/${name}.png` });
}
function append(room: Room, event: Omit<GameEvent, 'id'>) {
  room.game.logs.push({ ...event, id: (room.game.logs.at(-1)?.id ?? 0) + 1 }); room.version++; publish(room);
}

test('inspect the original SVG atlas for all implemented events and twists', async ({ page }) => {
  const cards = [...Object.keys(THIRD_EVENTS).map(id => ({ id, family: 'event' as const, name: CHARACTERS.find(card => card.id === id)?.nameZh ?? id })), ...TWIST_CARDS.map(card => ({ id: card.id, family: 'twist' as const, name: card.name }))];
  const tiles = cards.map(card => `<article>${renderToStaticMarkup(createElement(EventArt, { ...card, size: 72 }))}<strong>${card.name}</strong><small>${eventVisual(card.id, card.family)?.label}</small></article>`).join('');
  await page.setViewportSize({ width: 1200, height: 1350 });
  await page.setContent(`<html lang="zh-CN"><style>body{margin:0;padding:28px;background:#e5ede0;color:#315951;font:14px system-ui}h1{font-size:25px;margin:0 0 8px}p{margin:0 0 22px}main{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}article{background:#fffaf0;border:1px solid #31595130;border-radius:16px;padding:12px 5px;text-align:center;display:grid;justify-items:center;gap:6px}strong{font-size:12px}small{font-size:11px;color:#56796a}</style><h1>赛场图形 · 36 种特殊赛事 / 13 张变化卡</h1><p>每种效果使用不同的形状与构图，配合短标签、角色头像和关键数字。</p><main>${tiles}</main></html>`);
  await expect(page.locator('[data-event-art]')).toHaveCount(49);
  await screenshot(page, 'event-atlas');
});

for (const [name, viewport] of [
  ['desktop', { width: 1280, height: 900 }], ['phone', { width: 390, height: 844 }],
  ['small-phone', { width: 320, height: 667 }], ['landscape', { width: 844, height: 390 }],
  ['short-landscape', { width: 667, height: 375 }], ['small-landscape', { width: 568, height: 320 }],
] as const) test(`graphical cues leave actions and turn order reachable on ${name}`, async ({ browser }) => {
  const f = await fixture(browser, viewport), { page, room } = f;
  try {
    const controls = page.locator('.race-hud-buttons button, .chat-toggle');
    for (const control of await controls.all()) {
      await expect(control).toHaveAccessibleName(/.+/);
      const box = (await control.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      await expect(control.locator('svg')).toHaveCount(1);
    }
    const score = page.getByRole('button', { name: '累计积分', exact: true });
    await score.focus(); await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: '累计积分' })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(score).toBeFocused();
    const text = '催眠师发动集结传送；教练与飞艇从第7、13格传送到第3格。';
    room.game.racers[1]!.position = 3; room.game.racers[2]!.position = 3;
    append(room, { type: 'warp', source: 'r0', targets: ['r1', 'r2'], before: [7, 13], after: [3, 3], cause: 'thirds-hypnotist', text });
    const banner = page.getByTestId('skill-banner');
    await expect(banner.locator('[data-event-art="event:hypnotist"]')).toBeVisible();
    await expect(banner).toContainText('7→3'); await expect(banner).toContainText('13→3');
    expect(await page.evaluate(() => {
      const banner = document.querySelector('[data-testid="skill-banner"]')!.getBoundingClientRect();
      return ['.floating-racers', '.floating-roll', '[data-testid="board-minimap"]', '.race-hud-buttons', '.race-status-stack'].flatMap(selector => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return Math.min(box.right, banner.right) > Math.max(box.left, banner.left) && Math.min(box.bottom, banner.bottom) > Math.max(box.top, banner.top) ? [selector] : [];
      });
    }), 'a live effect must not cover order, roll, minimap or current status').toEqual([]);
    await screenshot(page, `warp-${name}`);
    await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle');
    await page.getByRole('button', { name: '事件记录', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '事件记录' })).toContainText(text);
    await page.keyboard.press('Escape');
    room.game.flags.thirds = { id: 'mouth', round: 1, held: {}, extraCards: [], npc: { id: 'mouth', position: 24 } };
    append(room, { type: 'event-marker', actor: { name: '大嘴', characterId: 'mouth' }, cause: 'thirds-mouth', before: [27], after: [24], text: '大嘴标记到第24格' });
    await expect(banner.locator('[data-event-art="event:mouth"]')).toBeVisible();
    await expect(banner).toContainText('标记 24格'); await expect(banner).not.toContainText('催眠师');
    await page.getByTestId('skip-animation').click(); await expect(banner).toHaveCount(0);
    await page.reload(); await expect(page.getByTestId('board-3d')).toHaveAttribute('data-phase', 'idle'); await expect(banner).toHaveCount(0);
    expect(f.errors).toEqual([]);
  } finally { await f.context.close(); }
});

for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['landscape', { width: 844, height: 390 }]] as const) test(`numeric choices show tokens, preserve costs, and open details without choosing on ${name}`, async ({ browser }) => {
  const f = await fixture(browser, viewport), { page, room } = f;
  try {
    room.game.racers[0]!.characterId = 'extra-mile-moneybags'; room.game.players[0]!.score = 2;
    delete room.game.flags.awaitRoll; room.game.queue = [{ kind: 'beginTurn', racerId: 'r0' }]; resolveTasks(room.game); room.version++; publish(room);
    const pending = room.game.pending!, version = room.version; expect(pending.kind).toBe('em-moneybags');
    const panel = page.getByTestId('skill-choice');
    await expect(panel.locator('.choice-dock-option.is-number')).toHaveCount(8);
    await expect(panel.locator('.is-number .choice-dock-label > strong')).toHaveText(['1格', '2格', '3格', '4格', '5格', '6格', '7格', '8格']);
    await expect(panel.locator('.choice-dock-title > strong')).toContainText(/支付1(?:积)?分/);
    expect(await panel.locator('button').evaluateAll(buttons => buttons.every(button => { const box = button.getBoundingClientRect(); return box.height >= 44 && box.width >= 44; }))).toBe(true);
    expect(await page.evaluate(() => { const hit = document.elementFromPoint(innerWidth * .5, innerHeight * .4); return !!hit?.closest('.board-scene'); }), 'the map above the anchored dock remains touchable').toBe(true);
    await page.getByRole('button', { name: '查看选项4详情', exact: true }).click();
    await expect(panel.getByRole('region', { name: '选项详情' })).toContainText('支付1分，移动4格');
    await expect(page.locator('.modal-backdrop')).toHaveCount(0);
    expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(viewport.height * (name === 'phone' ? .3 : .4) + 1);
    await expect(panel.getByRole('button', { name: '返回选项' })).toBeFocused();
    expect(app.rooms.get(room.code).version).toBe(version); expect(app.rooms.get(room.code).game.pending!.id).toBe(pending.id);
    await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: '查看选项4详情', exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: '查看选项4详情', exact: true })).toBeInViewport({ ratio: 1 });
    await page.getByRole('button', { name: '查看选项4详情', exact: true }).blur();
    await panel.getByRole('button', { name: '收起选项' }).click();
    expect((await panel.boundingBox())!.height).toBe(44);
    await panel.getByRole('button', { name: '展开选项' }).click();
    expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(viewport.height * (name === 'phone' ? .3 : .4) + 1);
    await screenshot(page, `numeric-choice-${name}`);
    if (!process.env.CI) await panel.screenshot({ path: `docs/qa/immersive-race-ui/numeric-choice-${name}-detail.png` });
    await page.getByRole('button', { name: '支付1分，移动4格', exact: true }).click();
    await expect.poll(() => app.rooms.get(room.code).game.players[0]!.score).toBe(1);
    expect(app.rooms.get(room.code).game.randomLog).toHaveLength(0);
    expect(f.errors).toEqual([]);
  } finally { await f.context.close(); }
});
