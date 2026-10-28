# 暂停按钮直接生效

2026-10-28。本次按用户最终要求仅调整暂停的交互与说明。点击“暂停比赛”直接发送暂停操作，不再打开浏览器确认弹窗；按钮旁显示冻结操作、计时与动画的说明，并通过 `aria-describedby` 关联。

原保留时间规则保持：真人房暂停后离线最多 4 小时、AI 房 30 分钟、练习房 10 分钟。共享期限、服务端、存档和续赛逻辑没有修改；完整规则仍见 [README](../../../README.md)。

## 本地验证

| 检查 | 结果 |
| --- | --- |
| `pnpm exec tsx --test tests/room-management.test.ts tests/room-lifecycle.test.ts tests/room-pause.test.ts` | 44/44，通过，沿用原时间边界测试 |
| `pnpm exec playwright test -c playwright.room-management.config.ts` | 8/8，通过；本地 HTTPS Worker 与 Node，桌面与手机，三种模式 |
| `pnpm exec playwright test tests/browser/room-pause.spec.ts` | 5/5，通过；选卡、骰面阅读、移动、决斗、六骰与入场暂停 |
| `pnpm typecheck` | 通过 |
| `pnpm build` | Node 与浏览器产物构建通过，保留已有的大 chunk 提示 |
| `git diff --check` | 通过 |

暂停与恢复的浏览器检查会捕获并拒绝意外原生弹窗，验证单次点击生效；踢人仍保留原确认流程。提示的 4 小时、30 分钟、10 分钟与退出说明分别核对。手机检查包含横向溢出、恢复按钮和说明可见性，以及说明与比赛状态、相机入口、暂停公告之间不重叠；最终截图另经目视核对。

新增模式提示检查位于已有的本地显式配置，未修改 CI 工作流、范围脚本或默认远端测试选择，也未手动调度额外远端工作流。没有部署或合并。

## 界面证据

桌面选秀：按钮旁直接显示说明。

![桌面暂停说明](desktop.png)

手机比赛：暂停说明与比赛状态、相机入口分别留位。

![手机比赛暂停](mobile.png)

手机 AI 房：继续显示原有的 30 分钟。

![AI 房保留原时间](ai-mobile.png)
