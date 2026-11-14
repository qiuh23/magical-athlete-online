import { useEffect, useId, useReducer, useRef } from 'react';
import { CHARACTERS } from '../shared/characters.js';
import type { GameAction, RoomView } from '../shared/types.js';
import { Avatar } from './avatars.js';
import { Icon } from './Icons.js';
import { ChoiceOptions } from './ChoiceOptions.js';
import { ChoiceDiceHint } from './ChoiceDiceHint.js';
import { ChoiceRelatedRacers } from './ChoiceRelatedRacers.js';
import { choiceAction, choiceDockReducer, choicePromptTitle, initialChoiceDockState, type ChoiceDockDetail } from './choice-dock.js';
import { routeChoice } from './scene/math.js';

/** A pending decision owns only this dock, never the rest of the map. A new
 * choice key remounts local UI so previous collapsed/details state cannot leak. */
export function ChoiceDock(props: { room: RoomView; busy: boolean; act: (action: GameAction) => void; onDetail: (id: string, racerId?: string) => void }) {
  const choice = props.room.pending;
  return choice ? <PendingChoiceDock key={`${props.room.code}:${props.room.round}:${choice.id}`} {...props} /> : null;
}
function PendingChoiceDock({ room, busy, act, onDetail }: { room: RoomView; busy: boolean; act: (action: GameAction) => void; onDetail: (id: string, racerId?: string) => void }) {
  const choice = room.pending!;
  const [state, dispatch] = useReducer(choiceDockReducer, initialChoiceDockState);
  const panel = useRef<HTMLDivElement>(null), heading = useRef<HTMLButtonElement>(null), collapse = useRef<HTMLButtonElement>(null), back = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const returnScroll = useRef({ options: 0, context: 0, body: 0 });
  const contentId = useId(), headingId = useId();
  const actor = room.racers.find(racer => racer.id === choice.racerId);
  const actorCard = CHARACTERS.find(card => card.id === actor?.characterId);
  const offered = room.role !== 'spectator' ? CHARACTERS.find(card => card.id === choice.offeredCharacterId) : undefined;
  const route = routeChoice(room);
  const duel = /duel-roll|cletus.*roll/.test(choice.kind);
  const characterChoice = !!offered || choice.options.some(option => option.characterId || room.racers.some(racer => racer.id === option.id) || CHARACTERS.some(card => card.id === option.id));
  const title = route ? `${route.from}格 · 选择路线` : choicePromptTitle(room, actorCard?.nameZh);
  const operator = room.pause ? '已暂停' : busy ? '处理中' : room.role === 'spectator' ? '观战' : choice.playerId === room.selfId ? '你来选' : `${(room.players.find(player => player.id === choice.playerId)?.seat ?? 0) + 1}号选择`;
  const explain = (detail: ChoiceDockDetail) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    returnScroll.current = { options: panel.current?.querySelector('.choice-dock-options')?.scrollLeft ?? 0, context: panel.current?.querySelector('.choice-dock-context')?.scrollLeft ?? 0, body: panel.current?.querySelector('.choice-dock-body')?.scrollTop ?? 0 };
    dispatch({ type: 'explain', detail });
  };
  const closeDetail = () => dispatch({ type: 'back' });
  useEffect(() => {
    if (state.detail) back.current?.focus({ preventScroll: true });
    else if (returnFocus.current) {
      const options = panel.current?.querySelector('.choice-dock-options'), context = panel.current?.querySelector('.choice-dock-context'), body = panel.current?.querySelector('.choice-dock-body');
      if (options) options.scrollLeft = returnScroll.current.options;
      if (context) context.scrollLeft = returnScroll.current.context;
      if (body) body.scrollTop = returnScroll.current.body;
      // Option controls are mounted again before restoring focus. Select by the
      // accessible label because the previous DOM node was intentionally removed.
      const label = returnFocus.current.getAttribute('aria-label');
      const optionId = returnFocus.current.getAttribute('data-choice-inspect');
      const target = [...(panel.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])].find(button => optionId !== null ? button.getAttribute('data-choice-inspect') === optionId : button.getAttribute('aria-label') === label);
      (target ?? heading.current)?.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [state.detail]);
  const context = !!(route && room.lastRoll) || !!choice.diceHint || !!offered || !!choice.relatedRacerIds?.some(id => id !== choice.racerId && !choice.options.some(option => (option.racerId ?? option.id) === id));
  return <div ref={panel} className={`floating-choice race-choice-dock ${state.collapsed ? 'is-collapsed' : ''} ${characterChoice ? 'character-choice-panel' : ''} ${route ? 'route-choice-panel' : ''}`} role="region" aria-labelledby={headingId} data-testid="skill-choice" data-choice-id={choice.id} onKeyDown={event => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    if (state.detail) closeDetail();
    else { dispatch({ type: 'escape' }); collapse.current?.focus({ preventScroll: true }); }
  }}>
    <div className="choice-dock-heading">
      {state.detail ? <button ref={back} type="button" className="choice-dock-back" aria-label="返回选项" onClick={closeDetail}><Icon kind="back" size={20} /></button> : actor && actorCard ? <button type="button" className="choice-dock-actor" aria-label={`查看发动角色${actorCard.nameZh}详情`} title={actorCard.nameZh} onClick={event => { event.currentTarget.focus({ preventScroll: true }); onDetail(actor.characterId, actor.id); }}><Avatar id={actor.characterId} /></button> : <span className="choice-dock-symbol"><Icon kind={route ? 'arrow' : 'skill'} size={22} /></span>}
      <button ref={heading} type="button" className="choice-dock-title" id={headingId} title={choice.title} aria-label={`查看完整技能说明：${choice.title}`} onClick={() => explain({ label: choice.title })}>
        <strong>{state.detail ? state.detail.number ? `选项 ${state.detail.number}` : '技能说明' : title}</strong><small>{operator}{!state.collapsed && !state.detail && <> · {choice.options.length}项 <span aria-hidden="true">↔</span></>}</small>
      </button>
      {state.collapsed && <ChoiceDiceHint room={room} compact />}
      <button ref={collapse} type="button" className="choice-dock-toggle" aria-label={state.collapsed ? '展开选项' : '收起选项'} title={state.collapsed ? '展开选项' : '收起选项'} aria-expanded={!state.collapsed} aria-controls={contentId} onClick={() => { returnFocus.current = null; dispatch({ type: 'toggle' }); }}><Icon kind={state.collapsed ? 'expand' : 'collapse'} size={20} /></button>
    </div>
    {!state.collapsed && <div className="choice-dock-body" id={contentId}>
      {state.detail ? <div className="choice-dock-explanation" tabIndex={0} role="region" aria-label="选项详情"><p>{state.detail.label}</p><small>{duel ? '双方各掷一次，完成后一起揭晓。' : '返回选项后选择；地图仍可拖动。'}</small></div> : <>
        {context && <div className="choice-dock-context">{route && room.lastRoll ? <span className="choice-dock-roll" data-testid="dice-value" aria-label={`上次骰面 ${room.lastRoll.face}，主移动 ${room.lastRoll.distance} 格`}><Icon kind="dice" size={18} /><b>{room.lastRoll.face}</b><Icon kind="move" size={18} /><b>{room.lastRoll.distance}格</b></span> : <ChoiceDiceHint room={room} compact />}<ChoiceRelatedRacers room={room} onDetail={onDetail} />{offered && <button type="button" className="choice-dock-offer" data-testid="offered-character" data-choice-character={offered.id} aria-label={`查看${offered.nameZh}详情`} onClick={event => { event.currentTarget.focus({ preventScroll: true }); onDetail(offered.id); }}><Avatar id={offered.id} /><span>新抽到 <strong>{offered.nameZh}</strong></span><Icon kind="info" size={18} /></button>}</div>}
        {route ? <div className="choice-options choice-dock-options" role="group" aria-label="路线选项">{route.options.map(option => <button type="button" className="button choice-dock-action choice-dock-route" key={option.id} aria-label={option.label} title={option.label} disabled={!choiceAction(room, busy, option.id)} onClick={() => { const action = choiceAction(room, busy, option.id); if (action) act(action); }}><Icon kind="arrow" size={20} /><strong>去 {option.to} 格</strong></button>)}</div> : room.role === 'spectator' ? <p className="choice-dock-wait">等待选手选择</p> : <ChoiceOptions room={room} busy={busy} duel={duel} act={act} onDetail={onDetail} onExplain={(label, number) => explain({ label, number })} />}
      </>}
    </div>}
  </div>;
}
