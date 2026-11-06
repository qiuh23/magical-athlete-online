# 运动会首页视觉验收

基线：`origin/main` 的 `a8ada023e59ba428ca9c4941679e708c459b5789`。在独立 worktree 中修改，仅涉及首页样式及两条房间可见性选项的精简文案。

## 视觉方向与范围

保留怪咖角色、倾斜大标题和跑道插画，以浅草绿底、深绿主要操作及少量骰子黄建立清楚的入口层级。沿用统一入口原则：44–48px 操作目标、10–12px 控件圆角、8/12/16/24/32 间距、清楚焦点、克制阴影。创建房间、现有房间、自己练习和人机对战仍直接呈现。

首页背景、页头和页脚均用 `body:has(.home)` 限定；表单、按钮及输入框样式限定在 `.home`。没有调整对局画面、联机协议或房间状态。既有比赛方案、可重复及排序地图、角色包、人数玩法和特殊赛事保持直接可见。首页提交条改为正常文档流，避免短横屏下遮住配置；320px 宽的预设说明允许换行，房间可见性选项缩短为“公开 · 房间列表可见”和“私密 · 凭邀请或房间码加入”。

## 前后截图

截图为本机 Microsoft Edge / Playwright 实际浏览器运行，页面全高截图。`before` 取自未修改 main，`after` 为最终代码。

| 视口 | 修改前 | 修改后 |
| --- | --- | --- |
| 桌面 1440×1000 | [before](athlete-before-desktop.png) | [after](athlete-after-desktop.png) |
| 手机竖屏 390×844 | [before](athlete-before-portrait.png) | [after](athlete-after-portrait.png) |
| 手机横屏 844×390 | [before](athlete-before-landscape.png) | [after](athlete-after-landscape.png) |

已逐张查看三组前后截图，以及 [桌面建房](athlete-after-create-desktop.png)、[竖屏建房](athlete-after-create-portrait.png)、[横屏建房](athlete-after-create-landscape.png)、[320px 建房](athlete-after-create-small.png)：标题、角色、入口卡片、按钮和输入框没有相互覆盖，配置选项没有被提交条遮住。

## 本地验证

- 实际运行：前端 `http://127.0.0.1:5181/`，Node 后端 `http://127.0.0.1:3191/`；本地 Vite API/Socket.IO 代理覆盖仅存在启动参数中，未修改仓库部署配置。
- `node docs/qa/entry-design/athlete-check.mjs` 通过：1440×1000、390×844、844×390、320×700 无水平溢出和 pageerror；键盘切换入口不自动展开、Enter 展开、返回恢复焦点；昵称/人数/时限/角色包草稿跨模式保留；练习和人机入口可用；邀请房间码和观战预选保留；返回大厅指向既有 Cloudflare 大厅；线路设置可打开且当前线路禁用。
- 按最终浏览器计算样式测量主入口：默认对比度 **7.08:1**，悬停 **9.04:1**，键盘焦点 **7.08:1**，禁用 **5.19:1**；键盘焦点为可见 3px 实线。测试禁用外观时设置原生 `disabled`，不修改应用状态。
- `node --import tsx --test tests/backends.test.ts tests/network-backends.test.ts`：**12/12 通过**，包含可信入口、跨服邀请、旧码判定、凭据/角色隔离、未确认建房请求重试的既有检查。
- [可复跑截图脚本](athlete-review.mjs)、[交互与样式检查脚本](athlete-check.mjs)、[测量结果](athlete-check-results.json)。可通过 `ATHLETE_REVIEW_URL` 指向其他本地运行地址。

全仓 build/typecheck 以及既有完整首页浏览器回归结果见本 PR 的总体验收记录。

## 设计参考与素材

- [Impeccable](https://github.com/pbakaus/impeccable)：按视觉层级、字体可读性、间距、对比度、响应式和可访问反馈审查现有界面。
- [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)：使用题材特定的角色与跑道作为记忆点，先定义紧凑的颜色/字体/布局原则，再截图自审并减少装饰。
- 所有头像、SVG 图标和程序化跑道沿用仓库已有资源（`src/client/avatars.tsx`、`src/client/Icons.tsx` 与现有首页跑道 CSS）；没有引入外部字体、图片、图标包、运行脚本或新依赖。

## 未验证

本次为本机浏览器视口验收，未进行实体 iPhone/Android、系统键盘或移动网络测试；未进行公网部署、云端资源变更或远端手动 CI。正式合入后的阿里云和 Cloudflare 发布仍使用仓库现有流程。
