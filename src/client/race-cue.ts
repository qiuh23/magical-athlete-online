import { CHARACTERS } from '../shared/characters.js';
import { TWIST_CARDS } from '../shared/twists.js';
import type { RoomView } from '../shared/types.js';
import { eventVisual } from './EventArt.js';
import type { IconKind } from './Icons.js';
import type { PresentationBeat } from './presentation.js';
import { trackMovementDistance } from './scene/math.js';

const aliases: Record<string, string> = { rocket: 'rocket-scientist', duel: 'duelist', pay: 'sisyphus', reroll: 'dicemonger', fish: 'suckerfish', past: 'twin', guess: 'genius', secret: 'genius', 'scooch-target': 'scoocher' };
const names = new Map(CHARACTERS.map(card => [card.id, card.nameZh]));
const abilityCaptions: Record<string, string> = {
  alchemist: '炼金加速', 'baba-yaga': '同格绊倒', banana: '香蕉绊倒', blimp: '弯道变速', centaur: '后蹄踢击', cheerleader: '全场助威', coach: '同格鼓劲', copycat: '复制领跑能力', dicemonger: '骰子交易', duelist: '同格决斗', egg: '破壳模仿', 'flip-flop': '位置互换', genius: '骰面预测', gunk: '黏液减速', hare: '野兔冲刺', heckler: '起哄追赶', 'huge-baby': '挤到身后', hypnotist: '催眠召唤', inchworm: '代替前进', lackey: '六点抢跑', leaptoad: '跳过占格', legs: '大步前进', 'lovable-loser': '末位得分', magician: '骰子重掷', mastermind: '冠军预言', mouth: '大嘴吞噬', 'party-animal': '派对聚拢', 'rocket-scientist': '火箭加速', romantic: '相遇心动', scoocher: '跟着蹭蹭', sisyphus: '起点轮回', skipper: '抢先行动', stickler: '精确冲线', suckerfish: '贴身随行', 'third-wheel': '双人插队', twin: '冠军传承',
};
Object.assign(abilityCaptions, {
  'bite-mark':'咬痕变身', blunderdog:'逆境助跑', cheatah:'秘密点数揭晓', critic:'评议重掷', diva:'歌剧女伶换位', doppelgangster:'替身并列冲线', gloth:'葛洛斯效应', 'hog-knight':'野猪坐骑转移', hopfrog:'弹跳越格', hotel:'旅馆招待', icarus:'高飞与坠落', kingtripper:'绊倒国王', kraken:'海怪聚拢', 'le-saboteur':'破坏行动', 'magical-athlete':'魔法运动员', mole:'钻地前进', 'mr-dice-guy':'六骰选点', mush:'获得额外能力', nemesis:'宿敌跟掷', 'nepo-baby':'关系助跑', null:'前方能力禁用', overtaker:'超车追赶', 'party-pooper':'强制重掷六点', penguin:'绊倒状态加倍', 're-runner':'追加参赛', 'show-off':'继续投掷', soulmate:'灵魂伴侣同行', 'speed-demon':'速度恶魔', spoilsport:'取消本场比赛', stepdad:'固定左邻助跑', streaker:'裸奔冲刺', stunner:'惊艳改骰', switcharoo:'交换控制权', tail:'尾巴跟进', 'the-hose':'回合结束喷水绊倒', understudy:'替补复制能力',
});

export interface CueArt { id: string; family: 'event' | 'twist'; label: string }

/** Presentation metadata only. Never infer a trigger from the current turn's
 * player: a public marker may act during another athlete's turn. */
export function cueArt(beat: PresentationBeat, room: RoomView): CueArt | undefined {
  const cause = beat.cause ?? '';
  const twist = cause.startsWith('twist-') ? cause.slice(6) : beat.events.some(event => event.type === 'twist') ? cause : '';
  if (eventVisual(twist, 'twist')) return { id: twist, family: 'twist', label: TWIST_CARDS.find(card => card.id === twist)!.name };
  if (!cause.startsWith('thirds')) return;
  const raw = cause.slice(7);
  // Engine work items such as thirds-guess/thirds-duel belong to the active
  // special event; its public identity is more precise than the work-item name.
  const id = eventVisual(raw) ? raw : room.trackState?.event?.id ?? aliases[raw];
  return id && eventVisual(id) ? { id, family: 'event', label: names.get(id) ?? eventVisual(id)!.label } : undefined;
}

export function raceCue(beat: PresentationBeat, room: RoomView) {
  const art = cueArt(beat, room);
  const event = beat.events[0];
  const cause = art?.label ?? (beat.cause === 'track-arrow' ? '箭头格' : abilityCaptions[beat.cause ?? ''] ?? names.get(beat.cause ?? ''));
  const distances = beat.motions.map(motion => trackMovementDistance(room.track, motion.path, room.trackState?.reversed));
  const distance = distances[0] ?? 0;
  const motion = new Set(distances).size > 1 ? '同时移动' : `${beat.motions.length > 1 ? '同时' : ''}${distance < 0 ? '后退' : '前进'}${Math.abs(distance)}格`;
  const amount = event?.text.match(/([+＋-]\d+)分(?=（[^（）]*）$|$)/)?.[1];
  const rank = event?.text.match(/获得第(\d+)名，[+＋-]\d+分$/)?.[1];
  const marker = event?.type === 'event-marker' || event?.type === 'twist-monster';
  const icon: IconKind = beat.cause?.endsWith('flip-flop') ? 'swap' : marker ? 'move' : beat.kind === 'finish' ? 'flag' : ['move', 'warp', 'swap', 'trip', 'recover', 'score', 'eliminate', 'dice'].includes(beat.kind) ? beat.kind as IconKind : 'skill';
  const title = beat.kind === 'move' ? `${cause && beat.cause !== 'main' ? `${cause} → ` : ''}${motion}`
    : beat.kind === 'warp' ? beat.cause?.endsWith('flip-flop') ? '交换位置' : '传送' : beat.kind === 'swap' ? '交换位置'
    : beat.kind === 'trip' ? '绊倒' : beat.kind === 'recover' ? event?.text.includes('代替主移动') || event?.text.includes('跳过主移动') ? '起身 · 跳过主移动' : '立即起身'
    : beat.kind === 'score' ? amount ? `${amount}分` : '积分变化'
    : beat.kind === 'finish' ? `${rank ? `第${rank}名` : '冲线'}${amount ? ` · ${amount}分` : ''}`
    : beat.kind === 'eliminate' ? '淘汰'
    : event?.type === 'cycle-draw' ? '强制循环 · 本场和局'
    : event?.type === 'loop' ? '连锁重复 · 停止重复分支'
    : event?.type === 'skip' ? beat.cause === 'show-off' ? '追加失败 · 主移动取消' : '跳过本次行动'
    : marker ? `标记 ${event?.after?.[0] ?? '移动'}${event?.after?.[0] !== undefined ? '格' : ''}`
    : event?.type === 'cancel-race' ? '本场比赛取消'
    : event?.type === 'cancel' ? '效果取消'
    : event?.type === 'reroll' ? '重新掷骰'
    : event?.type === 'prediction' ? '冠军预测'
    : event?.type === 'transform' ? '变身' : event?.type === 'mount' ? '搭乘' : event?.type === 'control' ? '操控变更'
    : event?.rollId !== undefined ? '骰点判定'
    : art ? eventVisual(art.id, art.family)?.label ?? art.label : abilityCaptions[beat.cause ?? ''] ?? cause ?? '技能发动';
  return { art, cause, icon, title, amounts: new Map(beat.motions.map((motion, index) => [motion.racerId, beat.kind === 'warp' || beat.kind === 'swap' ? `${motion.from}→${motion.to}` : `${distances[index]! >= 0 ? '+' : ''}${distances[index]}`])) };
}
