import { test, expect } from '@playwright/test';
import { playbackRecord, preparePlaybackProbe, skipQueuedPlayback } from './playback-diagnostics.js';

test('playback diagnostics records a real skip and survives navigation', async ({ page }) => {
  await preparePlaybackProbe(page);
  for (const version of [7, 8]) {
    if (version === 8) await page.reload();
    await page.setContent(`<main class="game-shell" data-room-version="${version}">
      <section data-testid="board-3d" data-phase="move" data-render-frame-count="42" data-frameloop="demand"></section>
      <button data-testid="skip-animation" aria-label="跳过动画" onclick="if(event.isTrusted)this.remove()">跳过</button>
      <button data-testid="roll-button">掷骰子</button></main>`);
    const record = playbackRecord({ seat: 4, step: 19, action: 'roll', roomVersion: version });
    const result = await skipQueuedPlayback(page, record);
    expect(result).toMatchObject({ attempts: 1, clicked: true });
    expect(record).toMatchObject({ status: 'complete', stage: 'complete', attempts: 1, clicked: true });
    expect(record.before?.ui).toMatchObject({ roomVersion: String(version), renderFrameCount: '42', frameloop: 'demand', skipButton: { disabled: false, centerHitsButton: true } });
    expect(record.probeError).toBeUndefined();
    await expect(page.getByRole('button', { name: '掷骰子', exact: true })).toBeEnabled();
  }
});

test('playback diagnostics rejects an offscreen skip without scrolling it into view', async ({ page }) => {
  await page.setContent('<div style="height:2000px"></div><button data-testid="skip-animation" aria-label="跳过动画" onclick="window.skipClicked=true;this.remove()">跳过</button>');
  const record = playbackRecord();
  const error = await skipQueuedPlayback(page, record, { timeoutMs: 1_000, clickTimeoutMs: 150 }).then(() => undefined, error => error as Error);
  expect(error).toBeInstanceOf(Error);
  expect(record).toMatchObject({ status: 'failed', clicked: false });
  expect(await page.evaluate(() => ({ scrollY, clicked: !!(window as unknown as { skipClicked?: boolean }).skipClicked }))).toEqual({ scrollY: 0, clicked: false });
});

test('playback diagnostics still rejects an enabled skip covered by another element', async ({ page }) => {
  await page.setContent('<button data-testid="skip-animation" aria-label="跳过动画" onclick="window.skipClicked=true;this.remove()">跳过</button><div style="position:fixed;inset:0;z-index:999" data-testid="public-overlay"></div>');
  const record = playbackRecord();
  const error = await skipQueuedPlayback(page, record, { timeoutMs: 1_000, clickTimeoutMs: 150 }).then(() => undefined, error => error as Error);
  expect(error).toBeInstanceOf(Error);
  expect(record).toMatchObject({ status: 'failed', clicked: false });
  expect(record.before?.ui).toMatchObject({ skipButton: { disabled: false, centerHitsButton: false, centerHit: { testId: 'public-overlay' } } });
  expect(await page.evaluate(() => !!(window as unknown as { skipClicked?: boolean }).skipClicked)).toBe(false);
});

test('playback diagnostics preserves an unclickable failure and streams only public evidence', async ({ page }) => {
  await page.setContent(`<style>#cover{position:fixed;inset:0;z-index:999}</style>
    <main class="game-shell" data-room-version="79">
      <section data-testid="board-3d" data-phase="move" data-render-frame-count="0" data-frameloop="always"></section>
      <button disabled data-testid="skip-animation" aria-label="跳过动画">跳过</button>
      <div data-testid="skill-choice"><h2>PRIVATE-HAND-TITLE</h2><button>PRIVATE-CARD-OPTION</button></div>
      <div id="cover" data-testid="public-overlay">PRIVATE-OBSTRUCTION-TEXT</div>
    </main><script>window.privateToken='PRIVATE-TOKEN';setInterval(()=>{const b=document.querySelector('[data-testid="board-3d"]');b.dataset.renderFrameCount=String(Number(b.dataset.renderFrameCount)+1)},30)</script>`);
  const record = playbackRecord({ seat: 4, step: 19, action: 'roll', roomVersion: 79 });
  const error = await skipQueuedPlayback(page, record, { timeoutMs: 1_600, clickTimeoutMs: 150 }).then(() => undefined, error => error as Error);
  expect(error).toBeInstanceOf(Error);
  expect(error!.message).toContain('click: Timeout');
  expect(record.status).toBe('failed');
  expect(record.error).toBe(error!.message.split('\n')[0]);
  expect(record.attempts).toBeGreaterThan(0);
  expect(record.clicked).toBe(false);
  expect(record.clickErrors.length).toBeGreaterThan(0);
  expect(record.elapsedMs).toBeGreaterThanOrEqual(1_000);
  expect(record.before?.ui).toMatchObject({ roomVersion: '79', skipButton: { disabled: true, centerHitsButton: false, centerHit: { testId: 'public-overlay' } }, skillChoice: { buttonCount: 1 } });
  expect(new Set(record.samples.map(sample => sample.ui.renderFrameCount)).size).toBeGreaterThan(1);
  expect(record.samples.at(-1)!.elapsedMs).toBeGreaterThan(record.before!.elapsedMs);
  const evidence = JSON.stringify(record);
  for (const secret of ['PRIVATE-HAND-TITLE', 'PRIVATE-CARD-OPTION', 'PRIVATE-OBSTRUCTION-TEXT', 'PRIVATE-TOKEN']) expect(evidence).not.toContain(secret);
  await test.info().attach('playback-failure-diagnostics', { body: Buffer.from(evidence), contentType: 'application/json' });
});

test('playback diagnostics bounds a stalled probe without masking the locator error or querying again', async ({ page }) => {
  await page.setContent('<button disabled data-testid="skip-animation" aria-label="跳过动画">跳过</button>');
  await preparePlaybackProbe(page);
  const evaluate = page.evaluate;
  let reads = 0;
  page.evaluate = (() => { reads++; return new Promise(() => {}); }) as typeof page.evaluate;
  const record = playbackRecord();
  try {
    const error = await skipQueuedPlayback(page, record, { timeoutMs: 2_600, clickTimeoutMs: 150 }).then(() => undefined, error => error as Error);
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toContain('click: Timeout');
    expect(record).toMatchObject({ status: 'failed', probeError: 'playback initial sample exceeded 2000ms' });
    expect(record.error).toBe(error!.message.split('\n')[0]);
    expect(record.before).toBeUndefined();
    expect(record.samples).toEqual([]);
    expect(reads).toBe(1);
    expect(record.elapsedMs).toBeLessThan(4_000);
  } finally { page.evaluate = evaluate; }
});

test('playback diagnostics installation errors leave the real skip behavior intact', async ({ page }) => {
  await page.setContent('<button data-testid="skip-animation" aria-label="跳过动画" onclick="this.remove()">跳过</button>');
  const exposeBinding = page.exposeBinding;
  page.exposeBinding = (() => Promise.reject(Error('synthetic binding failure'))) as typeof page.exposeBinding;
  const record = playbackRecord();
  try {
    const result = await skipQueuedPlayback(page, record);
    expect(result).toMatchObject({ attempts: 1, clicked: true });
    expect(record).toMatchObject({ status: 'complete', probeError: 'synthetic binding failure' });
    expect(record.samples).toEqual([]);
  } finally { page.exposeBinding = exposeBinding; }
});
