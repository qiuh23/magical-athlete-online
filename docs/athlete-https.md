# 运动会 HTTPS 入口准备（2026-11-04）

本次仅改代码和本地验证，未修改 ECS、DNS、安全组、证书、权限、已部署 Worker 或共享预览。统一大厅和网站备案信息见 [大厅上线说明](unified-lobby-https.md)。根域名用于大厅，运动会计划使用 `https://athlete.magical-athlete-online.cn`，反代仍是现有 `127.0.0.1:3000`；预览 `http://115.29.188.62:8080`／3001 保留。

## 发布配置不会被旧 HTTP 地址重新覆盖

此前 `scripts/deploy/ci-release.mjs` 的 `deploymentSettings()` 写死正式 IP 和预览 IP，并在每次发布的 `prepare` 阶段重新生成 `backends.json` 与 Worker 变量。现在正式与预览地址统一来自受信 `deploy/entries.json`；`scripts/deploy/sync-backends.mjs` 从同一配置生成构建用 `public/backends.json`，Worker 发布同样调用 `deploymentRegistry()`。HTTPS 地址不会生成 `allowInsecureHttp:true`。

为了让合并后的既有自动发布继续工作，当前 `production.aliyunOrigin` 仍为已使用的 HTTP IP；`plannedAliyunOrigin` 是待验收 HTTPS 子域，不是已开放声明。TLS 验收后，在一次审查过的配置提交中将 `aliyunOrigin` 改为该 HTTPS 地址，`allowInsecureHttp` 改为 false，运行同步脚本，并启用大厅的对应国内入口。预览地址不随正式迁移。不要再从旧脚本或临时 JSON 手工覆盖发布目录。

发布后现在会读取**两端** `/backends.json`，验证两条入口、transport 和 enabled 与受信配置一致，再检查版本及 HTTP／实时协议。Node 的空 `origin` 按本次验证的网页 origin 解析；错误、过期地址或 HTTPS 配置仍带临时 HTTP opt-in 会使验收失败，沿用原有成对回滚路径。此检查验证公开配置，不会接触房间身份。

`production.legacyOrigins` 显式保留旧页面的精确 Origin，用于恢复历史上保存在旧 HTTP 页面中的 Cloudflare 房间身份；它不会把旧地址重新加入新用户的导航目标，也不会迁移浏览器凭据。HTTPS 切换后 Cloudflare 的 `PUBLIC_ORIGINS` 同时包含新游戏 HTTPS 与这些旧 Origin。生产与预览白名单保持独立，禁止通配符、路径、凭据和重复项。

`sync-backends.mjs` 同时同步 `public/backends.json` 和 `wrangler.jsonc` 的受管变量；直接 Workers Builds 与已检查产物的 CI `prepare` 共用 `workerVariables()` 生成逻辑。因此下一次任一发布链都不会丢掉旧 HTTP Origin 或回退到另一份导航地址。正式启用仍须先完成公网验收，再修改生产 `aliyunOrigin`，最后开启大厅国内门禁。

## 合并后的人工上线顺序

1. 按大厅说明先保存 Nginx 全部站点、`server.env`、版本指针和证书续期配置；运行现有 SQLite 在线备份并检查完整性。保留当前所有旧站点和数据。不要重新运行 bootstrap 覆盖已有主机设置。
2. 将游戏子域直接解析到现有 ECS；仅在合并后按上线授权处理 80／443。3000 保持回环，不改变预览 8080／3001、巫师牌 3002 或其独立服务。
3. 审查 `/etc/magical-athlete/server.env`：`PUBLIC_ORIGIN=https://athlete.magical-athlete-online.cn`，`PUBLIC_ORIGINS=https://magical-athlete.qiuh23.workers.dev,http://115.29.188.62`，保留既有精确白名单项及其他开关、配额。不能用 `*`。保留 Aliyun **空 origin** 的 Node registry，例如：

   ```ini
   BACKENDS_CONFIG_JSON='{"backends":[{"id":"cloudflare","origin":"https://magical-athlete.qiuh23.workers.dev","transport":"worker","enabled":true},{"id":"aliyun","origin":"","transport":"socketio","enabled":true}]}'
   ```

   Node 在旧 HTTP IP 页面和新 HTTPS 子域页面均使用当前页面的 API／Socket.IO；它们访问同一个现有服务与数据库。不要把 Node 的国内 origin 固定为新域名，否则旧 IP 页面刷新可能被导航，原浏览器身份无法在新 origin 读取。恢复原身份应继续使用原浏览器和原入口。
4. 从已审查的合并版本执行：

   ```sh
   sudo env DOMAIN=athlete.magical-athlete-online.cn CERT_EMAIL=实际运维邮箱 ICP_CONFIRMED=true bash scripts/deploy/publish.sh
   ```

   脚本在配置／证书变更前校验精确目标和现有应用参数，沿用原配额前置检查。ECS 无法直连 Cloudflare 时仍使用原受保护、短时有效的 `CF_CAPACITY_FILE` 工作流。脚本先取得现有生产部署锁，再取得共用 `game-sites.configure.lock`，避免与自动发布并发切换；只安装新增的 `magical-athlete-https` 站点，不会覆盖原 IP 站点、预览站点或删除 default。ACME 使用独立 webroot，不由 `certbot --nginx` 自动改写其他站点。已有证书重跑时保留 TLS 监听。失败会还原该新增站点原内容，保留证书、旧站点、服务数据库与版本。
5. 在真实 HTTPS 上检查 HTML、JS、模型／图片、`/api/connectivity`、Socket.IO WSS 握手。两独立浏览器建房／加入、聊天、操作、观战与刷新恢复；从另一服务器打开 `A-` 邀请时仅整页跳转，不发送 HTTP API 或 `ws:` 请求。旧 IP 原房主刷新仍须使用原身份。公开状态不会包含 token；`?spectate=1` 保留观战意图，不会消耗已保存的选手身份。
6. 完成 TLS 验收后再切换 `deploy/entries.json` 和大厅配置，按既有 main 发布流程发布；检查两个 `/backends.json`、静态文件版本和实时协议，并在下一次正常发布后再次确认未回到 HTTP。不要在未合并的 PR 上发布。
7. 检查 `systemctl is-enabled certbot.timer`、`systemctl list-timers certbot.timer`、`certbot certificates`；执行 `certbot renew --dry-run` 并确认成功。保留各子域 80 上的 `/.well-known/acme-challenge/`，证书更新钩子会在 `nginx -t` 后 reload；检查文件里的到期时间以及 reload 后实际提供的证书。初次签发成功不等于续期已验证。

## 旧入口与回滚

大厅随本仓库既有 main 自动发布分别到 Cloudflare 资产和 ECS Node 资产，根域名通过 Nginx 反代同一 Node 的 `/lobby/`；两个部署端将持续收到同一已检查版本。巫师牌仍由自己仓库的既有 main 工作流自动更新，未合并 PR 不发布。运动会这次不改变受限安装器的权限或允许路径；新增的 HTTPS 发布工具从已审查的 main checkout 执行，不替换该安装器。上线后核对一次后续 main 自动更新的实际 SHA 和 `/backends.json`，开关启用不算链路验收。

旧 IP／端口入口持续保留，不做全站强制跳转；根域名从旧游戏规划改为大厅前，单独评估是否曾有根域名对局，不能通过新大厅猜测旧房间。国内与 Cloudflare 房间、身份仍独立，不跨服查房或自动切服。HTTPS、HTTP、IP 和不同域名的 localStorage／sessionStorage／浏览器计算存档各自独立。URL 只保留房间码和公开观战标记，不能传身份 token 或导出浏览器私密存档。

代码回滚沿用原 `rollback.sh`／受限 CI installer，只切换代码和 Worker 旧版本，保留当前 SQLite。入口配置回滚需要恢复 `deploy/entries.json`、构建 registry、大厅开关、Node env 及本次新增 Nginx 站点的相互一致状态；只回滚游戏代码不恢复这些配置。HTTPS 故障可先禁用大厅国内按钮、恢复旧公开入口；旧 IP 原房间保持可恢复。移除新增 HTTPS 站点前记录并取消仅属于它的续期配置，不能删除其他站点证书。不要恢复旧数据库来处理入口问题。

## 验证边界

新增单元测试覆盖 HTTPS 生成配置、下一次发布不恢复旧 IP、预览独立、错误 registry 拒绝、Origin 的协议／后缀／兄弟域拒绝、WSS 反代参数、ACME 路径、跨入口观战 URL 与保存身份的角色隔离。现有服务器测试覆盖 Socket.IO 双会话、幂等建房及 SQLite 重启恢复；新增浏览器用例覆盖跨入口观战、去除非公开 query／fragment、刷新仍预选观战。实际执行结果在 PR 中列出。

本次已执行 Node 24.22.2 相关单元／服务器／发布测试 26/26，两套 TypeScript 检查、Bash 语法及 Git 空白检查通过；client 与 browser 构建通过（保留已有大包提示）。Edge 四个定向浏览器用例与四个本地真实传输用例通过，后者包括两端双会话、旧跨入口身份、真实 Socket.IO 观战加入／不占座／刷新。Wrangler 测试使用本地自签 HTTPS 并显式忽略其证书错误，不能据此证明生产证书可信。Node 与本地 Worker 实际 GET 均确认大厅 HTML、JavaScript MIME 和 JSON 内容；Node 大厅资源 no-store，Worker 资产为 must-revalidate/max-age=0。两端不存在的 `/lobby/*` 路径沿用游戏 SPA HTML fallback，不返回配置；根域名 Nginx 白名单之外返回 404。

尚未在生产执行：可信证书签发及续期、真实 Nginx `nginx -t`／reload、国内运营商及实体手机访问、HTTPS 上双设备联机、生产服务重启、域名切换和下一次真实自动发布。测试模板文本、回环 Socket.IO 和浏览器模拟不能代替这些上线验收。
