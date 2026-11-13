import { useCallback, useEffect, useRef, useState } from 'react';
import './quality-suggestion.css';

export type QualitySuggestionEvent = 'suggest' | 'unavailable';
const SEEN_KEY = 'magical-athlete:quality-suggestion-seen';
// Storage can be unavailable in private/embedded contexts. Still do not repeat
// when Race remounts in the same page. Across reloads requires working storage.
let seenInPage = false;
function alreadySeen() {
  if (seenInPage) return true;
  try { return localStorage.getItem(SEEN_KEY) === 'true'; } catch { return false; }
}

export function useQualitySuggestion({ enabled, blocked, setLowQuality }: {
  enabled: boolean; blocked: boolean; setLowQuality: (value: boolean) => void;
}) {
  const [state, setState] = useState<'idle' | 'pending' | 'shown' | 'done'>(() => alreadySeen() ? 'done' : 'idle');
  const current = useRef(state); current.current = state;
  const finish = useCallback(() => { current.current = 'done'; setState('done'); }, []);
  const onSuggestion = useCallback((event: QualitySuggestionEvent) => {
    if (event === 'unavailable') {
      if (current.current === 'shown') { current.current = 'done'; setState('done'); }
      else if (current.current === 'pending') { current.current = 'idle'; setState('idle'); }
    } else if (current.current === 'idle' && !alreadySeen()) {
      current.current = 'pending'; setState('pending');
    }
  }, []);
  useEffect(() => {
    if (state === 'shown' && (!enabled || blocked)) finish();
    else if (state === 'pending' && !enabled) { current.current = 'idle'; setState('idle'); }
    else if (state === 'pending' && !blocked) {
      // On shallow/keyboard-sized screens, leave the normal menu setting alone
      // rather than letting an optional hint displace the playing surface.
      if (document.visibilityState !== 'visible' || !document.hasFocus() || (window.visualViewport?.height ?? window.innerHeight) < 600) { finish(); return; }
      if (alreadySeen()) { finish(); return; }
      // Persist on DISPLAY, not acceptance. Ignore, decline and close all count.
      seenInPage = true;
      try { localStorage.setItem(SEEN_KEY, 'true'); } catch { /* Page fallback above. */ }
      current.current = 'shown'; setState('shown');
    }
  }, [state, enabled, blocked, finish]);
  useEffect(() => {
    if (state !== 'shown') return;
    const timer = window.setTimeout(finish, 12_000);
    const hide = () => finish();
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide);
    window.visualViewport?.addEventListener('resize', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('blur', hide);
      window.removeEventListener('resize', hide);
      window.visualViewport?.removeEventListener('resize', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [state, finish]);
  const lower = () => {
    if (current.current !== 'shown' || !enabled || blocked) return;
    finish(); setLowQuality(true); // The existing App setter owns persistence.
  };
  return { visible: state === 'shown' && enabled && !blocked, onSuggestion, dismiss: finish, lower };
}

export function QualitySuggestion({ onLower, onDismiss }: { onLower: () => void; onDismiss: () => void }) {
  return <aside className="quality-suggestion" data-testid="quality-suggestion" aria-label="画质建议">
    <span role="status">动画有些卡顿，要降低画质吗？</span>
    <div><button type="button" onClick={onLower}>降低画质</button><button type="button" onClick={onDismiss}>保持高画质</button><button type="button" aria-label="关闭画质建议" onClick={onDismiss}>×</button></div>
  </aside>;
}
