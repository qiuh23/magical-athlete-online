import type { GameAction, Room } from './types.js';

export const CONTINUE_VOTE_MS = 60_000;
export const CONTINUE_RESULTS_MS = 120_000;
export interface RoomContinuation {
  id: string;
  round: number;
  stage: 'voting' | 'playing' | 'results';
  voters: string[];
  accepted: string[];
  deadline: number;
  seen: string[];
  emptySince?: number;
}
export const continuationAction = (action: GameAction) => action.type === 'continue-vote' || action.type === 'results-seen';
export const continuationPaused = (room: Room) => !!room.continuation && room.continuation.stage !== 'playing';
const humans = (room: Room) => room.game.players.filter(p => !p.isAI && p.connected);

/** Called by the authority at the existing owner-absence deadline. */
export function offerContinuation(room: Room, now: number): boolean {
  if (room.continuation || room.closedAt !== undefined || ['lobby','finished'].includes(room.game.phase)
    || humans(room).some(p => p.id === (room.ownerId ?? room.hostId))) return false;
  const voters = humans(room).map(p => p.id);
  if (!voters.length) return false;
  room.continuation = {id: crypto.randomUUID(), round:Math.max(1,room.game.round), stage:'voting', voters, accepted:[], deadline:now + CONTINUE_VOTE_MS, seen:[]};
  room.deadline = null; room.version++; room.updatedAt = now;
  return true;
}

/** The agreement survives reconnects; returning owners cannot turn it into a new room. */
export function updateContinuation(room: Room, now: number): boolean {
  const c = room.continuation;
  if (!c || room.closedAt !== undefined) return false;
  const online = humans(room);
  if ((c.stage === 'voting' && now >= c.deadline)
    || (c.stage === 'playing' && c.emptySince !== undefined && now >= c.emptySince + CONTINUE_VOTE_MS)
    || (c.stage === 'results' && (now >= c.deadline || (online.length > 0 && online.every(p => c.seen.includes(p.id)))))) {
    room.closedAt = now; room.closeReason = 'host-away';
  } else if (c.stage === 'playing' && ['results','finished'].includes(room.game.phase) && room.game.results.some(result=>result.round===c.round)) {
    c.stage = 'results'; c.deadline = now + CONTINUE_RESULTS_MS; room.deadline = null;
  } else if (c.stage === 'playing' && !online.length && c.emptySince === undefined) {
    c.emptySince = now;
  } else if (online.length && c.emptySince !== undefined) {
    delete c.emptySince;
  } else return false;
  room.version++; room.updatedAt = now;
  return true;
}

export function applyContinuationAction(room: Room, playerId: string, action: GameAction, now: number): void {
  const c = room.continuation;
  if (!c || !continuationAction(action) || !('continuationId' in action) || action.continuationId !== c.id) throw Error('这次继续比赛确认已经失效，请同步后重试。');
  const player = humans(room).find(p => p.id === playerId);
  if (!player) throw Error('只有在线真人选手能确认。');
  if (action.type === 'continue-vote') {
    if (c.stage !== 'voting' || now >= c.deadline || !c.voters.includes(playerId)) throw Error('继续比赛确认已经结束。');
    if (!action.continue) {room.closedAt = now; room.closeReason = 'host-away'; return;}
    if (!c.accepted.includes(playerId)) c.accepted.push(playerId);
    if (c.voters.every(id => c.accepted.includes(id))) {
      c.stage = 'playing';
      // Only unanimous continuation replaces the absent owner's manual pause.
      // Voting itself must leave the paused choices and visuals untouched.
      delete room.pause;
    }
  } else if (action.type === 'results-seen') {
    if (c.stage !== 'results' || !['results','finished'].includes(room.game.phase)) throw Error('本场结果尚未显示。');
    if (!c.seen.includes(playerId)) c.seen.push(playerId);
  }
  updateContinuation(room, now);
}
