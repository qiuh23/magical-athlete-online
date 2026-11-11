# 比赛积分与效果提示验收 · 2026-11-11

左下头像使用当前控制者的公开 `PlayerView.score`，与奖杯积分榜读取同一份已确认玩家数据。动画中的位置和完赛状态仍跟随原播放队列；积分不会从名次、动画日志或角色身份重新计算。席位、基础顺序、行动高亮、完赛名次、出局状态与角色详情入口均保留，右上小地图的位置和格数没有改动。

普通效果卡采用“简短效果名称 / 发动者 → 目标或结果”的布局，头像统一尺寸，位移数字放在卡内。多目标展示两名角色及“另 N 人”，其余目标和各自结果保留在无障碍名称与悬停说明中。赛场角色使用公开赛事图示或角色身份，不借用当前行动玩家的头像。

复制／获得能力卡单独展示接收角色、公开获得的能力和有效期。私人抽牌只显示公开张数。目标选择框保留确认按钮、收起／展开和详情入口，选项、权限及私人投影逻辑没有改动。狭小视口内选项可纵向滚动；展开和收起状态都为头像条与小地图保留空间。没有新增播放计时器，也没有改动暂停、跳过、重连和事件去重代码。

本地验证结果：

| 验证 | 结果 |
| --- | --- |
| 相关单元测试（9 个文件） | 105 项通过 |
| 国内版浏览器用例 | 11 项通过 |
| 海外版浏览器回归 | 46 个场景通过：整套运行 45 项通过；大厅暂停按钮的过期断言更新后，剩余 1 项单独复跑通过 |
| 生产代码及 Worker 类型检查 | 通过 |
| 国内版、海外版构建 `pnpm build` | 通过 |
| Worker `wrangler deploy --dry-run` | 通过 |
| `git diff --check` | 通过 |

最终的 320px 紧凑标题和并排目标按钮在两版分别复跑 2 项，均通过；目标按钮在初始视口内完整可见，其他选项仍可滚动操作。

| 检查范围 | 覆盖情况 |
| --- | --- |
| 积分 | 0 分、技能加分、扣分及负分；两角色共享同一玩家总分；控制权交换及旧动画角色；完赛、出局、观战；下一场新角色 ID |
| 效果卡 | 单目标 4→3、多目标不同起点、长名称、赛事角色、复制两种能力、空获得及私人抽牌张数 |
| 操作框 | 目标选择、详情不触发选择、收起后头像可点击、展开后继续选择、旁观者不可代选、私人抽牌不外泄 |
| 播放 | 技能因果顺序、骰点确认、同时移动、暂停／恢复、跳过、重复快照及刷新不重播 |
| 视口 | 1440×900、390×844、320×667、667×375、568×320；现有回归另含桌面、平板及其他横屏尺寸 |

截图来自本机 Microsoft Edge / Chromium 的浏览器模拟，使用本地测试房间与测试角色；没有进行真实手机、iOS Safari 或移动网络验证。两站分别构建并加载对应前端；海外版浏览器验收由本地 Socket.IO 测试服务推送公开快照，Worker 另作本地打包检查，没有部署生产环境。

关键截图：

| 场景 | 国内版 | 海外版 |
| --- | --- | --- |
| 桌面多目标效果与累计积分 | [截图](cn-desktop-multi.png) | [截图](global-desktop-multi.png) |
| 手机竖屏传送 4→3 | [截图](cn-portrait-warp.png) | [截图](global-portrait-warp.png) |
| 568×320 短横屏获得能力 | [截图](cn-small-landscape-ability.png) | [截图](global-small-landscape-ability.png) |
| 手机目标选择与头像条 | [截图](cn-portrait-choice.png) | [截图](global-portrait-choice.png) |

可复现的本地命令（PowerShell）：

```powershell
pnpm install --frozen-lockfile
pnpm typecheck:release
pnpm exec tsx --test tests/race-order.test.ts tests/race-ui.test.ts tests/ability-reveal.test.ts tests/presentation.test.ts tests/presentation-events.test.ts tests/ability-projection.test.ts tests/character-context.test.ts tests/room-pause.test.ts tests/three-player-mode.test.ts
pnpm build
pnpm exec wrangler deploy --dry-run

# pnpm build 留下国内版 dist/client 与海外版 dist/browser。
$env:SITE_EDITION='cn'
pnpm exec playwright test tests/browser/score-effects.spec.ts --reporter=list

# 本地 Socket.IO 测试服务从 dist/client 提供页面，换成海外版产物。
$env:SITE_EDITION='global'
pnpm exec vite build
pnpm exec playwright test tests/browser/score-effects.spec.ts tests/browser/immersive-race-ui.spec.ts tests/browser/ability-reveal-intro.spec.ts tests/browser/choice-ability-hints.spec.ts tests/browser/presentation-sequence.spec.ts tests/browser/room-pause.spec.ts tests/browser/minimap-readability.spec.ts tests/browser/race-hud-layout.spec.ts --reporter=list --timeout=90000
```

新用例的全部截图保存在被 Git 忽略的 `.local/qa/score-effects/`；此目录只收录上述八张关键截图。截图通过现有暂停／恢复机制检查稳定布局，并在正常播放时拍摄，不隐藏页面组件。

完整 `pnpm typecheck` 仍被未改动的 `tests/deployment-workflow.test.ts:52-53` 中两个 TS7016 阻断：`scripts/deploy/cloudflare-retry.mjs` 和 `scripts/deploy/cloudflare-command.mjs` 缺少类型声明。生产源代码与 Worker 的 `pnpm typecheck:release` 通过。构建保留原有大包提示；本次没有修改依赖、CI 或发布流程。
