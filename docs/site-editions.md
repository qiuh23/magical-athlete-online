# 独立站点部署与验证

本方案替代旧的服务器选择、跨站自动跳转、国内自由聊天及快捷短句/表情方案。国内与海外维护同一代码，构建和服务端策略独立。源码完成、本地验证、合并和实际发布是不同状态；本文件不宣称本次已发布。

| 发布目标 | 可信服务端配置 | 前端产物 | 本站入口配置 |
| --- | --- | --- | --- |
| 阿里云生产与预览 | `NODE_ENV=production SITE_EDITION=cn BACKEND_ID=aliyun` | `dist/client` | 单条 aliyun / Socket.IO / 同源 |
| Cloudflare 生产与预览 | `SITE_EDITION=global` Worker var | `dist/browser` | 单条 cloudflare / Worker / 同源 |

`deploy/entries.json`保留受信生产和预览的发布目标，仅供构建与发布器使用。公开 `/backends.json` 只含本站所需地址，`origin:""` 表示当前页面源。`scripts/build-sites.mjs`固定生成两套互相匹配的产物，`scripts/build-lobby.mjs`从受信源注册表裁剪各站的三款游戏入口；浏览器参数与本地偏好不能切换站点。直接 `vite build` 缺少 `SITE_EDITION` 会失败，`VITE_SITE_EDITION` 由 Vite 配置从可信构建环境注入，外部同名 VITE 变量不能覆盖。

阿里云在合并发布前更新 `/etc/magical-athlete/server.env` 与 `/etc/magical-athlete-preview/server.env`：

```dotenv
SITE_EDITION=cn
BACKEND_ID=aliyun
BACKENDS_CONFIG_JSON='{"siteEdition":"cn","backends":[{"id":"aliyun","origin":"","transport":"socketio","enabled":true}]}'
```

保留各环境原来的精确 `PUBLIC_ORIGIN`、同站旧 HTTP `PUBLIC_ORIGINS`、容量和持久化路径；删除海外 Origin。预览继续使用独立端口和数据库。旧 IP/HTTP vhost 必须指向此国内进程，不能运行缺少策略的旧服务。生产启动会验证 `site-edition.json`，发布器在激活前核对国内客户端、大厅和 registry 的模式。不能以清空数据库代替昵称迁移。

Cloudflare checked-artifact 与 Workers Builds 的可信变量由 `workerVariables` 统一生成：`SITE_EDITION=global`，`PUBLIC_ORIGINS`仅其本站源，`BACKENDS_CONFIG_JSON`为global单条。发布准备阶段核验 `dist/browser/site-edition.json`。自动发布继续通过现有 Checks → Deploy checked backends，保持已验证SHA、预览/生产目标、受限安装器、失败回滚及容量隔离。更新远端受信安装器 `install-ci.sh` 需要运维按原受审流程安装；源码变更不会自动更新实例 `/usr/local/lib/magical-athlete-deploy` 的旧副本。

昵称库在 `src/shared/site-policy.ts`，采用体育32词，不与其他游戏共享；ID作为持久化值保持稳定，显示名从库生成，编号和电脑标记独立展示。国内恢复在原数据上迁移成员并过滤历史公开交流与旧名称，保留原凭据及对局进度；国内停止新增交流及访问连接安全审计，移除交流举报和聊天处置；既有历史私有审计不删除。海外保留原有自由昵称与聊天。

本地验证：

```powershell
pnpm typecheck:release
pnpm exec tsx --test tests/site-policy.test.ts tests/backends.test.ts tests/network-backends.test.ts tests/lobby.test.ts tests/lobby-resources.test.ts tests/https-entries.test.ts tests/deployment-workflow.test.ts
pnpm build
pnpm exec wrangler deploy --dry-run
```

仅启动本地国内开发时同时为 Node 和 Vite 设置 `$env:SITE_EDITION='cn'`（Node `BACKEND_ID=aliyun`），运行 `pnpm dev` 和 `pnpm dev:client`。海外本地设置global；不要使用页面参数模拟策略。服务器安全测试的具体文件名以本次提交为准。

发布后分别核验国内、海外及各自预览的 `/site-edition.json`、`/backends.json`、`/api/connectivity`、`/deployment.json` 和大厅 `config.json`，检查模式/目标/完整SHA匹配；分别完成创建、原身份恢复、同站邀请、另一站拒绝、国内无交流与海外聊天、手机横屏和观众操作。备案信息沿用已核实配置，不因源码与本地测试推定任何公网发布状态。

国内停用访问与交流审计：更新受信安装器时安装 `disable-cn-audit.sh`，它关闭本游戏国内Nginx vhost的访问日志并停用本游戏审计cron及三款国内游戏共用的旧访问日志rotation任务，保留历史私有数据库与日志文件。新模板 `access_log off`，故障报告和游戏备份继续保留；审计preflight/maintenance在 `SITE_EDITION=cn` 时跳过。`/api/security/health` 返回 `enabled:false` 属于预期模式，不要求审计账本初始化。回滚也必须使用具有cn marker的新版产物，避免退回国内自由昵称/聊天旧版；不存在合法回滚产物时保持服务关闭并前向修复。

本次本地证据：双产物构建完成；既有发布/入口/产物契约40项通过；`tests/browser/site-editions.spec.ts` 3项通过（Chrome/Edge桌面模拟，含844×390手机横屏、真人掷骰、观战、刷新、伪造URL/存储和外国邀请码），截图位于本地 `test-results/site-editions/`。这不代表真实手机Safari、线上发布或真实国内网络验证；最终提交后仍按完整SHA核对发布状态。


## 本次本地验收（2026-11-06）

- 203项相关 Node 测试通过：站点策略、旧存档/回执、Node/Worker、海外交流恢复、浏览器主持存档、入口与现有发布契约。最终补充的旧主持显示ID和模式配置防御又通过6项CN与12项配置专项；没有重复运行无关完整游戏回归。
- 主项目及Worker类型检查、国内/海外构建、Worker dry-run通过。现有main自动发布流程和预览隔离保留；本次没有执行公网部署或合并。
- 国内浏览器3/3通过：伪造URL/localStorage、固定昵称、异站邀请、手机844×390实际掷骰、观战与刷新、本站大厅。海外真实本地workerd验证自定义昵称、自由聊天及刷新恢复，1440×900和844×390截图均已检查，pageerror为空。未在实体手机或Safari验收。
- 旧公开记录保留结构化游戏/动画数据，无法可靠重建的历史文字及旧技能提示使用固定文案；角色和卡牌显示编号校验不接受自由文字。旧管理员私有审计文件保持原样。

截图位于本地 `test-results/site-editions/`（不提交Git）。发布前仍须按上文更新实例固定工具与环境；源码/本地验证完成不等于实际线上状态已改变。
