import { useId } from 'react';
import { PortraitFinish } from './portrait-finish.js';
import { WURSTII_CHARACTERS } from '../shared/wurstii.js';
import { SECOND_WIND_CHARACTERS } from '../shared/second-wind.js';
import { FAN_CHARACTERS } from '../shared/fan-expansions.js';
import { SECOND_WIND_PORTRAITS_A } from './second-wind-portraits-a.js';
import { SECOND_WIND_PORTRAITS_B } from './second-wind-portraits-b.js';
import { SECOND_WIND_PORTRAITS_C } from './second-wind-portraits-c.js';
import { EXTRA_MILE_PORTRAITS } from './extra-mile-portraits.js';
import { LEAF_PORTRAITS } from './leaf-portraits.js';
import { WURSTII_PORTRAITS } from './wurstii-portraits.js';

import { ORIGINAL_PORTRAITS, Eyes } from './original-portraits.js';

const yellow = '#ffda27';
const portraits = ORIGINAL_PORTRAITS;

const secondWindIds = new Set(SECOND_WIND_CHARACTERS.map(character => character.id));
const allPortraits = { ...portraits, ...SECOND_WIND_PORTRAITS_A, ...SECOND_WIND_PORTRAITS_B, ...SECOND_WIND_PORTRAITS_C, ...EXTRA_MILE_PORTRAITS, ...LEAF_PORTRAITS, ...WURSTII_PORTRAITS };
const fanIds = new Set([...FAN_CHARACTERS, ...WURSTII_CHARACTERS].map(character => character.id));
export const AVATAR_IDS = Object.keys(allPortraits);
export function Avatar({ id, className = '' }: { id: string; className?: string }) {
  const prefix = `p-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return <svg className={`avatar${secondWindIds.has(id) ? ' sw-avatar' : fanIds.has(id) ? ' fan-avatar' : ''} ${className}`} viewBox="0 0 120 120" fill="none" stroke="#293b36" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><PortraitFinish prefix={prefix}>{allPortraits[id] ?? <><circle cx="60" cy="58" r="42" fill={yellow} /><Eyes /><path d="M43 79q17 16 35-2" /></>}</PortraitFinish></svg>;
}
