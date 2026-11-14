import { TRACKS, type TrackDefinition, type TrackId } from '../shared/tracks.js';

// The existing course palette, shared by the rim, sign and small-map key.
export const PORTAL_COLORS = ['#329bc2', '#aa77b9', '#dc8c54', '#62a15e', '#c97498', '#718aca'] as const;
export interface PortalConnection { key: string; from: number; to: number; bidirectional: boolean; code: string; color: string }

/** Read-only projection of the same destinations the authority's board task
 * consumes. A reverse arrow is shown only when that exact reverse edge exists. */
export function portalConnections(track: TrackId | TrackDefinition): PortalConnection[] {
  const definition = typeof track === 'string' ? TRACKS[track] : track;
  const validNode = (node: number) => Number.isInteger(node) && (definition.nodes ? !!definition.nodes[node] : node >= 0 && node <= definition.finish);
  const connections: Omit<PortalConnection, 'code' | 'color'>[] = [];
  for (const from of Object.keys(definition.specials).map(Number).sort((a, b) => a - b)) {
    const space = definition.specials[from]!;
    if (space.kind !== 'warp' || space.to === undefined || !validNode(from) || !validNode(space.to) || space.to === from) continue;
    const to = space.to, reverse = definition.specials[to], bidirectional = reverse?.kind === 'warp' && reverse.to === from;
    if (bidirectional && from > to) continue;
    connections.push({ key: `${from}:${to}`, from, to, bidirectional });
  }
  return connections.map((connection, index) => ({ ...connection, code: index < 26 ? String.fromCharCode(65 + index) : `P${index + 1}`, color: PORTAL_COLORS[index % PORTAL_COLORS.length]! }));
}

export function portalEndpoints(track: TrackId | TrackDefinition): PortalConnection[] {
  return portalConnections(track).flatMap(connection => connection.bidirectional ? [connection, { ...connection, from: connection.to, to: connection.from }] : [connection]);
}

export function portalCaption(connection: Pick<PortalConnection, 'from' | 'to' | 'bidirectional'>) {
  return `${connection.from}${connection.bidirectional ? '↔' : '→'}${connection.to}`;
}

export function portalDescription(connection: PortalConnection) {
  return `${connection.code}组，${connection.bidirectional ? `${connection.from}格与${connection.to}格双向传送` : `从${connection.from}格传送到${connection.to}格`}`;
}

/** Fit the expanded key inside the visible board, including short landscapes. */
export function portalPanelPlacement(summaryTop:number,summaryBottom:number,boardTop:number,boardBottom:number,naturalHeight:number) {
  const below=Math.max(0,boardBottom-summaryBottom-8),above=Math.max(0,summaryTop-boardTop-8);
  const upward=below<Math.min(180,naturalHeight)&&above>below;
  return {upward,maxHeight:Math.min(240,upward?above:below)};
}
