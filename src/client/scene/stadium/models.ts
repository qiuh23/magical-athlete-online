import { Mesh, MeshStandardMaterial, type Group } from 'three';
import type { RoomView } from '../../../shared/types.js';
import { TRACKS } from '../../../shared/tracks.js';
import layout from './layout-classic.json' with { type: 'json' };

export const STADIUM_ASSET_NAMES = [
  'athlete_bleachers', 'athlete_bunting', 'athlete_finish_gate', 'athlete_infield_plan',
  'athlete_officials_kiosk', 'athlete_pennant', 'athlete_planter', 'athlete_podium',
  'athlete_rail_corner', 'athlete_rail_straight', 'athlete_scoreboard', 'athlete_spectators_strip',
  'athlete_start_gate', 'athlete_start_platform', 'athlete_tile_coral', 'athlete_tile_gold',
  'athlete_tile_mint', 'athlete_tile_neutral', 'athlete_topiary',
] as const;
export type StadiumAssetName = typeof STADIUM_ASSET_NAMES[number];
export type StadiumModels = Record<StadiumAssetName, Group>;
export const STADIUM_URLS = STADIUM_ASSET_NAMES.map(name => `/models/stadium-v7/${name}.glb`);
export const TALL_DECOR = new Set(['athlete_scoreboard', 'athlete_bunting']);
export const STADIUM_PLACEMENTS = layout.placements.filter(p => p.trackIndex === null && !p.asset.endsWith('_gate.glb'));
export const isClassicStadium = (track: RoomView['track']) => track === 'mild' || track === 'wild';

/** Rule data, not the sample layout's tile colors, controls every live square. */
export function stadiumTileAsset(index: number, track: RoomView['track']): StadiumAssetName {
  if (index === 0) return 'athlete_start_platform';
  if (index === 30) return 'athlete_tile_coral';
  const special = TRACKS[track].specials[index];
  return special?.kind === 'star' ? 'athlete_tile_gold' : special?.kind === 'trip' ? 'athlete_tile_coral'
    : special?.kind === 'arrow' ? 'athlete_tile_mint' : 'athlete_tile_neutral';
}

/** Instances share cached geometry/PBR materials. Only a mutable color/emission surface is owned. */
export function instantiateStadiumModel(source: Group, surfaceColor?: string, gateReversed = false) {
  const object = source.clone(true);
  const owned: MeshStandardMaterial[] = [];
  object.traverse(node => {
    if (!(node instanceof Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    // Decorative geometry must not compete with the unchanged player interaction layer.
    node.raycast = () => {};
    const cloneMaterial = (material: MeshStandardMaterial) => {
      const surface = material.name.startsWith('tile_surface_');
      const gate = gateReversed && (material.name === 'mint' || material.name === 'coral');
      if (!surface && !gate) return material;
      const copy = material.clone();
      if (surface && surfaceColor) copy.color.set(surfaceColor);
      if (gate) copy.color.set(material.name === 'mint' ? '#ee785e' : '#438674');
      if (surface) { copy.emissive.copy(copy.color); copy.emissiveIntensity = 0; }
      owned.push(copy);
      return copy;
    };
    node.material = Array.isArray(node.material) ? node.material.map(cloneMaterial) : cloneMaterial(node.material as MeshStandardMaterial);
  });
  return { object, owned, dispose: () => owned.forEach(material => material.dispose()) };
}
