# 运动会发布故障复核与 UI 统一验收

## 核实范围

2026-11-11（北京时间）检查 `qiuh23/magical-athlete-online` 最新 main `7cc70a7f5c13517916edbd73e4c595a5c4065625`。既有 GitHub `Checks → Deploy checked backends` 成对发布阿里云与 Cloudflare；保留正式/预览、国内/海外入口和身份数据隔离，不启用新的托管或重复发布链。

## 最近失败的发布

- [Checks 42971134908](https://github.com/qiuh23/magical-athlete-online/actions/runs/42971134908)：成功，精确源为上面的 main SHA。阿里云产物 ZIP 68,498,048 bytes，Worker 产物 ZIP 47,091,967 bytes。
- [Deploy checked backends 42971277399](https://github.com/qiuh23/magical-athlete-online/actions/runs/42971277399)：失败。Cloudflare 发布步骤先成功；阿里云云助手 `t-hz072rjqpmcg9hc` 从 14:17:41 执行到 14:32:41，`ErrorCode=ExecutionTimeout`，900 秒超时，执行输出为空。失败发生在部署阶段，不能归为前端构建失败。
- 两端回滚步骤成功。Cloudflare 恢复到版本 ID `e3404b7b-fe7f-4d46-9917-76e314780d3d`。线上元数据与主机 current 指针也确认了实际恢复状态。

失败记录没有输出安装器阶段，因此不能仅凭它断言是下载、部署锁或其他具体调用阻塞。代码原先在等待部署锁和等待下载完成前都没有进度输出；下载超时与云助手命令超时同为 900 秒，云助手外层可能先结束并掩盖内层原因。

## 故障后实际状态

截至本次 21:16 的只读复核：

| 目标 | 实际提交 | 构建记录 |
| --- | --- | --- |
| [国内运动会](https://athlete.magical-athlete-online.cn) | `bad3bdad0501220b24009eb811e519f0238c96b6` | `42224495621` |
| [海外运动会](https://magical-athlete.qiuh23.workers.dev) | `bad3bdad0501220b24009eb811e519f0238c96b6` | `42224495621` |

国内通过 HTTPS 请求 `/deployment.json`、`/site-edition.json`、`/backends.json`、`/api/connectivity` 核实为 cn / aliyun / 同源。海外 `/deployment.json` 通过已登录浏览器直接读取；本机终端请求海外入口遇到 403，未将该终端结果当作站点宕机。

只读主机诊断云助手 `t-hz072sl4wudw4xs` 成功，未写游戏配置或数据：

- current 指向 `bad3bdad0501220b24009eb811e519f0238c96b6-42224495621`；previous 为 `1416de8c911419456f57e8eb8cf6b7fade85ec91-42209071463`。
- `/` 与 `/tmp` 可用约 21 GiB，45% 已用；可用内存约 1,142 MiB，交换区未使用。
- 未发现残留的部署锁持有者或本次临时产物文件。
- 已安装 `ci-install.mjs` SHA256 为 `edaea59248c02bb05931a421d7d2471a3128fafd43c2a38c2d4a00f131585726`，与核实的 main 源文件一致。
- 到失败产物所在 Azure `productionresultssa6` 与旧成功产物所在 `productionresultssa14` 的不带签名 HEAD 请求均约 1 秒返回 400，说明复核时基础连接可达。这不能反证当时 68 MB 文件传输没有停滞。

## 本次修复

`ci-install.mjs` 在解包前实施有界下载：30 秒无数据中断，每次最多 180 秒，最多 3 次，重试间隔 2/4 秒；每次重新创建文件与 SHA256 摘要，不续用损坏片段。403 等权限失败、体积超限、SHA256 不符立即失败。最坏下载预算约 546 秒，小于云助手 900 秒，为后续安装和失败处理留出时间。部署锁等待改为 60 秒，保留原目标锁与互斥方式。

固定阶段标记记录锁、下载开始/进度/验证、解包、安装与完成。下载失败信息只含固定原因和字节数，不含临时签名 URL 或底层异常。`ci-release.mjs` 在云助手失败时只显示白名单内的阶段标记，原始输出继续留在云助手。未扩大云权限、允许来源、目标、容量或安装范围。

修复须同步到 ECS 的 root-owned 安装器才会作用于阿里云安装。按 [既有主机工具升级约定](host-site-edition-upgrade.md) 从已核实 main 取源，核验旧/新 SHA、同时取得生产与预览锁、保留 root 私有备份后原子替换 `ci-install.mjs`，保持 root:root / 0644。该步骤不切换应用或重启服务；应用更新仍经既有 main 成对发布。

## 本地验证与发布状态

- `pnpm typecheck`：通过，保留 strict，并补齐两个既有 Cloudflare 部署辅助脚本的准确声明。
- Node 24 / Python 3.12 下 `tests/ci-installer.test.ts` 与 `tests/deployment-workflow.test.ts`：19/19 通过。新增测试覆盖中断流重下、SHA/权限/大小失败不重试、无数据中断与重试上限、输出白名单和签名 URL 不泄露。
- 系统 Python 3.9 初跑时已有提取测试因缺少 `tarfile.extractall(filter=...)` 失败；换用随运行时提供的 Python 3.12 后全部通过，没有为本地旧解释器放宽提取校验。
- 此段记录的是本地修复和故障前后证据。新 UI 与修复的最终提交、主机工具升级结果、两端上线完整 SHA 和浏览器验收应在最终发布完成后补记，不能从本地检查通过推定已经上线。
