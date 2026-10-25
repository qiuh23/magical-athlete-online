import { expect, type Page } from '@playwright/test';

type Sample = { elapsedMs: number; stage: string; ui: Record<string, unknown> };
export type PlaybackRecord = {
  seat?: number; step?: number; action?: string; roomVersion?: number;
  startedAt: string; status: 'running' | 'complete' | 'failed'; stage: string;
  elapsedMs: number; attempts: number; clicked: boolean;
  before?: Sample; samples: Sample[]; probeError?: string; error?: string;
  clickErrors: { elapsedMs: number; message: string }[];
};
export function playbackRecord(context: Pick<PlaybackRecord, 'seat' | 'step' | 'action' | 'roomVersion'> = {}): PlaybackRecord {
  return { ...context, startedAt: new Date().toISOString(), status: 'running', stage: 'before-skip', elapsedMs: 0, attempts: 0, clicked: false, samples: [], clickErrors: [] };
}
const errorSummary = (error: unknown) => (error instanceof Error ? error.message : String(error)).split('\n')[0]!.slice(0, 300);
const probes = new WeakMap<Page, Promise<Awaited<ReturnType<typeof installProbe>>>>();

/** One outstanding browser sample, only on the acting page while skip is pending.
 * Existing Three frame metadata avoids adding another RAF loop to eight clients. */
async function installProbe(page: Page) {
  let sequence = 0;
  let active: { token: number; record: PlaybackRecord; started: number; ready: () => void } | undefined;
  await page.exposeBinding('__relayPlaybackSample', ({ frame }, token: number, ui: Record<string, unknown>) => {
    if (!active || token !== active.token || frame !== page.mainFrame()) return false;
    const sample = { elapsedMs: Date.now() - active.started, stage: active.record.stage, ui };
    active.record.before ??= sample;
    active.record.samples.push(sample);
    if (active.record.samples.length > 12) active.record.samples.shift();
    active.ready();
    return true;
  });
  return {
    start(record: PlaybackRecord, lifetimeMs: number) {
      const token = ++sequence;
      const timer = setTimeout(() => { if (active?.token === token && !record.before) record.probeError = 'playback initial sample exceeded 2000ms'; }, 2_000);
      const ready = () => clearTimeout(timer);
      active = { token, record, started: Date.now(), ready };
      // Do not await this loop: it streams evidence to Node during locator waits.
      // Node stopping the record makes the next binding return false, including
      // after a navigation. No new renderer query is needed in failure handling.
      void page.evaluate(async ({ token, lifetimeMs }) => {
        const send = (window as unknown as { __relayPlaybackSample: (token: number, ui: Record<string, unknown>) => Promise<boolean> }).__relayPlaybackSample;
        const deadline = Date.now() + lifetimeMs;
        do {
          const board = document.querySelector<HTMLElement>('[data-testid="board-3d"]');
          const bounds = (element: Element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
          const button = (selector: string) => {
            const element = document.querySelector<HTMLButtonElement>(selector);
            if (!element) return null;
            const rect = bounds(element), css = getComputedStyle(element);
            const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
            return { disabled: element.disabled, ariaDisabled: element.getAttribute('aria-disabled'), bounds: rect,
              display: css.display, visibility: css.visibility, opacity: css.opacity, pointerEvents: css.pointerEvents, transform: css.transform,
              centerHitsButton: !!hit && (hit === element || element.contains(hit)),
              // Never copy hit text/HTML: the obstruction could be a private card.
              centerHit: hit ? { tag: hit.tagName, testId: hit.getAttribute('data-testid') } : null };
          };
          const choice = document.querySelector('[data-testid="skill-choice"]');
          const ui = { browserTimeMs: performance.now(), roomVersion: document.querySelector<HTMLElement>('.game-shell')?.dataset.roomVersion,
            visibility: document.visibilityState, focused: document.hasFocus(), viewport: { width: innerWidth, height: innerHeight },
            connection: document.querySelector('.race-match-label .connection,.room-label .connection')?.textContent?.trim(),
            status: document.querySelector('[data-testid="animation-phase"]')?.textContent?.trim(),
            phase: board?.dataset.phase, renderFrameCount: board?.dataset.renderFrameCount, frameloop: board?.dataset.frameloop,
            cameraState: board?.dataset.cameraState, cameraTargetIds: board?.dataset.cameraTargetIds,
            eventIds: board?.dataset.eventIds, motionCount: board?.dataset.motionCount,
            loadedModels: board?.dataset.loadedModels, modelFallbacks: board?.dataset.modelFallbacks,
            drawCalls: board?.dataset.drawCalls, triangles: board?.dataset.triangles, quality: board?.dataset.quality,
            skipButton: button('[data-testid="skip-animation"]'), rollButton: button('[data-testid="roll-button"]'),
            skillChoice: choice ? { buttonCount: choice.querySelectorAll('button').length, enabledButtons: choice.querySelectorAll('button:not(:disabled)').length } : null };
          if (!await send(token, ui)) return;
          await new Promise(resolve => setTimeout(resolve, 500));
        } while (Date.now() < deadline);
      }, { token, lifetimeMs }).catch(error => {
        if (active?.token === token) { record.probeError = errorSummary(error); ready(); }
      });
      return { stop: () => {
        clearTimeout(timer);
        if (!record.before && !record.probeError) record.probeError = 'playback probe stopped before first sample';
        if (active?.token === token) active = undefined;
      } };
    },
  };
}
export function preparePlaybackProbe(page: Page) {
  let probe = probes.get(page);
  if (!probe) {
    probe = boundedRead(installProbe(page), 'playback probe installation', 2_000).catch(error => ({
      start(record: PlaybackRecord) { record.probeError = errorSummary(error); return { stop() {} }; },
    }));
    probes.set(page, probe);
  }
  return probe;
}
export async function boundedRead<T>(operation: Promise<T>, label: string, timeoutMs = 20_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operation, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(Error(`${label} exceeded ${timeoutMs}ms`)), timeoutMs); })]); }
  finally { clearTimeout(timer); }
}

export async function skipQueuedPlayback(page: Page, record = playbackRecord(), options: { timeoutMs?: number; clickTimeoutMs?: number } = {}) {
  // Eight SwiftShader clients can delay renderer samples by 4–6 seconds in CI.
  // Keep a real, actionable click while allowing its two-frame stability check
  // to finish; the overall queue deadline and explicit failure probes stay bound.
  const started = Date.now(), timeoutMs = options.timeoutMs ?? 20_000, clickTimeoutMs = options.clickTimeoutMs ?? 8_000;
  let probe = { stop() {} };
  try {
    // Start sampling without waiting for the renderer. A slow probe must not
    // delay the original click or let an optional control finish before it.
    try { probe = (await preparePlaybackProbe(page)).start(record, timeoutMs + 5_000); }
    catch (error) { record.probeError = errorSummary(error); }
    const skip = page.getByRole('button', { name: '跳过动画', exact: true });
    await expect(async () => {
      record.stage = 'check-visible';
      if (await skip.isVisible()) {
        // Resolve once: a locator click otherwise keeps looking for a future
        // button after this optional control naturally disappears. A handle
        // still performs Playwright's actionability checks, but detaches promptly.
        const [target] = await skip.elementHandles();
        if (target) {
          record.stage = 'click'; record.attempts++;
          try { await target.click({ timeout: clickTimeoutMs }); record.clicked = true; }
          catch (error) {
            record.clickErrors.push({ elapsedMs: Date.now() - started, message: errorSummary(error) });
            if (record.clickErrors.length > 20) record.clickErrors.shift();
            record.stage = 'recheck-visible';
            if (await skip.isVisible()) throw error;
          } finally { await target.dispose(); }
        }
      }
      record.stage = 'wait-hidden';
      await expect(skip).toBeHidden({ timeout: clickTimeoutMs });
    }).toPass({ timeout: timeoutMs, intervals: [100, 250, 500] });
    record.status = 'complete'; record.stage = 'complete';
    return { elapsedMs: Date.now() - started, attempts: record.attempts, clicked: record.clicked };
  } catch (error) {
    record.status = 'failed'; record.error = errorSummary(error);
    throw error;
  } finally {
    record.elapsedMs = Date.now() - started;
    probe.stop();
  }
}
