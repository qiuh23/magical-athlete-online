import { useEffect } from 'react';
import type { RoomView } from '../shared/types.js';
import { browserIdle, schedulePreload, upcomingTrack } from './racetrack-preload.js';

export function useRacetrackPreload(room: RoomView | null, lowQuality: boolean) {
  const track = upcomingTrack(room), code = room?.code;
  const search = typeof window === 'undefined' ? '' : window.location.search;
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (!track || new URLSearchParams(search).get('environment') !== '1' || connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')) return;
    let cancelled = false, cancelRequests = () => {};
    const cancelImport = browserIdle(() => {
      void import('./scene/preload-racetrack-assets.js').then(module => {
        if (cancelled) return;
        cancelRequests = schedulePreload(module.racetrackAssetGroups(track, lowQuality, search), module.preloadRacetrackGroup, browserIdle);
      }).catch(() => { /* Foreground scene retains its normal load/retry path. */ });
    });
    return () => { cancelled = true; cancelImport(); cancelRequests(); };
  }, [track, code, lowQuality, search]);
}
