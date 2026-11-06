import { CHARACTERS } from '../shared/characters.js';
import type { GameAction, RoomView } from '../shared/types.js';
import { Avatar } from './avatars.js';
import { Icon } from './Icons.js';
import { ChoiceAbilityHint } from './ChoiceAbilityHint.js';
import { choiceVisual } from './choice-visuals.js';

export function ChoiceOptions({ room, busy, duel, act, onDetail, onExplain }: { room: RoomView; busy: boolean; duel: boolean; act: (action: GameAction) => void; onDetail: (id: string, racerId?: string) => void; onExplain: (label: string, number: string) => void }) {
  const choice = room.pending!;
  const numbers = choice.options.map(choiceVisual).filter(visual => !!visual);
  const sharedCost = numbers[0]?.cost && numbers.every(visual => visual.cost === numbers[0]!.cost) ? numbers[0].cost : undefined;
  const costInHeading = sharedCost && new RegExp(`支付${sharedCost}(?:积)?分`).test(choice.title);
  return <>{sharedCost && !costInHeading && <span className="choice-shared-cost" aria-label={`数字选项均需支付${sharedCost}分`}><Icon kind="score" size={16} />−{sharedCost}</span>}<div className="choice-options compact-choice-options">{choice.options.map(option => {
    const racer = room.racers.find(value => value.id === (option.racerId ?? option.id));
    const card = CHARACTERS.find(card => card.id === (option.characterId ?? racer?.characterId ?? option.id));
    const visual = card ? undefined : choiceVisual(option);
    const secondary = ['skip', 'pass', 'decline'].includes(option.id);
    const choose = <button type="button" className={`button ${secondary ? 'button-secondary' : ''} ${duel ? 'duel-roll-button' : ''} ${visual ? 'choice-number-button' : ''}`} aria-label={option.label} title={option.label} disabled={busy || choice.playerId !== room.selfId} onClick={() => act({ type: 'choose', choiceId: choice.id, optionId: option.id })}>
      {duel && <Icon kind="dice" size={26} />}{visual ? <b>{visual.number}</b> : option.label}
    </button>;
    if (card) return <div className="choice-character" key={option.id} data-choice-character={card.id}><Avatar id={card.id} />{choose}<button type="button" className="choice-character-detail" aria-label={`查看${card.nameZh}详情`} title={`${card.nameZh} · 能力详情`} onClick={() => onDetail(card.id, racer?.id)}><Icon kind="info" size={18} /></button><ChoiceAbilityHint characterId={card.id} racer={racer} /></div>;
    return <span className={`choice-option ${visual ? 'choice-number-option' : ''}`} key={option.id}>{choose}{visual && (visual.count || visual.cost && !sharedCost || visual.retreat !== undefined) && <span className="choice-number-metrics">{visual.count && <small className="choice-number-count">×{visual.count}</small>}{visual.cost && !sharedCost && <small className="choice-number-cost" aria-label={`支付${visual.cost}分`}><Icon kind="score" size={14} />−{visual.cost}</small>}{visual.retreat !== undefined && <small className="choice-number-retreat"><span>目标</span>−{visual.retreat}</small>}</span>}{visual && <button type="button" className="choice-number-detail" aria-label={`查看选项${visual.number}详情`} title="选项详情" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onExplain(option.label, visual.number); }}><Icon kind="info" size={17} /></button>}</span>;
  })}</div></>;
}
