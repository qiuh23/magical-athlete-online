import { TRACKS, type TrackId } from '../../../shared/tracks.js';

/** Local, reversible candidate. Stable board stays the default until full
 * device/pawn sweeps and real mobile renders have been accepted. */
export function mechanismsEnabled() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mechanisms') === '1';
}
export const MECHANISM_DECK_LIFT = 1.43;
export const MECHANISM_CELL_SPACING = 2.05;
export const MECHANISM_PAD_SIZE = 2.0;

/** Uniform XY-plane similarity, computed from source node spacing. No node,
 * branch, identity, progress, distance or random stream is changed. */
export function mechanismLayout(track: TrackId, spacing=track==='boardwalks'?2.3:MECHANISM_CELL_SPACING) {
  const definition = TRACKS[track];
  if (!Object.keys(definition.specials).length) return { scale: 1, lift: 0 };
  const points = definition.nodes ? Object.values(definition.nodes).map(p => [p.x * 2.05, p.z * 2.05])
    : Array.from({ length: definition.finish + 1 }, (_, i) => i <= 12 ? [i * 2.05, 0] : i <= 15 ? [12 * 2.05, (i-12)*2.05] : [(27-i)*2.05, 3*2.05]);
  let closest = Infinity;
  points.forEach((a,i) => points.slice(i+1).forEach(b => { const distance = Math.hypot(a[0]!-b[0]!, a[1]!-b[1]!); if (distance > .01) closest = Math.min(closest, distance); }));
  return { scale: Math.max(1, spacing / closest), lift: MECHANISM_DECK_LIFT };
}
const layouts = Object.fromEntries(Object.keys(TRACKS).map(track => [track, mechanismLayout(track as TrackId)])) as Record<TrackId, ReturnType<typeof mechanismLayout>>;
export function activeMechanismLayout(track: TrackId) { if(!mechanismsEnabled())return {scale:1,lift:0}; const requested=Number(new URLSearchParams(window.location.search).get('mechanismSpacing'));return requested>=2.05&&requested<=4.7?mechanismLayout(track,requested):layouts[track]; }
export function transformBoardPoint(point: [number,number,number], track: TrackId): [number,number,number] {
  const {scale,lift} = activeMechanismLayout(track);
  return [point[0]*scale, point[1]+lift, point[2]*scale];
}
