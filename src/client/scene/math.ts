import { transformBoardPoint } from './mechanisms/layout.js';
import { TRACKS, type TrackId } from '../../shared/tracks.js';
import type { RoomView } from '../../shared/types.js';

export const TILE = 2.05;
export const TRACK_FIRST_CORNER = TRACKS.mild.firstCorner;
export const TRACK_SECOND_CORNER = TRACKS.mild.secondCorner;
export const TRACK_FINISH = TRACKS.mild.finish;
const farStraight = TRACK_SECOND_CORNER - TRACK_FIRST_CORNER;
const minTrackX = Math.min(0, TRACK_FIRST_CORNER - (TRACK_FINISH - TRACK_SECOND_CORNER));
const centerTrackX = (minTrackX + TRACK_FIRST_CORNER) / 2;
/** Distance between the outermost tile centers; add one tile for board edges. */
export const BOARD_CENTER_SPAN = { width: (TRACK_FIRST_CORNER - minTrackX) * TILE, depth: farStraight * TILE } as const;

/**
 * One continuous U track with right-angle bends at 12 and 15. Both viewports
 * use the same track: compact view rotates it 90 degrees without refolding.
 */
export function boardPoint(position: number, compact: boolean, track: TrackId = 'mild'): [number, number, number] {
  const nodes = TRACKS[track].nodes;
  if (nodes) {
    const point = nodes[position] ?? nodes[0]!;
    const x = point.x * TILE, z = point.z * TILE, y = .22 + (point.y ?? 0) * TILE;
    return transformBoardPoint(compact ? [-z, y, x] : [x, y, z], track);
  }
  const index = Number.isFinite(position) ? Math.max(0, Math.min(TRACK_FINISH, position)) : 0;
  const x = (index <= TRACK_FIRST_CORNER ? index : index <= TRACK_SECOND_CORNER ? TRACK_FIRST_CORNER : TRACK_FIRST_CORNER - (index - TRACK_SECOND_CORNER)) - centerTrackX;
  const z = (index <= TRACK_FIRST_CORNER ? 0 : index <= TRACK_SECOND_CORNER ? index - TRACK_FIRST_CORNER : farStraight) - farStraight / 2;
  return transformBoardPoint(compact ? [-z * TILE, .22, x * TILE] : [x * TILE, .22, z * TILE], track);
}

export function trackNodeIds(track: TrackId): number[] {
  return TRACKS[track].nodes ? Object.keys(TRACKS[track].nodes!).map(Number) : Array.from({ length: TRACKS[track].finish + 1 }, (_, i) => i);
}

export function trackConnections(track: TrackId): [number, number][] {
  const edges = TRACKS[track].edges;
  return edges ? Object.entries(edges).flatMap(([from, targets]) => targets.map(to => [Number(from), to] as [number, number])) : Array.from({ length: TRACKS[track].finish }, (_, i) => [i, i + 1]);
}

/** Both forward forks and backward merges use the authority's legal options.
 * Recover the junction from public edges, including saves made before this UI. */
export function routeChoice(room: Pick<RoomView, 'pending' | 'selfId' | 'role' | 'track'>) {
  const pending = room.pending, edges = TRACKS[room.track].edges;
  if (room.role === 'spectator' || pending?.kind !== 'track-branch' || pending.playerId !== room.selfId || !edges) return;
  const options = pending.options.map(option => ({ ...option, to: Number(option.id) }));
  const junctions = trackNodeIds(room.track).filter(from => options.every(option => edges[from]?.includes(option.to)) || options.every(option => edges[option.to]?.includes(from)));
  if (junctions.length !== 1) return;
  return { from: junctions[0]!, options };
}

/** Node IDs are identities; a branch such as 8 -> 31 is still one forward step. */
export function trackMovementDistance(track: TrackId, path: readonly number[], reversed = false): number {
  if (path.length < 2) return 0;
  const [from, to] = path, forward = TRACKS[track].edges ? TRACKS[track].edges![from!]?.includes(to!) : to! > from!;
  return (path.length - 1) * (forward ? 1 : -1) * (reversed ? -1 : 1);
}

/** Uniform SVG projection shared by the setup thumbnails and live minimap. */
export function trackSvgLayout(track: TrackId, width: number, height: number, padding = 14) {
  const nodes = trackNodeIds(track), points = nodes.map(id => boardPoint(id, false, track));
  const minX = Math.min(...points.map(point => point[0])), maxX = Math.max(...points.map(point => point[0]));
  const minZ = Math.min(...points.map(point => point[2])), maxZ = Math.max(...points.map(point => point[2]));
  const scale = Math.min((width - padding * 2) / Math.max(1, maxX - minX), (height - padding * 2) / Math.max(1, maxZ - minZ));
  const point = (position: number) => {
    const [x, , z] = boardPoint(position, false, track);
    return { x: width / 2 + (x - (minX + maxX) / 2) * scale, y: height / 2 + (z - (minZ + maxZ) / 2) * scale };
  };
  return { nodes, edges: trackConnections(track), point };
}

/** Bounds for all real nodes, including the expanded starting lineup. */
export function boardBounds(track: TrackId = 'mild', compact = false) {
  const points = trackNodeIds(track).map(id => boardPoint(id, compact, track));
  const start = boardPoint(0, compact, track);
  points.push(compact ? [start[0], start[1], start[2] - TILE * 3] : [start[0] - TILE * 3, start[1], start[2]]);
  const minX = Math.min(...points.map(point => point[0])), maxX = Math.max(...points.map(point => point[0]));
  const minZ = Math.min(...points.map(point => point[2])), maxZ = Math.max(...points.map(point => point[2]));
  return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ, x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, top: Math.max(...points.map(point => point[1])) };
}

/**
 * Toy die face normals: +Y=1, -Y=6, +Z=2, -Z=5, +X=3, -X=4.
 * These XYZ Euler rotations put the confirmed face exactly along world +Y.
 */
export function diceTopRotation(face: number): [number, number, number] {
  switch (face) {
    case 2: return [-Math.PI / 2, 0, 0];
    case 3: return [0, 0, Math.PI / 2];
    case 4: return [0, 0, -Math.PI / 2];
    case 5: return [Math.PI / 2, 0, 0];
    case 6: return [Math.PI, 0, 0];
    default: return [0, 0, 0];
  }
}
