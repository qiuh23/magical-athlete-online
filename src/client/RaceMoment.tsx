import type { Racer, RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { Avatar } from './avatars.js';
import { currentController } from './character-context.js';
import { EventArt } from './EventArt.js';
import { Icon } from './Icons.js';
import type { PresentationBeat } from './presentation.js';
import { raceCue } from './race-cue.js';

const name = (id: string) => CHARACTERS.find(card => card.id === id)?.nameZh ?? id;

/** One card for the active beat of the existing queue. No independent timers,
 * event subscriptions or replay state: pause, skip and reconnect stay atomic. */
export function RaceMoment({ room, beat, racers, onDetail }: { room: RoomView; beat?: PresentationBeat; racers: Racer[]; onDetail: (id: string, racerId?: string) => void }) {
  if (!beat || ['intro', 'dice', 'duel-dice'].includes(beat.kind) || beat.abilityReveal) return null;
  const cue = raceCue(beat, room);
  const source = racers.find(racer => racer.id === beat.source);
  const affected = (beat.targets.length ? beat.targets : source ? [source.id] : []).flatMap(id => {
    const racer = racers.find(value => value.id === id);
    return racer ? [racer] : [];
  });
  const description = (racer: Racer) => {
    const owner = currentController(room, racer), amount = cue.amounts.get(racer.id);
    return `${name(racer.characterId)}${owner ? ` · ${owner.seat + 1}号` : ''}${amount ? `，${amount}格` : ''}`;
  };
  const chip = (racer: Racer, result = false) => {
    const owner = currentController(room, racer);
    return <button type="button" className="moment-racer" key={racer.id} title={description(racer)} aria-label={`查看${description(racer)}的技能与当前玩家`} onClick={() => onDetail(racer.characterId, racer.id)}>
      <Avatar id={racer.characterId} /><small>{owner ? `${owner.seat + 1}号` : name(racer.characterId)}</small>
      {result && cue.amounts.has(racer.id) && <b className="moment-number">{cue.amounts.get(racer.id)}<small>格</small></b>}
    </button>;
  };
  const stage = !!(cue.art || beat.actor);
  const selfOnly = !stage && source && affected.length === 1 && affected[0]!.id === source.id;
  const selfAmount = selfOnly ? cue.amounts.get(source.id) : undefined;
  const targets = selfOnly ? [] : affected;
  const remainder = targets.slice(2);
  return <aside key={beat.key} className={`race-moment banner-${beat.kind}`} data-testid="skill-banner" data-event-key={beat.key} role="status" aria-atomic="true">
    <div className="moment-heading"><strong>{cue.title}</strong>{!stage && cue.cause && !cue.title.includes(cue.cause) && <small>{cue.cause}</small>}</div>
    <div className="moment-participants">
      {cue.art ? <span className="moment-origin" role="img" aria-label={beat.actor?.name ?? cue.art.label}><EventArt {...cue.art} size={36} /><small>{beat.actor?.name ?? cue.art.label}</small></span>
        : beat.actor ? <span className="moment-origin"><Avatar id={beat.actor.characterId} /><small>{beat.actor.name}</small></span>
        : source ? chip(source) : <span className="moment-origin"><Icon kind={cue.icon} size={32} /><small>赛场</small></span>}
      {(targets.length > 0 || selfAmount) && <><Icon kind="arrow" size={16} /><div className="moment-targets">
        {selfAmount ? <b className="moment-number moment-self-result">{selfAmount}<small>格</small></b> : targets.slice(0, 2).map(racer => chip(racer, true))}
        {remainder.length > 0 && <span className="moment-more" title={remainder.map(description).join('；')} aria-label={`另${remainder.length}人：${remainder.map(description).join('；')}`}>另{remainder.length}人</span>}
      </div></>}
    </div>
  </aside>;
}
