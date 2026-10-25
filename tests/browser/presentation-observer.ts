import { expect, type Page } from '@playwright/test';

export interface PresentationSnapshot {
  seq: number;
  at: number;
  phase: string;
  eventIds: number[];
  dice: {
    visible: boolean;
    eventKey: string;
    mode: string;
    face: string;
    faces: string;
    label: string;
    caption: string;
    avatarLabel: string;
    avatarTag: string;
    buttonCount: number;
    readMs: number;
  } | null;
  positions: Record<string, { position: number; target: number }>;
  neutralMonster: string | null;
  eventMarker: string | null;
  banner: { text: string; avatarLabel: string; avatarTag: string; buttonCount: number } | null;
}

/** Record committed DOM in the browser before an action starts. Polling these
 * retained facts cannot miss a short phase while Node waits for a screenshot or
 * another locator. The observer does not schedule frames or pause playback. */
export async function observePresentation(page: Page) {
  await page.evaluate(() => {
    const scope = window as unknown as {
      __seenPhases: string[];
      __presentationRecords: PresentationSnapshot[];
    };
    scope.__seenPhases = []; scope.__presentationRecords = [];
    let previous = '', lastPhase = document.querySelector('[data-testid="board-3d"]')?.getAttribute('data-phase');
    const capture = () => {
      const board = document.querySelector('[data-testid="board-3d"]');
      const phase = board?.getAttribute('data-phase') ?? 'absent';
      if (board && phase !== lastPhase) {
        scope.__seenPhases.push(phase); lastPhase = phase;
      }
      const dice = board?.querySelector<HTMLElement>('.dice-spotlight');
      const avatar = dice?.querySelector('.dice-source-avatar');
      const banner = board?.querySelector('[data-testid="skill-banner"]');
      const bannerAvatar = banner?.querySelector('.skill-banner-avatar');
      const positions = Object.fromEntries([...(board?.querySelectorAll('[data-testid="scene-racer"]') ?? [])].map(element => [element.getAttribute('data-racer-id')!, {
        position: Number(element.getAttribute('data-position')),
        target: Number(element.getAttribute('data-target-position')),
      }]));
      const snapshot = {
        phase, eventIds: (board?.getAttribute('data-event-ids') ?? '').split(',').filter(Boolean).map(Number),
        dice: dice ? {
          visible: !dice.hidden, eventKey: dice.getAttribute('data-dice-event-key') ?? '',
          mode: dice.getAttribute('data-dice-mode') ?? '', face: dice.getAttribute('data-up-face') ?? '', faces: dice.getAttribute('data-up-faces') ?? '',
          label: dice.getAttribute('aria-label') ?? '', caption: dice.querySelector('.dice-caption')?.textContent ?? '',
          avatarLabel: avatar?.getAttribute('aria-label') ?? '', avatarTag: avatar?.tagName ?? '', buttonCount: dice.querySelectorAll('button').length,
          readMs: Number(dice.getAttribute('data-result-read-ms')),
        } : null,
        positions, neutralMonster: board?.getAttribute('data-neutral-monster') ?? null, eventMarker: board?.getAttribute('data-event-marker') ?? null,
        banner: banner ? { text: banner.textContent ?? '', avatarLabel: bannerAvatar?.getAttribute('aria-label') ?? '', avatarTag: bannerAvatar?.tagName ?? '', buttonCount: banner.querySelectorAll('button').length } : null,
      };
      const signature = JSON.stringify(snapshot);
      if (signature === previous) return;
      previous = signature;
      scope.__presentationRecords.push({ seq: scope.__presentationRecords.length, at: performance.now(), ...snapshot });
    };
    new MutationObserver(capture).observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['data-phase', 'data-event-ids', 'data-dice-event-key', 'data-up-face', 'data-up-faces', 'data-dice-mode', 'data-result-read-ms', 'hidden', 'class', 'aria-label', 'data-position', 'data-target-position', 'data-neutral-monster', 'data-event-marker'],
    });
    capture();
  });
}

export const presentationRecords = (page: Page): Promise<PresentationSnapshot[]> => page.evaluate(() => (window as unknown as { __presentationRecords: PresentationSnapshot[] }).__presentationRecords);

export async function waitForPresentationRecord(page: Page, predicate: (record: PresentationSnapshot) => boolean, message: string) {
  let found: PresentationSnapshot | undefined;
  await expect.poll(async () => {
    found = (await presentationRecords(page)).find(predicate);
    return !!found;
  }, { message }).toBe(true);
  return found!;
}
