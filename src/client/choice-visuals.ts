import type { ChoiceOption } from '../shared/types.js';

export interface ChoiceVisual { number: string; cost?: string; count?: string; retreat?: string }

/** Only collapse known wording. Unrecognised consequences stay visible rather
 * than being silently removed just because an option has a numeric ID. */
export function choiceVisual(option: ChoiceOption): ChoiceVisual | undefined {
  const label = option.label.trim();
  if (/^\d+$/.test(label)) return { number: label };
  const cell = /^第\s*(\d+)\s*格$/.exec(label);
  if (cell) return { number: cell[1]! };
  const target = /^(?:选择)?第\s*(\d+)\s*(?:位|名)(?:角色|选手)(?:发动技能)?(?:[，,]查看(?:详细)?效果)?$/.exec(label);
  if (target) return { number: target[1]! };
  const repeats = /^(\d+)（(\d+)次）$/.exec(label);
  if (repeats) return { number: repeats[1]!, count: repeats[2]! };
  const paid = /^支付(\d+)分，移动(\d+)格$/.exec(label);
  if (paid) return { number: paid[2]!, cost: paid[1]! };
  const bet = /^下注(\d+)分$/.exec(label);
  if (bet) return { number: bet[1]! };
  const allocation = /^自己前进(\d+)，目标后退(\d+)$/.exec(label);
  if (allocation) return { number: allocation[1]!, retreat: allocation[2]! };
  return undefined;
}
