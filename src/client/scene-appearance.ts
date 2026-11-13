import type { AthleteLightMode } from './scene/StudioLightingV7.js';

export type SceneAppearance = AthleteLightMode | 'auto';

/** Local presentation only. Existing stored fixed presets are retained, even if
 * written by the earlier default. Missing/invalid preferences start in auto. */
export const SCENE_APPEARANCES: ReadonlyArray<{value: SceneAppearance; label: string}> = [
  {value: 'auto', label: '自动（约3分钟）'},
  {value: 'day', label: '白天'},
  {value: 'dusk', label: '黄昏'},
  {value: 'night', label: '夜晚'},
];
export function sceneAppearance(value: string | null): SceneAppearance {
  return value === 'day' || value === 'dusk' || value === 'night' ? value : 'auto';
}
