# 胡闹运动会：让角色和选择先出现

游戏 UI 基线：`origin/main` **7e5717c3d8038a0f7eff6bd589db042efbec34f4**。共享大厅由同一 PR 的独立提交处理，见 [LOBBY.md](LOBBY.md)。未改服务器、规则、房间生命周期、区域策略、安全或部署配置。

## 实页发现与变化

- 原手机首页的 440px 宣传区、两段口号和入口副句使练习、人机入口落到首屏以下。现在保留游戏名、角色插画与四个明确入口，390×844 首屏可见全部入口；返回、规则和刷新复用统一 SVG。
- 删除建房与加入页的“先填昵称”“取名后加入”旧指导。国内随机昵称及换名仍保留；海外自定义昵称仍保留。错误和跨站邀请拒绝继续明确显示。
- 赛事方案增加实际赛道缩略图，角色包复用现有头像。地图、赛事、角色包、人数选项继续直接显示；预设不再重复展示完整轮换编辑，自定义或点击地图后显示排序控件。没有通过缩小字号隐藏说明。
- 候场先展示座位、准备和邀请，再展示默认展开的玩法选项。邀请码支持复制；删除常驻完整 URL、Cloudflare、邀请口号和重连教程。满员、已开赛、人数和观战状态保留，人物/眼睛 SVG 替代重复单位词。
- 保留既有沉浸赛场、镜头、地图、赛事 EventArt 与短标题；没有重造已有赛事插画。修复 compact 暂停说明缺少全局无障碍隐藏样式、手机候场旧 flex 布局、从长建房表单进入房间后停留在旧滚动位置的问题。
- 聊天点击外部收起但保留未发送草稿；改昵称有未保存确认，提交中禁止误关。通用弹窗的按钮、Escape 与背景关闭统一检查忙碌和未保存状态。修复比赛菜单打开积分/日志/地图详情时旧菜单仍覆盖新浮窗的问题。
- 原作与隐私举报入口保留。没有增加国内/海外切换入口。

## 优化前后截图

| 页面 | 之前 | 之后 |
| --- | --- | --- |
| 首页手机 | [before](game-before-portrait.png) | [海外](global-home-after-portrait.png) · [国内](cn-home-after-portrait.png) |
| 首页桌面 | [before](game-before-desktop.png) | [海外](global-home-after-desktop.png) · [国内](cn-home-after-desktop.png) |
| 建房手机 | [before](create-before-portrait.png) | [海外](global-create-after-portrait.png) · [国内](cn-create-after-portrait.png) |
| 候场手机 | [before](waiting-before-portrait.png) | [海外](global-waiting-after-portrait.png) · [国内](cn-waiting-after-portrait.png) |
| 实际赛场 | 保留既有美术 | [竖屏](global-race-after-portrait.png) · [横屏](global-race-after-landscape.png) |
| 规则 / 设置 / 结算 | — | [规则](global-rules-after-portrait.png) · [设置](global-settings-after.png) · [结算](global-results-after-portrait.png) |

Before 在原工作树 cf2cbcf 上渲染；已核对其 `src/client/` 与基线 7e5717c 没有差异。After 均来自本次最终构建产物，不以源码字符串推断可见性。附带的完整图片包含 1440×900、390×844、844×390、320×568 两区域组合。

## 本地验证

运行 `node --import tsx docs/qa/visual-first/game-review.mjs`，直接加载双区域构建产物并启动内存数据库服务。结果见 [game-review-results.txt](game-review-results.txt)。

- 国内与海外首页、建房、加入、候场、真实练习选角到比赛、规则和设置均实际打开；结算用仅限测试进程的服务端快照覆盖，不增加产品接口。
- 两区域 × 四视口均无页面横向溢出；比赛页面无需整页上下滚动。长昵称、满员、真实邀请加入、跨站邀请拒绝、断线重连、连接失败重试、重载恢复和取消解散通过。
- 国内无自定义昵称字段、无聊天入口，随机昵称可更换；海外自定义昵称、聊天及草稿保留通过。海外未提交改名的取消关闭、确认放弃通过。比赛菜单打开积分详情通过。
- `tsc -p tsconfig.release.json --noEmit`、`tsc -p tsconfig.worker.json --noEmit` 通过。
- `node scripts/build-sites.mjs` 成功构建国内 `dist/client` 和海外 `dist/browser`，保留现有大包提示。
- 配置、赛事、暂停、站点策略选定单测：38/38 通过。
- 完整 `node --import tsx --test tests/*.test.ts tests/host.test.mjs`：1495 项，1486 通过，9 失败。9 项均来自 `tests/owner-recovery.test.ts` 的旧双站配置夹具，与目前单站配置校验不匹配；在未做 UI 修改的原工作树复现相同 9 项失败，不修改网络逻辑来迎合旧夹具。
- 全量 `tsc --noEmit` 的已有基线问题：`tests/deployment-workflow.test.ts` 导入两个部署 `.mjs` 文件缺少声明（TS7016）。生产源码和 Worker 检查通过。

## 验证范围

浏览器为本机 Edge Chromium，触摸与尺寸为模拟；没有物理 iPhone/Safari、系统键盘、设备方向权限、移动网络、发热/电量验证。没有遍历全部角色技能和赛事组合；规则引擎由现有单测覆盖。既有浏览器回归套件部分仍使用旧文案定位，本次以附带双区域实际构建 QA 脚本验证新的可访问名称。没有远端 CI 重跑、合并或部署。
