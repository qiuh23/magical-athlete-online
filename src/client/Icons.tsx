import type { ButtonHTMLAttributes, ReactNode } from 'react';

const paths = {
  back: <><path d="M21 12H4m6-7-7 7 7 7" /></>,
  refresh: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  dice: <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8" cy="8" r="1" /><circle cx="16" cy="8" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="8" cy="16" r="1" /><circle cx="16" cy="16" r="1" /></>,
  flag: <><path d="M5 22V3m0 1c5-5 9 5 15 0v11c-6 5-10-5-15 0" /><path d="M10 3v10m5-8v10" /></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M15 4H5v12" /></>,
  sound: <><path d="M3 9h4l5-5v16l-5-5H3zM16 8q5 4 0 8m3-11q8 7 0 14" /></>,
  mute: <><path d="M3 9h4l5-5v16l-5-5H3zM16 9l6 6m0-6-6 6" /></>,
  arrow: <path d="M3 12h17M14 5l7 7-7 7" />,
  trophy: <><path d="M7 3h10v6c0 7-10 7-10 0V3zm0 2H3v3q0 5 5 5m9-8h4v3q0 5-5 5m-4 2v6m-5 0h10" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v2" /></>,
  bot: <><rect x="5" y="7" width="14" height="14" rx="3" /><path d="M12 3v4M2 12v5m20-5v5M9 17h6" /><circle cx="9" cy="12" r=".6" /><circle cx="15" cy="12" r=".6" /></>,
  chat: <><path d="M20.5 11a8.5 8.5 0 0 1-8.5 8.5H7L3 22v-6a8.5 8.5 0 1 1 17.5-5Z" /><path d="M7.5 10h9m-9 4h6" /></>,
  menu: <><path d="M5 6h14M5 12h14M5 18h14" /><circle cx="2" cy="6" r=".5" /><circle cx="2" cy="12" r=".5" /><circle cx="2" cy="18" r=".5" /></>,
  rules: <><path d="M12 5C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 1v16M5 8h4m-4 4h4m6-4h4m-4 4h4" /></>,
  log: <><rect x="5" y="4" width="16" height="17" rx="2" /><path d="M8 2v4M3 9h4m-4 5h4m-4 5h4m4-9h6m-6 5h6" /></>,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>,
  play: <path d="m7 3 14 9-14 9Z" />,
  skip: <><path d="m3 5 9 7-9 7Zm10 0 9 7-9 7Z" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
  collapse: <path d="m5 15 7-7 7 7" />,
  expand: <path d="m5 9 7 7 7-7" />,
  focus: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" /><circle cx="12" cy="12" r="4" /></>,
  overview: <><path d="m12 3 10 6-10 6L2 9Zm-9 11 9 6 9-6" /></>,
  follow: <><circle cx="12" cy="12" r="7" /><path d="M12 2v5m0 10v5M2 12h5m10 0h5" /><circle cx="12" cy="12" r="1" /></>,
  camera: <><path d="M3 7h5l2-3h4l2 3h5v13H3Z" /><circle cx="12" cy="13" r="4" /></>,
  move: <><path d="M3 17h16m-5-5 6 5-6 5M4 6l6-3 4 4-3 3 3 3m-4-4-4 4" /></>,
  warp: <><ellipse cx="5" cy="12" rx="3" ry="8" /><ellipse cx="19" cy="12" rx="3" ry="8" /><path d="M6 12h12m-4-4 4 4-4 4" /></>,
  swap: <><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" /></>,
  trip: <><circle cx="15" cy="5" r="2" /><path d="m8 8 6 2 3 6m-5-7-3 7-6 2m8-4 2 6m5 0h4M3 7l2 2m-1-5h2" /></>,
  recover: <><circle cx="13" cy="4" r="2" /><path d="m9 21 2-9 5 3 2 6M5 11l6-4 6 3h5m-19 7 3-3 3 3m-3-3v8" /></>,
  score: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8m-4-4v8" /></>,
  eliminate: <><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></>,
  skill: <><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" /><path d="m20 2 1 3 3 1" /></>,
  clock: <><circle cx="12" cy="13" r="9" /><path d="M9 1h6m-3 6v6l4 2" /></>,
  connection: <><path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0" /><circle cx="12" cy="20" r="1" /></>,
} satisfies Record<string, ReactNode>;

export type IconKind = keyof typeof paths;
export function Icon({ kind, size = 22 }: { kind: IconKind; size?: number }) {
  return <svg className="ui-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[kind]}</svg>;
}

export function IconButton({ icon, label, className = '', onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconKind; label: string }) {
  return <button type="button" className={`race-icon-button ${className}`} aria-label={label} title={label} {...props} onClick={event => { event.currentTarget.focus({ preventScroll: true }); onClick?.(event); }}><Icon kind={icon} /></button>;
}
