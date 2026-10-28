import { CHARACTERS } from '../shared/characters.js';
import type { Racer } from '../shared/types.js';
import { publicAbilityDetail } from './CharacterAbilities.js';

/** A card shows its printed text; a target shows its current public abilities. */
export function ChoiceAbilityHint({ characterId, racer }: { characterId: string; racer?: Racer }) {
  const detail = racer ? publicAbilityDetail(racer) : undefined;
  const powers = detail?.owned ?? [characterId];
  return <div className="choice-character-ability">
    {detail?.disabled && <strong>当前能力暂时禁用</strong>}
    {!powers.length && <p>当前没有生效能力。</p>}
    {powers.map(id => {
      const card = CHARACTERS.find(value => value.id === id);
      return card ? <p key={id} data-choice-power={id}>{powers.length > 1 || id !== characterId ? <strong>{card.nameZh}：</strong> : null}{card.ability}</p> : null;
    })}
  </div>;
}
