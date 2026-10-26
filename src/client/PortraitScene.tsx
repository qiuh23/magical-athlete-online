import type { CSSProperties } from 'react';
import { Avatar } from './avatars.js';

const themes = {
  meadow: '#b5d66b',
  dusk: '#c7b3e5',
  tide: '#9db7fb',
  rose: '#f6a8d0',
  honey: '#ffda27',
} as const;
type Theme = keyof typeof themes;
const nature = new Set(['banana', 'baba-yaga', 'hare', 'inchworm', 'leaptoad', 'gunk', 'centaur', 'hopfrog', 'hungry-sloth', 'hog-knight']);
const magic = new Set(['alchemist', 'hypnotist', 'magician', 'genius', 'mastermind', 'magical-athlete', 'witch', 'devil', 'sisyphus']);
const water = new Set(['blimp', 'skipper', 'suckerfish', 'icarus', 'rocket-scientist']);
const warm = new Set(['romantic', 'cheerleader', 'huge-baby', 'mouth', 'party-animal', 'twin', 'copycat']);

export function portraitTheme(id: string): Theme {
  if (nature.has(id) || /plant|leaf|frog|tree|green|worm|snail|bee|forest/.test(id)) return 'meadow';
  if (magic.has(id) || /witch|wizard|ghost|magic|oracle|phantom|moon|shadow/.test(id)) return 'dusk';
  if (water.has(id) || /fish|sea|sail|water|cloud|bird|penguin|ice/.test(id)) return 'tide';
  if (warm.has(id) || /love|heart|party|muse|dancer|twin/.test(id)) return 'rose';
  return 'honey';
}

export function portraitStyle(id: string): CSSProperties {
  return { '--portrait-paper': themes[portraitTheme(id)], '--portrait-accent': '#293b36' } as CSSProperties;
}

/** Flat cartoon stock keeps the athlete readable without a competing backdrop. */
export function PortraitScene({ id, className = '' }: { id: string; className?: string }) {
  const theme = portraitTheme(id);
  return <span className={`portrait-scene portrait-scene--${theme} ${className}`} style={portraitStyle(id)} aria-hidden="true">
    <Avatar id={id} />
  </span>;
}
