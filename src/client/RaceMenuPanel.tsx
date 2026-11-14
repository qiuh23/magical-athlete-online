import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icons.js';
import { installRaceMenuDismissal } from './race-menu-dismissal.js';

export function RaceMenuPanel({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const panel = useRef<HTMLElement>(null), closeButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(true), close = useRef<(restore?: boolean) => boolean>(() => false);
  close.current = (restore = true) => {
    if (panel.current?.querySelector('[data-submitting="true"]')) return false;
    if (panel.current?.querySelector('[data-unsaved="true"]') && !window.confirm('放弃未保存的修改？')) return false;
    restoreFocus.current = restore; onClose(); return true;
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current!;
    closeButton.current?.focus({ preventScroll: true });
    const remove = installRaceMenuDismissal(node, document.querySelector('[data-testid="presentation-settings"]'), reason => close.current(reason !== 'outside'));
    return () => {
      remove();
      if (restoreFocus.current && (node.contains(document.activeElement) || document.activeElement === document.body) && previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return <aside ref={panel} className="race-menu-panel" id="presentation-settings-panel" aria-labelledby="race-menu-title" tabIndex={-1}>
    <div className="race-menu-panel-header"><h2 id="race-menu-title">比赛菜单</h2><button ref={closeButton} type="button" className="close-button" onClick={() => close.current()} aria-label="关闭比赛菜单"><Icon kind="close" /></button></div>
    <div className="race-menu-panel-scroll">{children}</div>
  </aside>;
}
