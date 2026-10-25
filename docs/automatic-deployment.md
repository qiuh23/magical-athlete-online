# GitHub 自动发布

用户选择：PR 检查通过后更新测试入口，合并到 `main` 并检查通过后更新两个正式入口，不自动合并 PR。单台 ECS 上共用运行环境但隔离服务、数据和权限；没有另外购买服务器。

| 环境 | Cloudflare | 阿里云 | 每端真人房配额 |
| --- | --- | --- | --- |
| 正式 | https://magical-athlete.qiuh23.workers.dev | http://115.29.188.62 | 14 |
| 共用预览 | https://magical-athlete-preview.qiuh23.workers.dev | http://115.29.188.62:8080 | 1 |

合计最多 30 个真人房。预览是最新一个检查成功的本仓库 PR 共用的环境，页面显示 PR 和提交；新版本会替换此前预览代码。它不是每个 PR 独占一台服务器。正式和预览使用不同 Worker/Durable Objects、Node 服务、端口和 SQLite 目录；房间码在对应入口内使用，预览不会读取正式凭据。

`Checks` 明确检出 PR head，全部必需检查通过后打包同一份 Linux Node 24 产物及预编译 Worker。打包时没有云端凭据，不在低配 ECS 重做编译。两端验收成功后，受信发布作业删除本次两个已消费的构建产物，避免持续占用 GitHub 存储；失败或未发布的产物最多保留一天，过期后重新运行对应检查。共享预览以最新仍然开放且 head 未变化的成功 PR 为准，过时、关闭或失败的 PR 不发布。同仓库分支的 PR 不限制作者，同学的 PR 合并到 `main` 后同样自动发布正式环境，不改变任何合并权限。

本轮按用户要求精简最后部署验证：提交可注明 `Validation-Scope: deployment`，保留类型、单元、构建、后端/选服/恢复/目录等短检查，跳过已经验证过且与部署无关的场景及八人整局。若该提交修改 `src/engine` 或 `src/shared`，自动恢复原对局检查；默认检查策略不变，也可手动选择 `all`。本次新增发布代码的八人单场已在打包前通过，后续仅修复产物配置，不重复该场。

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

HTTP 公网与备案状态独立：当前阿里云使用临时 HTTP，ICP 仍在审核，HTTP 不豁免备案。备案通过后按 [HTTP 切换说明](http-transition.md) 统一调整受信配置及此处入口，再验证 HTTPS；不要把“Actions 成功”当作备案通过。
