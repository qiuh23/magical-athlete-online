# 骰子因果顺序、聊天定位与纯色卡牌

## 修改与依据

- 三角人先看到真实掷出的 3，再展示技能与移动；技能骰在反应前暂停时，也保留已确认的触发骰记录。惊艳者改变点数时，先显示实际投掷，再显示修正。
- 骰子先生选用已经公开的六骰结果后直接移动；真正重新投整组六骰仍有动画。触发骰与最终确认使用同一次投掷的引用，避免技能骰重复表现。
- 中立大嘴投骰明确使用场地角色名字、头像及“赛场效果骰”标签；NPC 的 3 点触发三角人时保留同一归属，之后确认原骰不再投一次。被变形的玩家仍归属其真实选手。
- 比赛聊天在 HUD 下方固定靠右，技能面板出现、消失或内容变高均不改变锚点；手机保留键盘避让，短横屏使用左右布局。移除了对权威 pending 与技能面板高度的双重定位依赖。
- 卡牌使用按角色区分的绿色、粉色、蓝色、紫色、黄色平涂背景及米白说明区，参考 `18afac3` 的单色块卡通感。保留现有 SVG 人物，去掉纸纹、拱门和枝叶场景。
- 对局仍由服务端抽样和结算；改动涉及公共表现记录及其消费，没有改规则版本、移动规则或技能条件。

## 同条件真实截图

修改前构建来自本轮起点 `dc7152a`，修改后使用本轮代码。固定同一组选角（香蕉、浪漫家、船长、三角人）、同样选中香蕉；桌面 1440×1000、手机 390×844，DPR 1。

| 条件 | 修改前 | 修改后 |
| --- | --- | --- |
| 桌面卡牌 | [截图](cards-before-desktop.png) | [截图](cards-after-desktop.png) |
| 手机卡牌 | [截图](cards-before-mobile.png) | [截图](cards-after-mobile.png) |
| 桌面详情 | [截图](card-detail-before-desktop.png) | [截图](card-detail-after-desktop.png) |
| 手机详情 | [截图](card-detail-before-mobile.png) | [截图](card-detail-after-mobile.png) |

聊天与技能面板同时展开：[桌面](chat-desktop.png)、[手机](chat-phone.png)、[900×500 横屏](chat-landscape.png)。[六骰选点](six-dice-selection.png)使用真实已确认的公开结果；[大嘴场地骰](stage-monster-die.png)显示中立角色头像及用途。

## 本地验证

2026-10-26，在本轮最终源码上：

- `pnpm typecheck`：客户端、Node 与 Worker 类型检查通过。
- `pnpm test`：1306/1306 通过，包含真实引擎的原始 3 点、惊艳者修正、技能暂停/JSON 恢复、同点真实新骰、六骰与巨嘴鸟调整、NPC 与附身选手身份检查。
- `pnpm build`：客户端、Node 与 Worker 构建通过；仍有既有的大体积 chunk 提示。
- `pnpm exec wrangler deploy --dry-run`：打包和绑定检查通过，未执行发布。
- `pnpm exec playwright test tests/browser/presentation-sequence.spec.ts tests/browser/card-background.spec.ts tests/browser/chat-layout.spec.ts --reporter=list`：初轮最终功能代码 17/17 通过，耗时约 1.9 分钟。覆盖两类大嘴场地骰与三角人连锁、单骰与六骰消重、AI 连锁、跨场和日志缺页恢复、三种聊天视口及卡牌。
- 纯色卡牌最终配色收尾：重新运行类型检查、完整构建，以及 `pnpm exec playwright test tests/browser/card-background.spec.ts --reporter=list`，1/1 通过（桌面/手机选中与详情均包含在内）。本页修改后截图已替换为最终纯色版本。
- CI 增加上述范围中的 11 项短回归，实际 `--list` 已确认包含卡牌、三种聊天视口及骰子/场地用例；`actionlint` 和 `git diff --check` 通过。既有八人冒烟仍最多一场。

## 验证边界

手机检查使用浏览器视口与 `visualViewport` 键盘高度模拟，未声称经过实体手机软键盘测试。双方对抗骰保留原有同时揭晓窗口。远端 CI、PR 预览和生产部署分别以对应工作流的实际结果为准。
