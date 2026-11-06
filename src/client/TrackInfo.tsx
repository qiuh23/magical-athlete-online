import type { RoomView } from '../shared/types.js';
import { CHARACTERS } from '../shared/characters.js';
import { TWIST_CARDS } from '../shared/twists.js';
import { EVENTS_RULES_VERSION } from '../shared/rules-versions.js';
import type { PresentationBeat } from './presentation.js';
import { EventArt, eventVisual } from './EventArt.js';
import { Icon } from './Icons.js';

export function visibleTwists(room: RoomView, queue: PresentationBeat[] = []) {
  const later = new Set(queue.slice(1).flatMap(beat => beat.events.filter(event => event.type === 'twist').map(event => event.cause)));
  return (room.trackState?.twist?.drawn ?? []).filter(id => !later.has(id));
}

export function TrackInfo({ room, queue, onDetails }: { room: RoomView; queue?: PresentationBeat[]; onDetails: () => void }) {
  const drawn = visibleTwists(room, queue), event = room.trackState?.event;
  if (room.track !== 'bridges' && room.track !== 'whirly-world' && !drawn.length && !event) return null;
  return <aside className="race-track-info race-event-chips" aria-label="本场地图与赛事">
    {(room.track === 'bridges' || room.track === 'whirly-world') && <button type="button" className="race-event-chip" onClick={onDetails} aria-label={`查看${room.track === 'bridges' ? '桥梁' : '漩涡传送'}规则`}><Icon kind={room.track === 'bridges' ? 'overview' : 'warp'} /><span>{room.track === 'bridges' ? '桥上／桥下' : '停下才传送'}</span></button>}
    {event && <button type="button" className="race-event-chip" data-testid="special-event" onClick={onDetails} aria-label={`特殊赛事：${CHARACTERS.find(card => card.id === event.id)?.nameZh ?? event.id}，查看详情`} title={eventVisual(event.id)?.label}><EventArt id={event.id} size={38} /><span>{eventVisual(event.id)?.label ?? '特殊赛事'}{event.npc && <b>标记 {event.npc.position}格</b>}{!!event.trampolines?.length && <b>{event.trampolines.join(' / ')}格</b>}</span></button>}
    {drawn.map(id => <button type="button" key={id} className="race-event-chip" data-twist-card={id} onClick={onDetails} aria-label={`${TWIST_CARDS.find(card => card.id === id)?.name ?? id}，查看详情`}><EventArt id={id} family="twist" size={38} /><span>{eventVisual(id, 'twist')?.label ?? '变化卡'}</span></button>)}
    {drawn.includes('randomness-ceased') && !!room.trackState?.twist?.fixedFaces && <div className="race-fixed-faces" aria-label="本场固定骰点">{room.players.map(player => { const face = room.trackState?.twist?.fixedFaces?.[player.id]; return face === undefined ? null : <span key={player.id}>{player.seat + 1}号 <b>{face}</b></span>; })}</div>}
  </aside>;
}

export function TrackDetails({ room, queue }: { room: RoomView; queue?: PresentationBeat[] }) {
  const drawn = visibleTwists(room, queue), event = room.trackState?.event;
  if (room.track !== 'bridges' && room.track !== 'whirly-world' && !drawn.length && !event) return <p>本场没有额外赛事效果。完整地图与比赛规则可从工具栏的规则入口查看。</p>;
  return <div className="race-track-details" aria-label="本场地图规则">
    {room.track === 'whirly-world' && <details className="track-rule-card" data-testid="whirly-rules">
      <summary>Whirly World · 传送规则</summary>
      <p>停在漩涡格时，传送到配对格；只经过不触发。一次传送不会沿同一连接立即弹回。</p>
      <p>六组连接：3↔5、7↔12、10↔15、18↔22、20↔23、24↔27；其余格子为普通格。</p>
      <p>本图采用共同确认的网页版布局。</p>
    </details>}
    {room.track === 'bridges' && <details className="track-rule-card" data-testid="bridges-rules">
      <summary>Bridges · 桥上桥下怎样走？</summary>
      <p><strong>只按格号顺序走，交叉处不能换层抄近路。</strong>例如3→4，8→9，不能3→8。</p>
      <p>桥上／桥下配对：3／8、10／13、15／18、20／23。每对在空间上重叠，仍是不同进度。</p>
      <p>同格技能一般同时作用两层；领先、落后和距离按格号算。上层越过会经过两层选手，下层越过只经过下层。</p>
      <p>吸盘鱼仅能跟同格号；跳蛙遇任一层占人都跳过。第二弯道为15格。</p>
      <a href="/rules/bridges.md" target="_blank" rel="noreferrer">完整规则与角色例外</a>
    </details>}
    {!!drawn.length && <section className="twist-card-panel" data-testid="twist-cards" aria-label="本场变化卡">
      <h3>变化卡 · {drawn.length} 张</h3>
      <div className="twist-card-list">{drawn.map((id, index) => {
        const card = TWIST_CARDS.find(card => card.id === id)!;
        return <article key={id} data-twist-card={id}>
          <EventArt id={id} family="twist" /><small>{index + 1} · {card.duration}</small><h3>{card.name}</h3><p>{card.effect}</p>
          {id === 'randomness-ceased' && room.trackState?.twist?.fixedFaces && <p className="twist-card-status">{room.players.map(player => `${player.name}：${room.trackState!.twist!.fixedFaces![player.id]}点`).join(' · ')}</p>}
          {id === 'season-finale' && room.rulesVersion === EVENTS_RULES_VERSION && <p className="twist-card-status">若抽到时已经发过名次奖励，则保留奖励，继续原比赛，本卡不再改赛制。</p>}
        </article>;
      })}<a href="/rules/competition.md" target="_blank" rel="noreferrer">地图与网页裁定</a></div>
    </section>}
    {event && <section className="special-event-detail"><EventArt id={event.id} /><h3>特殊赛事 · {CHARACTERS.find(c => c.id === event.id)?.nameZh ?? event.id}</h3><p>{event.description}</p><p>本场生效；需要你选择时会自动提示，其余效果由系统结算。</p>{event.npc && <p>公共标记：第 {event.npc.position} 格</p>}<a href="/rules/special-events.md" target="_blank" rel="noreferrer">网页适配规则</a></section>}
  </div>;
}
