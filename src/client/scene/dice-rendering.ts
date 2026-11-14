import { BufferGeometry, Euler, Matrix4, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** The original raised pip spheres, baked into two draws without changing a vertex,
 * normal, colour or material. All dice share the immutable buffers and materials. */
export const DICE_PIP_PATTERNS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-.24, .24], [.24, -.24]], 3: [[-.24, .24], [0, 0], [.24, -.24]],
  4: [[-.24, .24], [.24, .24], [-.24, -.24], [.24, -.24]],
  5: [[-.24, .24], [.24, .24], [0, 0], [-.24, -.24], [.24, -.24]],
  6: [[-.24, .26], [.24, .26], [-.24, 0], [.24, 0], [-.24, -.26], [.24, -.26]],
};
export const DICE_SIDES: { value: number; position: [number, number, number]; rotation: [number, number, number] }[] = [
  {value:1,position:[0,.501,0],rotation:[-Math.PI/2,0,0]}, {value:6,position:[0,-.501,0],rotation:[Math.PI/2,0,0]},
  {value:2,position:[0,0,.501],rotation:[0,0,0]}, {value:5,position:[0,0,-.501],rotation:[0,Math.PI,0]},
  {value:3,position:[.501,0,0],rotation:[0,Math.PI/2,0]}, {value:4,position:[-.501,0,0],rotation:[0,-Math.PI/2,0]},
];
export function createDicePips() {
  const sphere = new SphereGeometry(.065,12,8), red:BufferGeometry[] = [], dark:BufferGeometry[] = [];
  for (const side of DICE_SIDES) {
    const outer = new Matrix4().compose(new Vector3(...side.position), new Quaternion().setFromEuler(new Euler(...side.rotation)), new Vector3(1,1,1));
    for (const [x,y] of DICE_PIP_PATTERNS[side.value]!) {
      const local = new Matrix4().compose(new Vector3(x,y,.005), new Quaternion(), new Vector3(1,1,.28));
      (side.value===1?red:dark).push(sphere.clone().applyMatrix4(outer.clone().multiply(local)));
    }
  }
  const redGeometry = mergeGeometries(red,false)!, darkGeometry = mergeGeometries(dark,false)!;
  sphere.dispose(); [...red,...dark].forEach(geometry=>geometry.dispose());
  const redMaterial = new MeshStandardMaterial({color:'#ed6149',roughness:.5});
  const darkMaterial = new MeshStandardMaterial({color:'#253e50',roughness:.5});
  return {redGeometry,darkGeometry,redMaterial,darkMaterial,dispose(){redGeometry.dispose();darkGeometry.dispose();redMaterial.dispose();darkMaterial.dispose();}};
}

/** Start with the first drawable frame, not a React render while the hidden canvas
 * still has zero size. Completion is acknowledged only AFTER its terminal draw. */
export class DiceThrowPlayback {
  private firstAt: number | undefined;
  progress = 0;
  acknowledged = false;
  sample(now:number,durationMs:number,reducedMotion:boolean) {
    this.firstAt ??= now;
    this.progress = reducedMotion ? 1 : Math.max(0,Math.min(1,(now-this.firstAt)/Math.max(1,durationMs)));
    return this.progress;
  }
  afterRender() {
    if(this.progress<1||this.acknowledged)return false;
    this.acknowledged=true;return true;
  }
  /** A lost/uninitialized renderer must never hold the authoritative result hostage.
   * Allow two seconds beyond the full visible throw before using numeric fallback. */
  fallbackRemaining(now:number,requestedAt:number,durationMs:number) {
    return Math.max(0,(this.firstAt??requestedAt)+durationMs+2000-now);
  }
}
