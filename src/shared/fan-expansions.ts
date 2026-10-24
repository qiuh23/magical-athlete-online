import { LEAF_CHARACTERS } from './leaf-expansion.js';
import type { CharacterData } from './characters.js';
export interface FanCharacterData extends CharacterData { adaptation?: string }
/** Exact 32-name webpage manifest. Box is documented but absent from playable pools. */
export const EXTRA_MILE_MANIFEST: readonly FanCharacterData[] = [
  {
    "id": "extra-mile-box",
    "nameEn": "Box",
    "nameZh": "盒子",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "所有实体掷骰须入盒；骰子触及盒外时自己前进2。浏览器适配未确定，因此不可选。",
    "timing": [
      "physical-roll"
    ],
    "optional": true,
    "targets": "box",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次移动；当前不可选",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Box",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Box",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-01",
    "verified": false,
    "verification": "原始卡文已核验；实体规则未适配，隔离不可玩",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Box.png",
    "adaptation": "待确定实体入盒判定的数字化方式，未用随机概率代替。",
    "limit": "每次骰子触及盒外"
  },
  {
    "id": "extra-mile-broken-clock",
    "nameEn": "Broken Clock",
    "nameZh": "坏时钟",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "主移动时掷两颗骰子：点数不同，取较小的点数；点数相同，取两颗骰子的点数之和，作为本次主移动的基础距离。",
    "timing": [
      "main-roll"
    ],
    "optional": false,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Broken Clock",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Broken Clock",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-02",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Broken%20Clock.png",
    "limit": "每次主移动掷骰"
  },
  {
    "id": "extra-mile-cletus",
    "nameEn": "Cletus",
    "nameZh": "克莱特斯",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你可以不进行正常主移动，改为选择与你相距不超过3格的另一名选手，双方各掷一颗对抗骰。点数相同：淘汰目标；你的点数较大：重新掷主移动骰，照常进行主移动；目标的点数较大：目标前进1格，你不进行主移动。",
    "timing": [
      "main-replacement",
      "contest-roll"
    ],
    "optional": true,
    "targets": "与你相距不超过3格的另一名在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次对抗及其结果",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Cletus",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Cletus",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-03",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Cletus.png",
    "adaptation": "对抗骰不触发仅主移动骰能力；双方控制者均须点击。",
    "limit": "每次主移动前可选择一次对抗"
  },
  {
    "id": "extra-mile-doc-paradox",
    "nameEn": "Doc Paradox",
    "nameZh": "悖论博士",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你从终点向起点比赛，到达起点即完赛。与其他选手同格时，你被传送回终点，且本场之后的主移动距离增加3格；每次被送回终点都会再增加3格，可以累积。",
    "timing": [
      "before-race",
      "stop",
      "main-modifier"
    ],
    "optional": false,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "加成累积至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Doc Paradox",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Doc Paradox",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-04",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Doc%20Paradox.png",
    "adaptation": "数字适配：倒向起点完赛；倒向主移动的距离仍先应用通常加减；每次重置累计+3。",
    "limit": "每次与其他选手同格时触发"
  },
  {
    "id": "extra-mile-doctor-dice",
    "nameEn": "Doctor Dice",
    "nameZh": "骰子医生",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "不会绊倒。主移动前可传到一名倒地选手的格子并使其起身；向后传送时本次主移动+2。",
    "timing": [
      "before-main",
      "trip"
    ],
    "optional": true,
    "targets": "另一名已绊倒的在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "免疫持续生效；救援加成仅本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Doctor Dice",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Doctor Dice",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-05",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Doctor%20Dice.png",
    "limit": "免疫绊倒持续生效；每次主移动前可救援一次"
  },
  {
    "id": "extra-mile-dom-and-gary",
    "nameEn": "Dom and Gary",
    "nameZh": "多姆与加里",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "赛前增加一名由你操控的选手“加里”，从第4格起跑，按本场固定顺序在多姆之前行动。多姆越过加里或与加里同格时，淘汰加里，之后多姆本场的主移动距离增加2格。加里获得前两名时占据对应名次，但该名次积分不计入任何玩家得分。",
    "timing": [
      "before-race",
      "pass",
      "stop",
      "main-modifier"
    ],
    "optional": false,
    "targets": "多姆与额外选手加里",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "加里参赛及捕获加成持续至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Dom and Gary",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Dom and Gary",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-06",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Dom%20and%20Gary.png",
    "adaptation": "加里由操控多姆的玩家操作，但不为任何玩家计分；加里获得的名次积分不再发给其他选手。",
    "limit": "赛前增加一次加里；捕获加里一次"
  },
  {
    "id": "extra-mile-echo",
    "nameEn": "Echo",
    "nameZh": "回声",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你可以不掷主移动骰，改用上一位行动选手的实际主移动距离作为基础距离，包括前进或后退方向，再计算你的移动加减效果。没有上一位选手的记录时，正常掷骰；传送不计为移动距离。",
    "timing": [
      "main-replacement"
    ],
    "optional": true,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Echo",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p7 / Echo",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-07",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Echo.png",
    "adaptation": "PDF写previous racer moved，网页写rolled；采用PDF。首次行动无前次记录时正常掷骰；传送不算移动。",
    "limit": "每次主移动前可选择一次"
  },
  {
    "id": "extra-mile-gingy",
    "nameEn": "Gingy",
    "nameZh": "姜饼人",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你有4点生命。其他选手停到你所在格时，你失去1点生命，且本场之后的主移动距离增加1格，可以累积。你自己停到别人的格子不触发。生命降至0时，你被淘汰。",
    "timing": [
      "stop",
      "main-modifier"
    ],
    "optional": false,
    "targets": "停到你所在格的其他选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "生命与移动加成保留至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Gingy",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Gingy",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-08",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Gingy.png",
    "limit": "初始4点生命；每名到达的其他选手分别触发"
  },
  {
    "id": "extra-mile-gluebert",
    "nameEn": "Gluebert",
    "nameZh": "胶水伯特",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "同格其他选手主移动-2；其他选手越过自己时，该次移动少1格。",
    "timing": [
      "main-modifier",
      "passed"
    ],
    "optional": false,
    "targets": "其他在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "对应的那次移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Gluebert",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Gluebert",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-09",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Gluebert.png",
    "limit": "每次同格选手的主移动、每次被越过时触发"
  },
  {
    "id": "extra-mile-heads",
    "nameEn": "Heads",
    "nameZh": "硬币头",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "每次你掷出一颗骰子后，可以将它翻到底面，使用“7减去当前点数”的结果，例如将2变成5。每颗骰子只能翻面一次。",
    "timing": [
      "any-roll"
    ],
    "optional": true,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "当前这颗骰子的结果",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Heads",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Heads",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-10",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Heads.png",
    "adaptation": "每颗骰只翻一次；翻面在强制重掷检查之前，固定点数后不再翻回。",
    "limit": "每颗骰子最多翻面一次"
  },
  {
    "id": "extra-mile-honey-pot",
    "nameEn": "Honey Pot",
    "nameZh": "蜜罐",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "赛前由公共供应向蜜罐加入与当前场次相同数量的积分，例如第3场加入3分，不扣除你的积分；你选择一格作为蜜罐格。任何选手停到该格时，掷骰并领取相应点数的积分，余额不足则只领取剩余积分。每发出1分，你前进1格。",
    "timing": [
      "before-race",
      "stop",
      "ability-roll"
    ],
    "optional": false,
    "targets": "赛前标记的格子，以及停到该格的选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "蜜罐余额与标记保留至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Honey Pot",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Honey Pot",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-11",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Honey%20Pot.png",
    "adaptation": "蜜罐积分由公共供应提供，不扣除玩家积分。余额不足时只领取剩余积分；多个蜜罐角色各自标记一格，共享本场蜜罐余额。",
    "limit": "赛前加分并标记一次；蜜罐有余额时，每次停格分别领取"
  },
  {
    "id": "extra-mile-king-pete",
    "nameEn": "King Pete",
    "nameZh": "皮特国王",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "其他选手每次掷出5或6时，你前进1格。若这是主移动掷骰，还使对方该次主移动距离减少1格；独立技能骰或对抗骰不会扣减主移动距离。",
    "timing": [
      "any-roll"
    ],
    "optional": false,
    "targets": "其他在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次前进及对应的主移动扣减",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "King Pete",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p7 / King Pete",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-12",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/King%20Pete.png",
    "adaptation": "数字适配：主骰扣当前主移动；能力骰与对抗骰无主移动可扣，仍触发国王前进。",
    "limit": "其他选手每次掷出5或6时触发"
  },
  {
    "id": "extra-mile-lazy-bones",
    "nameEn": "Lazy Bones",
    "nameZh": "懒骨头",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "在你的主移动骰首次掷出6之前，不能靠主移动离开起点。每当你的主移动骰掷出6，就传送到领跑者所在格，代替本次主移动，并获得一个额外回合。首次掷出6后，其他点数可以正常移动。",
    "timing": [
      "main-roll"
    ],
    "optional": false,
    "targets": "领跑选手；并列时选择一名",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "解锁正常移动持续至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Lazy Bones",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Lazy Bones",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-13",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Lazy%20Bones.png",
    "adaptation": "数字适配：锁在起点仅限制自己的主移动；首次掷6后解除，随后每次主骰6仍执行传送和额外回合。",
    "limit": "每次主移动掷出6时触发"
  },
  {
    "id": "extra-mile-marksman",
    "nameEn": "Marksman",
    "nameZh": "神射手",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "进行主移动前，你可以选择一名与你相距至少4格、且不在起点的其他选手作为射击目标。每次掷一颗骰子，将点数不断相加，直到累计点数达到或超过目标所在格的编号。\n恰好相等：淘汰目标。超过：目标前进1格。\n射击结束后，你照常进行主移动。",
    "example": "你在第2格，目标在第9格，需要凑到9点。先掷出4、3，累计7点，必须继续掷；下一骰为2就命中，为3则累计10点，目标前进到第10格。比较的是目标的格号，不是你们相距的7格。",
    "timing": [
      "before-main",
      "ability-roll"
    ],
    "optional": true,
    "targets": "与你相距至少4格、且不在起点的另一名在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次射击；被淘汰者退出本场",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Marksman",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p7 / Marksman",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-14",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Marksman.png",
    "adaptation": "网页版按一颗一颗掷骰的方式射击；每次点击后只掷一颗，点数累计达到或超过射击开始时记录的目标格号后结束。",
    "limit": "每次主移动前可射击一次；连续掷骰直到达到或超过目标格号"
  },
  {
    "id": "extra-mile-moneybags",
    "nameEn": "Moneybags",
    "nameZh": "钱袋先生",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "可支付1积分代替掷骰，以自己选择的1至8格为主移动距离。",
    "timing": [
      "main-replacement"
    ],
    "optional": true,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Moneybags",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Moneybags",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-15",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Moneybags.png",
    "limit": "每次主移动前可支付1分使用一次"
  },
  {
    "id": "extra-mile-mr-fox",
    "nameEn": "Mr. Fox",
    "nameZh": "狐狸先生",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "每场至多3次，在公开技能生效前阻止该次能力。",
    "timing": [
      "reaction"
    ],
    "optional": true,
    "targets": "即将生效的一次已公开能力",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "只阻止当前这一次能力效果",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Mr. Fox",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Mr. Fox",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-16",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Mr.%20Fox.png",
    "adaptation": "数字适配：按本场固定顺序响应，一个阻止成功即关闭窗口；阻止不再互相阻止；已付款和已花次数不返还。持续能力按单次可观察激活开启窗口。",
    "limit": "每场最多成功阻止3次"
  },
  {
    "id": "extra-mile-oddball",
    "nameEn": "Oddball",
    "nameZh": "怪球",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "自己主骰偶数时本次主移动-2，奇数时+3。",
    "timing": [
      "main-roll",
      "main-modifier"
    ],
    "optional": false,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Oddball",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Oddball",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-17",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Oddball.png",
    "limit": "每次主移动掷骰"
  },
  {
    "id": "extra-mile-pooh",
    "nameEn": "Pooh",
    "nameZh": "维尼",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "每个回合中，从第二次能力结算完成起，每完成一次能力，你就前进1格。维尼自身的响应不计入，也不会因此反复触发自己。你绊倒后立即起身。",
    "timing": [
      "power-done",
      "trip"
    ],
    "optional": false,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "每次前进或立即起身",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Pooh",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Pooh",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-18",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Pooh.png",
    "adaptation": "数字适配：本回合第二次及之后每次能力完成均前进1；自己的该次响应不继续触发自己。",
    "limit": "每回合从第二次能力完成起逐次触发；自身响应不计入"
  },
  {
    "id": "extra-mile-robin-hood",
    "nameEn": "Robin Hood",
    "nameZh": "罗宾汉",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你越过领跑选手或与领跑选手同格时，从操控领跑选手的玩家那里转移1分，交给操控赛道末位选手的玩家，然后你前进2格。并列目标按本场固定行动顺序取第一名；领跑者没有积分时不转分，你仍前进2格。",
    "timing": [
      "pass",
      "stop"
    ],
    "optional": false,
    "targets": "领跑选手和赛道末位选手的控制者",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次转分与前进",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Robin Hood",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p7 / Robin Hood",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-19",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Robin%20Hood.png",
    "adaptation": "数字适配：并列领先或末位按本场固定顺序取第一名不同选手；不足1分不转移，仍移动2格。",
    "limit": "每次越过领跑者或与领跑者同格时触发"
  },
  {
    "id": "extra-mile-saint-nick",
    "nameEn": "Saint Nick",
    "nameZh": "圣尼克",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你停到已有其他选手的格子时，每名其他选手使你前进1格。完成这次前进及后续效果后，操控那些选手的玩家依次为各自选手掷一颗骰子：1～3点，该选手后退1格；4～6点，该选手前进2格。因同一次效果与你一起到达的选手不计入。",
    "timing": [
      "stop",
      "ability-roll"
    ],
    "optional": false,
    "targets": "你到达前已在该格的其他选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次前进与送礼骰效果",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Saint Nick",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Saint Nick",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-20",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Saint%20Nick.png",
    "adaptation": "按每名选手计数与逐个掷骰，同玩家的两个选手仍分别执行；自身额外移动完成及连锁后才开始送礼骰。",
    "limit": "每次停到有其他选手的格子时，按其他选手逐名处理"
  },
  {
    "id": "extra-mile-school-bully",
    "nameEn": "School Bully",
    "nameZh": "校园恶霸",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你的主移动最终点数为3时，使所有其他选手绊倒。被此效果绊倒的选手，下次进行主移动时掷一颗恢复骰：\n1～3点：起身，以该点数为基础距离进行主移动，校园恶霸前进2格。\n4～6点：只起身，跳过本次主移动。",
    "timing": [
      "main-roll",
      "recovery-roll"
    ],
    "optional": false,
    "targets": "所有其他在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "绊倒持续至恢复；恢复骰只用于那次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "School Bully",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / School Bully",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-21",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/School%20Bully.png",
    "adaptation": "PDF明确恢复成功后按该骰移动，网页省略，采用PDF；4至6只起身而失去主移动。",
    "limit": "每个主移动最终3点；每名被绊倒者恢复时掷一次骰"
  },
  {
    "id": "extra-mile-scout",
    "nameEn": "Scout",
    "nameZh": "童子军",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "主骰确定后、移动前可向前或向后传送1格。",
    "timing": [
      "main-roll"
    ],
    "optional": true,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次传送；之后仍按原骰进行主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Scout",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Scout",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-22",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Scout.png",
    "limit": "每次主移动骰最终确定后可传送一次"
  },
  {
    "id": "extra-mile-shuffler",
    "nameEn": "Shuffler",
    "nameZh": "洗牌师",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "赛前，将本场所有选手的角色卡上原本写明的能力洗牌，随机重新分配。你的回合开始时，若你独自处于末位，可以再次洗牌。只重新分配能力，棋子、位置和控制者不交换；你仍保留再次洗牌的能力。",
    "timing": [
      "before-race",
      "turn-start"
    ],
    "optional": true,
    "targets": "本场所有选手，不包括没有独立角色卡的加里",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "重分配的能力保留至再次洗牌或本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Shuffler",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Shuffler",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-23",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Shuffler.png",
    "adaptation": "重新分配能力不改变各选手的操控者、位置与棋子；已经执行的赛前效果不重复执行，已有标记和资源仍归原选手。",
    "limit": "赛前一次；独自末位的自身回合开始时可再洗牌"
  },
  {
    "id": "extra-mile-silly-goose",
    "nameEn": "Silly Goose",
    "nameZh": "傻鹅",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "主骰1至6分别改为移动-3、0、2、5、7、10格。",
    "timing": [
      "main-roll"
    ],
    "optional": false,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Silly Goose",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Silly Goose",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-24",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Silly%20Goose.png",
    "limit": "每次主移动掷骰"
  },
  {
    "id": "extra-mile-snake-eyes",
    "nameEn": "Snake Eyes",
    "nameZh": "蛇眼",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "赛前预测一名选手获得本场冠军，并选择下注积分，最多不超过你当前的积分，也可以下注0分。下注时不扣分；本场结束时，猜中净增加下注额的3倍，猜错扣除下注额。和局视为未猜中。",
    "timing": [
      "before-race",
      "race-end"
    ],
    "optional": false,
    "targets": "你预测会获得本场冠军的选手，可以是自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "预测与下注保留至本场结算",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Snake Eyes",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p7 / Snake Eyes",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-25",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Snake%20Eyes.png",
    "adaptation": "数字适配：下注额限当前玩家积分，不预扣；结束按净增3倍或扣注额结算；和局视为未猜中。",
    "limit": "每场赛前下注一次，赛后结算一次"
  },
  {
    "id": "extra-mile-snub",
    "nameEn": "Snub",
    "nameZh": "落选仔",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "主移动增加本批选秀中在自己之前被选出的角色数量。",
    "timing": [
      "draft",
      "main-modifier"
    ],
    "optional": false,
    "targets": "自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "加成持续至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Snub",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Snub",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-26",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Snub.png",
    "adaptation": "记录本批选秀选择前的全桌选牌数；练习自由组队顺序视为该次选牌顺序。",
    "limit": "按本批选秀的选牌顺序确定一次加成"
  },
  {
    "id": "extra-mile-terrible-toddler",
    "nameEn": "Terrible Toddler",
    "nameZh": "可怕幼童",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你的主移动最终点数为1或2时，先额外掷一颗范围骰，使与你相距不超过该骰点数的所有选手绊倒，包括你自己，然后继续本次主移动。",
    "timing": [
      "main-roll",
      "ability-roll"
    ],
    "optional": false,
    "targets": "与你相距不超过范围骰点数的所有在赛选手，包括自己",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "绊倒持续至各选手恢复",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Terrible Toddler",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Terrible Toddler",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-27",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Terrible%20Toddler.png",
    "adaptation": "anyone包含自己；额外范围骰不触发主移动专属能力。",
    "limit": "每个主移动最终1或2点触发一次"
  },
  {
    "id": "extra-mile-thief",
    "nameEn": "Thief",
    "nameZh": "盗贼",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "赛前秘密指定另一选手；本场结束公开目标，偷取该选手本场获得的积分。",
    "timing": [
      "before-race",
      "race-end"
    ],
    "optional": false,
    "targets": "赛前秘密选择的另一名选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "目标保密至本场结束时揭晓",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Thief",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p5 / Thief",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-28",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Thief.png",
    "adaptation": "目标保密至本场结束。按目标这名选手在本场获得的积分计算窃取额，不包含其队友的收入；最多偷走操控目标的玩家当前剩余的积分。",
    "limit": "每场赛前秘密选择一次，赛后窃取一次"
  },
  {
    "id": "extra-mile-toll-troll",
    "nameEn": "Toll Troll",
    "nameZh": "收费巨魔",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "赛前标记一格，任何选手停在该格自己获得1积分。",
    "timing": [
      "before-race",
      "stop"
    ],
    "optional": false,
    "targets": "赛前标记的格子，以及停到该格的选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "标记保留至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Toll Troll",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p7 / Toll Troll",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-29",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Toll%20Troll.png",
    "limit": "赛前标记一次；每次有选手停到标记格时得分"
  },
  {
    "id": "extra-mile-totally-fair-ref",
    "nameEn": "Totally Fair Ref",
    "nameZh": "绝对公平裁判",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "其他选手从非领先位置进入领先时倒地。",
    "timing": [
      "move"
    ],
    "optional": false,
    "targets": "从非领先位置进入领先的其他选手，包括进入并列领先",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "绊倒持续至目标恢复",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Totally Fair Ref",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p1 / Totally Fair Ref",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-30",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Totally%20Fair%20Ref.png",
    "adaptation": "数字适配：从不在并列领先变为并列领先也算进入；同组同时到达合并检查。",
    "limit": "每次其他选手从非领先位置进入领先时触发"
  },
  {
    "id": "extra-mile-whisper",
    "nameEn": "Whisper",
    "nameZh": "低语",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "你停到已有其他选手的格子时，必须移动到前方或后方距离最近的空格；两边一样近时，由你选择。别人停到你所在格时，你必须向前移动到下一个空格。这些都是正常移动，会触发途中和停下时的效果。",
    "timing": [
      "stop"
    ],
    "optional": false,
    "targets": "你需要移入的最近空格；等距时由你选择",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次移动及后续触发效果",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Whisper",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Whisper",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-31",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Whisper.png",
    "adaptation": "等距两个空格由控制者选择；以正常移动结算经过和停格触发。",
    "limit": "每次符合条件的同格相遇都必须处理"
  },
  {
    "id": "extra-mile-witch-hazel",
    "nameEn": "Witch Hazel",
    "nameZh": "女巫海泽尔",
    "translation": "本项目译名",
    "edition": "extra-mile",
    "ability": "可把非负主移动距离分为自己前进和另一名选手后退；先完成自身移动及连锁，再对所选目标后退。",
    "timing": [
      "main-allocation"
    ],
    "optional": true,
    "targets": "另一名在赛选手",
    "scope": "按每名选手；其他选手包含同一玩家的另一选手。",
    "duration": "本次自身前进和目标后退",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "Extra Mile 作者角色网页",
        "locator": "Witch Hazel",
        "accessed": "2026-10-22",
        "version": "v13，32名名单"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/ExtraMile.pdf",
        "title": "Extra Mile 作者卡面PDF",
        "locator": "PDF p3 / Witch Hazel",
        "accessed": "2026-10-22",
        "version": "2026-10-22下载，8页33张正面"
      }
    ],
    "testId": "EM-32",
    "verified": true,
    "verification": "作者网页与PDF卡面交叉核对；规则采用PDF优先",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/extra-mile/Witch%20Hazel.png",
    "adaptation": "PDF明确one other racer，网页写other racers；查未发现作者勘误，采用PDF单目标。全给自身或全给目标均可；负主移动不分配。",
    "limit": "每次非负主移动距离确定后可分配一次"
  }
];
export const FAN_CHARACTERS: readonly FanCharacterData[] = [...EXTRA_MILE_MANIFEST.filter(c=>c.id!=='extra-mile-box'),...LEAF_CHARACTERS];
export const EXTRA_MILE_CHARACTER_IDS: readonly string[] = FAN_CHARACTERS.filter(c=>c.edition==='extra-mile').map(c=>c.id);
export const LEAF_CHARACTER_IDS: readonly string[] = LEAF_CHARACTERS.map(c=>c.id);
export const FAN_READY_COUNTS = {'extra-mile':EXTRA_MILE_CHARACTER_IDS.length,'leaf-fan':LEAF_CHARACTER_IDS.length} as const;
export const FAN_SOURCE_STATUS = {verifiedAt:'2026-10-22',extraMile:{webCount:32,pdfFrontCount:33,excludedPdfOnly:'Groundhogs Day / DÉJÀ MOVE',isolated:['extra-mile-box']},leaf:{count:18,ready:18,missing:[],acquisition:'BGG downloads returned403; user provided original files459312/459301/459299; fullPDF andPNG read2026-10-22'}} as const;
