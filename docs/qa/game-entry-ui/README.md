# 游戏内线路入口优化验收

基线为 `main` `10047d9`；仅修改前端入口、房内导航及对应本地回归。保留现有黄蓝色插画风格、双服务器协议、房间、身份存储、独立游戏网址与发布流程。

## 行为

- 首页服务器双卡改为低视觉权重的当前线路标签。「线路设置」保留连接重试及「切换服务器」。
- 页首「返回游戏大厅」返回当前服务器对应的纯净大厅 URL。切换入口使用同一个 URL 加 `#choices`，在统一大厅选择另一线路。普通返回不携带游戏、房间、令牌、查询或片段。
- 国内大厅为 `https://magical-athlete-online.cn/`，Cloudflare 大厅为 `https://magical-athlete.qiuh23.workers.dev/lobby/`，与 `lobby/config.json` 一致。
- 房内与比赛菜单中的两种导航均先确认。取消继续当前房间；确认只作整页导航，不调用离席、解散、清除身份或迁服。说明中提示原入口恢复及计算房主离页影响。
- 正在创建/加入与未确认建房回执期间阻止大厅导航。导航确认状态在首页及浏览器路由切换时复位。
- 保留旧房间码所属服务器确认、邀请前缀优先于本地偏好，以及原身份与观众刷新恢复。

## 实际截图

本地实际渲染截取，均无横向溢出。`before-*` 为修改前构建，`after-*` 为最终构建；浏览器通过真实本地 Node/Socket.IO 服务获取配置与游戏数据。

| 尺寸 | 修改前（Edge / Chromium） | 修改后（Edge / Chromium） | 修改后（WebKit） |
| --- | --- | --- | --- |
| 1440 × 1000 | [桌面](before-desktop.png) | [桌面](after-desktop.png) | [桌面](after-desktop-webkit.png) |
| 390 × 844 | [手机竖屏](before-portrait.png) | [手机竖屏](after-portrait.png) | [手机竖屏](after-portrait-webkit.png) |
| 844 × 390 | [手机横屏](before-landscape.png) | [手机横屏](after-landscape.png) | [手机横屏](after-landscape-webkit.png) |

人工查看了桌面、手机竖屏及横屏图片：页首导航可用，当前线路行紧凑，展开设置使用文档流，游戏入口与原有插画完整保留。

## 本地检查

环境：Windows，Node `26.13.0`，Playwright，Edge/Chromium 与本地安装的 WebKit。

| 命令 | 结果 |
| --- | --- |
| `npm test` | 1471 / 1471 通过 |
| `npm run typecheck` | 通过，含 Worker TypeScript 检查 |
| `npm run build` | 通过，客户端、Node 和 browser 构建；既有分包体积提示仍在 |
| `npx playwright test tests/browser/dual-backend.spec.ts tests/browser/home-entry.spec.ts --reporter=list` | 两文件 17 项均得到通过结果；一次桌面用例遇到 Chromium `Target crashed`，该项孤立重跑通过 |
| `node scripts/game-entry-review.mjs` | 通过；53 请求，`errors=[]`，见 [结果](result.json) |
| `$env:BROWSER_ENGINE = 'webkit'; node scripts/game-entry-review.mjs` | 通过；67 请求，`errors=[]`，见 [结果](result-webkit.json) |
| `git diff --check` | 通过 |

导航专项检查：创建中门禁、同线路返回与切线 URL、取消保留房间、确认后浏览器 Back 恢复同一身份、跨入口观战邀请覆盖冲突偏好并丢弃私密参数、观众刷新。专项使用两个临时本地真实 Node 权威端；大厅导航目标由本地 HTML 响应替身接管，不访问生产大厅或创建生产房间。WebKit 专项等待 Socket.IO 从 polling 升级到 WebSocket 后再导航，避免把被整页导航中止的 polling 请求误计为应用错误。

既有双端集成用例随 UI 契约更新为从统一大厅选定的独立 URL 进入游戏；本次没有重跑要求真实本地 Wrangler/双端长局的全部手动套件，也没有新增或手动触发远端 CI。

这些是桌面浏览器与 WebKit 的尺寸模拟检查；没有据此声称完成实体 iPhone Safari、真实运营商或公网部署验收。PR 暂不合并、不发布。
