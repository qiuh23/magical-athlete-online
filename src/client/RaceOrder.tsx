import type { CSSProperties } from 'react';
import type { Racer, RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { Avatar } from './avatars.js';
import { currentController } from './character-context.js';
import { Icon } from './Icons.js';

/** Positions and finish states follow playback; ownership and totals use the
 * same confirmed public players as the trophy scoreboard. */
export function RaceOrder({ room, racers, order, activeId, onDetail }: {
  room: RoomView; racers: Racer[]; order?: string[]; activeId?: string;
  onDetail: (id: string, racerId?: string) => void;
}) {
  const ordered = (order ?? racers.map(racer => racer.id)).flatMap(id => {
    const racer = racers.find(value => value.id === id);
    return racer ? [racer] : [];
  });
  return <div className="floating-racers" aria-label="本场基础行动顺序与玩家累计积分">{ordered.map((racer, index) => {
    const owner = currentController(room, racer);
    if (!owner) return null;
    const name = CHARACTERS.find(card => card.id === racer.characterId)?.nameZh ?? racer.characterId;
    const status = racer.eliminated ? '出局' : racer.finished ? racer.rank ? `第${racer.rank}名` : '已完赛' : racer.tripped ? '绊倒' : undefined;
    return <button type="button" className={`floating-racer ${activeId === racer.id ? 'is-active' : ''} ${owner.id === room.selfId ? 'is-self' : ''}`} key={racer.id} data-racer-id={racer.id} style={{ '--racer-color': owner.color } as CSSProperties}
      aria-label={`${name}，基础顺序${index + 1}，${owner.seat + 1}号${owner.id === room.selfId ? '你' : owner.name}，累计${owner.score}分${status ? `，${status}` : ''}，查看技能`}
      title={name} onClick={() => onDetail(racer.characterId, racer.id)}>
      <span className="floating-avatar"><Avatar id={racer.characterId} /><b className="racer-seat" aria-hidden="true">{owner.seat + 1}</b>{owner.id === room.selfId && <i>你</i>}{status && <span className="racer-state" title={status} aria-label={status}>{racer.eliminated ? '出局' : racer.finished ? racer.rank ? `${racer.rank}名` : <Icon kind="flag" size={16} /> : <Icon kind="trip" size={16} />}</span>}</span>
      <span className="floating-racer-score"><span>{owner.score}<small>分</small></span></span>
    </button>;
  })}</div>;
}
