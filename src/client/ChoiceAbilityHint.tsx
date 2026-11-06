import { CHARACTERS } from '../shared/characters.js';
import type { Racer } from '../shared/types.js';
import { publicAbilityDetail } from './CharacterAbilities.js';
import { Avatar } from './avatars.js';
import { Icon } from './Icons.js';

/** Extra/current powers remain visible as portraits; full text is available
 * through the adjacent character detail button. */
export function ChoiceAbilityHint({ characterId, racer }: { characterId: string; racer?: Racer }) {
  const detail = racer ? publicAbilityDetail(racer) : undefined;
  const powers = detail?.owned ?? [characterId];
  return <div className="choice-character-ability choice-power-icons">
    {detail?.disabled && <strong><Icon kind="eliminate" size={16} />禁用</strong>}
    {!powers.length && <span>无能力</span>}
    {powers.filter(id => id !== characterId || powers.length > 1).map(id => {
      const card = CHARACTERS.find(value => value.id === id);
      return card ? <span key={id} data-choice-power={id} aria-label={`当前能力：${card.nameZh}`} title={card.nameZh}><Avatar id={id} /></span> : null;
    })}
  </div>;
}
