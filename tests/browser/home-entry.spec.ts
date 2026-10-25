import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';

let application: ReturnType<typeof createApplication>, url: string;

test.beforeAll(async () => {
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(0, '127.0.0.1', resolve));
  const address = application.http.address();
  if (!address || typeof address === 'string') throw Error('No server address');
  url = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => application.close());

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

async function neutralHome(page: Page) {
  await expect(page.getByRole('tablist', { name: '进入游戏方式' }).getByRole('tab')).toHaveCount(4);
  await expect(page.getByRole('tab', { selected: true })).toHaveCount(0);
  await expect(page.locator('#entry-form')).toHaveCount(0);
  await expect(page.locator('#entry-content')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '观战', exact: true })).toHaveCount(0);
  expect(await page.locator('.entry-panel').evaluate(element => element.getBoundingClientRect().height)).toBeLessThan(450);
  await noOverflow(page);
}

for (const mobile of [false, true]) {
  test(`首页入口先保持未选择，展开与返回保留各模式草稿 ${mobile ? '手机' : '桌面'}`, async ({ page }, testInfo) => {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    await page.goto(url);
    await neutralHome(page);
    await page.screenshot({ path: testInfo.outputPath('home-initial.png'), fullPage: true });

    await page.getByRole('tab', { name: '创建房间', exact: true }).click();
    await expect(page.getByRole('tab', { name: '创建房间', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel', { name: '创建房间', exact: true })).toHaveAttribute('id', 'entry-content');
    await page.getByLabel('你的昵称').fill('入口草稿同学');
    await page.getByLabel('房间人数上限').selectOption('2');
    await page.getByLabel('每次操作时限').selectOption('60');
    await page.getByRole('checkbox', { name: 'Extra Mile', exact: true }).check();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('home-create.png'), fullPage: true });
    await page.getByRole('button', { name: '← 返回首页（保留设置）', exact: true }).click();
    await neutralHome(page);
    await expect(page.getByRole('tab', { name: '创建房间', exact: true })).toBeFocused();

    await page.getByRole('tab', { name: '人机对战', exact: true }).click();
    await page.getByLabel('AI 人数', { exact: true }).selectOption('1');
    await expect(page.getByRole('checkbox', { name: 'Extra Mile', exact: true })).not.toBeChecked();
    await page.getByRole('checkbox', { name: 'Second Wind', exact: true }).check();
    await page.getByRole('button', { name: '← 返回首页（保留设置）', exact: true }).click();
    await neutralHome(page);
    await expect(page.getByRole('tab', { name: '人机对战', exact: true })).toBeFocused();

    await page.getByRole('tab', { name: '自己练习', exact: true }).click();
    await expect(page.getByRole('button', { name: '开始自己练习', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '← 返回首页（保留设置）', exact: true }).click();
    await neutralHome(page);
    await expect(page.getByRole('tab', { name: '自己练习', exact: true })).toBeFocused();

    await page.getByRole('tab', { name: '创建房间', exact: true }).click();
    await expect(page.getByLabel('你的昵称')).toHaveValue('入口草稿同学');
    await expect(page.getByLabel('房间人数上限')).toHaveValue('2');
    await expect(page.getByLabel('每次操作时限')).toHaveValue('60');
    await expect(page.getByRole('checkbox', { name: 'Extra Mile', exact: true })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'Second Wind', exact: true })).not.toBeChecked();
    await page.getByRole('tab', { name: '人机对战', exact: true }).click();
    await expect(page.getByLabel('AI 人数', { exact: true })).toHaveValue('1');
    await expect(page.getByRole('checkbox', { name: 'Second Wind', exact: true })).toBeChecked();

    await page.getByRole('tab', { name: '现有房间', exact: true }).click();
    await page.getByLabel('房间码', { exact: true }).fill('ABC234');
    await page.getByRole('radio', { name: /作为观战者/ }).check();
    await page.getByRole('button', { name: '← 返回首页（保留设置）', exact: true }).click();
    await neutralHome(page);
    await expect(page.getByRole('tab', { name: '现有房间', exact: true })).toBeFocused();
    await page.getByRole('tab', { name: '现有房间', exact: true }).click();
    await expect(page.getByLabel('房间码', { exact: true })).toHaveValue('ABC234');
    await expect(page.getByRole('radio', { name: /作为观战者/ })).toBeChecked();
    await expect(page.getByRole('button', { name: '进入房间观战', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: '现有房间', exact: true })).toBeVisible();
    await noOverflow(page);
    await page.screenshot({ path: testInfo.outputPath('home-existing-rooms.png'), fullPage: true });
  });
}

test('键盘移动入口焦点不自动展开，确认后进入面板并可返回原入口', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('tab', { name: '创建房间', exact: true }).focus();
  for (const [key, name] of [
    ['ArrowRight', '现有房间'],
    ['ArrowLeft', '创建房间'],
    ['ArrowLeft', '人机对战'],
    ['Home', '创建房间'],
    ['End', '人机对战'],
  ]) {
    await page.keyboard.press(key!);
    await expect(page.getByRole('tab', { name, exact: true })).toBeFocused();
    await neutralHome(page);
  }
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: '人机对战', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: '人机对战', exact: true })).toHaveAttribute('id', 'entry-content');
  await expect(page.locator('.setup-heading h2')).toBeFocused();
  await page.getByRole('button', { name: '← 返回首页（保留设置）', exact: true }).click();
  await neutralHome(page);
  await expect(page.getByRole('tab', { name: '人机对战', exact: true })).toBeFocused();
});

test('现有房间同时支持房间码和列表，以选手或观众身份加入', async ({ browser }, testInfo) => {
  const contexts: BrowserContext[] = [], errors: string[] = [];
  try {
    const makePage = async (mobile = false) => {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });
      contexts.push(context);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.stack ?? error.message));
      return page;
    };
    const host = await makePage();
    await host.goto(url);
    await host.getByRole('tab', { name: '创建房间', exact: true }).click();
    await host.getByLabel('你的昵称').fill('入口房主');
    await host.getByLabel('房间人数上限').selectOption('6');
    await host.getByLabel('每次操作时限').selectOption('0');
    await host.getByRole('button', { name: '创建房间，召集朋友', exact: true }).click();
    await expect(host.locator('.connection.is-online')).toBeVisible();
    const code = host.url().split('/').at(-1)!;

    for (const via of ['code', 'directory'] as const) {
      for (const role of ['player', 'spectator'] as const) {
        const page = await makePage(role === 'spectator');
        await page.goto(url);
        await page.getByRole('tab', { name: '现有房间', exact: true }).click();
        await page.getByLabel('你的昵称').fill(`${via === 'code' ? '房间码' : '列表'}${role === 'player' ? '选手' : '观众'}`);
        if (via === 'code') {
          await page.getByLabel('房间码', { exact: true }).fill(code);
          if (role === 'spectator') await page.getByRole('radio', { name: /作为观战者/ }).check();
          await page.getByRole('button', { name: role === 'player' ? '加入这场胡闹' : '进入房间观战', exact: true }).click();
        } else {
          const row = page.getByTestId(`directory-room-${code}`);
          await expect(row).toBeVisible();
          await noOverflow(page);
          await page.screenshot({ path: testInfo.outputPath(`directory-${role}.png`), fullPage: true });
          // Each row has explicit actions; the spectator action must work even
          // while the manual room-code form retains its default player role.
          await expect(page.getByRole('radio', { name: /作为选手/ })).toBeChecked();
          await row.getByRole('button', { name: role === 'player' ? '加入房间' : '观战', exact: true }).click();
        }
        await expect(page).toHaveURL(`${url}/room/${code}`);
        await expect(page.locator('.connection.is-online')).toBeVisible();
        if (role === 'spectator') {
          await expect(page.locator('.spectator-badge')).toHaveText('正在观战');
          await expect(page.getByRole('button', { name: '我准备好了', exact: true })).toHaveCount(0);
        } else {
          await expect(page.getByRole('button', { name: '我准备好了', exact: true })).toBeVisible();
        }
        await noOverflow(page);
      }
    }
    expect(application.rooms.get(code.replace(/^[CA]-/,'')).game.players).toHaveLength(3);
    expect(application.rooms.get(code.replace(/^[CA]-/,'')).spectators).toHaveLength(2);
    expect(errors).toEqual([]);
  } finally { await Promise.all(contexts.map(context => context.close())); }
});

test('邀请链接直接展开现有房间，返回首页后可保留昵称重新选择入口', async ({ page }) => {
  const { room } = application.rooms.create('邀请房主', 6, 0);
  await page.goto(`${url}/room/${room.code}`);
  await expect(page.locator('#entry-form')).toBeVisible();
  await expect(page.getByRole('tab', { name: '现有房间', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { selected: true })).toHaveCount(1);
  await expect(page.getByRole('tabpanel', { name: '现有房间', exact: true })).toHaveAttribute('id', 'entry-content');
  await expect(page.locator('.setup-heading h2')).toBeFocused();
  await expect(page.getByLabel('房间码', { exact: true })).toHaveValue(room.code);
  await expect(page.getByRole('radio', { name: /作为选手/ })).toBeChecked();
  await page.getByLabel('你的昵称').fill('邀请观众');
  await page.getByRole('button', { name: '← 返回首页（保留设置）', exact: true }).click();
  await expect(page).toHaveURL(`${url}/`);
  await neutralHome(page);
  await expect(page.getByRole('tab', { name: '现有房间', exact: true })).toBeFocused();
  await page.getByRole('tab', { name: '现有房间', exact: true }).click();
  await expect(page.getByLabel('你的昵称')).toHaveValue('邀请观众');
  await page.getByLabel('房间码', { exact: true }).fill(room.code);
  await page.getByRole('radio', { name: /作为观战者/ }).check();
  await page.getByRole('button', { name: '进入房间观战', exact: true }).click();
  await expect(page.locator('.connection.is-online')).toBeVisible();
  await expect(page.locator('.spectator-badge')).toHaveText('正在观战');
  expect(application.rooms.get(room.code).game.players).toHaveLength(1);
  expect(application.rooms.get(room.code).spectators).toHaveLength(1);
});
