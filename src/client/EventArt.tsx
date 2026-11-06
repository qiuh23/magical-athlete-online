import type { ReactNode } from 'react';
import type { ThirdEventId } from '../shared/special-events.js';
import type { TwistCardId } from '../shared/twists.js';

// Original, code-native mini illustrations. Shape and composition identify each
// event independently of the shared palette; labels always accompany HUD art.
const gold = '#efbb50', coral = '#ed8064', lilac = '#b59bd1', mint = '#9fc9ad';
const Die = ({ x = 22, y = 22, size = 22 }: { x?: number; y?: number; size?: number }) => <g transform={`translate(${x} ${y}) scale(${size / 22})`}><rect width="22" height="22" rx="5" fill="#fffaf0" /><circle cx="6" cy="6" r="1.3" fill="currentColor" /><circle cx="16" cy="16" r="1.3" fill="currentColor" /><circle cx="11" cy="11" r="1.3" fill="currentColor" /></g>;
const Card = ({ x = 14, y = 12, fill = gold }: { x?: number; y?: number; fill?: string }) => <g transform={`translate(${x} ${y})`}><rect width="23" height="31" rx="4" fill={fill} /><path d="m5 15 6-8 6 8-6 8Z" fill="#fffaf0" /></g>;
interface Visual { label: string; art: ReactNode }

export const SPECIAL_EVENT_VISUALS = {
  alchemist: { label: '重新发牌', art: <><Card x={34} y={19} fill={lilac} /><path d="M17 8h14m-11 0v15L8 44q-4 9 7 10h25q8-2 4-9L28 23V8" fill={mint} /><path d="M14 37h23M20 43l5 4m7-9 4 4" /><circle cx="39" cy="11" r="3" fill={gold} /></> },
  'baba-yaga': { label: '女巫追逐', art: <><path d="m9 48 33-33M35 10l8 9 10-1-8-14-10 6Z" fill={lilac} /><path d="m9 36 16 15-18 4-3-6Z" fill={gold} /><path d="m7 45 9 8m-4-13 9 10" /><path d="M53 35a10 10 0 1 0 0 19 10 10 0 0 1 0-19Z" fill={coral} /></> },
  banana: { label: '蹦床连跳', art: <><ellipse cx="30" cy="42" rx="24" ry="7" fill={mint} /><path d="m11 45-3 11m43-11 3 11M17 19l8-10 8 10m-8-9v22" /><path d="M39 8q17 14-3 23 11-14 3-23Z" fill={gold} /><path d="m30 40 5-4 6 5" /></> },
  mouth: { label: '巨口淘汰', art: <><path d="M55 15a25 25 0 1 0 0 34L32 32Z" fill={coral} /><path d="m17 12 4 10 6-13m-15 34 10-2-3 11" fill="#fffaf0" /><circle cx="32" cy="16" r="2" fill="currentColor" /><path d="m48 24 7 8-7 8" /></> },
  skipper: { label: '行动反转', art: <><path d="M10 24A22 22 0 0 1 49 15l6 9H40m15 16A22 22 0 0 1 15 49l-6-9h15" fill="none" /><path d="m23 25 8-12 8 12ZM21 29h22l-7 13H27Z" fill={gold} /><path d="M31 13v16" /></> },
  centaur: { label: '额外能力', art: <><path d="M13 40h22l7 12m-24-12-6 13m7-27-6 14m17-20 7 7 14-9" /><circle cx="26" cy="15" r="6" fill={coral} /><path d="m20 23 10 1 5 16H15Z" fill={mint} /><Card x={41} y={28} fill={gold} /></> },
  inchworm: { label: '15格出发', art: <><path d="M8 38q2-15 10-1 4-26 13-2 5-13 13 0h9v8H8Z" fill={mint} /><circle cx="48" cy="31" r="6" fill={gold} /><circle cx="50" cy="29" r="1" /><path d="M8 51h48m-43-3v6m10-6v6m10-6v6m10-6v6m10-6v6" /><text x="20" y="19" stroke="none" fill="currentColor" fontSize="16" fontWeight="900">15</text></> },
  'third-wheel': { label: '向左传牌', art: <><Card x={7} y={19} fill={gold} /><Card x={34} y={19} fill={lilac} /><path d="M15 12h35m-28-6-7 6 7 6M49 56H14m28-6 7 6-7 6" /></> },
  coach: { label: '同格加速', art: <><path d="M12 12q2 17 19 19l5-10" /><path d="M27 27h24v16q-22 17-26-3Z" fill={gold} /><circle cx="39" cy="35" r="5" fill="#fffaf0" /><path d="m48 13 5-7m-8 8V5m9 15 7-2M11 47h11m-6-5v10" /></> },
  blimp: { label: '飞艇同行', art: <><ellipse cx="32" cy="25" rx="27" ry="14" fill={mint} /><path d="M10 21q20-14 43 0M17 31q18 9 34-1m-24 9-3 9h16l-3-9M5 20l-3-7h8M5 29l-3 7h9" /><path d="M13 53h38m-7-5 7 5-7 5" /></> },
  'rocket-scientist': { label: '双骰冲刺', art: <><path d="M33 7Q53 9 53 27L30 46 17 33Z" fill={coral} /><circle cx="40" cy="21" r="6" fill="#fffaf0" /><path d="m21 25-12 3-5 12 14-5m19 6-1 14 12-5 2-12M18 40l-8 13 13-7" fill={gold} /><Die x={4} y={4} size={16} /></> },
  duelist: { label: '同格决斗', art: <><path d="m10 8 8 1 35 40-5 6L13 16Zm44 0-8 1L11 49l5 6 35-39Z" fill={lilac} /><path d="m5 43 16 14m38-14L43 57" /><Die x={22} y={22} size={20} /></> },
  'lovable-loser': { label: '末位领奖', art: <><path d="M8 42h17v14H8Zm17-10h16v24H25Zm16 15h16v9H41Z" fill={mint} /><path d="M23 8h20v10q-10 17-20 0Zm0 3h-7q-3 10 11 12m16-12h7q3 10-11 12m-6 3v6" fill={gold} /><path d="m10 32 6-7 6 7" /></> },
  genius: { label: '秘密猜数', art: <><path d="M32 13q-12-12-18 3-14 5-6 18-6 15 9 17 9 11 15 0 8 11 16 0 15-2 10-17 7-14-6-18-6-15-20-3Z" fill={lilac} /><path d="M32 13v38m-16-31q11-1 7 12m-5 12 8-4m20-18q-12 0-6 12m8 9-9-3" /><text x="26" y="42" fill="currentColor" stroke="#fffaf0" strokeWidth=".7" fontSize="26" fontWeight="900">?</text></> },
  'huge-baby': { label: '巨婴击退', art: <><ellipse cx="33" cy="26" rx="21" ry="18" fill={gold} /><path d="M28 10q13-10 11 3M22 25h1m20 0h1" /><ellipse cx="33" cy="35" rx="10" ry="6" fill={mint} /><circle cx="33" cy="40" r="6" fill="none" /><path d="M8 48h15m-9-6-6 6 6 6m29-6h14m-6-6 6 6-6 6" /></> },
  'party-animal': { label: '派对得分', art: <><path d="m12 53 6-32 25 24Z" fill={coral} /><path d="m19 23 21 22M10 12l6 3m28-4-3 7M50 30l8 1M30 5v6M26 24q-3-12 7-10m5 21q-1-13 11-13" /><circle cx="49" cy="48" r="10" fill={gold} /><path d="M45 48h8m-4-4v8" /></> },
  leaptoad: { label: '再来一回合', art: <><circle cx="21" cy="20" r="7" fill={mint} /><circle cx="42" cy="20" r="7" fill={mint} /><ellipse cx="32" cy="32" rx="19" ry="16" fill={mint} /><path d="M20 20h1m20 0h1M24 33q8 8 16 0M17 41 7 52h17m23-11 10 11H40M24 10l8-7 8 7" /><path d="M32 4v14" /></> },
  legs: { label: '计时冲线', art: <><path d="m28 9-8 23 13 8-7 16H14m24-45-4 15 15 9 3 16h9" strokeWidth="6" /><circle cx="13" cy="17" r="10" fill={gold} /><path d="M13 11v6l5 3m30-9 9-5m-5 12 9 1" /></> },
  heckler: { label: '全员猜骰', art: <><path d="M8 25h13l24-14v38L21 37H8Zm11 12 5 16h10l-5-12" fill={coral} /><path d="M51 23l9-4m-9 12h11m-11 8 9 4" /><Die x={3} y={2} size={18} /></> },
  hypnotist: { label: '集结传送', art: <><circle cx="32" cy="29" r="21" fill={lilac} /><path d="M43 23q-10-15-24 0-8 16 10 21 16 2 17-12 0-13-12-12-12 2-8 12 4 7 10 2" /><path d="m6 9 8 7m-8 1 8-1-1-8m43 43-8-7m8-1-8 1 1 8" /></> },
  copycat: { label: '换用能力', art: <><Card x={8} y={9} fill={lilac} /><Card x={29} y={23} fill={gold} /><path d="m36 9 8-4 10 8m-5-7 5 7-8 2" /><path d="m8 48 9 9 9-3m-12-3 3 6-8 2" /></> },
  twin: { label: '往届能力', art: <><circle cx="19" cy="19" r="8" fill={gold} /><circle cx="46" cy="19" r="8" fill={lilac} /><path d="M7 51V39q12-15 24 0v12Zm27 0V39q12-15 24 0v12Z" fill={mint} /><path d="M26 8h12m-6-5-6 5 6 5M38 56H26m6-5 6 5-6 5" /></> },
  lackey: { label: '猜奇偶随行', art: <><ellipse cx="17" cy="21" rx="7" ry="13" transform="rotate(-25 17 21)" fill={gold} /><ellipse cx="37" cy="40" rx="7" ry="13" transform="rotate(-25 37 40)" fill={mint} /><path d="M31 9h22v17m-6-6 6 6 6-6" /><text x="5" y="57" fill="currentColor" stroke="none" fontSize="12" fontWeight="900">1/2</text></> },
  hare: { label: '首尾变速', art: <><ellipse cx="24" cy="14" rx="5" ry="12" fill={mint} /><ellipse cx="38" cy="14" rx="5" ry="12" fill={mint} /><ellipse cx="31" cy="36" rx="22" ry="17" fill={mint} /><path d="M22 33h1m16 0h1m-12 9 4 3 4-3" /><path d="M4 58h16m-8-8v16m32-8h16" /></> },
  magician: { label: '切换荒野', art: <><path d="M9 25h46l-5 30H14Z" fill={lilac} /><ellipse cx="32" cy="25" rx="27" ry="6" fill={gold} /><path d="m23 24 3-20 6 12 5-12 4 20" fill={mint} /><path d="m47 7 9 10m0-10-9 10M18 39h28" /></> },
  dicemonger: { label: '重掷送步', art: <><Die x={19} y={20} size={27} /><path d="M9 27A24 24 0 0 1 50 13l6 8H43m11 15A24 24 0 0 1 13 51l-5-8h13" /><path d="M7 7h9m-5-4v9" /></> },
  egg: { label: '触蛋回起点', art: <><path d="M32 6C24 6 13 25 13 38c0 22 38 22 38 0C51 25 40 6 32 6Z" fill={gold} /><path d="m17 29 9 6 8-10 13 7M7 18H2V8m0 10 10-9m32 47h15m-6-5 6 5-6 5" /></> },
  suckerfish: { label: '同格搭便车', art: <><path d="M7 19q15-19 30 0-15 19-30 0L2 9v20Zm24 25q13-17 28 0-15 17-28 0l-6-9v18Z" fill={mint} /><circle cx="28" cy="17" r="1.5" fill="currentColor" /><circle cx="51" cy="42" r="1.5" fill="currentColor" /><path d="M19 30q-4 12 10 13M42 12h16m-6-5 6 5-6 5" /></> },
  cheerleader: { label: '末位接棒', art: <><circle cx="32" cy="15" r="6" fill={gold} /><path d="m22 30 10-8 10 8-5 12H26Zm4 12-6 14m17-14 6 14M21 30 8 19m35 11 13-11" fill={coral} /><path d="m4 10 14 13m-15-8 17 3M10 5l1 19m36-14 13 12m-16-5 18-1M54 5l-1 20" stroke={gold} strokeWidth="4" /></> },
  romantic: { label: '交换角色', art: <><path d="M32 28 16 15C2 0-6 28 32 48 70 28 62 0 48 15Z" fill={coral} /><path d="M10 53h40m-8-6 8 6-8 6M54 8H20m8-6-8 6 8 6" /><path d="M27 23h10v15H27Z" fill="#fffaf0" /></> },
  scoocher: { label: '一起绊倒', art: <><rect x="10" y="17" width="13" height="37" rx="3" fill={lilac} /><path d="m30 25 12-5 17 34-12 5Z" fill={coral} /><path d="M13 35h7m-4-12v4m21 7 3 6m5 10 3 6M26 11l10 5m-4-8 4 8-9 1" /></> },
  sisyphus: { label: '付分重掷', art: <><path d="m4 57 35-28 22 28Z" fill={mint} /><circle cx="39" cy="21" r="16" fill={lilac} /><path d="m32 14 12 5-7 8M15 35l8-6m-8 0v6h7" /><circle cx="15" cy="13" r="9" fill={gold} /><path d="M12 13h6" /></> },
  gunk: { label: '后退重掷', art: <><path d="M7 44q2-19 12-13 11-30 23-4 18-5 15 21-24 12-50-4Z" fill={mint} /><circle cx="25" cy="32" r="2" /><circle cx="41" cy="32" r="2" /><path d="M23 44q10 6 19-1M4 16h13m-6-6-7 6 7 6" /><Die x={40} y={3} size={18} /></> },
  stickler: { label: '常规赛', art: <><rect x="13" y="10" width="38" height="47" rx="5" fill={mint} /><path d="M24 6h16v10H24Z" fill={gold} /><path d="m21 34 8 8 16-19m-22 28h20" /></> },
  'flip-flop': { label: '交换位置', art: <><circle cx="13" cy="18" r="9" fill={gold} /><circle cx="51" cy="46" r="9" fill={lilac} /><path d="M25 17h32m-7-6 7 6-7 6M38 46H6m7-6-7 6 7 6M13 29v5m38-5v5" /></> },
  mastermind: { label: '猜骰得分', art: <><path d="M7 14q25-11 50 0v18L42 44 32 35 22 44 7 32Z" fill={lilac} /><path d="m15 24 10 3m14 0 10-3M32 13v12" /><Die x={23} y={42} size={17} /><circle cx="52" cy="51" r="9" fill={gold} /><path d="M48 51h8m-4-4v8" /></> },
} satisfies Record<ThirdEventId, Visual>;

export const TWIST_VISUALS = {
  'alchemy-lab': { label: '巨口泄漏', art: <><path d="m6 13 12-6 19 32q8 18-9 17Z" fill={mint} /><path d="m15 30 12-6" /><path d="M57 20a17 17 0 1 0 0 30L42 35Z" fill={coral} /><path d="m39 20 2 8 7-8" fill="#fffaf0" /></> },
  bonkbug: { label: '终点虫灾', art: <><path d="M11 54V8h37v16H11m6-16v16m9-16v16m10-16v16" /><ellipse cx="41" cy="42" rx="12" ry="15" fill={coral} /><path d="M41 28v29m-13-20-8-4m8 12-8 1m9 6-6 6m31-21 7-4m-7 12 7 1m-8 6 6 6M36 28l-3-8m13 8 3-8" /></> },
  conveyor: { label: '主移动+3', art: <><rect x="5" y="34" width="54" height="20" rx="10" fill={mint} /><circle cx="16" cy="44" r="5" /><circle cx="32" cy="44" r="5" /><circle cx="48" cy="44" r="5" /><path d="M8 22h48m-9-8 9 8-9 8" /><text x="19" y="13" stroke="none" fill="currentColor" fontSize="16" fontWeight="900">+3</text></> },
  'curse-wands': { label: '跳位行动', art: <><path d="m9 53 34-34m-2 34L15 19" strokeWidth="5" /><path d="m43 5 3 9 10 1-8 6 2 10-8-6-9 5 3-10-7-7 11 1Z" fill={lilac} /><circle cx="13" cy="13" r="9" fill={gold} /><path d="m10 13 3 3 4-6M7 61h47" /></> },
  fans: { label: '再抽两张', art: <><Card x={7} y={8} fill={gold} /><Card x={34} y={8} fill={lilac} /><circle cx="15" cy="47" r="5" fill={coral} /><circle cx="33" cy="47" r="5" fill={coral} /><circle cx="51" cy="47" r="5" fill={coral} /><path d="m5 61 4-9h12l5 9m1 0 2-9h10l4 9m1 0 2-9h10l4 9" /></> },
  'mirror-world': { label: '起终点反转', art: <><path d="M22 5h28v46H22Z" fill={lilac} /><path d="m27 12 16-4m-16 14 16-6M18 58h36m-18-7v7M5 33h43m-8-7 8 7-8 7m-27 5-8-7 8-7" /><path d="M32 7v43" strokeDasharray="3 4" /></> },
  'scrying-pool': { label: '前后6步起淘汰', art: <><ellipse cx="32" cy="38" rx="27" ry="17" fill={lilac} /><path d="M10 37q22-20 44 0-22 20-44 0Z" fill={mint} /><circle cx="32" cy="37" r="8" fill={gold} /><path d="m9 57 47-44" /><text x="23" y="20" fill="currentColor" stroke="none" fontSize="20" fontWeight="900">6</text></> },
  pinata: { label: '落点拾分', art: <><path d="m13 20 8-10 10 6 13-8 6 12-6 10 3 18H34l-3-12-7 1-4 12H9l5-20-8-1Z" fill={coral} /><path d="M14 24h30m-26 7h24M31 2v13" /><circle cx="52" cy="49" r="9" fill={gold} /><path d="M48 49h8m-4-4v8m-25 8 3-4m11 5 2-5" /></> },
  'randomness-ceased': { label: '骰点锁定', art: <><Die x={6} y={7} size={33} /><rect x="27" y="31" width="30" height="25" rx="5" fill={gold} /><path d="M33 31v-8q9-13 18 0v8m-9 10v7" /></> },
  'roast-chicken': { label: '末位前进7', art: <><path d="M15 40C-1 18 22 3 38 17s2 32-16 26Z" fill={coral} /><path d="m30 35 14 12q13-4 12 4 4 12-8 7-7 3-8-4L24 42" fill="#fffaf0" /><path d="M38 8h22m-7-6 7 6-7 6" /><text x="7" y="60" fill="currentColor" stroke="none" fontSize="16" fontWeight="900">+7</text></> },
  'season-finale': { label: '两人决赛', art: <><path d="M23 5h20v15q-10 17-20 0Zm0 4h-8v9q1 9 11 9m17-18h8v9q-1 9-11 9M33 31v10m-7 0h14M6 55l14-12m-5 0h5v6m38 6L45 43m5 0h-5v6" fill={gold} /><circle cx="8" cy="39" r="5" fill={mint} /><circle cx="56" cy="39" r="5" fill={lilac} /></> },
  'swap-meet': { label: '秘密换角', art: <><Card x={6} y={14} fill={gold} /><Card x={35} y={14} fill={lilac} /><path d="M15 7h38m-7-5 7 5-7 5M49 57H11m7-5-7 5 7 5" /><path d="M15 29h5m24 0h5" /></> },
  'time-imp': { label: '下场返场', art: <><path d="m14 16-4-12 16 9h13L54 4l-4 14q12 28-18 37Q2 44 14 16Z" fill={lilac} /><path d="m21 24 6 3m12 0 6-3" /><circle cx="34" cy="42" r="14" fill={gold} /><path d="M34 33v9l7 3" /></> },
} satisfies Record<TwistCardId, Visual>;

export function eventVisual(id: string, family: 'event' | 'twist' = 'event'): Visual | undefined {
  return family === 'event' ? SPECIAL_EVENT_VISUALS[id as ThirdEventId] : TWIST_VISUALS[id as TwistCardId];
}
export function EventArt({ id, family = 'event', size = 48 }: { id: string; family?: 'event' | 'twist'; size?: number }) {
  const visual = eventVisual(id, family);
  if (!visual) return null;
  return <svg className="event-art" data-event-art={`${family}:${id}`} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{visual.art}</svg>;
}
