import { Matrix4, Vector3 } from 'three';
import type { TrackId } from '../../../shared/tracks.js';
import { boardPoint, trackConnections } from '../math.js';
import { mechanismAnchors, type MechanismAnchor } from './events.js';

export interface MechanismPlacement { anchor: MechanismAnchor; position: [number,number,number]; yaw: number; deckYaw:number; matrix: Matrix4 }
/** The support side is perpendicular to the actual adjacent route, including
 * explicit forks. The complete rigid root rotates, never its working head. */
export function mechanismPlacements(track: TrackId, compact = false): MechanismPlacement[] {
  const edges = trackConnections(track);
  return mechanismAnchors(track).map(anchor => {
    const p = boardPoint(anchor.node, false, track);
    const connected = edges.filter(([a,b]) => a === anchor.node || b === anchor.node).map(([a,b]) => boardPoint(a === anchor.node ? b : a, false, track));
    // Pick a support side with the greatest distance to all incident route rays.
    let yaw = 0, best = -Infinity;
    for (let i=0;i<32;i++) {
      const angle=i*Math.PI/16, x=Math.sin(angle)*1.65,z=Math.cos(angle)*1.65;
      const clearance = Math.min(...connected.map(q => {
        const dx=q[0]-p[0],dz=q[2]-p[2],t=Math.max(0,Math.min(1,(x*dx+z*dz)/(dx*dx+dz*dz)));
        return Math.hypot(x-t*dx,z-t*dz);
      }));
      if (clearance > best+1e-8) { best=clearance; yaw=angle; }
    }
    let deckYaw=yaw;
    // Gain v2 fixed mount: external cabinet clears all current standing/down
    // occupancy slots. This is a placement change, never an animated offset.
    if(anchor.kind==='gain'){p[0]+=Math.sin(yaw)*.85;p[2]+=Math.cos(yaw)*.85;}
    if(track==='wild'&&anchor.node===5){yaw=Math.PI/4;deckYaw=0;p[0]-=1.1455129855;p[2]+=.5544870145;}
    // Fixed from initial mount through preparation, contact and retraction.
    if(track==='wild'&&anchor.node===24){yaw=0;deckYaw=0;p[0]-=.4;p[2]-=.25;}
    const position: [number,number,number] = compact ? [-p[2],p[1],p[0]] : p;
    if(compact)yaw-=Math.PI/2;
    const matrix = new Matrix4().makeRotationY(yaw);matrix.setPosition(new Vector3(...position));
    return { anchor, position, yaw, deckYaw, matrix };
  });
}
