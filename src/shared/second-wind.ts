import type { CharacterData } from './characters.js';
/** Official card text checked against the user-supplied Second Wind rulebook, pp24-27. */
export const SECOND_WIND_CHARACTERS: readonly CharacterData[] = [
  {
    "id": "bite-mark",
    "nameEn": "Bite Mark",
    "nameZh": "咬痕",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "你的主移动最终点数为1或2时，变身为狼人巨口，持续至本场结束。变身后，你每次移动都会淘汰被你越过的其他选手。",
    "timing": [
      "main-roll-final",
      "passed"
    ],
    "optional": false,
    "targets": "被越过的其他选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "变身后每次越过其他选手时触发",
    "duration": "变身持续至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Bite Mark",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Bite Mark",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-01",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Bite%20Mark.png"
  },
  {
    "id": "blunderdog",
    "nameEn": "Blunderdog",
    "nameZh": "糊涂狗",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "计算主移动时，若你处于末位（包括并列末位），主移动骰的基础距离乘以3，再计算其他加减效果；否则将本次主移动的方向反转。",
    "timing": [
      "main-move"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Blunderdog",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Blunderdog",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-02",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Blunderdog.png"
  },
  {
    "id": "cheatah",
    "nameEn": "Cheatah",
    "nameZh": "千术豹",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "用秘密设定1～6代替主移动掷骰；右手玩家猜中则不移动。",
    "timing": [
      "before-main",
      "secret-guess"
    ],
    "optional": false,
    "targets": "右手真人玩家；自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "秘密直到猜测完成",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Cheatah",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Cheatah",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-03",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Cheatah.png"
  },
  {
    "id": "critic",
    "nameEn": "Critic",
    "nameZh": "评论家",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "位于你前方的选手掷出主移动骰后，你可以要求其重掷一次，舍弃原来的结果。每个回合最多要求一次。",
    "timing": [
      "reroll-window"
    ],
    "optional": true,
    "targets": "位于自身前方的选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每个回合一次",
    "duration": "舍弃旧骰面",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Critic",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Critic",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-04",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Critic.png"
  },
  {
    "id": "diva",
    "nameEn": "Diva",
    "nameZh": "歌剧女伶",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "你的回合开始时，若你处于末位（包括并列末位），与一名领跑选手交换位置；否则与一名末位选手交换位置。目标有多名时，由你选择。",
    "timing": [
      "turn-start"
    ],
    "optional": false,
    "targets": "领跑或末位选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合开始一次",
    "duration": "立即",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Diva",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Diva",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-05",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Diva.png"
  },
  {
    "id": "doppelgangster",
    "nameEn": "Doppelgängster",
    "nameZh": "替身帮",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "最先冲线的选手改为淘汰；自己获得其能力。",
    "timing": [
      "before-first-finish"
    ],
    "optional": false,
    "targets": "首个冲线选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每场一次",
    "duration": "获得能力至本场结束",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Doppelgängster",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Doppelgängster",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-06",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Doppelgangster.png"
  },
  {
    "id": "gloth",
    "nameEn": "Gloth",
    "nameZh": "葛洛斯",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "主移动−1；比赛结束时若尚未超过第二弯道，获得3分。",
    "timing": [
      "main-move",
      "race-end"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动；每场结束一次",
    "duration": "本场",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Gloth",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Gloth",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-07",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Gloth.png"
  },
  {
    "id": "hog-knight",
    "nameEn": "Hog Knight",
    "nameZh": "野猪骑士",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "开赛时你骑着一只野猪。每只坐骑使当前骑手的主移动距离增加2格。其他选手停到当前骑手所在格时，会夺走坐骑；一名选手可以同时骑多只野猪。",
    "timing": [
      "before-race",
      "main-move",
      "stop"
    ],
    "optional": false,
    "targets": "停到坐骑所在格的选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次合法停格",
    "duration": "坐骑留在本场",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Hog Knight",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Hog Knight",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-08",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Hog%20Knight.png"
  },
  {
    "id": "hopfrog",
    "nameEn": "Hopfrog",
    "nameZh": "弹跳蛙",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "回合结束时，若自己恰在任意选手后1格，获得额外回合。",
    "timing": [
      "turn-end"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合结束一次",
    "duration": "下一个回合",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Hopfrog",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p24 / Hopfrog",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-09",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第24页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Hopfrog.png"
  },
  {
    "id": "hotel",
    "nameEn": "Hotel",
    "nameZh": "旅馆",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "其他选手停到自己所在格，需付给自己1分；无法支付则绊倒。",
    "timing": [
      "stop"
    ],
    "optional": false,
    "targets": "单独到达自身格的其他选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次合法停格",
    "duration": "立即",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Hotel",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Hotel",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-10",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Hotel.png"
  },
  {
    "id": "icarus",
    "nameEn": "Icarus",
    "nameZh": "伊卡洛斯",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "主移动+3；主移动最终骰面6时淘汰。",
    "timing": [
      "main-roll-final",
      "main-move"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "立即",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Icarus",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Icarus",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-11",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Icarus.png"
  },
  {
    "id": "kingtripper",
    "nameEn": "Kingtripper",
    "nameZh": "绊倒国王",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "回合开始时，可以绊倒领跑选手；并列则选择一名。",
    "timing": [
      "turn-start"
    ],
    "optional": true,
    "targets": "领跑选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合开始一次",
    "duration": "至目标下次恢复",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Kingtripper",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Kingtripper",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-12",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Kingtripper.png"
  },
  {
    "id": "kraken",
    "nameEn": "Kraken",
    "nameZh": "海怪",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "每场一次，在回合开始时可以把所有其他选手传送至自己所在格并绊倒。",
    "timing": [
      "turn-start"
    ],
    "optional": true,
    "targets": "所有其他在赛选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每场一次",
    "duration": "至目标下次恢复",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Kraken",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Kraken",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-13",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Kraken.png"
  },
  {
    "id": "le-saboteur",
    "nameEn": "Le Saboteur",
    "nameZh": "破坏者",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "其他选手主骰3时，整个主移动改为后退；显摆精任一保留骰为3、骰子先生六骰中含3同样生效。双重反向抵消。",
    "timing": [
      "main-roll-final"
    ],
    "optional": false,
    "targets": "其他在赛选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每个最终3",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Le Saboteur",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Le Saboteur",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-14",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/LeSaboteur.png"
  },
  {
    "id": "magical-athlete",
    "nameEn": "Magical Athlete",
    "nameZh": "魔法运动员",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "根据主移动骰最终保留的点数，执行对应效果：\n1点：以7格为基础距离进行主移动。\n2点：将所有并列末位选手同时传送到你所在格。\n3点：传送到另一名选手所在格，并绊倒该格所有其他选手。\n4点：以4格为基础距离进行主移动，并获得一个额外回合。\n5点：所有并列领跑选手同时后退5格。\n6点：以6格为基础距离进行主移动，并绊倒被你越过的选手。",
    "timing": [
      "main-roll-final",
      "passed"
    ],
    "optional": false,
    "targets": "按点数确定：2点影响所有并列末位；3点选择另一名选手所在格；5点影响所有并列领跑者；6点影响被你越过的选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "本次效果",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Magical Athlete",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Magical Athlete",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-15",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Magical%20Athlete.png"
  },
  {
    "id": "mole",
    "nameEn": "Mole",
    "nameZh": "鼹鼠",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "若与你同格及前后相邻1格内都没有其他选手，你可以不掷主移动骰，改用6格作为主移动的基础距离。",
    "timing": [
      "before-main"
    ],
    "optional": true,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Mole",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Mole",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-16",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Mole.png"
  },
  {
    "id": "mr-dice-guy",
    "nameEn": "Mr. Dice Guy",
    "nameZh": "骰子先生",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "主移动掷六颗骰子，从出现至少两次的点数中选择一个作为结果。项目房规：六骰各异时，等待当前控制者重掷整组六骰。",
    "timing": [
      "main-roll"
    ],
    "optional": false,
    "targets": "六颗骰子中重复的点数",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Mr. Dice Guy",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Mr. Dice Guy",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-17",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Mr.%20Dice%20Guy.png"
  },
  {
    "id": "mush",
    "nameEn": "Mush",
    "nameZh": "蘑菇泥",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "你的主移动最终点数为1或2时，从未选角色牌堆抽一张牌，额外获得该牌的能力，持续至本场结束，可以不断累积。不补用已经错过的发动时机，也不执行返场等赛后效果。复制蘑菇泥时，只获得它的抽牌能力，不继承它已经累积的能力。",
    "timing": [
      "main-roll-final"
    ],
    "optional": false,
    "targets": "牌库顶选手牌",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每个最终1或2",
    "duration": "本场剩余时间",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Mush",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p25 / Mush",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-18",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第25页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Mush.png"
  },
  {
    "id": "nemesis",
    "nameEn": "Nemesis",
    "nameZh": "宿敌",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "其他选手掷出主移动骰并完成移动后，你可以额外掷一颗骰子。若与你跟随的那次主移动骰最终点数相同，你就前进相应格数。",
    "timing": [
      "other-main-roll"
    ],
    "optional": true,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次其他选手主骰",
    "duration": "立即",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Nemesis",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Nemesis",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-19",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Nemesis.png"
  },
  {
    "id": "nepo-baby",
    "nameEn": "Nepo Baby",
    "nameZh": "关系宝宝",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "开赛时置于第一弯道。",
    "timing": [
      "before-race"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "开赛一次",
    "duration": "起始位置",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Nepo Baby",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Nepo Baby",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-20",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Nepo%20Baby.png"
  },
  {
    "id": "null",
    "nameEn": "Null",
    "nameZh": "虚无",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "位于你前方的选手，主移动距离减少1格，且所有能力暂时失效。不再位于你前方时，这些限制解除。",
    "timing": [
      "continuous",
      "main-move"
    ],
    "optional": false,
    "targets": "严格位于自身前方的在赛选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "持续",
    "duration": "符合位置条件时",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Null",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Null",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-21",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Null.png"
  },
  {
    "id": "overtaker",
    "nameEn": "Overtaker",
    "nameZh": "超车骷髅",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "自己前方每有一名选手，主移动+1。",
    "timing": [
      "main-move"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次主移动",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Overtaker",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Overtaker",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-22",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Overtaker.png"
  },
  {
    "id": "party-pooper",
    "nameEn": "Party Pooper",
    "nameZh": "扫兴鬼",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "所有掷出的6必须重掷；每次因此重掷，自己移动1。",
    "timing": [
      "any-roll"
    ],
    "optional": false,
    "targets": "所有骰子；自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每个6",
    "duration": "旧骰作废",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Party Pooper",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Party Pooper",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-23",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Party%20Pooper.png"
  },
  {
    "id": "penguin",
    "nameEn": "Penguin",
    "nameZh": "企鹅",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "被其他选手越过时自己绊倒；绊倒时主移动不跳过，改为骰面加倍，并在主移动后恢复站立。",
    "timing": [
      "passed",
      "main-move",
      "recovery"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次被越过/绊倒主移动",
    "duration": "绊倒时主骰加倍代替跳过；该次主移动后恢复站立",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Penguin",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Penguin",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-24",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Penguin.png"
  },
  {
    "id": "re-runner",
    "nameEn": "Re-Runner",
    "nameZh": "返场跑者",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "首次参赛后，余下每场都作为所属玩家的额外选手参赛。",
    "timing": [
      "race-end",
      "before-race"
    ],
    "optional": false,
    "targets": "稳定的所属玩家",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "首次参赛后各场",
    "duration": "本局剩余比赛",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Re-Runner",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Re-Runner",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-25",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Re-Runner.png"
  },
  {
    "id": "show-off",
    "nameEn": "Show-Off",
    "nameZh": "显摆精",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "掷出主移动骰后，你可以继续掷骰，把点数累加为本次主移动的基础距离。每颗新骰都必须大于上一颗；若小于或等于上一颗，本次累计距离全部作废，不进行主移动。你可以在追加掷骰前停止，并按已累计的点数移动。",
    "timing": [
      "main-roll",
      "push-your-luck"
    ],
    "optional": true,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "可持续追加，严格递增",
    "duration": "本次主移动",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Show-Off",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Show-Off",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-26",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Show-Off.png"
  },
  {
    "id": "soulmate",
    "nameEn": "Soulmate",
    "nameZh": "灵魂伴侣",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "开赛前选择一名对方选手；自己回合开始距其不超过5格时，传送到对方所在格。",
    "timing": [
      "before-race",
      "turn-start"
    ],
    "optional": false,
    "targets": "由其他玩家控制的在赛选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "开赛选一名；每回合开始一次",
    "duration": "本场",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Soulmate",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p26 / Soulmate",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-27",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第26页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Soulmate.png"
  },
  {
    "id": "speed-demon",
    "nameEn": "Speed Demon",
    "nameZh": "速度恶魔",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "控制你的玩家每有1分，你的主移动距离就增加1格。你的回合开始时，若你领先所有其他选手至少4格，你被淘汰。",
    "timing": [
      "turn-start",
      "main-move"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合开始/主移动",
    "duration": "即时",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Speed Demon",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Speed Demon",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-28",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Speed%20Demon.png"
  },
  {
    "id": "spoilsport",
    "nameEn": "Spoilsport",
    "nameZh": "输不起",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "回合开始时，如果所有其他选手均领先自己至少5格，取消本场比赛，自己获得3分。",
    "timing": [
      "turn-start"
    ],
    "optional": false,
    "targets": "自身及整场比赛",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合开始一次",
    "duration": "本场取消",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Spoilsport",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Spoilsport",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-29",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Spoilsport.png"
  },
  {
    "id": "stepdad",
    "nameEn": "Stepdad",
    "nameZh": "继父",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "固定行动顺序中左侧首名其他玩家的非淘汰选手主移动+2；该选手夺冠时，继父当前控制者获得3分。目标被淘汰后顺延。",
    "timing": [
      "continuous",
      "main-move",
      "first-finish"
    ],
    "optional": false,
    "targets": "沿本场固定顺序跳过己方队友和淘汰者，取第一名对方选手",
    "scope": "多角色依官方第27页惠及另一名玩家；按固定卡位顺延，不按赛道位置判定",
    "limit": "持续；获冠军一次",
    "duration": "本场",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Stepdad",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Stepdad",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-30",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Stepdad.png"
  },
  {
    "id": "streaker",
    "nameEn": "Streaker",
    "nameZh": "裸奔客",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "一次移动越过至少一名选手时，自己获得1分。",
    "timing": [
      "passed"
    ],
    "optional": false,
    "targets": "自身",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每次越过移动一次",
    "duration": "立即",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Streaker",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Streaker",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-31",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Streaker.png"
  },
  {
    "id": "stunner",
    "nameEn": "Stunner",
    "nameZh": "惊艳者",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "与你同格或相距1格的其他选手，无论因什么原因掷骰，结果都视为1点。",
    "timing": [
      "any-roll"
    ],
    "optional": false,
    "targets": "距自身不超过1格的其他选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "持续",
    "duration": "符合位置条件时",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Stunner",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Stunner",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-32",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Stunner.png"
  },
  {
    "id": "switcharoo",
    "nameEn": "Switcharoo",
    "nameZh": "交换袋鼠",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "你的回合结束时，可以与同格或相距1格的另一名选手交换控制权：你们的玩家互换操控的选手，双方棋子、位置和状态不变。",
    "timing": [
      "turn-end"
    ],
    "optional": true,
    "targets": "同格或相距1格的另一名在赛选手，包括你控制的另一名选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合结束一次",
    "duration": "本场控制权与牌归属",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Switcharoo",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Switcharoo",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-33",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Switcharoo.png"
  },
  {
    "id": "tail",
    "nameEn": "Tail",
    "nameZh": "尾巴",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "回合开始时，可传送到最近前方选手身后1格。",
    "timing": [
      "turn-start"
    ],
    "optional": true,
    "targets": "最近前方格；并列同格无差别",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "每回合开始一次",
    "duration": "立即",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Tail",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Tail",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-34",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Tail.png"
  },
  {
    "id": "the-hose",
    "nameEn": "The Hose",
    "nameZh": "水管",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "你的回合结束时，额外掷一颗范围骰，使你前方距离不超过该骰点数的所有在赛选手绊倒。例如掷出3，会绊倒你前方1、2、3格的选手；同格和后方不受影响。",
    "timing": [
      "turn-end",
      "ability-roll"
    ],
    "optional": false,
    "targets": "你前方距离不超过范围骰最终点数的所有在赛选手，包括队友；不含同格和后方",
    "scope": "能力骰独立于主骰，不应用主移动加减；受惊艳者固定骰面与扫兴鬼重掷影响。恢复代替主移动后仍触发；完赛或淘汰后不触发。企鹅不是绊倒免疫",
    "limit": "每回合结束一次",
    "duration": "至目标恢复",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / The Hose",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / The Hose",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-35",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/The%20Hose.png"
  },
  {
    "id": "understudy",
    "nameEn": "Understudy",
    "nameZh": "替补演员",
    "translation": "本项目译名",
    "edition": "second-wind",
    "ability": "赛前选择另一名参赛选手，复制其角色卡上原本写明的能力，可以选择你控制的另一名选手。可以执行复制能力的赛前效果，不执行返场等赛后效果。",
    "timing": [
      "before-race"
    ],
    "optional": false,
    "targets": "本场其他参赛者，包含同一玩家的另一名选手",
    "scope": "按卡文；other 为其他选手，opposing 为其他玩家控制的选手",
    "limit": "开赛一次",
    "duration": "本场",
    "statuses": [],
    "sources": [
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/?v=13",
        "title": "非官方玩家图鉴：Second Wind 卡文转录（未采用 Interactions）",
        "locator": "Second Wind / Understudy",
        "accessed": "2026-10-21",
        "version": "v13"
      },
      {
        "url": "https://johnnlds.github.io/Magical-Athlete-Racers/officialrules.pdf",
        "title": "CMYK 更新版基础规则书镜像；只用于通则",
        "locator": "p14 / p15 / p20 / p23",
        "accessed": "2026-10-21",
        "version": "32页更新版；非Second Wind完整规则书"
      },
      {
        "url": "/rules/second-wind-verification.md",
        "title": "用户提供 Second Wind 官方规则书：逐卡核验记录",
        "locator": "p27 / Understudy",
        "accessed": "2026-10-23",
        "version": "用户提供的32页PDF"
      }
    ],
    "testId": "SW-36",
    "verified": true,
    "verification": "已对照用户提供 Second Wind 规则书第27页官方卡面和逐角色说明；网页差异见项目规则。",
    "imageUrl": "https://johnnlds.github.io/Magical-Athlete-Racers/images/expansion/Understudy.png"
  }
];

/** Explicit project rulings, not official Second Wind card text. */
export const SECOND_WIND_PROJECT_NOTES: Readonly<Record<string,string>> = {
  'mr-dice-guy':'项目房规（新规则v2）：六骰均不相同时，先公开本组结果，再等待当前控制者重掷整组六骰；主要移动尚未执行，不消耗额外回合。',
};
