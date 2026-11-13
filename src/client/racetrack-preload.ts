import type { RoomView } from '../shared/types.js';
import type { TrackId } from '../shared/tracks.js';

/** Draft's room.track can still describe the previous race. The frozen plan,
 * not editable lobby configuration, is authoritative before selection. */
export function upcomingTrack(room: Pick<RoomView, 'phase' | 'round' | 'track' | 'matchPlan'> | null): TrackId | null {
  if (!room || !['draft', 'selection'].includes(room.phase)) return null;
  const planned = room.matchPlan?.races[room.round - 1]?.map;
  // Legacy selection views also leave room.track on the previous race.
  // Without a frozen plan, do not guess a historical ruleset's next map.
  if (!planned) return null;
  return room.phase === 'selection' ? room.track : planned;
}

export type IdleScheduler = (work: () => void) => () => void;
/** One bounded cache request per idle slice. Cancellation stops queued work;
 * already-started shared loads are retained for the foreground race. */
export function schedulePreload<T>(items: readonly T[], run: (item: T) => void, idle: IdleScheduler): () => void {
  let stopped = false, cursor = 0, cancel = () => {};
  const next = () => {
    if (stopped || cursor >= items.length) return;
    cancel = idle(() => {
      if (stopped) return;
      try { run(items[cursor++]!); } catch { /* Optional preparation never blocks play. */ }
      next();
    });
  };
  next();
  return () => { stopped = true; cancel(); };
}

/** No deadline forcing heavy work onto a busy frame. Older browsers get a
 * delayed task; hidden tabs and active input defer preparation. */
export const browserIdle: IdleScheduler = work => {
  let cancelled = false, timer: ReturnType<typeof setTimeout>, handle: number | undefined;
  const host = window as Window & { requestIdleCallback?: (cb: (deadline: {timeRemaining(): number}) => void) => number; cancelIdleCallback?: (id: number) => void };
  const attempt = () => {
    if (cancelled) return;
    const input = navigator as Navigator & { scheduling?: { isInputPending?: () => boolean } };
    if (document.hidden || input.scheduling?.isInputPending?.()) { timer = setTimeout(attempt, 250); return; }
    if (host.requestIdleCallback) handle = host.requestIdleCallback(deadline => {
      if (cancelled) return;
      if (document.hidden || input.scheduling?.isInputPending?.() || deadline.timeRemaining() < 8) { timer = setTimeout(attempt, 250); return; }
      work();
    });
    else work();
  };
  timer = setTimeout(attempt, 250);
  return () => { cancelled = true; clearTimeout(timer); if (handle !== undefined) host.cancelIdleCallback?.(handle); };
};
