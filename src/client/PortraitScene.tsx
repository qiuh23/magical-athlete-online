import type { CSSProperties } from 'react';
import { Avatar } from './avatars.js';

export function portraitStyle(_id: string): CSSProperties {
  return { '--portrait-paper': '#254de4', '--portrait-accent': '#fff3b0' } as CSSProperties;
}

/** Flat cartoon stock keeps the athlete readable without a competing backdrop. */
export function PortraitScene({ id, className = '' }: { id: string; className?: string }) {
  return <span className={`portrait-scene ${className}`} style={portraitStyle(id)} aria-hidden="true">
    <Avatar id={id} />
  </span>;
}
