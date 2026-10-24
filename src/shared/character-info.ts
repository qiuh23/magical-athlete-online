import { CHARACTERS } from './characters.js';
import type { GameEvent, Racer, RacerFlags } from './types.js';

const knownCard = (id: unknown): id is string => typeof id === 'string' && CHARACTERS.some(card => card.id === id);

/** Project decisions stay separate from the quoted/translated card ability. */
export const COPY_ABILITY_PROJECT_NOTES:Readonly<Record<string,string>>={
  copycat:'只模仿领跑选手角色卡上原本写明的能力，不继承对方复制或额外获得的能力；不补用赛前效果。已经开始的动作及其效果仍会完成。',
  egg:'从未选角色牌堆抽取至多三张；不足时回收公共弃牌，仍不足就只提供现有牌。选择后，这些牌放回弃牌堆，所选能力的来源仍公开可查。',
  twin:'继承所选冠军冲线时的主要能力，不包含额外或临时获得的能力，也不继承积分、筹码等资源。同一角色多次夺冠时，选择具体场次。',
  understudy:'获得目标角色卡上原本写明的能力，并可在赛前继续执行该能力的赛前效果。同一选手已经执行过的同一种赛前效果不重复执行。',
  mush:'抽到的能力额外保留至本场结束；重复抽到同一种能力不会叠加。不补用已经错过的发动时机；即使临时借来的同种能力到期，抽牌获得的这一份仍保留。',
  doppelgangster:'获得首位冲线者被淘汰前正在生效的能力。若有多个选手同时获得这些能力，获得的内容相同；不继承目标已使用的次数、资源或私人手牌。',
  'leaf-zombie':'复制此前未获冠军或亚军的选手角色卡上原本写明的能力，不继承其当时复制、额外获得或临时借来的能力。',
  'leaf-thespian':'同一选手每回合最多各使用一次戏剧演员或电影制作人的借牌能力。抽到另一种借牌能力时，可以在本次主骰前继续使用，但不补发赛前手牌。通过连续借牌获得的临时能力，都在自己的下个回合开始时失效；同种能力不叠加，也不重置已用次数。',
  'leaf-filmmaker':'比赛中途获得此能力，不补发七张赛前手牌。每回合最多各使用一次戏剧演员或电影制作人的借牌能力；再次抽到已经用过的借牌能力时，不重复选牌。通过连续借牌获得的临时能力，都在自己的下个回合开始时失效。',
  'extra-mile-shuffler':'只重新分配本场选手角色卡上原本写明的主要能力。各选手的控制者、位置、额外或临时能力，以及已有标记和资源均保持不变。加里没有独立角色卡，不参与洗牌。',
};

/** Only already revealed choices belong in public racer information. Older saves
 * recorded the choice in a public copy event instead of a dedicated flag. Match
 * its exact original text; a current inherited power cannot prove the drawn card.
 */
export function publicCopyCardIds(racer: Racer, logs: readonly GameEvent[]): Pick<RacerFlags, 'eggCardId' | 'twinCardId'> {
  const result: Pick<RacerFlags, 'eggCardId' | 'twinCardId'> = {};
  for (const kind of ['egg', 'twin'] as const) {
    const field = kind === 'egg' ? 'eggCardId' : 'twinCardId';
    const stored = racer.flags[field];
    if (knownCard(stored)) { result[field] = stored; continue; }
    const event = logs.find(entry => entry.type === 'copy' && entry.source === racer.id && entry.cause === kind);
    if (!event) continue;
    if (knownCard(event.selectedCardId)) { result[field] = event.selectedCardId; continue; }
    const printedName = CHARACTERS.find(card => card.id === racer.characterId)?.nameZh ?? racer.characterId;
    const selected = CHARACTERS.find(card => event.text === `${printedName}本场复制${card.nameZh}`);
    if (selected) result[field] = selected.id;
  }
  return result;
}
