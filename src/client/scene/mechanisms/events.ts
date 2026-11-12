import { TRACKS, type TrackId } from '../../../shared/tracks.js';
import type { GameEvent, Racer } from '../../../shared/types.js';
import type { PresentationBeat, PresentationMotion } from '../../presentation.js';
import { trackConnections, trackNodeIds } from '../math.js';

export type MechanismKind = 'punch' | 'trip' | 'gain' | 'loss' | 'warp';
export interface MechanismAnchor {
  id: string;
  node: number;
  kind: MechanismKind;
  direction?: 1 | -1;
  points?: number;
  destination?: number;
}
export interface MechanismAction {
  key: string;
  anchor: MechanismAnchor;
  eventId: number;
  targets: string[];
  motions: PresentationMotion[];
  /** Actual authoritative score change, including a clamped zero. */
  scoreDelta?: number;
  role: 'source' | 'destination';
}

/** Fixed mechanisms come only from actual special cells. Event NPCs, banana
 * trampolines, bonkbug and one-use coins remain owned by TwistPieces. */
export function mechanismAnchors(track: TrackId): MechanismAnchor[] {
  return trackNodeIds(track).flatMap(node => {
    const special = TRACKS[track].specials[node];
    if (!special) return [];
    const kind: MechanismKind = special.kind === 'arrow' ? 'punch' : special.kind === 'star'
      ? (special.points ?? 1) < 0 ? 'loss' : 'gain' : special.kind;
    return [{ id: `${track}:${node}`, node, kind,
      ...(special.kind === 'arrow' ? { direction: (special.move ?? 1) < 0 ? -1 as const : 1 as const } : {}),
      ...(special.kind === 'star' ? { points: special.points ?? 1 } : {}),
      ...(special.to !== undefined ? { destination: special.to } : {}),
    }];
  });
}

/** Older frozen rules expose the real delta in their score log, not the tile.
 * Never infer a debit from printed points or from the latest player's total. */
export function eventScoreDelta(event: GameEvent): number | undefined {
  if (Number.isFinite(event.scoreDelta)) return event.scoreDelta;
  const match = /(?:^|\s)([+＋−-]?\d+)分(?:[（(]|$)/.exec(event.text);
  return match ? Number(match[1]!.replace('＋', '+').replace('−', '-')) : undefined;
}

export function newlyTrippedTargets(beat: PresentationBeat | undefined, racers: Racer[]): string[] {
  if (beat?.kind !== 'trip') return [];
  return [...new Set(beat.targets)].filter(id => racers.some(racer => racer.id === id && !racer.tripped && !racer.eliminated));
}

export function pawnFallPhase(beat: PresentationBeat | undefined, racer: Racer): 'trip' | 'recover' | 'down' | undefined {
  if (beat?.kind === 'recover' && beat.targets.includes(racer.id) && racer.tripped) return 'recover';
  if (racer.tripped) return 'down';
  return beat?.kind === 'trip' && beat.targets.includes(racer.id) ? 'trip' : undefined;
}

/** Validate every consecutive edge, including backward branches; node IDs are
 * identities, not coordinates. A malformed path must not create a cross-board punch. */
export function isTrackPath(track: TrackId, path: readonly number[]): boolean {
  const ids = new Set(trackNodeIds(track));
  const edges = new Set(trackConnections(track).flatMap(([a,b]) => [`${a}:${b}`, `${b}:${a}`]));
  return path.length > 0 && path.every(id => ids.has(id)) && path.slice(1).every((id,index) => id === path[index] || edges.has(`${path[index]}:${id}`));
}

/** Pure, repeatable projection of the CURRENT beat and its pre-event racers.
 * receiveRoom already owns event-ID deduplication. This adds the state edge,
 * so a new trip event on a fallen pawn does not replay a fall or an actuator. */
export function mechanismActions(track: TrackId, beat: PresentationBeat | undefined, racers: Racer[]): MechanismAction[] {
  if (!beat) return [];
  const anchors = mechanismAnchors(track);
  const byNode = new Map(anchors.map(anchor => [anchor.node, anchor]));
  const byId = new Map(racers.map(racer => [racer.id, racer]));
  const actions: MechanismAction[] = [];
  const seen = new Set<number>();
  for (const event of beat.events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const add = (node: number, kind: MechanismKind, targets: string[], motions: PresentationMotion[] = [], role: MechanismAction['role'] = 'source', scoreDelta?: number) => {
      const anchor = byNode.get(node);
      if (!anchor || anchor.kind !== kind || !targets.length) return;
      actions.push({ key: `${beat.key}:${event.id}:${node}:${role}`, anchor, eventId: event.id, targets: [...new Set(targets)], motions, role, ...(scoreDelta !== undefined ? { scoreDelta } : {}) });
    };
    if (event.type === 'trip' && event.source === 'track') {
      const targets = (event.targets ?? []).filter(id => beat.targets.includes(id) && byId.has(id) && !byId.get(id)!.tripped && !byId.get(id)!.eliminated);
      for (const node of new Set(targets.map(id => byId.get(id)!.position))) add(node, 'trip', targets.filter(id => byId.get(id)!.position === node));
    } else if (event.type === 'move' && event.cause === 'track-arrow') {
      for (const id of event.targets ?? []) {
        const motion = beat.motions.find(value => value.racerId === id && value.from === event.before?.[event.targets!.indexOf(id)]);
        if (motion && isTrackPath(track, motion.path) && motion.path[0] === motion.from && motion.path.at(-1) === motion.to) add(motion.from, 'punch', [id], [motion]);
      }
    } else if (event.type === 'warp' && event.cause === 'track-whirl') {
      for (const id of event.targets ?? []) {
        const motion = beat.motions.find(value => value.racerId === id);
        if (!motion || byNode.get(motion.from)?.kind !== 'warp') continue;
        add(motion.from, 'warp', [id], [motion]);
        // Destination is the event's actual result, not the printed pair label.
        add(motion.to, 'warp', [id], [motion], 'destination');
      }
    } else if (event.type === 'score' && (event.cause === 'track-star' || /[（(]赛道星格[）)]/.test(event.text))) {
      const racer = byId.get(event.source ?? '');
      const delta = eventScoreDelta(event);
      if (!racer || delta === undefined) continue;
      const anchor = byNode.get(event.boardPosition ?? racer.position);
      if (anchor?.kind === 'gain' || anchor?.kind === 'loss') add(anchor.node, anchor.kind, [racer.id], [], 'source', delta);
    }
  }
  return actions;
}

/** One hardware assembly per anchor even when a beat contains multiple score
 * owners or trip targets. Each authoritative action remains available to HUDs. */
export function groupMechanismActions(actions: readonly MechanismAction[]) {
  const groups = new Map<string, { anchor: MechanismAnchor; actions: MechanismAction[] }>();
  for (const action of actions) {
    const group = groups.get(action.anchor.id) ?? { anchor: action.anchor, actions: [] };
    group.actions.push(action); groups.set(action.anchor.id, group);
  }
  return [...groups.values()];
}
export function mechanismActionSignature(actions: readonly MechanismAction[]) {
  return JSON.stringify(actions.map(a => [a.key, a.targets, a.scoreDelta, a.role, a.motions]));
}
