import { Box3, Matrix4, Ray, Vector3, type Camera } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { trackNodeIds } from '../math.js';
import { environmentPoint, type EnvironmentOptions } from './layout.js';
import type { EnvironmentTree } from './runtime.js';

/** Finite, conservative presentation probes. Not a collision certificate or a
 * pixel/HUD/mobile-device acceptance test. Hidden trees remain in audit inputs. */
export function environmentTreeVisibility(track: TrackId, options: EnvironmentOptions, compact: boolean) {
  const rotation = new Matrix4().makeRotationY(compact ? -Math.PI / 2 : 0), ray = new Ray(), direction = new Vector3(), hit = new Vector3(), box = new Box3();
  const points = trackNodeIds(track).flatMap(id => {
    const p = environmentPoint(track, id, options);
    return [p.clone().add(new Vector3(-.58, .025, -.6)), p.clone().add(new Vector3(0, .1, 0)), p.clone().add(new Vector3(0, 1.6, 0)), ...[-.8, .8].flatMap(x => [-.8, .8].map(z => p.clone().add(new Vector3(x, .03, z))))];
  }).map(p => p.applyMatrix4(rotation));
  return (camera: Camera, trees: EnvironmentTree[]) => {
    camera.getWorldDirection(direction).negate(); const hidden = new Set<string>();
    for (const tree of trees) {
      box.copy(tree.box).applyMatrix4(rotation);
      if (points.some(p => { ray.set(p, direction); return !!ray.intersectBox(box, hit) && hit.distanceToSquared(p) > .0001; })) hidden.add(tree.name);
    }
    return hidden;
  };
}
