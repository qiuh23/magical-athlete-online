/** Player-facing summaries of the implemented cards; source: Second Wind pp28–29. */
export const TWIST_CARDS = [
  { id: 'alchemy-lab', name: '炼金实验室泄漏', page: 28, duration: '本场持续', effect: '狼人巨口出现在起点；每个回合结束后掷骰移动，越过的选手会被淘汰。有咬痕参赛时，由它控制变身后的巨口。' },
  { id: 'bonkbug', name: '终点线虫灾', page: 28, duration: '本场持续', effect: '停在终点前最后两格时，后退5格。只是经过这两格不会触发；比赛方向反转后，危险格也跟随终点改变。' },
  { id: 'conveyor', name: '传送带启动', page: 28, duration: '立即生效 · 本场持续', effect: '所有在赛选手传送到本场实际起点后一格；若事件将起点设为15格，则传送到16格。此后所有人的主移动增加3格，技能造成的其他移动不增加。' },
  { id: 'curse-wands', name: '人手一支诅咒魔杖', page: 28, duration: '本场持续', effect: '每个选手的回合结束后掷骰，跳过相应数量的行动席位。已完赛或淘汰的席位仍计数并掷骰，直到轮到在赛选手。' },
  { id: 'fans', name: '观众要求更混乱', page: 28, duration: '立即执行', effect: '再抽两张变化卡，按顺序执行。需要选择的卡片会先等相关玩家完成选择，再执行下一张。' },
  { id: 'mirror-world', name: '镜像世界', page: 28, duration: '立即生效 · 本场持续', effect: '比赛方向反转，起点和终点互换，棋子保留原位。此后前进朝向新的终点。' },
  { id: 'scrying-pool', name: '占卜池边禁止奔跑', page: 28, duration: '本场持续', effect: '主移动经过加减后若达到6格或更多，改为直接淘汰，不执行这次移动。网页规则也计入后退6格；技能造成的其他移动不受影响。' },
  { id: 'pinata', name: '皮纳塔漏宝', page: 28, duration: '收完或本场结束', effect: '第一弯道之后、终点之前的空格各放1枚分数筹码。首次停在有筹码的格子就获得1分，并拿走该筹码。' },
  { id: 'randomness-ceased', name: '随机停止了随机', page: 29, duration: '本场持续', effect: '每位玩家各掷一次骰。此后该玩家本场的移动骰、能力骰和事件效果骰固定为这个点数，重掷也不会改变。决定先手或打破平局的比较骰照常掷。' },
  { id: 'roast-chicken', name: '地上的烤鸡', page: 29, duration: '立即执行', effect: '当前最后一名的选手前进7格。若并列最后，所有并列者都前进7格。' },
  { id: 'season-finale', name: '季终决战', page: 29, duration: '改变本场结算', effect: '前两位冲线者进入决赛，其他人淘汰；两位决赛者从第二弯道开始再赛，原第一名先行动。网页规则由决赛冠军独得本场前两名的奖励。' },
  { id: 'swap-meet', name: '交换集市', page: 29, duration: '立即秘密选择', effect: '每位仍有角色在赛的玩家抽一张未选角色牌，可以用它替换自己的一名在赛角色，也可以保留原角色。全部选择完成后统一揭晓。' },
  { id: 'time-imp', name: '踩中了时间小鬼', page: 29, duration: '本场离场 · 下一场返场', effect: '触发变化卡的选手立即淘汰，下一场作为该玩家的额外角色参赛。若已是最后一场，则没有后续返场。' },
] as const;
export type TwistCardId = typeof TWIST_CARDS[number]['id'];
