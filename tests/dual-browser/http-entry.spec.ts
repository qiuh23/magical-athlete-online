import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createApplication } from '../../src/server/index.js';
import {mkdirSync} from 'node:fs';

// The resolver maps these names to this test's loopback listener. Unlike
// localhost, an ordinary HTTP hostname is not a browser secure context.
const entryOrigin = 'http://game.http.test:3322';
const secondEntry = 'http://guest.http.test:3322';
const workerOrigin = 'https://127.0.0.1:8797';
const deployment = { backends: [
  { id: 'cloudflare', origin: workerOrigin, transport: 'worker', enabled: true },
  { id: 'aliyun', origin: entryOrigin, transport: 'socketio', enabled: true, allowInsecureHttp: true },
] };
let application: ReturnType<typeof createApplication>;
const originalEnv = { BACKEND_ID: process.env.BACKEND_ID, BACKENDS_CONFIG_JSON: process.env.BACKENDS_CONFIG_JSON, PUBLIC_ORIGINS: process.env.PUBLIC_ORIGINS };

test.beforeAll(async () => {
  process.env.BACKEND_ID = 'aliyun';
  process.env.BACKENDS_CONFIG_JSON = JSON.stringify(deployment);
  process.env.PUBLIC_ORIGINS = [entryOrigin, secondEntry, workerOrigin].join(',');
  application = createApplication(':memory:');
  await new Promise<void>(resolve => application.http.listen(3322, '127.0.0.1', resolve));
});
test.afterAll(async () => {
  await application.close();
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

async function configured(context: BrowserContext) {
  await context.route('**/backends.json', route => route.fulfill({ json: deployment }));
  await context.addInitScript(() => {
    localStorage.setItem('magical-athlete:low-quality', 'true');
    localStorage.setItem('magical-athlete:reduced-motion', 'true');
    localStorage.setItem('magical-athlete:muted', 'true');
  });
}
async function online(page: Page) { await expect(page.locator('.connection.is-online')).toBeVisible(); }
async function chat(page: Page, text: string) {
  await page.getByRole('button', { name: /^房间聊天/ }).click();
  await page.getByLabel('聊天消息', { exact: true }).fill(text);
  await page.getByRole('button', { name: '发送', exact: true }).click();
  await expect(page.getByRole('log', { name: '聊天记录' })).toContainText(text);
}
async function persistedIdentity(page: Page, backendId: 'aliyun' | 'cloudflare', code: string) {
  const saved = await page.evaluate(({ backendId, code }) => ({
    route: JSON.parse(sessionStorage.getItem('magical-athlete:route-identity:v1') ?? 'null'),
    credential: JSON.parse(localStorage.getItem(`magical-athlete:identity:${backendId}:${code}:player`) ?? 'null'),
  }), { backendId, code });
  expect(saved.credential).toEqual(expect.objectContaining({
    backendId, roomCode: code,
    playerId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
    token: expect.any(String),
  }));
  expect(saved.credential.token.length).toBeGreaterThanOrEqual(40);
  expect(saved.route).toEqual({ code, backendId, playerId: saved.credential.playerId, role: 'player' });
  return saved;
}
async function closeOwnRoom(page?: Page) {
  if (!page || page.isClosed() || !new URL(page.url()).pathname.startsWith('/room/')) return;
  if (await page.locator('[data-room-closed="true"]').count()) return;
  if (!await page.locator('.game-shell').count()) return;
  const end = page.getByRole('button', { name: '结束房间', exact: true });
  if (!await end.count()) await page.getByRole('button', { name: '比赛菜单', exact: true }).click({ timeout: 5000 });
  await end.click({ timeout: 5000 });
  await page.getByRole('dialog', { name: '结束此房间？', exact: true }).getByRole('button', { name: '确认结束', exact: true }).click({ timeout: 5000 });
  await expect(page.locator('[data-room-closed="true"]')).toBeVisible();
}

for (const backend of ['aliyun', 'cloudflare'] as const) {
  test(`ordinary HTTP entry: ${backend} create/join/chat/reconnect across independent entries`, async ({ browser }, info) => {
    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
    const errors: string[] = [];
    const mainlandRequests: string[] = [];
    let host: Page | undefined;
    try {
      await Promise.all(contexts.map(configured));
      host = await contexts[0]!.newPage();
      const guest = await contexts[1]!.newPage();
      for (const page of [host, guest]) page.on('pageerror', error => errors.push(error.message));
      // Exercise both top-level directions with the real Worker and Node builds.
      const targetOrigin = backend === 'aliyun' ? entryOrigin : workerOrigin;
      await host.goto(backend === 'aliyun' ? workerOrigin : entryOrigin);
      const selected = host.getByRole('radio', { name: backend === 'aliyun' ? '阿里云内地' : 'Cloudflare', exact: true });
      await expect(selected).toBeEnabled(); await selected.click();
      await expect(host).toHaveURL(targetOrigin+'/');
      if (backend === 'aliyun') {
        expect(await host.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID, random: typeof crypto.getRandomValues })))
          .toEqual({ secure: false, uuid: 'undefined', random: 'function' });
        // Simulate losing VPN/Cloudflare after reaching the mainland entry.
        await contexts[0]!.route(workerOrigin+'/**',route=>route.abort('internetdisconnected'));
        await contexts[0]!.routeWebSocket('wss://127.0.0.1:8797/**',ws=>ws.close());
        host.on('request',request=>mainlandRequests.push(request.url()));
      }
      await host.getByRole('tab', { name: '创建房间', exact: true }).click();
      await host.getByLabel('你的昵称').fill(`HTTP房主${backend}`);
      await host.getByLabel('房间人数上限').selectOption('2');
      await host.getByLabel('每次操作时限').selectOption('0');
      await host.getByLabel('房间可见性', { exact: true }).selectOption('private');
      await host.getByRole('button', { name: '创建房间，召集朋友', exact: true }).click();
      await online(host);
      const route = new URL(host.url()).pathname;
      const code = route.split('/').at(-1)!.replace(/^[CA]-/, '');
      expect(route).toMatch(backend === 'aliyun' ? /^\/room\/A-[A-Z2-9]{6}$/ : /^\/room\/C-[A-Z2-9]{6}$/);
      const directory = await host.request.get(backend === 'aliyun' ? 'http://127.0.0.1:3322/api/rooms' : `${workerOrigin}/api/browser/rooms`);
      expect(directory.status()).toBe(200);
      expect((await directory.json()).rooms.map((room: { code: string }) => room.code)).not.toContain(code);
      const wrongEntry = backend === 'aliyun' ? workerOrigin : secondEntry;
      await guest.goto(wrongEntry + route+'?token=must-not-transfer#private');
      await expect(guest).toHaveURL(targetOrigin+route);
      if (backend === 'aliyun') {
        await contexts[1]!.route(workerOrigin+'/**',route=>route.abort('internetdisconnected'));
        await contexts[1]!.routeWebSocket('wss://127.0.0.1:8797/**',ws=>ws.close());
        guest.on('request',request=>mainlandRequests.push(request.url()));
      }
      await guest.getByLabel('你的昵称').fill(`HTTP访客${backend}`);
      await guest.getByRole('button', { name: '加入这场胡闹', exact: true }).click();
      await online(guest);
      await expect(host.locator('.lobby-seats')).toContainText(`HTTP访客${backend}`);
      await expect(host.getByRole('radio',{name:'Cloudflare',exact:true})).toHaveCount(0);
      await expect(host.locator('.selectable-link')).toHaveAttribute('href',targetOrigin+route);
      await host.getByRole('button', { name: '我准备好了', exact: true }).click();
      await expect(host.getByRole('button', { name: '取消准备', exact: true })).toBeVisible();
      const message = `HTTP-${backend}-聊天`;
      await chat(host, message);
      await guest.getByRole('button', { name: /^房间聊天/ }).click();
      await expect(guest.getByRole('log', { name: '聊天记录' })).toContainText(message);
      const identity = await persistedIdentity(guest, backend, code);
      const ownerIdentity = await persistedIdentity(host, backend, code);
      await contexts[1]!.setOffline(true);
      await expect(guest.locator('.connection.is-online')).toHaveCount(0);
      await contexts[1]!.setOffline(false); await online(guest);
      await guest.reload(); await online(guest);
      expect(await persistedIdentity(guest, backend, code)).toEqual(identity);
      await host.reload();await online(host);
      expect(await persistedIdentity(host, backend, code)).toEqual(ownerIdentity);
      await expect(host.getByRole('button',{name:'取消准备',exact:true})).toBeVisible();
      await guest.getByRole('button', { name: /^房间聊天/ }).click();
      await expect(guest.getByRole('log', { name: '聊天记录' })).toContainText(message);
      // Reload closes the host's local chat panel, while history remains stored.
      if (backend === 'aliyun') {
        expect(mainlandRequests.filter(value=>/^https?:/.test(value)).every(value=>new URL(value).origin===entryOrigin)).toBe(true);
        expect(mainlandRequests.some(value=>value.includes('/assets/')&&value.endsWith('.js'))).toBe(true);
        expect(mainlandRequests.some(value=>value.includes('/assets/')&&value.endsWith('.css'))).toBe(true);
        mkdirSync('docs/qa/server-entry-switch',{recursive:true});
        await host.screenshot({path:'docs/qa/server-entry-switch/aliyun-independent-desktop.png',fullPage:true});
      }
      await host.setViewportSize({ width: 390, height: 844 });
      expect(await host.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await host.screenshot({ path: info.outputPath(`http-${backend}-mobile.png`), fullPage: true });
      if (backend === 'aliyun') await host.screenshot({path:'docs/qa/server-entry-switch/aliyun-independent-mobile.png',fullPage:true});
      await closeOwnRoom(host);
      await expect(guest.locator('[data-room-closed="true"]')).toBeVisible();
      expect(errors).toEqual([]);
    } finally {
      try { await closeOwnRoom(host); } finally { await Promise.all(contexts.map(context => context.close())); }
    }
  });
}

test('ordinary HTTP entry: practice can submit a valid dice roll and AI can start', async ({ browser }) => {
  const context = await browser.newContext(); await configured(context);
  let page: Page | undefined;
  try {
    page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(entryOrigin);
    const backend = page.getByRole('radio', { name: '阿里云内地', exact: true });
    await expect(backend).toBeEnabled(); await backend.click();
    await context.route(workerOrigin+'/**',route=>route.abort('internetdisconnected'));
    await context.routeWebSocket('wss://127.0.0.1:8797/**',ws=>ws.close());
    await page.getByRole('tab', { name: '自己练习', exact: true }).click();
    await page.getByRole('button', { name: '开始自己练习', exact: true }).click();
    await online(page);
    const code = new URL(page.url()).pathname.split('/').at(-1)!.replace(/^A-/, '');
    for (const name of ['炼金术士', '飞艇', '半人马', '啦啦队长']) {
      await page.locator('.practice-pool').getByRole('button', { name: `选择${name}`, exact: true }).click();
    }
    await page.getByRole('button', { name: '确认练习阵容', exact: true }).click();
    await page.locator('.hand-selection').getByRole('button', { name: '选择炼金术士', exact: true }).click();
    await page.getByRole('button', { name: '锁定上场角色', exact: true }).click();
    await expect(page.getByTestId('roll-button')).toBeEnabled({ timeout: 30000 });
    await page.getByTestId('roll-button').click();
    await expect.poll(() => application.rooms.get(code).game.lastRoll?.face).toBeGreaterThanOrEqual(1);
    expect(application.rooms.get(code).game.lastRoll!.face).toBeLessThanOrEqual(6);
    await closeOwnRoom(page);
    await page.goto(entryOrigin);
    await expect(backend).toBeEnabled(); await backend.click();
    await page.getByRole('tab', { name: '人机对战', exact: true }).click();
    await page.getByLabel('AI 人数', { exact: true }).selectOption('1');
    await page.getByRole('button', { name: '开始人机对战', exact: true }).click();
    await online(page);
    await expect(page.getByRole('heading', { name: '组建你的队伍', exact: true })).toBeVisible();
    await closeOwnRoom(page);
    expect(errors).toEqual([]);
  } finally { try { await closeOwnRoom(page); } finally { await context.close(); } }
});
