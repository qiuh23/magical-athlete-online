import { CHARACTERS } from '../shared/characters.js';
import type { AbilityRevealData } from './ability-reveal.js';
import { Avatar } from './avatars.js';
import './ability-reveal.css';
import { Icon } from './Icons.js';

export function AbilityReveal({ reveal, onDetail }: {reveal:AbilityRevealData;onDetail:(id:string,racerId?:string)=>void}) {
  return <aside className="ability-reveal-card" role="status" aria-label="新能力提示" data-testid="ability-reveal" data-event-id={reveal.eventId}>
    <div className="ability-reveal-heading"><h2>{reveal.title}</h2><small>{reveal.recipient}</small></div>
    <div className="ability-reveal-flow">
      {reveal.characterId && <><button type="button" className="ability-reveal-recipient" onClick={()=>onDetail(reveal.characterId!,reveal.racerId)} aria-label={`查看${reveal.recipient}的能力详情`}><Avatar id={reveal.characterId}/></button><Icon kind="arrow" size={16}/></>}
      {reveal.privateDrawCount !== undefined ? <p className="ability-reveal-private">抽到 <strong>{reveal.privateDrawCount}</strong> 张私人手牌</p> : <div className="ability-reveal-powers">{reveal.powers.map(id=><button type="button" key={id} onClick={()=>onDetail(id)} aria-label={`查看${CHARACTERS.find(card=>card.id===id)?.nameZh ?? id}能力`}><Avatar id={id}/><strong>{CHARACTERS.find(card=>card.id===id)?.nameZh ?? id}</strong></button>)}{!reveal.powers.length && <span>未获得新能力</span>}</div>}
    </div>
    <span className="sr-only">{reveal.source}</span><p className="ability-reveal-duration">{reveal.duration}</p>
  </aside>;
}
