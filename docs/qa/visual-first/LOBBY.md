# 一起玩大厅：插画与选择优先

基线：2026-11-06 拉取的 `origin/main`，`7e5717c3d8038a0f7eff6bd589db042efbec34f4`。先运行基线页面再修改，源配置按现有 `build-lobby.mjs` 投影成独立国内／海外配置后本地提供。没有用源码字符串数量代替可见页面审查。

## 删减与替换

| 原先可见内容 | 修改后 |
| --- | --- |
| 页首品牌副标题、口号、大标题下两句介绍、第二个选择标题 | 品牌＋一个“今天玩什么？” |
| 每卡玩法副标题、宣传句、练习／联机说明 | 保留原有完整 SVG 插画、游戏名称和“进入” |
| 卡坦岛过时的“3–4 人” | 删除人数宣传；实际人数选项仍由各游戏负责 |
| 常驻随机名／聊天说明、跨站房间说明、页尾口号 | 页首小站点标识；邀请上下文才显示本站限制 |
| 出错只让玩家阅读刷新提示 | 明确错误与“刷新重试”按钮；结束 aria-busy 状态 |
| 手机大卡堆叠，第三款在很远的下方 | 横向插画卡，三个入口在首屏可见，字号保持 21–22px 起 |

原插画、掷骰局部动效、减少动态效果、整卡链接与键盘焦点保留。SVG 装饰设置 `aria-hidden`，链接用游戏名及当前“进入／加入房间／观战”动作提供无障碍名称。没有新增跨站切换。`lobby/routing.mjs` 和站点构建配置未改，邀请的本站校验、角色、房间码、过滤令牌／跳转参数均沿用原实现。备案原文“京ICP备2026075006号-1”和 `https://beian.miit.gov.cn/` 保持原样。

## 前后截图

| 本地实际页面 | 前 | 后 |
| --- | --- | --- |
| 国内桌面 1440×900 | [前](lobby-cn-before-desktop.png) | [后](lobby-cn-after-desktop.png) |
| 国内竖屏 390×844 | [前](lobby-cn-before-portrait.png) | [后](lobby-cn-after-portrait.png) |
| 国内横屏 844×390 | [前](lobby-cn-before-landscape.png) | [后](lobby-cn-after-landscape.png) |
| 海外桌面 1440×900 | [前](lobby-global-before-desktop.png) | [后](lobby-global-after-desktop.png) |
| 海外竖屏 390×844 | [前](lobby-global-before-portrait.png) | [后](lobby-global-after-portrait.png) |
| 海外横屏 844×390 | [前](lobby-global-before-landscape.png) | [后](lobby-global-after-landscape.png) |

另保留两站 320×720 窄屏和 768×1024 平板截图。插画无裁切，三个卡片都保留 44px 以上的动作区。桌面、竖屏及横屏已逐图查看。

## 验证

- `node docs/qa/visual-first/lobby-review.mjs --before`：双站各五尺寸，10 个基线页面通过。
- `node docs/qa/visual-first/lobby-review.mjs`：双站各五尺寸，10 个优化页面通过；无横向溢出，三个入口都位于首屏；图像解码、备案链接、本站三入口、44px 动作区、标题与入口不重叠、键盘焦点通过。
- 同一脚本验证三游戏邀请只启用对应卡、返回选择清除查询、外站邀请拒绝且不跳转、邀请不携带令牌／任意跳转、503 错误和刷新恢复；无页面脚本异常。详细布局测量见 `lobby-{before,after}-results.json`。
- `node node_modules/tsx/dist/cli.mjs --test tests/lobby.test.ts tests/lobby-resources.test.ts tests/lobby-catan-art.test.ts`：6/6 通过，覆盖独立站点、邀请与配置约束、双产物资源、国内允许资源列表和插画拓扑。

现有 `tests/browser/lobby.spec.ts` 仍包含早期双站切换和 v1 配置断言，与本次基线已有的独立站点实现不符，未把这套过时断言作为本轮通过项；本轮实际独立站点行为由上述脚本验证。

未覆盖：实体 iPhone／Android、Safari、系统辅助技术、移动网络、生产 DNS／TLS 及线上房间。浏览器为本机 Edge，手机为视口模拟。没有触发远端 CI、生产部署或改动工作流／凭据；交付为审查分支 PR，合并后的部署继续由既有 main 流程管理。
