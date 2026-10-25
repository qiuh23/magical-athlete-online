# 双后端接入与阿里云部署

## 当前交付状态

本分支包含连接适配、服务端配置与可重复执行的部署脚本。**杭州 ECS 和域名已实际购买，首期合计 137 元；ICP 已由本人提交、仍在审核。** 云端验证与进度见 [实际状态记录](aliyun-readiness.md)。本机测试不能替代云端或国内真实网络实测。阿里云服务端的公网开放闸门默认关闭；新增 [来源 IP 白名单限制的临时 HTTP 入口](http-transition.md)，使用现有受控验证闸门。

正式 Cloudflare 入口为 <https://magical-athlete.qiuh23.workers.dev>，此前已按用户授权手动发布源版本 `21de691`。临时 HTTP 目标为 `http://115.29.188.62`，仅供允许的测试网络；正式域名 `https://magical-athlete-online.cn` 仍未开放。每次实际部署的提交、检查和入口状态在 PR 中记录；PR 不自动合并。

## 相同前端、相同规则

两端运行相同 Git 提交的 `src/engine` 和 `src/shared`。Worker 继续使用 Durable Objects 和原生 WebSocket，Node 继续使用 SQLite 和 Socket.IO；不复制规则引擎。`src/shared/backend-protocol.ts` 发布共同协议和规则标记，HTTP 与专用实时探测同时成功且版本匹配后，客户端才允许选择。

`GET /api/connectivity`、Worker `/api/connectivity/ws`、Node Socket.IO `auth:{probe:true}` 只返回标记，不创建房间、不加载 AI、不写房间名额；实时检测连接完成或超时后释放。房间 API 仍用原来的鉴权凭据和服务端规则结算。

前端通过同源 `/backends.json` 读取受信部署配置，格式：

```json
{"backends":[
  {"id":"cloudflare","origin":"https://magical-athlete.qiuh23.workers.dev","transport":"worker","enabled":true},
  {"id":"aliyun","origin":"https://已备案的实际域名","transport":"socketio","enabled":false}
]}
```

空 `origin` 表示当前网页 origin。Worker 默认使用随前端发布的 `public/backends.json`；Node 开发默认动态返回同源 Socket.IO 配置，生产必须设置 `BACKENDS_CONFIG_JSON`。两种入口均可通过该非密钥环境变量覆盖配置；不要在 URL 参数、邀请码或房间列表里接受任意后端地址。配置仅含公开地址，绝不包含云密钥。

Node 自行提供 `dist/client` 内的完整 HTML、JS、模型、图片等资源，国内入口不需要先打开 Cloudflare 页面。国内 DNS 应直接解析至阿里云公网 IP；不要开启 Cloudflare 代理。跨入口在原网页连接目标后端，身份保留于原网页域的浏览器存储；不同网站域名之间的本地存储不共享，旧玩家应使用原网页入口恢复。

## 配额切换与存量

Worker 当前单端默认配额 30，Node 阿里云配额默认 15。启用双端后**必须先将 Worker 切为 `DUAL_BACKEND_ENABLED=true`、`MULTIPLAYER_ROOM_LIMIT=15`**，Node 同样为 true/15。配置校验拒绝双端大于 15 的单端配额，允许临时降至 0。计数沿用现有真人房规则，练习/AI 不占真人房配额；私人真人房计入配额。

不要两端直接各启用 30。先通过既有发布流程部署 Worker 15 的限制，保持阿里云未开放。配额降低仅阻止新房，**不会关闭存量对局**。从 Worker `/api/browser/rooms` 的 `capacity.used` 确认包括私人房的存量已降至 15 或以下后，才开放阿里云 15。`publish.sh` 在首次开放前实际读取该配额，确认上限和存量都不超过 15；读取失败也暂停开放。若存量超过 15，等待自然结束，绝不为腾名额强制关闭对局。此发布检查不影响日常查找或加入阿里云房间，后者独立访问阿里云。

建房请求 ID 在本端持久化。Node 通过 SQLite 事务同时保存配额、房间、凭据和回执，Worker 通过目录预留与房间 Durable Object 的持久回执恢复；提交超时后在原后端使用同一请求 ID 重试。不要修改请求内容或改选服务器来处理结果不明的请求。

## 账号、采购与备案前置

必须先取得用户费用确认，再购买中国内地轻量应用服务器或 ECS。确认内容包括中国站账号、地域、CPU/内存、系统盘、带宽/流量、首期实付、续费、自动续费状态、备案服务码资格。不能用海外服务器套餐的资格或营销首年价格推定中国内地备案资格。官方流程及本次账号/报价核实记录见本 PR 的云接入准备记录。

用户确认仅与熟人休闲使用，不收费、不投放广告；本次未发起额外游戏审批或付费代办。网站 ICP 已本人提交；如审核方对实际服务内容提出其他要求，再根据明确要求处理。HTTP 或 IP 不构成备案豁免；审核期间仅保留受控入口，不将其标为正式公开上线。

## 初始化与受控验证

目标系统 Ubuntu 24.04 LTS / Debian 12+。云安全组起初只允许用户自己的管理 IP 访问 SSH 22，公网 80、443、3000 均关闭。使用 SSH 密钥，凭据保存于用户密钥管理或本机受保护配置，不放仓库。

1. 在服务器检出已经审查的提交，执行 `sudo bash scripts/deploy/bootstrap.sh`。脚本安装官方 Node 24、固定 pnpm、SQLite、nginx、certbot，创建无登录权限的 athlete 用户、systemd 服务与每日备份任务。首次保持 nginx 停止，不启动公网入口。
2. 检查 `/etc/magical-athlete/server.env`（root:athlete，0640）。复制的模板默认 `PUBLIC_ACCESS_ENABLED=false`、`CONTROLLED_VALIDATION=false`，只绑定 `127.0.0.1`。填写实际 origin/配置；所有生产地址均由部署者控制。
3. 如进行受控测试，设置 `CONTROLLED_VALIDATION=true`，保留 `HOST=127.0.0.1` 与 `PUBLIC_ACCESS_ENABLED=false`，重启服务。通过 `ssh -L 3000:127.0.0.1:3000 <管理用户名>@<实例IP>` 访问 `http://127.0.0.1:3000`；在受控浏览器的临时配置中启用 Aliyun，不能同步到公开配置。测试结束恢复 false。
4. 执行 `sudo bash scripts/deploy/update.sh <完整40位提交SHA>`。脚本要求干净 checkout 与指定 SHA 一致，安装锁定依赖、类型检查并构建，保留旧 release，在线备份 SQLite，原子切换软链接、重启，失败自动回退代码。
5. 验证两独立浏览器建房/加入、有效操作、聊天、刷新与断线恢复，练习与 AI 启动；停止重启服务后用原凭据恢复同一房间、聊天和游戏状态。检查日志 `journalctl -u magical-athlete`。此前实际 ECS 已完成此组受控验证；新的 HTTP 入口还需单独验收。

`bootstrap.sh` 会从 nodejs.org 下载并校验官方发布的 SHA256。若国内实例无法访问 Node/软件源，应在核实官方镜像或离线安装包后重试，不让国内玩家的浏览器依赖这些安装源。`update.sh` 首次构建需要安装开发依赖；运行时只读取构建产物，写目录只有 `/var/lib/magical-athlete`。

**低配实例优先使用预编译包。** 2GiB 内存同时运行游戏、TypeScript 与两次 Vite 构建可能被系统终止；不能把本机充足内存的构建成功视为云端编译容量证明。在 Linux CI/构建机（与实例 CPU 架构相同、Node 24）运行 `bash scripts/deploy/package.sh <完整SHA> /绝对路径/release.tar.gz`，脚本从该提交导出源码、锁定安装、检查并构建，裁剪为生产依赖，将完整国内网页资源和 Node 产物打包，生成 `.sha256`。通过 SSH 将两文件传至服务器，再执行 `sudo bash scripts/deploy/update.sh <完整SHA> /绝对路径/release.tar.gz`。服务器校验 SHA256 和包内提交、平台、架构、Node 版本后解包，无需在实例编译或访问 npm。包与校验文件必须从同一个受信 CI 获取，校验和不替代来源验证。不要打包 Windows 的 `node_modules`。

Node 下载受阻时，不自动换第三方镜像。在可访问 nodejs.org 的环境下载同一官方 Node 24 发布目录中的 Linux 对应架构 `.tar.xz` 和 `SHASUMS256.txt`，经 SSH 上传同一目录，然后执行 `sudo env NODE_DOWNLOAD_DIR=/该目录 bash scripts/deploy/bootstrap.sh`；仍校验官方清单中的 SHA256。源码构建模式继续保留，适合已有足够内存的构建服务器。本次 ECS 的官方 Node 离线安装、构建和生产打包路径已实际执行成功。

## 公开入口与 HTTPS

公开开放是单独步骤。确认备案、必要资质、域名 DNS 直连、静态总配额和发布审批后，将服务器配置的 `PUBLIC_ACCESS_ENABLED=true`、`CONTROLLED_VALIDATION=false`。在云安全组仅新增 80/443，保持 3000 不对外开放。按用户授权执行：

```sh
sudo env DOMAIN=实际备案域名 CERT_EMAIL=运维联系邮箱 ICP_CONFIRMED=true bash scripts/deploy/publish.sh
```

脚本安装 nginx 反向代理并申请 HTTPS，开启证书自动续期。代理透传 Upgrade/Origin，75 秒读写超时大于 Socket.IO 的 15 秒心跳 + 20 秒失联窗口；应用 HTTP API 和实时 Origin 白名单均包含两个入口的精确 origin，支持跨域预检。`PUBLIC_ORIGIN` 为国内入口，`PUBLIC_ORIGINS` 为逗号分隔的其他受信入口；Worker 对应设置 `PUBLIC_ORIGINS` 为国内入口。不要使用 `*`。

完成 HTTPS、实时握手、必要资源直接加载、跨入口入房、重启持久化及国内真实网络实测后，再将两个入口的 `BACKENDS_CONFIG_JSON` 中 Aliyun 改为 `enabled:true`，按现有发布流程更新。尚未验证时继续显示“未部署/未开放”。

## 更新、回滚与备份

更新使用已审查的完整 SHA 执行上述 `update.sh`；不推送 main，不在本任务自动合并。代码回滚执行 `sudo bash scripts/deploy/rollback.sh`，切回 `previous`，**保留当前 SQLite**。现有规则版本化机制使旧房继续使用原规则。

自动备份与手动 `sudo /usr/local/sbin/magical-athlete-backup` 使用 SQLite 在线备份 API，覆盖 WAL 已提交状态，并执行 `integrity_check`。备份目录 `/var/backups/magical-athlete` 权限 0700，文件 0600，保留 14 天。数据库含玩家鉴权散列及回执，请按敏感数据保管；生产启用前由用户选择独立存储目的地并授权异机备份。

恢复数据需先停服、备份当前库、确认目标备份完整性，再恢复 `rooms.sqlite` 并清理已停服库的 WAL/SHM 后重启；恢复旧备份会丢失其后的操作，必须事先确认回退范围。通常回滚只切换代码，不回退数据库。生产切换及数据恢复都遵循仓库发布流程和用户授权。

## 交付验证边界

本分支后端针对性测试覆盖探测不占名额、CORS、未开放生产闸门、双端静态配额、降低配额保留存量、创建回执持久幂等、SQLite 重启后身份与聊天恢复。浏览器跨入口、桌面/手机与既有合并检查由 PR 实际检查记录列出。脚本语法检查不是云端部署成功；国内模拟断网不是国内真实网络验证。账户/购买/实名/备案阻塞时提交 Draft PR，保留未完成清单。
