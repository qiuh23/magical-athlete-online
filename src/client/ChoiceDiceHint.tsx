import type { RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { currentController } from './character-context.js';

export function ChoiceDiceHint({ room, compact = false }: { room: RoomView; compact?: boolean }) {
  const hint = room.pending?.diceHint;
  if (!hint) return null;
  const racer = room.racers.find(racer => racer.id === hint.racerId);
  const owner = racer ? currentController(room, racer) : undefined;
  const characterId = hint.characterId ?? racer?.characterId;
  const name = CHARACTERS.find(character => character.id === characterId)?.nameZh ?? '选手';
  const actor = `${owner ? `${owner.seat + 1}号 ${owner.name}的` : ''}${name}`;
  const faces = `${hint.faces.join('、')} 点`;
  return compact ? <small data-testid="choice-dice-hint">{actor} · 刚才骰面 {faces}</small> : <div className="choice-dice-hint" data-testid="choice-dice-hint"><span>{actor} · 刚才骰面</span><strong>{faces}</strong></div>;
}
