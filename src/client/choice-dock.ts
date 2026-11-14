import type { GameAction, RoomView } from '../shared/types.js';

export type ChoiceDockDetail = { label: string; number?: string };
export type ChoiceDockState = { collapsed: boolean; detail?: ChoiceDockDetail };
export const initialChoiceDockState: ChoiceDockState = { collapsed: false };
export function choiceDockReducer(state: ChoiceDockState, event: { type: 'toggle' | 'back' | 'escape' } | { type: 'explain'; detail: ChoiceDockDetail }): ChoiceDockState {
  if (event.type === 'explain') return { collapsed: false, detail: event.detail };
  if (event.type === 'back') return initialChoiceDockState;
  if (event.type === 'escape') return state.detail ? initialChoiceDockState : { collapsed: true };
  return { collapsed: !state.collapsed };
}

/** UI checks supplement, but never replace, server authority. Inspecting a choice
 * is always safe; only the owning, unpaused player may submit a legal option. */
export function choiceAction(room: RoomView, busy: boolean, optionId: string): GameAction | undefined {
  const choice = room.pending;
  if (!choice || busy || room.pause || room.role === 'spectator' || choice.playerId !== room.selfId || !choice.options.some(option => option.id === optionId)) return;
  return { type: 'choose', choiceId: choice.id, optionId };
}

export function choicePromptTitle(room: RoomView, actorName?: string) {
  const title = room.pending?.title ?? '';
  const prefix = actorName ? `${actorName}：` : '';
  return prefix && title.startsWith(prefix) ? title.slice(prefix.length) : title;
}
