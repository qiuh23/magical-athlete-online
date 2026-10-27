import type { ThirdEventId } from './special-events.js';
import { TWIST_CARDS, type TwistCardId } from './twists.js';

/** Web rulings for public events, never restrictions on an athlete's powers. */
const CONFLICTS:Partial<Record<ThirdEventId,{cards:readonly TwistCardId[];reason:string}>>={
  'lovable-loser':{cards:['season-finale'],reason:'保留最后两名领奖的规则'},
  legs:{cards:['season-finale'],reason:'保留计时标记到终点即结算的规则'},
  cheerleader:{cards:['curse-wands'],reason:'保留末位在赛选手接着行动的规则'},
  skipper:{cards:['curse-wands'],reason:'保留事件规定的行动方向'},
  leaptoad:{cards:['curse-wands'],reason:'保留停到有人格时的额外回合'},
  inchworm:{cards:['mirror-world'],reason:'本场起点固定为15格'},
};

export function twistEventConflict(event:ThirdEventId|undefined,card:TwistCardId):string|undefined{
  const conflict=event?CONFLICTS[event]:undefined;
  return conflict?.cards.includes(card)?conflict.reason:undefined;
}

export function eventTwistRestriction(event:ThirdEventId):string{
  const conflict=CONFLICTS[event];if(!conflict)return '';
  const cards=TWIST_CARDS.filter(card=>conflict.cards.includes(card.id)).map(card=>`「${card.name}」`).join('、');
  return `本场不会抽到变化卡${cards}，${conflict.reason}。`;
}
