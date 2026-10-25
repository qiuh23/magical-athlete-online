import { mkdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';

let application: ReturnType<typeof createApplication>, url: string;
const output = 'test-results/card-background';

test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('Missing test server address');
  url = `http://127.0.0.1:${address.port}`;
  mkdirSync(output, { recursive: true });
});
test.afterAll(async () => { await application.close(); });

test('flat blue and yellow cards keep artwork, selection and details readable on desktop and mobile', async ({ browser }) => {
  const created = application.rooms.create('卡牌检查', 2, 0);
  const guest = application.rooms.join(created.identity.roomCode, '卡牌伙伴');
  const room = application.rooms.get(created.identity.roomCode);
  room.game.phase = 'draft';
  room.game.draft = {
    market: ['banana', 'romantic', 'skipper', 'leaf-triangle-man'],
    order: [created.identity.playerId, guest.identity.playerId], cursor: 0, batch: 0,
  };
  room.deadline = null; room.configFrozen = true; room.version++;
  application.store.save(room);

  for (const [name, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ] as const) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    try {
      await context.addInitScript(identity => {
        localStorage.setItem(`magical-athlete:identity:${identity.roomCode}`, JSON.stringify(identity));
        localStorage.setItem('magical-athlete:muted', 'true');
        localStorage.setItem('magical-athlete:reduced-motion', 'true');
      }, created.identity);
      const page = await context.newPage(), errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${url}/room/${created.identity.roomCode}`);
      const cards = page.locator('.character-card');
      await expect(cards).toHaveCount(4);
      for (const card of await cards.all()) {
        const artwork = card.locator('.character-avatar-detail');
        expect(await artwork.evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none');
        expect(await artwork.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(37, 77, 228)');
        expect(await card.locator('.character-copy').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(255, 218, 39)');
        await expect(artwork.locator('.portrait-scenery')).toHaveCount(0);
        const frame = await artwork.boundingBox(), avatar = await artwork.locator('.avatar').boundingBox();
        expect(frame).toBeTruthy(); expect(avatar).toBeTruthy();
        expect(avatar!.x).toBeGreaterThanOrEqual(frame!.x);
        expect(avatar!.x + avatar!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
        expect(avatar!.y).toBeGreaterThanOrEqual(frame!.y);
        expect(avatar!.y + avatar!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
      }
      const banana = page.locator('[data-character-id="banana"]');
      await banana.getByRole('button', { name: '选择香蕉', exact: true }).click();
      await expect(banana).toHaveClass(/selected/);
      await page.mouse.move(0, 0);
      await page.locator('.character-grid').screenshot({ path: `${output}/${name}.png` });
      await banana.getByRole('button', { name: '查看香蕉的技能与当前玩家', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('.portrait-scene .avatar')).toBeVisible();
      await expect(dialog.locator('.portrait-scenery')).toHaveCount(0);
      await expect(dialog.locator('.identity-name')).toHaveText('香蕉');
      expect(await dialog.locator('.modal-header').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(37, 77, 228)');
      await dialog.screenshot({ path: `${output}/${name}-detail.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  }
});
