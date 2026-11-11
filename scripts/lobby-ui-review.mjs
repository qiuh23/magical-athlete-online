import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { buildLobby } from './build-lobby.mjs';

// Exercise the actual static app and independently generated configurations.
// All game navigations are intercepted: this review never creates live rooms.
const output = resolve('output/playwright/ui-unification/lobby');
const directory = await mkdtemp(join(tmpdir(), 'athlete-lobby-ui-'));
const targets = { cn: join(directory, 'client/lobby'), global: join(directory, 'browser/lobby') };
const types = { '.html': 'text/html; charset=utf-8', '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const errors = [], checks = [], screenshots = [];
let browser, server;
try {
  await mkdir(output, { recursive: true });
  await buildLobby(Object.values(targets));
  server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const match = /^\/(cn|global)\/(.*)$/.exec(path);
      if (!match) { response.writeHead(404).end(); return; }
      const root = targets[match[1]], file = resolve(root, match[2] || 'index.html');
      if (!file.startsWith(root + '/')) { response.writeHead(404).end(); return; }
      const data = await readFile(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/plain' }).end(data);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  const page = await context.newPage();
  for (const edition of ['cn', 'global']) {
    const config = JSON.parse(await readFile(join(targets[edition], 'config.json'), 'utf8'));
    const serverId = edition === 'cn' ? 'aliyun' : 'cloudflare';
    const prefix = edition === 'cn' ? 'A' : 'C';
    const base = `${origin}/${edition}/`;
    const ready = async (query = '') => {
      await page.goto(base + query);
      await expect(page.locator('#choices')).not.toHaveAttribute('aria-busy');
    };
    const verifyEntries = async () => {
      for (const [game, entries] of Object.entries(config.entries)) {
        await expect(page.locator(`[data-game="${game}"]`)).toHaveAttribute('href', entries[serverId].origin + '/');
      }
    };
    await ready();
    await expect(page.locator('#current-server')).toHaveText(edition === 'cn' ? '国内站' : '海外站');
    await verifyEntries();
    for (const [name, width, height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390],['narrow',320,720]]) {
      await page.setViewportSize({ width, height });
      await expect(page.locator('.game')).toHaveCount(3);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${edition}/${name}: no horizontal overflow`);
      for (const link of await page.locator('.game').all()) {
        await expect(link).toBeVisible();
        const action = await link.locator('.action').boundingBox();
        assert(action.height >= 44 && action.width >= 44, `${edition}/${name}: 44px action target`);
      }
      await page.locator('.action').evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished.catch(() => {})))));
      const path = join(output, `${edition}-${name}.png`);
      await page.screenshot({ path, fullPage: true });
      screenshots.push(path);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [game, room] of [['athlete','ABC234'],['wizard','ABCD2345'],['catan','ABC234']]) {
      await ready(`?game=${game}&room=${prefix}-${room}&token=secret&next=https://evil.example`);
      const target = page.locator(`[data-game="${game}"]`);
      const href = await target.getAttribute('href');
      const url = new URL(href);
      assert.equal(url.origin, config.entries[game][serverId].origin);
      if(game === 'athlete') assert.equal(url.pathname, `/room/${prefix}-${room}`);
      else assert.equal(url.searchParams.get('room'), `${prefix}-${room}`);
      assert(!url.href.includes('secret') && !url.href.includes('evil'));
      await expect(page.locator('.game[href]')).toHaveCount(1);
      await expect(target).toHaveClass(/invited/);
      await page.getByRole('button', { name: '返回游戏选择' }).click();
      await verifyEntries();
      await expect(page.locator('#invitation')).toBeHidden();
      assert.equal(new URL(page.url()).search, '');
    }
    for (const [game, room] of [['athlete','ABC234'],['wizard','ABCD2345']]) {
      await ready(`?game=${game}&room=${prefix}-${room}&watch=1`);
      const href = new URL(await page.locator(`[data-game="${game}"]`).getAttribute('href'));
      assert.equal(href.searchParams.get(game === 'athlete' ? 'spectate' : 'watch'), '1');
      await expect(page.locator('#invite-details')).toContainText('观战');
    }
    for (const query of [
      `?game=athlete&room=${prefix === 'A' ? 'C' : 'A'}-ABC234`,
      `?game=athlete&room=${prefix}-ABC234&game=wizard`,
    ]) {
      await ready(query);
      await expect(page.locator('#status')).toHaveAttribute('role', 'alert');
      await expect(page.locator('.game[href]')).toHaveCount(0);
      await page.getByRole('button', { name: '返回游戏选择' }).click();
      await verifyEntries();
      await expect(page.locator('[data-game="athlete"]')).toBeFocused();
      await expect(page.locator('#status')).toBeEmpty();
    }
    await ready();
    for (const [game, entries] of Object.entries(config.entries)) {
      const entry = entries[serverId].origin + '/';
      await context.route(entry, route => route.fulfill({ contentType: 'text/html', body: '<title>Game entry fixture</title><h1>游戏入口</h1>' }));
      await page.locator(`[data-game="${game}"]`).click();
      await expect(page).toHaveURL(entry);
      await ready();
    }
    checks.push(`${edition}: 4 viewports, three game entries, invite isolation, invalid invite recovery, keyboard focus`);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.game').first().evaluate(element => getComputedStyle(element).transitionDuration), '0s');
  await context.route('**/config.json', route => route.fulfill({ status: 503, body: '{}' }));
  await page.goto(`${origin}/global/`);
  await expect(page.locator('#status')).toHaveAttribute('role', 'alert');
  await expect(page.getByRole('button', { name: '刷新重试' })).toBeVisible();
  await expect(page.locator('.game[href]')).toHaveCount(0);
  assert.deepEqual(errors, []);
  const result = { result: 'passed', checks, screenshots, errors, limits: 'Local static UI and intercepted game navigations; no production room or TLS verification.' };
  await writeFile(join(output, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server ? server.close(resolve) : resolve());
  await rm(directory, { recursive: true, force: true });
}
