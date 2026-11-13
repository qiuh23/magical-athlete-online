import type { MeshStandardMaterial } from 'three';
/** Keep the accepted fixture geometry/identity untouched. All visible lamp output
 * uses this shared neutral/cool-white color at runtime and in offline previews. */
export const FLOODLIGHT_COLOR='#f2f6ff';
export function applyFloodlightColor(lenses:ReadonlyArray<{material:MeshStandardMaterial}>){
 for(const lens of lenses)lens.material.emissive.set(FLOODLIGHT_COLOR);
}
