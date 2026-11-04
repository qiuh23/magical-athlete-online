import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

let server: Server, origin: string;
const directory = resolve('lobby');
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = new URL(req.url!, 'http://localhost').pathname;
    const filename = pathname === '/' || pathname === '/lobby/' ? 'index.html' : pathname.replace(/^\/lobby\//, '').replace(/^\//, '');
    const file = resolve(directory, filename);
    if (!file.startsWith(directory + '\\') && !file.startsWith(directory + '/')) { res.writeHead(404).end(); return; }
    try {
      const data = await readFile(file);
      const types: Record<string,string> = { '.html': 'text/html; charset=utf-8', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/plain', 'Cache-Control': 'no-store' }).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw Error('No server');
  origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(() => new Promise<void>((resolve,reject) => server.close(error => error ? reject(error) : resolve())));

async function activate(page: import('@playwright/test').Page) {
  await page.route('**/config.json', async route => {
    const config = JSON.parse(await readFile(resolve(directory, 'config.json'), 'utf8'));
    config.entries.athlete.aliyun.enabled = config.entries.wizard.aliyun.enabled = true;
    await route.fulfill({ json: config });
  });
}

test('320px、390px、桌面布局与待上线状态，所有运行资源来自当前入口', async ({page}) => {
  const external: string[] = [], errors: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== origin) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(origin + '/lobby/');
    await expect(page.locator('#choices')).not.toHaveAttribute('aria-busy');
    await expect(page.getByRole('radio', {name:'国内服务器'})).toBeChecked();
    await expect(page.locator('[data-game="athlete"]')).not.toHaveAttribute('href');
    await expect(page.locator('[data-game="athlete"] .action')).toHaveText('国内 HTTPS 待上线');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('radio', {name:'Cloudflare'}).check();
    await expect(page.locator('[data-game="wizard"]')).toHaveAttribute('href', 'https://wizard-friends.qiuh23.workers.dev/');
    await page.screenshot({path:`.local/lobby-${width}.png`,fullPage:true});
    await page.evaluate(() => localStorage.clear());
  }
  await expect(page.getByRole('link', {name:'京ICP备2026075006号-1'})).toHaveAttribute('href','https://beian.miit.gov.cn/');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('四个入口整页跳转；偏好刷新恢复，不发出跨服探测或混合内容请求', async ({page}) => {
  await activate(page);
  for (const [serverId, label] of [['aliyun','国内服务器'], ['cloudflare','Cloudflare']]) for (const game of ['athlete','wizard']) {
    await page.goto(origin + '/');
    await page.getByRole('radio', {name:label}).check();
    await page.reload();
    await expect(page.getByRole('radio', {name:label})).toBeChecked();
    const link = page.locator(`[data-game="${game}"]`);
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^https:\/\//);
    expect(href).toContain(serverId === 'aliyun' ? `${game}.magical-athlete-online.cn` : '.workers.dev');
    await page.route(href!, route => route.fulfill({contentType:'text/html',body:'<!doctype html><p>游戏入口测试替身</p>'}));
    await link.click();
    await expect(page).toHaveURL(href!);
  }
});

test('邀请高于偏好，保留四入口观战，刷新不丢失且不接受URL令牌', async ({page}) => {
  await activate(page);
  await page.goto(origin);
  await page.getByRole('radio', {name:'Cloudflare'}).check();
  for (const game of ['athlete','wizard']) for (const [serverId, prefix] of [['aliyun','A'], ['cloudflare','C']]) {
    const code = game === 'athlete' ? 'ABC234' : 'ABCD2345';
    await page.goto(`${origin}/?game=${game}&room=${prefix}-${code}&watch=1&token=private&redirect=https://evil.test#secret`);
    await page.reload();
    await expect(page.locator('#invite-details')).toContainText('观战');
    await expect(page.locator(`input[value="${serverId}"]`)).toBeChecked();
    await expect(page.locator(`input[value="${serverId}"]`)).toBeDisabled();
    const href = await page.locator(`[data-game="${game}"]`).getAttribute('href');
    expect(href).toContain(game === 'athlete' ? `/room/${prefix}-${code}?spectate=1` : `?room=${prefix}-${code}&watch=1`);
    expect(href).not.toMatch(/private|secret|evil/);
    await expect(page.locator(`[data-game="${game === 'athlete' ? 'wizard' : 'athlete'}"]`)).not.toHaveAttribute('href');
  }
  await page.getByRole('button',{name:'返回游戏选择'}).click();
  expect(new URL(page.url()).search).toBe('');
  expect(new URL(page.url()).hash).toBe('');
  await expect(page.getByRole('radio',{name:'Cloudflare'})).toBeEnabled();
});

test('存储API完全不可用仍可进入；错误配置和冲突邀请安全停止', async ({page}) => {
  await page.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError');}}));
  await page.goto(origin);
  await page.getByRole('radio',{name:'Cloudflare'}).check();
  await expect(page.locator('[data-game="athlete"]')).toHaveAttribute('href','https://magical-athlete.qiuh23.workers.dev/');
  await page.goto(origin+'/?game=athlete&room=A-ABC234&server=cloudflare');
  await expect(page.getByRole('alert')).toContainText('不一致');
  await expect(page.locator('[data-game="athlete"]')).not.toHaveAttribute('href');
  await page.route('**/config.json',route=>route.fulfill({json:{version:1,entries:{}}}));
  await page.goto(origin);
  await expect(page.getByRole('alert')).toContainText('配置');
  await expect(page.locator('[data-game="wizard"]')).not.toHaveAttribute('href');
});
