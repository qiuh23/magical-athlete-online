import type { LabelBox } from './mechanisms/focus-labels.js';
import type { TrackId } from '../../shared/tracks.js';
import { boardPoint, boardBounds } from './math.js';
export function portalSignPoint(track: TrackId, node: number, compact: boolean): [number,number,number] {
  const p=boardPoint(node,compact,track),flat=boardPoint(node,false,track),side=flat[2]<boardBounds(track,false).z?-1:1;
  return [p[0]+(compact?-side*.88:0),p[1]+.08,p[2]+(compact?0:side*.88)];
}
export interface PortalLabelCandidate { node: number; x: number; y: number; depth: number; width: number; height: number }
const overlaps = (a: LabelBox, b: LabelBox) => a.left < b.right + 4 && a.right > b.left - 4 && a.top < b.bottom + 4 && a.bottom > b.top - 4;
/** Hide only crowded/offscreen signs rather than moving them to a false tile.
 * The touch-accessible pair key always retains every connection. */
export function placePortalLabels(candidates: readonly PortalLabelCandidate[], width: number, height: number, blocked: readonly LabelBox[]) {
  const result: (PortalLabelCandidate & { box: LabelBox })[] = [];
  for (const c of [...candidates].sort((a, b) => Math.hypot(a.x-width/2,a.y-height/2)-Math.hypot(b.x-width/2,b.y-height/2))) {
    if (![c.x, c.y, c.depth, c.width, c.height].every(Number.isFinite) || Math.abs(c.depth) > 1) continue;
    const box = { left: c.x-c.width/2, right: c.x+c.width/2, top: c.y-c.height/2, bottom: c.y+c.height/2 };
    if (box.left < 8 || box.right > width-8 || box.top < 8 || box.bottom > height-8 || blocked.some(b => overlaps(box, b)) || result.some(p => overlaps(box, p.box))) continue;
    result.push({ ...c, box });
  }
  return result;
}
