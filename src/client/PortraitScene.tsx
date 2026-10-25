import type { CSSProperties } from 'react';
import { Avatar } from './avatars.js';

const themes = {
  meadow: { paper: '#edf0dc', accent: '#546d47', light: '#faf8e6', shadow: '#a6b58b' },
  dusk: { paper: '#e9e4f1', accent: '#75638f', light: '#faf3ed', shadow: '#b2a3c6' },
  tide: { paper: '#ddebed', accent: '#426f77', light: '#f3f5e4', shadow: '#91b6bc' },
  rose: { paper: '#f3e3df', accent: '#9c5d5c', light: '#fff3df', shadow: '#d6aba1' },
  honey: { paper: '#f2e8cd', accent: '#96733b', light: '#fff9e6', shadow: '#d2bb88' },
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
  const theme = themes[portraitTheme(id)];
  return { '--portrait-paper': theme.paper, '--portrait-accent': theme.accent, '--portrait-light': theme.light, '--portrait-shadow': theme.shadow } as CSSProperties;
}

/** A little printed theatre behind each athlete; the drawing stays inside its own safe area. */
export function PortraitScene({ id, className = '' }: { id: string; className?: string }) {
  const theme = portraitTheme(id);
  return <span className={`portrait-scene portrait-scene--${theme} ${className}`} style={portraitStyle(id)} aria-hidden="true">
    <svg className="portrait-scenery" viewBox="0 0 240 240" fill="none">
      <path d="M37 190V106a83 83 0 0 1 166 0v84" fill="var(--portrait-light)" />
      <path d="M28 188v-82a92 92 0 0 1 184 0v82" stroke="var(--portrait-accent)" strokeOpacity=".27" />
      <path d="M33 190h174M47 199h146M67 207h106" stroke="var(--portrait-accent)" strokeOpacity=".28" />
      <circle cx="120" cy="112" r="63" stroke="var(--portrait-accent)" strokeOpacity=".12" strokeDasharray="1 5" />
      {theme === 'meadow' ? <g stroke="var(--portrait-accent)" strokeWidth="1.2" opacity=".5">
        <path d="M38 182q-16-39-10-74m13 62-20-13m17-3 8-21m-13 6-15-15m185 58q16-39 10-74m-13 62 20-13m-17-3-8-21m13 6 15-15" />
        <path d="M24 125q-18-9-12-22 14 3 12 22m18 27q-3-16 10-20 5 13-10 20m174-27q18-9 12-22-14 3-12 22m-18 27q3-16-10-20-5 13 10 20" fill="var(--portrait-shadow)" stroke="none" />
        <circle cx="173" cy="58" r="13" fill="var(--portrait-shadow)" stroke="none" />
      </g> : theme === 'dusk' ? <g stroke="var(--portrait-accent)" opacity=".5">
        <path d="M178 49a16 16 0 1 0 18 22 19 19 0 0 1-18-22Z" fill="var(--portrait-shadow)" stroke="none" />
        <path d="m43 67 2-7 2 7 7 2-7 2-2 7-2-7-7-2Zm152 69 2-7 2 7 7 2-7 2-2 7-2-7-7-2ZM29 126h8m-4-4v8m128-92h8m-4-4v8" />
        <circle cx="70" cy="43" r="2" /><circle cx="207" cy="96" r="2" />
        <path d="M37 176q83-43 166 0" strokeDasharray="2 5" />
      </g> : theme === 'tide' ? <g stroke="var(--portrait-accent)" opacity=".4">
        <path d="M19 160q12-8 24 0t24 0m106 0q12-8 24 0t24 0M20 171q12-8 24 0t24 0m106 0q12-8 24 0t24 0M37 79h25m-14-7h26m94 21h27m-12-7h20" />
        <circle cx="175" cy="55" r="14" fill="var(--portrait-shadow)" stroke="none" />
        <path d="m32 112 5-4 5 4m141-72 5-4 5 4" />
      </g> : theme === 'rose' ? <g stroke="var(--portrait-accent)" opacity=".4">
        <path d="M24 81q96 28 192 0M32 84l5 13 9-9m146 0 11 9 5-13M37 171l-12-12m178 12 12-12" />
        <path d="M42 51c-13-12-24 6 0 18 24-12 13-30 0-18Z" fill="var(--portrait-shadow)" stroke="none" />
        <path d="m191 126 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" />
        <circle cx="176" cy="50" r="9" /><circle cx="29" cy="131" r="3" />
      </g> : <g stroke="var(--portrait-accent)" opacity=".4">
        <circle cx="178" cy="57" r="13" fill="var(--portrait-shadow)" stroke="none" />
        <path d="M178 37v-6m0 52v-6m20-20h6m-52 0h6m34-14 5-5m-5 33 5 5m-33-33-5-5M27 159l13-9m160 0 13 9" />
        <path d="m37 76 2-6 2 6 6 2-6 2-2 6-2-6-6-2ZM206 113h8m-4-4v8" />
        <path d="M26 181h18m152 0h18" strokeWidth="2" />
      </g>}
      <ellipse cx="120" cy="187" rx="51" ry="7" fill="var(--portrait-shadow)" opacity=".28" />
    </svg>
    <Avatar id={id} />
  </span>;
}
