import type { RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { currentController } from './character-context.js';
import { Avatar } from './avatars.js';
import { Icon } from './Icons.js';

export function ChoiceDiceHint({ room, compact = false }: { room: RoomView; compact?: boolean }) {
  const hint = room.pending?.diceHint;
  if (!hint) return null;
  const racer = room.racers.find(racer => racer.id === hint.racerId);
  const owner = racer ? currentController(room, racer) : undefined;
  const characterId = hint.characterId ?? racer?.characterId;
  const name = CHARACTERS.find(character => character.id === characterId)?.nameZh ?? '选手';
  const actor = `${owner ? `${owner.seat + 1}号 ${owner.name}的` : ''}${name}`;
  const faces = `${hint.faces.join('、')} 点`;
  return <div className={`choice-dice-hint compact-dice-hint ${compact ? 'is-compact' : ''}`} data-testid="choice-dice-hint" aria-label={`${actor} · 刚才骰面 ${faces}`} title={`${actor} · 刚才骰面 ${faces}`}>{characterId && <Avatar id={characterId} />}{owner && <small>{owner.seat + 1}号</small>}<Icon kind="dice" size={18} />{hint.faces.map((face, index) => <b key={index}>{face}</b>)}</div>;
}
