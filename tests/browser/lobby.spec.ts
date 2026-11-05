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
  // Exercise activation and rollback explicitly, independently of the current
  // production flags. Disabled-server coverage remains after launch.
  config.lobbies.aliyun.enabled = active;
  config.entries.athlete.aliyun.enabled = config.entries.wizard.aliyun.enabled = active;
  config.entries.catan.aliyun.enabled = config.entries.catan.cloudflare.enabled = active;
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

test('双大厅切换真实改变整页网址，来源优先偏好；三款游戏六个入口同服且刷新不跳回', async ({page}) => {
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
  for (const server of ['aliyun','cloudflare']) for (const game of ['athlete','wizard','catan']) {
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
  for (const game of ['athlete','wizard','catan']) for (const [server,prefix] of [['aliyun','A'],['cloudflare','C']]) for (const watch of game === 'catan' ? [false] : [false,true]) {
    const code = game === 'wizard' ? 'ABCD2345' : 'ABC234';
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

test('精致大厅在常见断点保留插画、独立标题和44px入口，桌面三卡完整位于首屏', async ({page}) => {
  await sites(page, true);
  for (const [width,height] of [[1366,768],[320,720],[390,844],[600,960],[768,1024],[1024,768],[844,390]]) {
    await page.setViewportSize({width,height});
    await ready(page, cnLobby);
    const layout = await page.evaluate(async () => {
      const box = (element: Element) => {
        const {left,top,right,bottom,width,height} = element.getBoundingClientRect();
        return {left,top,right,bottom,width,height};
      };
      const images = await Promise.all([...document.querySelectorAll<HTMLImageElement>('.art > img')].map(async image => {
        await image.decode();
        return {width:image.naturalWidth,height:image.naturalHeight,box:box(image)};
      }));
      const pairs = [['.intro h1','.subtitle'],['.game-heading h2','.selection']].map(([a,b]) => [box(document.querySelector(a)!),box(document.querySelector(b)!)]);
      const cards = [...document.querySelectorAll('.game')].map(card => {
        const title = box(card.querySelector('h3')!);
        const type = box(card.querySelector('.game-type')!);
        const mode = box(card.querySelector('.game-mode')!);
        const action = box(card.querySelector('.action')!);
        pairs.push([title,type],[mode,action]);
        return {card:box(card),title,type,action};
      });
      return {overflow:document.documentElement.scrollWidth > innerWidth,images,pairs,cards};
    });
    expect(layout.overflow, `${width}px must not overflow horizontally`).toBe(false);
    expect(layout.images).toHaveLength(3);
    for (const image of layout.images) {
      expect(image.width).toBe(640);
      expect(image.height).toBe(360);
      expect(image.box.width).toBeGreaterThan(0);
      expect(image.box.height).toBeGreaterThan(0);
    }
    for (const [a,b] of layout.pairs) {
      const overlapWidth = Math.min(a.right,b.right)-Math.max(a.left,b.left);
      const overlapHeight = Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      expect(overlapWidth > .5 && overlapHeight > .5, `${width}px text and controls must have separate space`).toBe(false);
    }
    for (const {card,title,type,action} of layout.cards) {
      expect(action.height, `${width}px action must remain an easy tap target`).toBeGreaterThanOrEqual(44);
      for (const child of [title,type,action]) {
        expect(child.left).toBeGreaterThanOrEqual(card.left);
        expect(child.right).toBeLessThanOrEqual(card.right);
      }
      if (width === 1366) {
        expect(card.top).toBeGreaterThanOrEqual(0);
        expect(card.bottom).toBeLessThanOrEqual(height);
        expect(action.bottom).toBeLessThanOrEqual(height);
      }
    }
  }
});

test('骰子局部动效响应悬停与键盘，移开复位并遵循减少动态效果设置', async ({page}) => {
  await page.setViewportSize({width:1366,height:768});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await sites(page, true);
  await ready(page, cnLobby);
  const card = page.locator('[data-game="athlete"]');
  const die = card.locator('.die-body');
  const transform = () => die.evaluate(element => getComputedStyle(element).transform);
  expect(await transform()).toBe('none');
  await card.hover();
  await expect.poll(transform).not.toBe('none');
  await page.mouse.move(0,0);
  await expect.poll(transform).toBe('none');
  await page.getByRole('radio',{name:'国内服务器'}).focus();
  await page.keyboard.press('Tab');
  await expect(card).toBeFocused();
  await expect.poll(transform).not.toBe('none');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect.poll(transform).toBe('none');
  expect(await die.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  expect(await card.evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  await card.hover();
  expect(await transform()).toBe('none');
  expect(await card.evaluate(element => getComputedStyle(element).transform)).toBe('none');
});

test('触屏直接轻点可见入口按钮，按当前大厅线路进入对应游戏', async ({browser}) => {
  const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try {
    const page = await context.newPage();
    const config = await sites(page, true);
    for (const server of ['aliyun','cloudflare']) for (const game of ['athlete','wizard','catan']) {
      await ready(page, server === 'aliyun' ? cnLobby : cfLobby);
      await page.locator(`[data-game="${game}"] .action`).tap();
      await expect(page).toHaveURL(config.entries[game][server].origin+'/');
      await expect(page.getByText('游戏入口测试替身')).toBeVisible();
    }
  } finally { await context.close(); }
});


test('卡坦岛未上线时两端都不能进入，观战邀请明确报错且不跳往其他服', async ({page}) => {
  await sites(page);
  for (const url of [cfLobby,cnLobby]) {
    await ready(page,url);
    await expect(page.locator('[data-game="catan"]')).not.toHaveAttribute('href');
    await expect(page.locator('[data-game="catan"] .action')).toHaveText('未上线 · 敬请期待');
  }
  const invite=cfLobby+'?game=catan&room=A-ABC234';
  await ready(page,invite);
  await expect(page).toHaveURL(invite);
  await expect(page.locator('#invite-details')).toContainText('卡坦岛好友桌');
  await expect(page.locator('[data-game="catan"]')).not.toHaveAttribute('href');
  await page.goto(cfLobby+'?game=catan&room=C-ABC234&watch=1');
  await expect(page.getByRole('alert')).toContainText('暂不支持观战');
  await expect(page.locator('[data-game="catan"]')).not.toHaveAttribute('href');
});


test('交付配置两大厅原游戏开放、卡坦岛关闭，桌面与手机截图', async ({page}) => {
  await sites(page,true);
  const release=JSON.parse(await readFile(resolve(directory,'config.json'),'utf8'));
  await page.route('**/config.json',route=>route.fulfill({json:release}));
  for (const [width,height] of [[1440,900],[390,844]]) {
    await page.setViewportSize({width,height});
    await ready(page,cnLobby);
    await expect(page.locator('[data-game="athlete"]')).toHaveAttribute('href',release.entries.athlete.aliyun.origin+'/');
    await expect(page.locator('[data-game="wizard"]')).toHaveAttribute('href',release.entries.wizard.aliyun.origin+'/');
    await expect(page.locator('[data-game="catan"]')).not.toHaveAttribute('href');
    await page.locator('[data-game="catan"] img').evaluate((image: HTMLImageElement)=>image.decode());
    await page.screenshot({path:`.local/catan-lobby-${width}.png`,fullPage:true});
    await page.getByRole('radio',{name:'Cloudflare'}).check();
    await expect(page).toHaveURL(cfLobby);
    await expect(page.locator('[data-game="catan"]')).not.toHaveAttribute('href');
  }
});
