import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';

const directory = resolve('lobby');
const cfLobby = 'https://magical-athlete.qiuh23.workers.dev/lobby/';
const cnLobby = 'https://magical-athlete-online.cn/';
const types: Record<string,string> = { '.html': 'text/html; charset=utf-8', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

// The browser exercises real top-level navigation across the production origin
// shapes, but every response is a local fixture: no production rooms or TLS are
// tested by this suite, and no request leaves the browser interception layer.
async function sites(page: Page, active = false, extraOrigin?: string) {
  const config = JSON.parse(await readFile(resolve(directory, 'config.json'), 'utf8'));
  if (active) {
    config.lobbies.aliyun.enabled = true;
    config.entries.athlete.aliyun.enabled = config.entries.wizard.aliyun.enabled = true;
  }
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const lobby = url.origin === new URL(cfLobby).origin && url.pathname.startsWith('/lobby/') ? cfLobby
      : url.origin === new URL(cnLobby).origin ? cnLobby
      : extraOrigin && url.origin === extraOrigin ? extraOrigin + '/' : null;
    if (!lobby) {
      if (Object.values(config.entries).some((game: any) => Object.values(game).some((entry: any) => entry.origin === url.origin))) {
        await route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><p>游戏入口测试替身</p>'});
      } else await route.abort('blockedbyclient');
      return;
    }
    const pathname = url.pathname.slice(new URL(lobby).pathname.length);
    const filename = pathname || 'index.html';
    const file = resolve(directory, filename);
    if (!file.startsWith(directory + '\\') && !file.startsWith(directory + '/')) { await route.fulfill({status:404,body:''}); return; }
    if (filename === 'config.json') { await route.fulfill({json:config}); return; }
    try { await route.fulfill({contentType:types[extname(file)] || 'text/plain',body:await readFile(file)}); }
    catch { await route.fulfill({status:404,body:''}); }
  });
  return config;
}

async function ready(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('#choices')).not.toHaveAttribute('aria-busy');
}

test('320/390窄屏、横屏和桌面：当前Cloudflare明确，国内暂未开放，运行资源同源', async ({page}) => {
  await sites(page);
  const external: string[] = [], errors: string[] = [], failures: string[] = [];
  page.on('request', request => { if (new URL(request.url()).origin !== new URL(cfLobby).origin) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
  for (const [width,height] of [[320,720],[390,844],[667,375],[1440,1000]]) {
    await page.setViewportSize({width,height});
    await ready(page, cfLobby);
    await expect(page.getByRole('radio', {name:'Cloudflare'})).toBeChecked();
    await expect(page.getByRole('radio', {name:'国内服务器'})).toBeDisabled();
    await expect(page.locator('#current-server')).toHaveText('Cloudflare');
    await expect(page.locator('[data-game="athlete"]')).toHaveAttribute('href','https://magical-athlete.qiuh23.workers.dev/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:`.local/lobby-${width}x${height}.png`,fullPage:true});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('radio',{name:'Cloudflare'}).focus();
  await expect(page.getByRole('radio',{name:'Cloudflare'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-game="athlete"]')).toBeFocused();
  expect(await page.locator('[data-game="athlete"]').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  await expect(page.getByRole('link', {name:'京ICP备2026075006号-1'})).toHaveAttribute('href','https://beian.miit.gov.cn/');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('https://magical-athlete.qiuh23.workers.dev/');
  expect(external).toEqual([]); expect(errors).toEqual([]); expect(failures).toEqual([]);
});

test('双大厅切换真实改变整页网址，来源优先偏好；四游戏入口同服且刷新不跳回', async ({page}) => {
  const config = await sites(page, true);
  await ready(page, cfLobby+'?token=secret&redirect=https://evil.test#private');
  await page.evaluate(() => localStorage.setItem('games-lobby:server:v1','aliyun'));
  await page.reload();
  await expect(page.locator('#current-server')).toHaveText('Cloudflare');
  const navigations: {url:string;referrer:string|undefined}[] = [];
  page.on('request', request => { if (request.isNavigationRequest()) navigations.push({url:request.url(),referrer:request.headers().referer}); });
  await page.getByRole('radio',{name:'国内服务器'}).check();
  await expect(page).toHaveURL(cnLobby);
  expect(navigations.at(-1)).toEqual({url:cnLobby,referrer:undefined});
  await expect(page.locator('#current-server')).toHaveText('国内服务器（阿里云）');
  await page.reload();
  await expect(page).toHaveURL(cnLobby);
  await page.getByRole('radio',{name:'Cloudflare'}).check();
  await expect(page).toHaveURL(cfLobby);
  for (const server of ['aliyun','cloudflare']) for (const game of ['athlete','wizard']) {
    await ready(page, server === 'aliyun' ? cnLobby : cfLobby);
    const href = config.entries[game][server].origin+'/';
    await expect(page.locator(`[data-game="${game}"]`)).toHaveAttribute('href',href);
    await page.locator(`[data-game="${game}"]`).click();
    await expect(page).toHaveURL(href);
    await expect(page.getByText('游戏入口测试替身')).toBeVisible();
  }
});

test('邀请跨大厅只跳一次，游戏/服务器/观战高于偏好且不携带令牌，刷新恢复', async ({page}) => {
  await sites(page, true);
  for (const game of ['athlete','wizard']) for (const [server,prefix] of [['aliyun','A'],['cloudflare','C']]) for (const watch of [false,true]) {
    const code = game === 'athlete' ? 'ABC234' : 'ABCD2345';
    const start = server === 'aliyun' ? cfLobby : cnLobby;
    const target = server === 'aliyun' ? cnLobby : cfLobby;
    await ready(page, start);
    await page.evaluate(server => localStorage.setItem('games-lobby:server:v1',server),server === 'aliyun' ? 'cloudflare' : 'aliyun');
    await page.goto(`${start}?game=${game}&room=${prefix}-${code}&watch=${watch?'1':'0'}&token=private&redirect=https://evil.test#secret`);
    await expect(page).toHaveURL(target+`?game=${game}&server=${server}&room=${prefix}-${code}${watch?'&watch=1':''}&lobbyHop=1`);
    await expect(page.locator('#choices')).not.toHaveAttribute('aria-busy');
    await page.reload();
    await expect(page.locator('#invite-details')).toContainText(watch?'观战':'加入房间');
    await expect(page.locator(`input[value="${server}"]`)).toBeChecked();
    await expect(page.locator(`input[value="${server}"]`)).toBeDisabled();
    const href = await page.locator(`[data-game="${game}"]`).getAttribute('href');
    expect(href).toContain(game === 'athlete' ? `/room/${prefix}-${code}${watch?'?spectate=1':''}` : `?room=${prefix}-${code}${watch?'&watch=1':''}`);
    expect(href).not.toMatch(/private|secret|evil/);
    await expect(page.locator(`[data-game="${game === 'athlete' ? 'wizard' : 'athlete'}"]`)).not.toHaveAttribute('href');
  }
  await page.getByRole('button',{name:'返回游戏选择'}).click();
  expect(new URL(page.url()).search).toBe(''); expect(new URL(page.url()).hash).toBe('');
  await expect(page.getByRole('radio',{name:'Cloudflare'})).toBeEnabled();
});

test('两端受信配置漂移时跨大厅邀请最多跳一次，停止循环并提示配置不一致', async ({page}) => {
  const config = await sites(page, true);
  const drifted = structuredClone(config);
  drifted.lobbies.aliyun.url = cfLobby;
  drifted.lobbies.cloudflare.url = cnLobby;
  await page.route(cnLobby+'config.json', route => route.fulfill({json:drifted}));
  const navigations: string[] = [];
  page.on('request', request => { if (request.isNavigationRequest()) navigations.push(request.url()); });
  await page.goto(cfLobby+'?game=athlete&room=A-ABC234&watch=1&token=secret');
  await expect(page).toHaveURL(cnLobby+'?game=athlete&server=aliyun&room=A-ABC234&watch=1&lobbyHop=1');
  await expect(page.getByRole('alert')).toContainText('配置不一致');
  await expect(page.locator('[data-game="athlete"]')).not.toHaveAttribute('href');
  expect(navigations).toHaveLength(2);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('已停止自动跳转');
  expect(navigations).toHaveLength(3);
});

test('国内未开放的邀请保留原服，不跨服找房；国内页面可明确主动前往Cloudflare', async ({page}) => {
  await sites(page);
  const invite = cfLobby+'?game=athlete&room=A-ABC234&watch=1';
  await ready(page, invite);
  await expect(page).toHaveURL(invite);
  await expect(page.locator('#current-server')).toHaveText('Cloudflare');
  await expect(page.locator('#invite-details')).toContainText('国内服务器');
  await expect(page.locator('[data-game="athlete"]')).not.toHaveAttribute('href');
  await expect(page.locator('[data-game="athlete"] .action')).toHaveText('暂未开放');
  await page.reload(); await expect(page).toHaveURL(invite);
  await ready(page, cnLobby);
  await expect(page.locator('[data-game="wizard"]')).not.toHaveAttribute('href');
  await expect(page.locator('#server-message, #status')).toContainText(['暂未开放','']);
  await page.getByRole('radio',{name:'Cloudflare'}).check();
  await expect(page).toHaveURL(cfLobby);
});

test('禁用存储仍可切换，冲突邀请/错误配置/非受信页面安全停止', async ({page}) => {
  await sites(page, true, 'https://untrusted.example');
  await page.addInitScript(() => Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage blocked','SecurityError');}}));
  await ready(page, cnLobby);
  await page.getByRole('radio',{name:'Cloudflare'}).check();
  await expect(page).toHaveURL(cfLobby);
  await page.goto(cfLobby+'?game=athlete&room=A-ABC234&server=cloudflare');
  await expect(page.getByRole('alert')).toContainText('不一致');
  await expect(page.locator('[data-game="athlete"]')).not.toHaveAttribute('href');
  await page.goto('https://untrusted.example/');
  await expect(page.getByRole('alert')).toContainText('受信');
  await expect(page.locator('[data-game="wizard"]')).not.toHaveAttribute('href');
  await page.route('**/config.json',route=>route.fulfill({json:{version:1,entries:{}}}));
  await page.goto(cfLobby);
  await expect(page.getByRole('alert')).toContainText('配置');
});
