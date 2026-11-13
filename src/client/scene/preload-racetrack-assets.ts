import './asset-loading.js';
import { useGLTF } from '@react-three/drei';
import type { TrackId } from '../../shared/tracks.js';
import { COMMON_ASSETS, environmentUrl, mapEnvironmentAssets } from './environment/layout.js';
import { FLOODLIGHT_ASSETS, floodlightUrl } from './environment/floodlights.js';
import { DISPLAY_URLS, fullCoveragePlacements } from './environment/full-coverage.js';
import { mechanismPadUrl } from './mechanisms/models.js';

export type RacetrackAssetGroup = string | string[];
/** Preserve consumer URL order and array boundaries: Fiber keys array loads as
 * a single cache entry. Per-file preloads would not warm those same entries.
 * Only the released environment is prepared, never opt-out/legacy candidates,
 * all characters, or the rest of the match's maps. */
export function racetrackAssetGroups(track: TrackId, lowQuality: boolean, search: string): RacetrackAssetGroup[] {
  const query = new URLSearchParams(search);
  if (query.get('environment') !== '1') return [];
  const groups: RacetrackAssetGroup[] = [COMMON_ASSETS.map(environmentUrl), mapEnvironmentAssets(track).map(environmentUrl), FLOODLIGHT_ASSETS.map(floodlightUrl)];
  if (query.get('mechanisms') === '1') {
    groups.push(mechanismPadUrl(lowQuality));
    for (const variant of new Set(fullCoveragePlacements(track).map(p => p.variant))) groups.push(DISPLAY_URLS[variant]);
  }
  return groups;
}
/** Drei's supported preload API populates the exact parsed GLTF cache used by
 * the real scene. No hidden Canvas, scene assembly, GPU upload, or animation. */
export function preloadRacetrackGroup(group: RacetrackAssetGroup) { useGLTF.preload(group); }
