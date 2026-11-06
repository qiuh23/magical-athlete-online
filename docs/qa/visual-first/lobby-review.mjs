// Local browser QA only. Configs use the same per-site projection as build-lobby.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { validateConfig } from '../../../lobby/routing.mjs';

const root = resolve('lobby');
const output = resolve('docs/qa/visual-first');
const stage = process.argv.includes('--before') ? 'before' : 'after';
const source = JSON.parse(await readFile(resolve(root, 'config.json'), 'utf8'));
const configs = Object.fromEntries(['cn', 'global'].map(siteEdition => {
  const server = siteEdition === 'cn' ? 'aliyun' : 'cloudflare';
  return [siteEdition, validateConfig({version: 2, siteEdition, lobbies: {[server]: source.lobbies[server]}, entries: Object.fromEntries(Object.entries(source.entries).map(([game, entries]) => [game, {[server]: entries[server]}]))})];
}));
const mime = {'.html':'text/html; charset=utf-8','.mjs':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server = createServer(async (request, response) => {
  const [, edition, ...parts] = new URL(request.url, 'http://localhost').pathname.split('/');
  if (!configs[edition]) { response.writeHead(404).end(); return; }
  const pathname = parts.join('/') || 'index.html';
  if (pathname === 'config.json') { response.writeHead(200, {'Content-Type': mime['.json']}).end(JSON.stringify(configs[edition])); return; }
  const file = resolve(root, pathname);
  if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.writeHead(200, {'Content-Type': mime[extname(file)] || 'application/octet-stream'}).end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(5210, '127.0.0.1', done));
const browser = await chromium.launch({channel: process.platform === 'win32' ? 'msedge' : undefined});
try {
  await mkdir(output, {recursive:true});
  const page = await browser.newPage({deviceScaleFactor:1});
  const errors = [], report = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const edition of ['cn', 'global']) {
    const serverId = edition === 'cn' ? 'aliyun' : 'cloudflare';
    const base = `http://127.0.0.1:5210/${edition}/`;
    for (const [label, width, height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390],['narrow',320,720],['tablet',768,1024]]) {
      await page.setViewportSize({width,height});
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('#choices').hasAttribute('aria-busy'));
      assert.equal(await page.locator('a.game[href]').count(), 3);
      assert.equal(await page.locator('#current-server').innerText(), edition === 'cn' ? '国内站' : '海外站');
      assert.equal(await page.locator('input[type=radio]').count(), 0);
      assert.equal(await page.getByRole('link', {name:'京ICP备2026075006号-1'}).getAttribute('href'), 'https://beian.miit.gov.cn/');
      for (const game of Object.keys(configs[edition].entries)) assert.equal(await page.locator(`[data-game=${game}]`).getAttribute('href'), configs[edition].entries[game][serverId].origin + '/');
      await page.locator('.art img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        cards: [...document.querySelectorAll('.game')].map(card => {
          const box = node => { const {x,y,width,height,right,bottom} = node.getBoundingClientRect(); return {x,y,width,height,right,bottom}; };
          return {card:box(card),title:box(card.querySelector('h3')),action:box(card.querySelector('.action')),art:box(card.querySelector('.art'))};
        }),
      }));
      assert.equal(layout.overflow, false);
      for (const {card,title,action} of layout.cards) {
        assert.ok(action.height >= 44);
        assert.ok(title.right <= card.right && action.right <= card.right);
        assert.ok(Math.min(title.right,action.right) - Math.max(title.x,action.x) <= 0 || Math.min(title.bottom,action.bottom) - Math.max(title.y,action.y) <= 0);
        if (stage === 'after') assert.ok(card.bottom <= height, `${edition}/${label}: all cards fit first viewport`);
      }
      await page.screenshot({path:resolve(output,`lobby-${edition}-${stage}-${label}.png`),fullPage:true});
      report.push({edition,label,width,height,...layout});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('.brand').focus(); await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-game=athlete]').evaluate(element => element === document.activeElement), true);
    assert.equal(await page.locator('[data-game=athlete]').evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
    for (const game of ['athlete','wizard','catan']) {
      const code = game === 'wizard' ? 'ABCD2345' : 'ABC234';
      const prefix = edition === 'cn' ? 'A' : 'C';
      await page.goto(`${base}?game=${game}&room=${prefix}-${code}&token=secret&redirect=https://example.com#private`);
      await page.waitForFunction(() => !document.querySelector('#choices').hasAttribute('aria-busy'));
      assert.equal(await page.locator('a.game[href]').count(),1);
      assert.ok(!(await page.locator(`a[data-game=${game}]`).getAttribute('href')).match(/secret|private|example/));
      await page.getByRole('button',{name:'返回游戏选择'}).click();
      assert.equal(await page.locator('a.game[href]').count(),3);
      assert.equal(new URL(page.url()).search,'');
    }
    await page.goto(`${base}?game=athlete&room=${edition === 'cn' ? 'C' : 'A'}-ABC234`);
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').innerText(), /不属于当前站点/);
    assert.equal(await page.locator('a.game[href]').count(),0);
    assert.equal(new URL(page.url()).pathname,`/${edition}/`);
  }
  if (stage === 'after') {
    await page.route('**/config.json',route=>route.fulfill({status:503,body:''}));
    await page.goto('http://127.0.0.1:5210/cn/');
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').innerText(),/刷新重试/);
    await page.getByRole('button',{name:'刷新重试'}).waitFor();
    await page.unroute('**/config.json');
    await page.getByRole('button',{name:'刷新重试'}).click();
    await page.waitForFunction(() => !document.querySelector('#choices').hasAttribute('aria-busy'));
  }
  assert.deepEqual(errors,[]);
  await writeFile(resolve(output,`lobby-${stage}-results.json`),JSON.stringify({stage,report,keyboard:'passed',invitations:'passed',errors},null,2)+'\n');
  console.log(JSON.stringify({stage,sizes:report.length,keyboard:'passed',invitations:'passed',errors}));
} finally { await browser.close(); await new Promise(done=>server.close(done)); }
