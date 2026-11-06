import type { RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { Avatar } from './avatars.js';
import { publicAbilityDetail } from './CharacterAbilities.js';
import { currentController } from './character-context.js';
import { Icon } from './Icons.js';

export function ChoiceRelatedRacers({ room, onDetail }: { room: RoomView; onDetail: (characterId: string, racerId?: string) => void }) {
  const choice = room.pending;
  const optionIds = new Set(choice?.options.map(option => option.racerId).filter(Boolean));
  // Target options already show their abilities. Reserve this compact row for
  // the other participants, including an opponent whose die prompted a reaction.
  const racers = (choice?.relatedRacerIds ?? []).flatMap(id => {
    const racer = room.racers.find(racer => racer.id === id);
    return racer && racer.id !== choice?.racerId && !optionIds.has(id) ? [racer] : [];
  });
  if (!racers.length) return null;
  return <section className="choice-related-racers" aria-label="本次技能相关角色" data-testid="choice-related-racers">
    <div className="choice-related-list">{racers.map(racer => {
      const character = CHARACTERS.find(character => character.id === racer.characterId), owner = currentController(room, racer);
      const ability = publicAbilityDetail(racer);
      return <button type="button" className="choice-related-character" key={racer.id} data-related-racer={racer.id} aria-label={`查看相关角色${character?.nameZh ?? racer.characterId}的技能卡片`} title={`${character?.nameZh ?? racer.characterId}${owner ? ` · ${owner.seat + 1}号 ${owner.name}` : ''}${ability.disabled ? ' · 能力禁用' : ''}`} onClick={() => onDetail(racer.characterId, racer.id)}>
        <Avatar id={racer.characterId} /><b>{owner ? owner.seat + 1 : ''}</b>{ability.disabled && <Icon kind="eliminate" size={16} />}<Icon kind="info" size={16} />
      </button>;
    })}</div>
  </section>;
}
