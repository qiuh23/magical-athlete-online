import type { RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { Avatar } from './avatars.js';
import { publicAbilityDetail } from './CharacterAbilities.js';
import { currentController } from './character-context.js';

export function ChoiceRelatedRacers({ room, onDetail }: { room: RoomView; onDetail: (characterId: string, racerId?: string) => void }) {
  const choice = room.pending;
  const optionIds = new Set(choice?.options.map(option => option.racerId).filter(Boolean));
  // Target options already show their abilities. Reserve this compact row for
  // the other participants, including an opponent whose die prompted a reaction.
  const racers = (choice?.relatedRacerIds ?? []).flatMap(id => {
    const racer = room.racers.find(racer => racer.id === id);
    return racer && !optionIds.has(id) ? [racer] : [];
  });
  if (!racers.length) return null;
  return <section className="choice-related-racers" aria-label="本次技能相关角色" data-testid="choice-related-racers">
    <span>相关角色 · 点开卡片查看完整技能</span>
    <div className="choice-related-list">{racers.map(racer => {
      const character = CHARACTERS.find(character => character.id === racer.characterId), owner = currentController(room, racer);
      const ability = publicAbilityDetail(racer);
      const description = ability.owned.map(id => {
        const card = CHARACTERS.find(card => card.id === id);
        return card ? `${id !== racer.characterId || ability.owned.length > 1 ? `${card.nameZh}：` : ''}${card.ability}` : '';
      }).filter(Boolean).join('；') || '当前没有生效能力。';
      return <button type="button" className="choice-related-character" key={racer.id} data-related-racer={racer.id} aria-label={`查看相关角色${character?.nameZh ?? racer.characterId}的技能卡片`} onClick={() => onDetail(racer.characterId, racer.id)}>
        <Avatar id={racer.characterId} /><strong>{character?.nameZh ?? racer.characterId}<small>{owner ? `${owner.seat + 1}号 ${owner.name}` : ''}</small></strong>
        <span>{ability.disabled ? '当前能力暂时禁用 · ' : ''}{description}</span>
      </button>;
    })}</div>
  </section>;
}
