# GitHub 自动发布

> 2026-11-06：本站独立策略以 [独立站点部署与验证](site-editions.md) 为准。旧服务器选择、跨站自动跳转、跨站Origin和国内聊天描述已被替代；下文既有公网证据只反映当时状态，不能作为本次发布证明。

用户选择：PR 检查通过后更新测试入口，合并到 `main` 并检查通过后更新两个正式入口，不自动合并 PR。单台 ECS 上共用运行环境但隔离服务、数据和权限；没有另外购买服务器。

| 环境 | Cloudflare | 阿里云 | 每端真人房配额 |
| --- | --- | --- | --- |
| 正式 | https://magical-athlete.qiuh23.workers.dev | https://athlete.magical-athlete-online.cn | 14 |
| 共用预览 | https://magical-athlete-preview.qiuh23.workers.dev | http://115.29.188.62:8080 | 1 |

合计最多 30 个真人房。预览是最新一个检查成功的本仓库 PR 共用的环境，页面显示 PR 和提交；新版本会替换此前预览代码。它不是每个 PR 独占一台服务器。正式和预览使用不同 Worker/Durable Objects、Node 服务、端口和 SQLite 目录；房间码在对应入口内使用，预览不会读取正式凭据。

`Checks` 明确检出 PR head，全部必需检查通过后打包同一份 Linux Node 24 产物及预编译 Worker。打包时没有云端凭据，不在低配 ECS 重做编译。两端验收成功后，受信发布作业删除本次两个已消费的构建产物，避免持续占用 GitHub 存储；失败或未发布的产物最多保留一天，过期后重新运行对应检查。共享预览以最新仍然开放且 head 未变化的成功 PR 为准，过时、关闭或失败的 PR 不发布。同仓库分支的 PR 不限制作者，同学的 PR 合并到 `main` 后同样自动发布正式环境，不改变任何合并权限。

2026-11-05 按用户明确要求，自动 main/PR 默认改为 **release**：Linux Node24 + 冻结依赖安装、严格生产源码与 Worker 两套类型检查、发布/入口/协议/版本/安装器的轻量契约测试、双客户端与服务端构建、Worker 打包预演，随后按完整源 SHA 校验并打包同一可信产物。工作流仍叫 `Checks`，原 workflow_run 发布链、当前 main/精确产物来源、摘要、权限隔离、备份/回滚与部署后公网完整 SHA、registry、HTTP/实时验证均保留。

默认 `typecheck:release` 的主配置继承原 strict 配置，只把检查根限定为 src 与 Vite 配置，保留 client/server/engine/shared，Worker 仍由原配置单独检查。原 `typecheck` 继续检查全部 src/tests/Playwright 配置，供本地和显式手动套件使用；未减弱生产源码 strict。自动 release 不安装浏览器，不运行 Playwright、八人整局、截图或全量玩法单测；旧 `Validation-Scope` footer 也不会使自动发布进入 UI 套件。

完整玩法/浏览器检查应在本地运行；需要远端复核时显式手动运行 Checks 并选择 `all`、`eight-only`、`ability-interactions` 或 `deployment`，原入口保留，手动默认也是 release。手动 deployment 涉及 engine/shared 时仍保留原 eight-only 保护。手动检查不会生成自动发布候选，自动发布仍只接受当前 main push 或受信 PR 的成功产物。

默认契约文件：`ci-validation-scope`、`deployment-workflow`、`ci-installer`、`build-info`、`deployment-info`、`deployment-capacity`、`https-entries`、`backends`、`lobby`、`lobby-resources`、`dual-backend-worker`、`dual-backend-server`、`network-backends`（均在 tests/，后缀 .test.ts）。覆盖固定受信入口、单站模式与精确同站 Origin、HTTP/实时协议、身份隔离、源 SHA、包来源/解包边界与回滚契约，不跑完整比赛或浏览器。本地完整回归仍用 `pnpm typecheck`、`pnpm test` 及原 Playwright 配置。

## 自动发布的唯一归属

运动会的目标是仅保留 `Checks → Deploy checked backends` 成对发布 CF 与阿里云：同一提交分别验证的国内 Linux 产物/海外预编译 Worker、同一完整提交、同一受信发布器和失败回滚。此前还实际存在 Native Cloudflare Workers Builds 的 main 直接构建发布，曾在 GitHub 验证尚未完成时先更新 CF，造成重复构建与两端版本错位。原成对链的 e3 发布（Checks41867131447、release41869680169）已真实成功。

**2026-11-05 已在控制台关闭并刷新回读确认：** `magical-athlete` 生产设置的“禁用构建”从 0 改为 1、保存后整页刷新仍为 1。Git 仓库连接和 main 分支保留，原 `pnpm build` / `pnpm exec wrangler deploy` / 根目录 `/` 未改；没有删除 Worker、修改绑定或扩大令牌权限。后续运动会仅由原 GitHub 成对链发布，不能再用 Native Builds 提前更新 CF。需要回滚该开关时，可将它恢复为 0；恢复前先明确唯一生产发布所有者，避免再次双重发布。巫师牌的唯一 CF Builds 保持开启，其实际命令已只读核实为 `npm run build:cloudflare` / `npm run deploy:cloudflare`，与 GitHub 阿里云发布各有目标。

fork PR 可以运行无密钥检查并生成产物，但不自动获得预览云权限。维护者检查该提交后，可手动运行发布工作流，填写对应 Checks run ID 并勾选 `allow_fork_preview`。受信控制脚本核对操作者具有 write/maintain/admin 权限、精确 fork/提交和成功产物，仅批准这次共享预览；这不会限制 fork PR 的正常合并，也不会将它直接发布正式环境。

`Deploy checked backends` 在 `main` 上运行，严格核对原始 Checks 工作流、仓库、当前 PR/main SHA 和产物摘要，然后调用受信的可复用发布工作流。带凭据的作业只检出 `main` 的控制脚本，不执行 PR 的 npm 脚本或配置文件；PR 产物作为已核验数据发送至目标云。两个环境各自串行发布，发布前再次排除过时提交。

阿里云用 GitHub OIDC 换取短期 STS，只授权固定 ECS 和对应部署用户。通过云助手传递临时签名产物地址、SHA256 和提交，不向 ECS 发送 GitHub token，也不开放 GitHub SSH 网段。宿主机固定 sudo 安装器验证来源地址、ZIP、Linux 包及部署标记，再使用已有在线备份、原子切换和健康检查；预览用户不能安装正式目标。部署后检查两个入口的提交、规则/协议、HTTP 与实时探测，探测不建房。

先记录 Cloudflare 旧版本，再更新两端；后端安装或验证失败时尝试恢复两端旧版本。跨云发布不具备原子事务，失败的工作流必须检查回滚步骤；首次预览尚无旧 Worker 时无法回滚一个不存在的版本。不要中途取消正在切换的发布作业，若取消或云助手结果超时，先核对实际版本再重试同一检查。

## 一次性配置

工作流文件先随 PR 合入 `main` 后，自动触发器才会生效；不会为安装自动发布而擅自合并该 PR。启用前需要：

- GitHub `preview`、`production` environments；正式环境仅允许 `main`。
- 环境变量 `ALIYUN_ROLE_ARN`（各环境不同）、`ALIYUN_OIDC_PROVIDER_ARN`、`ALIYUN_REGION_ID`、`ALIYUN_INSTANCE_ID`、`CLOUDFLARE_ACCOUNT_ID`。
- 环境 secret `CLOUDFLARE_API_TOKEN`，仅授予所需 Worker 发布权限；不复制本机 OAuth 刷新凭据。
- 仓库变量 `AUTO_DEPLOY_ENABLED=true`，仅在云权限和宿主安装器验证成功后设置。
- 宿主机安装 `scripts/deploy/install-ci.sh`，分别配置正式与预览服务、用户、持久目录以及 14/1 配额；凭据不入库。

初次合入前，可临时设置 `AUTO_DEPLOY_BOOTSTRAP_VERIFY=true`，运行独立的 `Deployment authorization check`。它不检出 PR、不发布应用，仅使用官方固定版本的 OIDC/CLI action，以预览部署用户运行一次 `id -un` 并查询结果，证明真实 GitHub → STS → 指定 ECS 的权限链路。验证后关闭此变量；正式角色受 `main` 环境规则限制，在工作流合入并首次正式发布前不宣称已验证。

日常只需提交 PR，检查通过后在 `Deploy checked backends` 的运行摘要打开两个预览入口；合并到 `main` 后正式入口自动更新。无需自动合并。需要重新部署仍保有产物的成功检查时，可手动运行发布工作流并填写 Checks run ID；若产物已在成功发布后清理或已过期，先重新运行 Checks。手动发布仍核对当前 PR/main 和产物，不能借此发布旧提交。

HTTP 公网、备案与 HTTPS 上线状态分别验收：国内新 HTTPS 大厅和两个游戏子域现已完成可信 TLS、资源及定向游戏/WSS 检查，旧 HTTP 地址兼容保留。2026-11-05 初查时曾观察到 Native Builds 在 GitHub Checks 排队时先更新 CF、阿里云仍旧版；该历史现象也是关闭重复触发的原因。新流程同样必须分别核对最终两端完整 SHA、配置、运行记录和资源，不能把合并或某个构建成功当作公网发布完成。实际证据与历史快照见 [本次审计](lobby-deployment-audit-2026-11-05.md)。

当前构建使用 `scripts/build-sites.mjs`分别固定cn Node与global Worker，发布包不能共用同一站点配置。模式marker和本站registry均在打包、实例激活与发布后验证；生产/预览隔离不变。国内停止新增交流与访问安全审计，现有受信安装器须更新后才能使用新的停审计与模式校验流程；历史审计记录保留，游戏与故障数据继续保存。详情见 [独立站点部署与验证](site-editions.md)。
