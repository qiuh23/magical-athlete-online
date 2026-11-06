// Local source server: no public service, credentials, or production rooms.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const root = resolve('.');
const output = resolve('docs/qa/entry-design');
const stage = process.argv.includes('--before') ? 'before' : 'after';
const mime = { '.html': 'text/html; charset=utf-8', '.mjs': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + '/') && !file.startsWith(root + '\\')) { response.writeHead(403).end(); return; }
  try { response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(5184, '127.0.0.1', done));
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
try {
  await mkdir(output, { recursive: true });
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const report = [];
  for (const [label, width, height] of [['desktop',1440,1000], ['portrait',390,844], ['landscape',844,390], ['narrow',320,720], ['tablet',768,1024]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:5184/lobby/');
    await page.waitForFunction(() => !document.querySelector('#choices').hasAttribute('aria-busy'));
    assert.equal(await page.locator('a.game[href]').count(), 3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const art = await page.locator('.art').evaluateAll(elements => elements.map(element => {
      const image = element.querySelector('img');
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, fit: getComputedStyle(image).objectFit, loaded: image.complete && image.naturalWidth > 0 };
    }));
    assert.ok(art.every(item => item.loaded));
    if (stage === 'after') assert.ok(art.every(item => Math.abs(item.width / item.height - 16 / 9) < .02 && item.fit === 'contain'));
    await page.screenshot({ path: resolve(output, `lobby-${stage}-${label}.png`), fullPage: true });
    await page.locator('.catan .art').screenshot({ path: resolve(output, `catan-art-${stage}-${label}.png`) });
    report.push({ label, width, height, art });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('radio', { name: 'Cloudflare' }).focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('[data-game="athlete"]').evaluate(element => element === document.activeElement), true);
  const focus = await page.locator('[data-game="athlete"]').evaluate(element => ({ style:getComputedStyle(element).outlineStyle, width:getComputedStyle(element).outlineWidth }));
  assert.equal(focus.style, 'solid');
  assert.equal(focus.width, '3px');
  await page.goto('http://127.0.0.1:5184/lobby/?game=catan&room=C-ABC234');
  await page.waitForFunction(() => !document.querySelector('#choices').hasAttribute('aria-busy'));
  assert.match(await page.locator('[data-game="catan"]').getAttribute('href'), /room=C-ABC234/);
  assert.equal(await page.locator('a.game[href]').count(), 1);
  await page.getByRole('button', {name:'返回游戏选择'}).click();
  assert.equal(await page.locator('a.game[href]').count(), 3);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ stage, report, keyboardFocus:focus, invitation:'passed', errors }, null, 2));
} finally { await browser.close(); await new Promise(done => server.close(done)); }
