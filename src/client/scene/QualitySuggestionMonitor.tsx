import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { QualitySuggestionEvent } from '../QualitySuggestion.js';

/** This observes animation callback spacing, NOT GPU/render execution time.
 * Non-dice beats last roughly 650–2200 ms (presentation.ts), so evidence can
 * span short animation bursts. Demand intervals and their first resume frame
 * are never samples. Three consecutive 800 ms windows must each have >=75%
 * intervals over 40 ms, within 30 s, before offering a choice. */
export function QualitySuggestionMonitor({ enabled, scope, onSuggestion }: {
  enabled: boolean; scope: string; onSuggestion?: (event: QualitySuggestionEvent) => void;
}) {
  const sample = useRef({ frames: 0, slow: 0, elapsed: 0, windows: 0, since: 0,
    last: 0, continuous: false, viewport: '', settleUntil: performance.now() + 3000, reported: false });
  const reset = (settleMs = 2000) => {
    const s = sample.current;
    s.frames = s.slow = s.elapsed = s.windows = s.since = s.last = 0;
    s.continuous = false; s.settleUntil = performance.now() + settleMs;
  };
  useEffect(() => {
    reset(3000);
    const interrupt = () => { reset(); onSuggestion?.('unavailable'); };
    window.addEventListener('blur', interrupt);
    window.addEventListener('focus', interrupt);
    window.addEventListener('resize', interrupt);
    window.visualViewport?.addEventListener('resize', interrupt);
    document.addEventListener('visibilitychange', interrupt);
    return () => {
      window.removeEventListener('blur', interrupt);
      window.removeEventListener('focus', interrupt);
      window.removeEventListener('resize', interrupt);
      window.visualViewport?.removeEventListener('resize', interrupt);
      document.removeEventListener('visibilitychange', interrupt);
    };
  }, [scope, enabled, onSuggestion]);
  useEffect(() => {
    if (!enabled) onSuggestion?.('unavailable');
    return () => onSuggestion?.('unavailable');
  }, [enabled, onSuggestion]);
  useFrame((state, delta) => {
    const s = sample.current, now = performance.now();
    if (!enabled || !onSuggestion || s.reported) return;
    if (document.visibilityState !== 'visible' || !document.hasFocus() || state.gl.getContext().isContextLost()) {
      reset(); return;
    }
    const viewport = `${state.size.width}:${state.size.height}:${state.gl.getPixelRatio()}`;
    if (s.viewport !== viewport) {
      const settleUntil = Math.max(s.settleUntil, now + 2000);
      s.viewport = viewport; reset(); s.settleUntil = settleUntil; return;
    }
    if (now < s.settleUntil) { s.continuous = false; return; }
    // Expire sparse evidence, including demand gaps with no callbacks at all.
    if ((s.since && now - s.since > 30_000) || (s.last && now - s.last > 10_000)) reset(0);
    if (state.frameloop !== 'always') { s.continuous = false; return; }
    if (!Number.isFinite(delta) || delta <= 0 || delta > .2) { reset(); return; }
    if (!s.continuous) { s.continuous = true; s.last = now; return; }
    s.last = now; s.since ||= now;
    s.frames++; s.elapsed += delta; if (delta > .04) s.slow++;
    if (s.elapsed < .8 || s.frames < 8) return;
    s.windows = s.slow / s.frames >= .75 ? s.windows + 1 : 0;
    s.frames = s.slow = s.elapsed = 0;
    if (s.windows >= 3) { s.reported = true; onSuggestion('suggest'); }
  });
  return null;
}
