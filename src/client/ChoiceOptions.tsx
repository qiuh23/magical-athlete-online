import { CHARACTERS } from '../shared/characters.js';
import type { GameAction, RoomView } from '../shared/types.js';
import { Avatar } from './avatars.js';
import { Icon } from './Icons.js';
import { ChoiceAbilityHint } from './ChoiceAbilityHint.js';
import { choiceVisual } from './choice-visuals.js';
import { choiceAction } from './choice-dock.js';
import { currentController } from './character-context.js';

/** One horizontal row, not a page of cards. Choosing and inspecting are separate
 * 44px controls; the full authority-provided label remains the accessible name. */
export function ChoiceOptions({ room, busy, duel, act, onDetail, onExplain }: { room: RoomView; busy: boolean; duel: boolean; act: (action: GameAction) => void; onDetail: (id: string, racerId?: string) => void; onExplain: (label: string, number: string) => void }) {
  const choice = room.pending;
  if (!choice) return null;
  return <div className="choice-options choice-dock-options" role="group" aria-label="选择选项，横向滑动查看更多">{choice.options.map(option => {
    const racer = room.racers.find(value => value.id === (option.racerId ?? option.id));
    const card = CHARACTERS.find(card => card.id === (option.characterId ?? racer?.characterId ?? option.id));
    const owner = racer ? currentController(room, racer) : undefined;
    const visual = card ? undefined : choiceVisual(option);
    const secondary = ['skip', 'pass', 'decline', 'keep'].includes(option.id);
    const unit = /^第\s*\d+\s*格$/.test(option.label) ? '格' : /^支付\d+分，移动/.test(option.label) ? '格' : /^下注/.test(option.label) ? '分' : undefined;
    const allowed = !!choiceAction(room, busy, option.id);
    return <div className={`choice-dock-option ${card ? 'is-character' : visual ? 'is-number' : 'is-text'}`} key={option.id} data-choice-character={card?.id}>
      <button type="button" className={`button choice-dock-action ${secondary ? 'is-secondary' : ''}`} aria-label={option.label} title={option.label} disabled={!allowed} onClick={() => { const action = choiceAction(room, busy, option.id); if (action) act(action); }}>
        {card && <Avatar id={card.id} />}{duel && <Icon kind="dice" size={22} />}
        <span className="choice-dock-label"><strong>{visual ? <>{visual.number}{unit && <small>{unit}</small>}</> : option.label}</strong>
          {racer && <small>{owner ? `${owner.seat + 1}号 · ` : ''}{racer.position}格{racer.tripped ? ' · 绊倒' : ''}</small>}
          {visual && (visual.count || visual.cost || visual.retreat !== undefined) && <span className="choice-dock-metrics">{visual.count && <small>×{visual.count}</small>}{visual.cost && <small aria-label={`支付${visual.cost}分`}>−{visual.cost}分</small>}{visual.retreat !== undefined && <small>目标 −{visual.retreat}</small>}</span>}
        </span>
      </button>
      {card ? <button type="button" className="choice-dock-inspect" data-choice-inspect={option.id} aria-label={`查看${card.nameZh}详情`} title={`${card.nameZh} · 能力详情`} onClick={event => { event.currentTarget.focus({ preventScroll: true }); onDetail(card.id, racer?.id); }}><Icon kind="info" size={18} /></button> : <button type="button" className="choice-dock-inspect" data-choice-inspect={option.id} aria-label={`查看选项${visual?.number ?? option.label}详情`} title="选项详情" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onExplain(option.label, visual?.number ?? ''); }}><Icon kind="info" size={18} /></button>}
      {card && <ChoiceAbilityHint characterId={card.id} racer={racer} />}
    </div>;
  })}</div>;
}
