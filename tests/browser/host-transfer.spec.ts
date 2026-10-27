import { test, expect } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';

let application: ReturnType<typeof createApplication>, url: string;

test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('Missing server address');
  url = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => application.close());

for (const [device, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test(`host transfer shows readable candidates and updates ownership on ${device}`, async ({ browser }, testInfo) => {
    const created = application.rooms.create('原房主', 2, 0);
    const code = created.identity.roomCode;
    const members = [created, application.rooms.join(code, '接任同学')];
    const contexts = await Promise.all(members.map(() => browser.newContext({ viewport })));
    const errors: string[] = [];
    try {
      const pages = await Promise.all(contexts.map(async (context, index) => {
        await context.addInitScript(identity => {
          localStorage.setItem(`magical-athlete:identity:cloudflare:${identity.roomCode}`, JSON.stringify({ ...identity, backendId: 'cloudflare' }));
        }, members[index]!.identity);
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${url}/room/C-${code}`);
        await expect(page.locator('.connection.is-online')).toBeVisible();
        return page;
      }));
      const host = pages[0]!, guest = pages[1]!;
      const menu = host.locator('.transfer-host');
      const candidate = menu.getByRole('button', { name: '交给 接任同学', exact: true });
      await expect(candidate).toBeHidden();
      await expect(guest.locator('.transfer-host')).toHaveCount(0);
      await menu.locator('summary').click();
      await expect(candidate).toBeVisible();
      await expect(menu.getByRole('button')).toHaveCount(1);
      await host.locator('.lobby-invite').screenshot({ path: testInfo.outputPath('host-transfer-menu.png') });
      const textColor = await host.locator('body').evaluate(body => getComputedStyle(body).color);
      await expect(candidate).toHaveCSS('color', textColor);
      expect(await host.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await candidate.click();
      await expect.poll(() => application.rooms.get(code).hostId).toBe(members[1]!.identity.playerId);
      await expect(host.locator('.transfer-host')).toHaveCount(0);
      await guest.locator('.transfer-host summary').click();
      await expect(guest.getByRole('button', { name: '交给 原房主', exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  });
}
