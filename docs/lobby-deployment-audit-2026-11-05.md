# 大厅与双端部署只读核查：2026-11-05

本次使用最新远端 main：运动会 `485f54fa62867d5b7193ad01027bbf886f0e5936`（PR #40 已合并），巫师牌 `aa18110e2e3240c8ab0d8f2e537dab5b6a865745`（PR #21 已合并）。检查前四个原工作区均无未提交改动，原分支保留，本次在两个独立 worktree 修改。以下为北京时间 2026-11-05 00:09 初查、00:22:25 复核的只读快照，会随后续发布变化。

## 代码、构建、实际公网分别核对

| 范围 | 构建/发布证据 | 公网实测 | 结论 |
| --- | --- | --- | --- |
| Cloudflare 大厅 `https://magical-athlete.qiuh23.workers.dev/lobby/` | main 的 [Workers Builds check](https://github.com/qiuh23/magical-athlete-online/runs/126688153475) success；版本 `2b20a9a9-50fa-4331-bdca-f6dbd5880dc7` | HTML、app、routing、style、config、favicon 全 200，MIME 正确；六个文件 SHA256 均逐字匹配 `485f54f` 的源文件 | 现有大厅已实际提供；本 PR 的路由/视觉改进尚未发布 |
| Cloudflare 运动会 `https://magical-athlete.qiuh23.workers.dev/` | 上述 CF build 对应最新 main | 页面、初始 JS/CSS、browser health 正常；`/deployment.json` 返回 547 字节 SPA HTML，不能作为版本 JSON | 构建记录及大厅源码匹配成立；当前游戏缺少可用公开 SHA 元信息，不能声称该 JSON 已验证完整 SHA |
| 阿里云旧运动会 `http://115.29.188.62/` | main [Checks 41862223740](https://github.com/qiuh23/magical-athlete-online/actions/runs/41862223740) 初查 queued，00:22:25 顶层 API 为 in_progress；最近成功成对发布为 [41392354011](https://github.com/qiuh23/magical-athlete-online/actions/runs/41392354011) | `/deployment.json` 为 `0ff8b2c30bd28d2cc50fb5d16729666a0c642bfe`，run `41390948807`；health 正常 | 仍是上一版，未因 PR 合并变成最新 main |
| 阿里云旧 `/lobby/` | 同上 | `/lobby/`、`/lobby/config.json`、`/lobby/routing.mjs` 虽是 200，但均返回 547 字节运动会 SPA HTML | 国内大厅未由旧站点提供；200 状态不能替代内容/MIME验收 |
| Cloudflare 巫师牌 `https://wizard-friends.qiuh23.workers.dev/` | [Workers Builds check](https://github.com/qiuh23/wizard-friends/runs/126687260085) success；版本 `0e773bce-0d3a-4e80-91be-4ffab28ed5cf` | build-info 完整 revision 为 `aa18110e2e3240c8ab0d8f2e537dab5b6a865745`；health v2，runtime 同源 | 当前 CF 游戏已更新 |
| 阿里云旧巫师牌 `http://115.29.188.62:8081/` | 最新 [Verify 41862175852](https://github.com/qiuh23/wizard-friends/actions/runs/41862175852) 已 success；自然触发的新 [阿里发布 41865713450](https://github.com/qiuh23/wizard-friends/actions/runs/41865713450) 自 00:17:21 起 queued，00:22:25 仍未完成；最近成功阿里发布为 [41262595419](https://github.com/qiuh23/wizard-friends/actions/runs/41262595419) | build-info 与 health revision 均为 `496603d65f460c8ff1cc4049861cc6fd63a2b26e`；v2、runtime 同源 | 仍是上一版 |
| 国内新大厅 `https://magical-athlete-online.cn/` | 配置和模板已准备；本次未安装或发布 | 本机 curl Schannel TLS 握手失败（exit 35），没有 HTTP 响应 | 暂未开放，未通过公网验收 |
| 国内新运动会 `https://athlete.magical-athlete-online.cn/`、新巫师牌 `https://wizard.magical-athlete-online.cn/` | 已记录的候选子域；不能把候选名称当作 DNS 已生效 | 两个 HTTPS 均在本机 TLS 握手失败（exit 35） | 未通过公网验收，不开启大厅入口 |

00:22:25 再读两个旧国内入口，完整 SHA 仍分别为表中 `0ff8b2c` 与 `496603d`。GitHub queued/in_progress 仅是读取时可见状态；运动会 job 专用步骤查询已显示 Complete job success（类型、单测、构建、八人单场、打包/上传均成功），顶层 workflow 状态尚未一致完成；不能把单个 job 成功写成配对发布成功。没有可靠证据说明排队或状态差异根因，不据此推断计费、权限或配额。没有主动重跑、取消或触发工作流。

运动会国内预览 `http://115.29.188.62:8080/deployment.json` 仍是 `950403652b2334e7622b1b1c97137121f501dae6`、PR #39、run `41388931036`。本次没有修改预览，也没有触发远端 CI 或创建线上房间。

本次通过用户提供的已登录阿里云备案控制台，只读确认 `magical-athlete-online.cn` 显示“管局审核通过”，网站号为 **京ICP备2026075006号-1**，与此前用户确认记录一致。该状态没有证明 HTTPS 已上线。本次没有根据本机代理 DNS 推断权威记录，也没有仅凭 TLS 失败断言 DNS、443 或证书中的某一个根因；阿里云 DNS 控制台当前仅有一条启用的 `@ A → 115.29.188.62`，TTL 10 分钟，没有 `athlete` 或 `wizard` 记录；证书控制台 V2 的正式证书和个人测试证书列表均显示 0，未检查 V1、上传证书或 ECS 本地证书，不能据此宣称主机没有证书。实际主机安装状态仍待核对。

## 静态资源与国内独立性

六个 CF 大厅公开文件均正确，约 19KB 未压缩总量，无外部字体/CDN、跨服健康请求或游戏运行时依赖。另对两游戏两个现有公网端的入口引用及可识别 Vite 散列资源共 122 项作 GET：脚本 10、CSS 4、SVG 108，均 200 且 MIME 正确。这覆盖巫师两端分包与数字牌资源；没有把源代码中的非运行时素材文件名当作真实请求，也没有把所有未访问的 3D 模型、音频或实际完整对局声称为已验收。只读实时探测还确认运动会 CF 的 WSS connectivity marker 与国内 Socket.IO probe 均成功、协议/规则标记一致；国内旧巫师 WS probe 返回 v2 与旧 SHA。巫师 CF 的 `/api/presence` WSS 成功完成 upgrade 后立即关闭，未发送 hello/身份或建房；该项只验传输升级，不等于房间操作/恢复验收。浏览器交互/移动截图的本地结果另见本 PR。

旧运动会国内 backends 的 Aliyun origin 为空、CF origin 明确为 CF；巫师国内 runtime 的 backendId 为 Aliyun、relayOrigin 为空，页面/API/实时连接按现有同源设计运行。CF 两游戏仍保留受信旧 HTTP 国内游戏入口。这些是旧入口过渡，不意味着新 HTTPS 大厅可用或跨域身份可迁移。

国内根大厅采用 `deploy/nginx-lobby.conf.template` 精确公开文件 allowlist，通过本机 `127.0.0.1:3000/lobby/` 读取同份大厅产物，不反代 CF，不需要 CF API/CDN。**模板在仓库和本地生成成功不等于生产 Nginx 已安装**。新插画与 build-info 的路径必须一同进入 allowlist；未包含资源时应在本地/站点验收发现，不能靠游戏 SPA fallback 掩盖。

运动会目前既有 GitHub `Checks → Deploy checked backends`，又观察到 CF Workers Builds 在 Checks 排队时已经发布。故“配对发布完成”必须核对 GitHub 发布记录、两端公开 SHA、配置与资源。新增 `build-info.json` 在两种构建链均由 Git HEAD 生成完整源提交，游戏根与大厅目录各有副本；它仅说明构建源身份。受信 CI 的 `deployment.json` 继续说明 target、run 和 PR，不会被 build-info 生成器覆盖。未知 SHA 时构建报错，不填写伪造版本。CI 打包前还核对四份 build-info 均等于已检查提交，拒绝给旧游戏或大厅产物重新贴上新 release 身份。

## 本 PR 本地实际验证

- 全套单元测试 1466 项通过；新增 build-info/资源部署完整性两项专项测试 2/2 另行通过，校验旧构建不能冒充新 SHA、HTML fallback 不能充当 JSON、既有 release metadata 保留、两份大厅产物逐字一致、Nginx allowlist 覆盖所有真实 HTML 引用并拒绝非公开路径。
- 两套 TypeScript 检查、Node/client 与 Worker/browser 构建通过；CI 打包脚本 Bash 语法、四份构建 source SHA、Git 空白检查通过。构建仍有项目原有的大游戏分包提示，大厅没有引入 Three.js 或任何新依赖。
- 本地 Edge 大厅浏览器检查 6/6；双后端 Node/Worker 回归 4/4。覆盖两大厅整页跳转、四游戏入口、未开放与错误配置、邀请/观战优先、刷新/偏好、敏感参数过滤、键盘与资源同源；目标 HTTPS 的页面导航用本地测试替身，不等于真实新域联机通过。
- 已实际查看 320、390、667 横屏、1440 桌面四种宽度的截图，并检查窄屏/横屏首屏、可读文字、插画主体、焦点与溢出；横屏压缩首屏间距后重跑六项大厅检查仍全部通过。实体手机与运营商网络没有验收。
- 最终大厅八个运行源码资源共 **40,771 字节**，加可公开检查的 build-info 后 **40,832 字节**（均未压缩）；两张原创 SVG 共 **14,938 字节**。这是本 PR 的新统计，前文约 19KB 仅描述当前线上旧大厅。无外部字体、CDN 或额外 3D 依赖。

最后一次 `node scripts/build-lobby.mjs` 已把最终 CSS、两个原创 SVG 与元信息复制到 `dist/client/lobby`、`dist/browser/lobby`，四份 build-info 与本地构建时的 Git HEAD 完整 SHA 匹配。源代码提交后重建会记录新的提交；本地 dirty worktree 构建不应被描述为该提交的正式发布。

## 上线顺序与回滚

1. 先合并兼容改进，仍保持国内新大厅及两个 HTTPS 游戏入口禁用。沿原发布链分别确认两端构建与发布；CF `/lobby/build-info.json`、游戏 `/build-info.json` 与 main 完整 SHA 比较，阿里旧入口继续核对 `/deployment.json`。页面和全部大厅资源要校验 MIME/内容，不只 HTTP 200。
2. 主机、DNS、证书、安全设置的实际变更须在另行明确授权后执行。按 [统一 HTTPS 手册](unified-lobby-https.md) 安装固定工具和精确站点配置，先准备 DNS/ACME/可信 TLS，保留旧 IP/80、8080、8081 与现有数据库/身份恢复。备案通过不会自动完成这些步骤。
3. 两个新游戏分别验 HTTPS 页面、资源、API、真实 WSS/Socket.IO、邀请与只读观战、原身份刷新、旧入口恢复。根大厅资源全部由国内提供，断开 CF 网络后仍可打开；根 `/api`、`/socket.io` 保持 404。
4. 持久更新运动会 `deploy/entries.json`、巫师 runtime/生产 env/GitHub公开入口变量；验证自动构建不会恢复旧配置。只有实际验收通过后，最后启用国内大厅与两个游戏的配置开关，再验证两大厅互跳及四游戏入口。
5. 回滚先禁用故障国内入口或恢复已验收受信配置；分别回退对应游戏 current/previous 或保留的 CF 版本，保留当前 SQLite，不用旧数据库覆盖新动作。主机配置按本次备份恢复并 `nginx -t` 后 reload；同时恢复仓库和生产公开变量，防止后续发布再次切回。仅回滚本次游戏/大厅站点，保留另一游戏、预览、旧入口及证书。

本 PR 不把未执行的生产站点配置、可信证书/续期、真实国内移动网络、线上房间/WebSocket全流程或失败回滚演练标为通过。原始只读响应、headers、hash 和本机探测脚本留在忽略提交的 `.local/public-audit/` 与 `.local/public-audit.py`。
