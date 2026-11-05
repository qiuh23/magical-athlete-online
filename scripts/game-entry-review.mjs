import { chromium, webkit, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createApplication } from '../dist/server/server/index.js';

// Local-only real Node/Socket.IO authorities. No production rooms or CI runs.
const before = process.argv.includes('--before');
const output = 'docs/qa/game-entry-ui';
const safari = process.env.BROWSER_ENGINE === 'webkit';
const suffix = safari ? '-webkit' : '';
const apps = [], errors = [], requests = [];
let browser, releaseCreate = () => {};
try {
  process.env.PUBLIC_ACCESS_ENABLED = 'true';
  const origins = {};
  for (const id of ['cloudflare', 'aliyun']) {
    process.env.BACKEND_ID = id;
    const app = createApplication(':memory:');
    await new Promise(resolve => app.http.listen(0, '127.0.0.1', resolve));
    origins[id] = `http://127.0.0.1:${app.http.address().port}`;
    apps.push(app);
  }
  process.env.BACKENDS_CONFIG_JSON = JSON.stringify({ backends: Object.entries(origins).map(([id, origin]) => ({ id, origin, transport: 'socketio', enabled: true })) });
  await mkdir(output, { recursive: true });
  browser = safari ? await webkit.launch({ headless: true }) : await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const context = await browser.newContext();
  context.on('request', request => requests.push(request.url()));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origins.cloudflare + '/?token=private&next=https://evil.test#private');
  await expect(page.getByRole('tab', { name: '创建房间', exact: true })).toBeVisible();
  for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, portrait: { width: 390, height: 844 }, landscape: { width: 844, height: 390 } })) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: `${output}/${before ? 'before' : 'after'}-${name}${suffix}.png`, fullPage: true });
  }
  if (before) {
    console.log('Captured baseline home at desktop, portrait and landscape.');
  } else {
    await expect(page.getByRole('radiogroup', { name: '服务器', exact: true })).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: '当前线路' })).toContainText('Cloudflare');
    await expect(page.getByRole('link', { name: '返回游戏大厅', exact: true })).toHaveAttribute('href', 'https://magical-athlete.qiuh23.workers.dev/lobby/');
    await expect(page.getByRole('button', { name: '切换到阿里云内地', exact: true })).toHaveCount(0);
    await page.getByText('线路设置', { exact: true }).click();
    await expect(page.getByRole('button', { name: '当前线路 Cloudflare', exact: true })).toBeDisabled();
    for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 1000 }, portrait: { width: 390, height: 844 }, landscape: { width: 844, height: 390 } })) {
      await page.setViewportSize(viewport);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.screenshot({ path: `${output}/after-settings-${name}${suffix}.png`, fullPage: true });
    }
    await page.getByRole('button', { name: '切换到阿里云内地', exact: true }).click();
    await expect(page).toHaveURL(origins.aliyun + '/');
    await expect(page.locator('.current-line')).toContainText('阿里云内地');
    await page.getByText('线路设置', { exact: true }).click();
    await expect(page.getByRole('button', { name: '当前线路 阿里云内地', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '切换到Cloudflare', exact: true }).click();
    await expect(page).toHaveURL(origins.cloudflare + '/');
    await page.getByRole('tab', { name: '创建房间', exact: true }).click();
    await page.getByLabel('你的昵称').fill('入口验收房主');
    await page.getByLabel('房间人数上限').selectOption('2');
    await page.getByLabel('每次操作时限').selectOption('0');
    const creationGate = new Promise(resolve => { releaseCreate = resolve; });
    await context.route(origins.cloudflare + '/api/rooms', async route => { if (route.request().method() === 'POST') await creationGate; return route.continue(); });
    await page.getByRole('button', { name: '创建房间，召集朋友', exact: true }).click();
    await expect(page.getByRole('link', { name: '返回游戏大厅', exact: true })).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('link', { name: '返回游戏大厅', exact: true }).click({ force: true });
    await expect(page).toHaveURL(origins.cloudflare + '/');
    releaseCreate();
    await expect(page.locator('.connection.is-online')).toBeVisible();
    // Let Socket.IO finish its normal polling-to-WebSocket upgrade before
    // navigating away; WebKit reports aborted polling during a hop as pageerror.
    await expect.poll(() => [...apps[0].io.sockets.sockets.values()].every(socket => socket.conn.transport.name === 'websocket')).toBe(true);
    const roomURL = page.url();
    const saved = await page.evaluate(() => sessionStorage.getItem('magical-athlete:route-identity:v1'));
    await page.getByRole('link', { name: '返回游戏大厅', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '返回游戏大厅？' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '继续留在房间', exact: true }).click();
    await expect(page).toHaveURL(roomURL);
    await expect(page.locator('.connection.is-online')).toBeVisible();
    await expect(page.getByRole('dialog', { name: /返回游戏大厅？|切换服务器？/ })).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem('magical-athlete:route-identity:v1'))).toBe(saved);
    const lobbyURL = 'https://magical-athlete.qiuh23.workers.dev/lobby/';
    await context.route(lobbyURL, route => route.fulfill({ contentType: 'text/html', body: '<h1>本地大厅导航替身</h1>' }));
    await page.getByRole('link', { name: '返回游戏大厅', exact: true }).click();
    await dialog.getByRole('button', { name: '确认返回游戏大厅', exact: true }).click();
    await expect(page).toHaveURL(lobbyURL);
    await page.goBack();
    await expect(page.locator('.connection.is-online')).toBeVisible();
    await expect(page.getByRole('dialog', { name: /返回游戏大厅？|切换服务器？/ })).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem('magical-athlete:route-identity:v1'))).toBe(saved);
    // Room-side switching is secondary and guarded; the original identity stays.
    await page.locator('.room-details > summary').click();
    await expect(page.getByRole('button', { name: '当前线路 Cloudflare', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '切换到阿里云内地', exact: true }).click();
    const switchDialog = page.getByRole('dialog', { name: '切换服务器？' });
    await expect(switchDialog).toContainText('独立游戏入口');
    await switchDialog.getByRole('button', { name: '继续留在房间', exact: true }).click();
    await expect(page).toHaveURL(roomURL);
    expect(await page.evaluate(() => sessionStorage.getItem('magical-athlete:route-identity:v1'))).toBe(saved);
    await page.getByRole('button', { name: '切换到阿里云内地', exact: true }).click();
    await switchDialog.getByRole('button', { name: '确认切换服务器', exact: true }).click();
    await expect(page).toHaveURL(origins.aliyun + '/');
    await page.goBack();
    await expect(page.locator('.connection.is-online')).toBeVisible();
    await expect(page.getByRole('dialog', { name: /返回游戏大厅？|切换服务器？/ })).toHaveCount(0);
    expect(await page.evaluate(() => sessionStorage.getItem('magical-athlete:route-identity:v1'))).toBe(saved);
    // Foreign invitation wins over a conflicting local preference.
    const guest = await context.newPage();
    guest.on('pageerror', error => errors.push(error.message));
    await guest.addInitScript(() => localStorage.setItem('magical-athlete:backend-preference:v1', 'aliyun'));
    await guest.goto(origins.aliyun + new URL(roomURL).pathname + '?spectate=1&token=secret#private');
    await expect(guest).toHaveURL(roomURL + '?spectate=1');
    await guest.getByLabel('你的昵称').fill('跨服观众');
    await guest.getByRole('button', { name: '进入房间观战', exact: true }).click();
    await expect(guest.locator('.spectator-badge')).toContainText('正在观战');
    await guest.reload();
    await expect(guest.locator('.spectator-badge')).toContainText('正在观战');
    const ali = await context.newPage();
    await ali.goto(origins.aliyun);
    await expect(ali.getByRole('link', { name: '返回游戏大厅', exact: true })).toHaveAttribute('href', 'https://magical-athlete-online.cn/');
    await ali.getByText('线路设置', { exact: true }).click();
    await expect(ali.getByRole('button', { name: '当前线路 阿里云内地', exact: true })).toBeDisabled();
    await expect(ali.getByRole('button', { name: '切换到Cloudflare', exact: true })).toBeEnabled();
    expect(errors).toEqual([]);
    const result = { result: 'passed', sizes: ['1440x1000', '390x844', '844x390'], errors, requests: requests.length, checks: ['creation-in-flight blocks lobby navigation', 'compact line status', 'same-line lobby URLs', 'secondary direct server choice and clean URLs both directions', 'in-room direct switch cancel, confirm and Back preserve identity', 'cancel keeps room', 'confirm navigation and browser Back restore same identity', 'foreign spectator invite ignores conflicting preference and removes private query', 'spectator refresh'] };
    await writeFile(`${output}/result${suffix}.json`, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
  }
} finally {
  releaseCreate();
  await browser?.close();
  await Promise.all(apps.map(app => app.close()));
}
