# 胡闹运动会 UI 阶段 3：字号、圆角、间距归一

基线：阶段 2 的 `932eaebebc7454f2197a9d80f36d0fe9a5655f95`。

## 范围

- 23 个现有游戏 CSS 文件统一字号、字重、字体引用、圆角、间距、动效和语义层级，没有新增 CSS 文件。
- `ui-theme.css` 仍是唯一全局 token 来源。删除已完成迁移的 `--yellow / --ink / --green / --pink` 别名，所有引用改为品牌/正文 token；`App.tsx` 仅替换骰子 SVG 的两个样式变量引用。
- 大厅 CSS 与大厅 baseline 元数据不变。游戏逻辑、状态、网络、服务端、DOM 和可访问性属性均未改动。非动效媒体条件逐项比对基线一致；阶段 4 配色/卡片/HUD/断点改造未实施。

## 尺度前后

| 项目 | 原先 | 本阶段 |
| --- | --- | --- |
| 正文和控件字号 | 6–118px、rem、流式混用 | 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 32px |
| 小字 | 248 处正数字号低于 11（含 1 处 rem） | CSS 信息文字声明不低于 11px |
| 字重 | 400–950，含 650/750/850/950 | 400 / 500 / 600 / 700 / 800 |
| 展示数字 | 9 处 Arial Black 散写 | `--font-display`；成绩、倒计时、席位、骰子读数也沿用 |
| 印刷/阅读衬线 | Georgia / Noto Serif 各处散写 | `--font-print` / `--font-reading` |
| 圆角 | 3–30px 及 rem 等 | `--radius-sm/md/lg`；保留方角和圆形 |
| padding / margin / gap | 1–60px 散值 | 0 / 4 / 8 / 12 / 16 / 24 / 32px；保留百分比/视口/安全区与控件避让计算 |
| 动效 | .12–.3s 及运行时注入时长 | `--duration-1/2/3`，统一 cubic-bezier(.2,.7,.3,1) |
| 层级 | -1–250 共 31 个数值 | `--z-base/sticky/dock/banner/menu/modal/toast` |

## 版式与例外

- 小屏卡牌印刷标题允许换行，压缩装饰而不缩回小字。卡牌建立局部层叠上下文，保证键盘焦点、徽章和印刷行不会盖过全局确认操作栏。
- 传送门标牌最小高 32px、自然高度，容纳加大的文字与 padding；拥挤席位徽章采用 line-height:1。
- 聊天关闭按钮和练习底部操作区保留原 60px 避让，写为触控尺寸 + 16px。
- `.sr-only` 的 -1px margin 是可访问性裁切几何，保持原值。
- 首页 hero 的既有流式标题采用文档明确允许的 32px 基准、96px 上限。这是九档静态字阶之外唯一的展示字例外，不是新的首页视觉方案。
- 举报 summary 的原文字仍为 0，用同一元素上的 12px 伪元素显示“举报”；原 DOM 可访问名称保持不变，不属于可见信息小字。
- SVG 缩略图/小地图文字随 viewBox 缩放，声明为 11px 不代表屏幕上实际达到 11px。本阶段不改地图几何或 SVG DOM，不能宣称已验证其最终物理字号。
- 未删除任何活跃组件类。替换过渡别名之前全仓搜索确认其用途均为样式；完成后 `src/client` 无旧别名声明和引用。重复的 reduced-motion animation/transition 禁用规则由置零时长 token 等价接管，滚动/悬停/透明度规则保留。

## 验证

详见 PR 中最终运行结果。此文档不会将源代码检查当作实际浏览器验收。

- `pnpm typecheck`：源码、全部测试配置和 Worker 通过。
- `node --test tests/ui-scale.test.ts tests/ui-consolidation.test.ts tests/lobby.test.ts`：13/13 通过。
- `pnpm build`：国内 Node + 海外 Worker 客户端和各自大厅通过。
- `node --import tsx --test` 定向 UI / 交互回归：61/61 通过（含新增尺度测试、既有组件归属、技能选择、比赛菜单、聊天生命周期、传送门和大厅）。
- 同一 Node loader 运行默认发布契约：62/62 通过。它不运行受限的 tsx CLI IPC 启动动作。
- `wrangler deploy --dry-run`：通过，仅预演打包；没有手动部署。
- `git diff --check`：通过；大厅样式无差异、非动效媒体条件不变。
- 按用户最新要求跳过浏览器启动、三视口截图与游戏内截图；未声称 Playwright 或视觉验收通过。
