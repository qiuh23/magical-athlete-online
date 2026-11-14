import { Matrix4, Vector3 } from 'three';
import {VENUE_TREE_SELECTION} from './scene-hierarchy.js';
import { TRACKS, type TrackId } from '../../../shared/tracks.js';
import { boardPoint } from '../math.js';
import { activeMechanismLayout } from '../mechanisms/layout.js';
import source from './source-layout.json' with { type: 'json' };

/** New recovery candidate, not the lost environment-v1 tested tree. */
export const ENVIRONMENT_REVISION = 'environment-segmented-seating-v1-20261113';
/** Explicit local corrections. Scans may vary these in an isolated audit process;
 * rendering uses these exact fixed values, with no rule or actuator movement. */
export const ENVIRONMENT_LOCAL_OFFSETS = {
  wildPodium: [-1.7, 0, 1.0],
  squiggleTree02: [1.0, 0, 0],
  squiggleTree03: [0, 0, 1.95],
};
export function environmentVenueOffset(track: TrackId | undefined, asset: string) {
  return new Vector3(...(track === 'wild' && asset.startsWith('podium') ? ENVIRONMENT_LOCAL_OFFSETS.wildPodium : [0, 0, 0]));
}
export const TREE_ASSETS = ['tree_elm_rebuilt_lod2', 'tree_maple_rebuilt_lod2', 'tree_sapling_rebuilt_lod2'];
export const FACILITY_ASSETS = ['bleachers', 'spectators', 'podium', 'officials_kiosk', 'scoreboard', 'grandstand_rostrum', 'official_rostrum', 'podium_plinth'];
export const COMMON_ASSETS = [...TREE_ASSETS, 'start_gate', 'finish_gate', 'bleachers', 'spectators', 'grandstand_rostrum'];
export type EnvironmentOptions = { scale: number; lift: number; lowQuality: boolean; reversed?: boolean };
export const isNaturalMap = (track: TrackId) => ['squiggle', 'boardwalks', 'bridges'].includes(track);
export function environmentEnabled(search = typeof window === 'undefined' ? '' : window.location.search) {
  return new URLSearchParams(search).get('environment') === '1';
}
/** No old contact certificate includes this rebuilt scenery, even while it loads. */
export const environmentAllowsPhysicalContact = (candidate: boolean) => !candidate;
export function mapEnvironmentAssets(track: TrackId) {
  return isNaturalMap(track) ? [`${track}_base`, `${track}_landscape_reexport_v1`, `${track}_furniture`] : FACILITY_ASSETS.filter(asset => !['bleachers','spectators','grandstand_rostrum'].includes(asset));
}
export const environmentAssets = (track: TrackId) => [...COMMON_ASSETS, ...mapEnvironmentAssets(track)];
export const environmentUrl = (asset: string) => `/models/environment-rebuilt-v2/${asset}.glb`;
export function environmentPoint(track: TrackId, node: number, options: EnvironmentOptions) {
  // boardPoint remains the single source for the real route. Normalize its current
  // presentation similarity so the same builder can be audited with explicit options.
  const p = boardPoint(node, false, track), current = activeMechanismLayout(track);
  return new Vector3(p[0] / current.scale * options.scale, p[1] - current.lift + options.lift, p[2] / current.scale * options.scale);
}
export function environmentTrees(track: TrackId, options: EnvironmentOptions) {
  return source[track].trees.filter((_,index)=>VENUE_TREE_SELECTION[track].includes(index)).map(tree => {
    const matrix = new Matrix4().set(...tree.matrix.flat() as Parameters<Matrix4['set']>);
    matrix.elements[12] *= options.scale / tree.sourceScale;
    matrix.elements[14] *= options.scale / tree.sourceScale;
    matrix.elements[13] += isNaturalMap(track) ? .7 : options.lift ? 0 : .09;
    // Preserve the two known local visibility repairs, with new-scene checks still required.
    if ((track === 'mild' || track === 'twisty-twirl') && tree.name === 'INFIELD_TREE_03') matrix.elements[14] -= .65;
    if (track === 'bridges' && tree.name === 'REFINED_TREE_06') matrix.elements[12] -= .8;
    if (track === 'squiggle') {
      const delta = tree.name === 'REFINED_TREE_02' ? ENVIRONMENT_LOCAL_OFFSETS.squiggleTree02 : tree.name === 'REFINED_TREE_03' ? ENVIRONMENT_LOCAL_OFFSETS.squiggleTree03 : [0, 0, 0];
      matrix.elements[12] += delta[0]!; matrix.elements[13] += delta[1]!; matrix.elements[14] += delta[2]!;
    }
    return { name: tree.name, asset: tree.asset, matrix };
  });
}
export function furnitureAnchors(track: TrackId) { return source[track].pockets.map(p => new Vector3(p.x, 0, p.z)); }
export function venuePlacements(lift: number) {
  const high = lift > 0;
  return [
    // Preserve the accepted infield facilities. Spectator banks and their
    // matching support now live in the separate perimeter seating builder.
    { asset: 'podium', position: [-7.7, high ? .484 : .234, -.10] },
    { asset: 'scoreboard', position: [8.3, high ? .884 : .234, -.30] },
  ];
}
export function gatePlacements(track: TrackId, options: EnvironmentOptions) {
  return [0, TRACKS[track].finish].map((node, i) => {
    const p = environmentPoint(track, node, options);
    return { asset: i ? 'finish_gate' : 'start_gate', position: [p.x - (i ? 0 : 3.075), p.y, p.z - 1.52] as [number, number, number] };
  });
}
