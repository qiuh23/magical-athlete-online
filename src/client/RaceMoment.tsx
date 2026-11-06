import type { Racer, RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { Avatar } from './avatars.js';
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
  const affected = racers.filter(racer => (beat.targets.length ? beat.targets : [beat.source]).includes(racer.id));
  const chip = (racer: Racer) => {
    const owner = room.players.find(player => player.id === racer.playerId);
    return <span className="moment-racer" key={racer.id} aria-label={`${owner ? `${owner.seat + 1}号 · ` : ''}${name(racer.characterId)}${cue.amounts.has(racer.id) ? `，${cue.amounts.get(racer.id)}格` : ''}`}>
      <Avatar id={racer.characterId} /><small>{owner ? `${owner.seat + 1}号` : name(racer.characterId)}</small>{cue.amounts.has(racer.id) && <b>{cue.amounts.get(racer.id)}</b>}
    </span>;
  };
  return <aside key={beat.key} className={`scene-action-banner race-moment banner-${beat.kind}`} data-testid="skill-banner" data-event-key={beat.key} role="status" aria-atomic="true">
    {cue.art ? <span className="moment-illustration" role="img" aria-label={beat.actor?.name ?? cue.art.label}><EventArt {...cue.art} size={54} /></span> : beat.actor ? <span className="skill-banner-avatar" aria-label={beat.actor.name}><Avatar id={beat.actor.characterId} /></span> : source ? <button type="button" className="skill-banner-avatar board-avatar-button" onClick={() => onDetail(source.characterId, source.id)} aria-label={`查看${name(source.characterId)}技能与当前玩家`}><Avatar id={source.characterId} /></button> : <span className="moment-illustration"><Icon kind={cue.icon} size={34} /></span>}
    <div className="moment-content"><small>{beat.actor ? `${beat.actor.name} · 赛场效果` : cue.cause ? `${cue.cause} · ${beat.kind === 'move' ? '技能效果' : '赛场效果'}` : source ? `${name(source.characterId)} · ${room.players.find(player => player.id === source.playerId)?.seat !== undefined ? `${room.players.find(player => player.id === source.playerId)!.seat + 1}号` : '技能效果'}` : '赛场效果'}</small>
      <strong><Icon kind={cue.icon} size={20} />{cue.title}</strong>
      {(source || affected.length > 0) && <div className="moment-participants">{source && !affected.some(racer => racer.id === source.id) && <>{chip(source)}<Icon kind="arrow" size={16} /></>}{affected.slice(0, 3).map(chip)}{affected.length > 3 && <span className="moment-more">+{affected.length - 3}人</span>}</div>}
    </div>
  </aside>;
}
