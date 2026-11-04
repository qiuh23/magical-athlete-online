# 统一大厅与国内 HTTPS 上线手册

## 核实结果与边界

2026-11-04，用户确认备案域名 `magical-athlete-online.cn`；备案控制台截图确认完整网站号 **京ICP备2026075006号-1**。大厅页脚展示该号码，链接 `https://beian.miit.gov.cn/`。附件里的通知不作为执行线上操作的授权。

本次只读核查：现有杭州 ECS `magical-athlete-cn` 为 Running / Ubuntu 24.04 / 公网 `115.29.188.62`。阿里云 DNS 只有 `@ A → 115.29.188.62`，TTL 600，尚无两个游戏子域。域名实名和域名验证均通过。系统 DNS 受本机代理 fake-IP 影响，真实记录以阿里云 API 为准。

| 现有入口 | 公开元信息核实的完整 SHA |
| --- | --- |
| 运动会 CF、国内80 | `0ff8b2c30bd28d2cc50fb5d16729666a0c642bfe`，等于当前 main |
| 运动会国内8080预览 | `950403652b2334e7622b1b1c97137121f501dae6`，PR #39 |
| 巫师牌 CF、国内8081 | `496603d65f460c8ff1cc4049861cc6fd63a2b26e`，等于当前 main |

根域名 HTTPS 本机握手失败，不能认为新证书可用。本次未修改生产服务器、DNS、安全组、证书、环境、自动开关或云权限，未创建线上测试房、重启服务或部署功能分支。

## 目标入口与受信配置

| 用途 | 国内待上线地址 | Cloudflare 地址 |
| --- | --- | --- |
| 大厅 | `https://magical-athlete-online.cn/` | `https://magical-athlete.qiuh23.workers.dev/lobby/` |
| 胡闹运动会 | `https://athlete.magical-athlete-online.cn/` | `https://magical-athlete.qiuh23.workers.dev/` |
| 巫师牌 | `https://wizard.magical-athlete-online.cn/` | `https://wizard-friends.qiuh23.workers.dev/` |

国内三个 HTTPS 地址是确定的部署方案，尚未上线。`lobby/config.json` 是大厅四入口的唯一受信表，国内暂为 `enabled:false`，界面显示“国内 HTTPS 待上线”。游戏实际生效配置仍保留旧 HTTP IP，避免合并后自动发布提前改换邀请目标。

大厅源码 `lobby/` 不依赖 CDN、外部字体、跨服健康探测或游戏 API。构建将同一份文件复制到 `dist/client/lobby`、`dist/browser/lobby`。CF Worker 的 `/` 仍为原运动会。国内 Nginx 根域仅将明确公开文件反代至现有 Node 的 `127.0.0.1:3000/lobby/`，无 CF 依赖，不增进程或后端；根域 `/api`、`/socket.io` 等返回404。这也避免 Nginx 无权读取 root:athlete 0750 release 而403，不给 www-data 增加读取环境/数据库的组权限。

国内游戏子域各自反代原3000/3002，预览仍是3001/8080。选择游戏时顶层导航到受信 origin，页面、API和实时连接一起切换。运动会实际发布地址由 `deploy/entries.json` 管理；构建和发布器据此同步 backends.json，发布后再对两端配置校验，防止写回旧IP。大厅表只负责导航，不暗中修改游戏部署配置。

## 邀请与身份

原游戏邀请继续直接进游戏。可选大厅邀请为：

```text
/?game=athlete&server=aliyun&room=A-ABC234&watch=1
/lobby/?game=wizard&server=cloudflare&room=C-ABCD2345&watch=1
```

房间前缀优先本机偏好；显式 server 冲突、重复参数、无前缀或格式错误时停止，不猜服务器。有效邀请锁定游戏/服务器，刷新保留房间与观战；主动“返回游戏选择”才清除。导航只重建公开房间码和观战（运动会 `spectate=1`、巫师牌 `watch=1`），其他query/hash不转发，不传token、任意后端或跳转URL。

国内与CF房间池、身份独立，不跨服找房、不自动切服。HTTP/HTTPS/IP/端口/域名的浏览器数据分开，同数据库也不会自动共享浏览器身份。旧IP页面继续通过原同源服务恢复对局，新HTTPS空存储不能冒充旧身份。不以URL令牌或存储导出导入替代身份设计。

## 最终自动更新流程

- 运动会保留 `Checks → Deploy checked backends`，main成功后成对更新CF与ECS；大厅随同一前端产物进入两端。国内根域代理current的 `/lobby/`，无需另加复制任务。生产与预览仍独立。
- 巫师牌保留 `Verify game → Deploy checked Wizard to Aliyun` 和原CF Workers Builds。已只读核实最新main的 Verify `41262534954`、Aliyun release `41262595419` 与CF Builds成功，公开SHA匹配；新HTTPS切换后仍需再验正常main发布。
- 不只改线上文件。运动会必须持久更新 `deploy/entries.json`；巫师牌必须同时持久更新仓库runtime、ECS环境与GitHub production的 `ALIYUN_PUBLIC_ORIGIN`。详见各游戏HTTPS手册。

本次两个PR提交使用 `[skip ci]`，防止PR Checks成功自动替换线上共享预览；draft不能阻止原预览。未修改原工作流/自动开关。维护者最终合并时，**合并消息须去除 `[skip ci]`** 才会触发原main发布；审查期间不要去掉HEAD标记后推送或手动触发预览。[GitHub跳过规则](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)只适用于push/pull_request，不能代表其他触发器停止。

Cloudflare Builds的分支/预览配置API只读查询403，未扩大权限。两个仓库的 `preinstall` 和构建入口调用 `scripts/review-build-guard.mjs`，仅在 `WORKERS_CI=1` 且分支以 `codex/review-only/` 开头时失败，阻止本次审查分支部署；main及普通预览分支保持原行为。这不保证Cloudflare不创建构建/预览记录，不把阻止部署写成无任何远端动作。[官方构建环境变量](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#default-variables)。

## 合并后的分阶段操作

仅在用户合并两PR后执行线上步骤，始终使用已检查main。

1. 记录四正式入口、预览、SHA及站点基线；各游戏执行原SQLite在线备份并检查integrity_check。保留current/previous、旧代码与80/8080/8081。修改站点取得 `/run/lock/game-sites.configure.lock`，并按游戏文档取得部署锁，避免与自动发布并发。
2. 先让原自动流程发布兼容代码，地址仍旧HTTP。核对四入口和CF `/lobby/`；国内按钮仍待上线。按游戏手册升级固定主机部署工具，不扩大OIDC/RAM/sudo权限。合并源码不代表root安装器已经升级。
3. 操作者新增 `athlete`、`wizard` A记录直达现ECS，根域仍直达ECS，不套CF代理。核实80/443规则，合并后只开放必要443；3000/3001/3002保持回环，旧入口保留。真实DNS就绪后再申请证书。
4. 离线审查生成配置：

   ```sh
   node scripts/prepare-lobby-https.mjs .local/https-lobby
   node scripts/deploy/render-https.mjs athlete.magical-athlete-online.cn --acme-only
   node scripts/deploy/render-https.mjs athlete.magical-athlete-online.cn
   # 巫师牌仓库：node scripts/deploy/prepare-https.mjs .local/https-review
   ```

   根大厅模板为 `deploy/nginx-lobby.conf.template`。先只安装80端口ACME server块，证书存在后才装443块。不覆盖IP/预览、不删除default、不设置HSTS includeSubDomains/preload。同一Nginx以精确server_name区分三个域名，[官方匹配说明](https://nginx.org/en/docs/http/server_names.html)。
5. 根域与运动会ACME webroot为 `/var/lib/letsencrypt`，巫师牌按其生成配置使用独立路径。逐域确认challenge经公网可读，使用 `certbot certonly --webroot`，避免 `--nginx` 自动改写其他站点。根证书名须 `magical-athlete-online.cn`，与模板路径一致；联系邮箱由操作者提供，不写仓库。
6. 先合并各游戏精确Origin白名单（新HTTPS及需保留的旧HTTP，无通配符），再验新域API/WSS/Socket.IO。应用、数据、服务保持独立；完成两个新子域静态和联机验收后启用根大厅独立站点。根 `/`/配置/模块/CSS/favicon应正确，`/api`/`/socket.io`应404，国内无CF运行请求。每次 nginx -t 后reload，失败恢复本次游戏自己的env/站点。
7. 新域完整验收后，受审查更新运动会entries.production的 aliyunOrigin 为 `https://athlete.magical-athlete-online.cn`、allowInsecureHttp=false；preview不动。ECS后端表仅当前Aliyun项保持 origin空串，CF项明确CF origin，保留新旧页面同源及归属；PUBLIC_ORIGINS明确保留旧HTTP。巫师牌按其手册更新runtime/生产变量及旧Host恢复。最后开启大厅两个国内enabled并提交构建发布。离线脚本 `--activate-domestic` 只用于审查启用效果，不改源码或线上。
8. 用下一次正常必要的main变更验证原自动更新，无需新增CI：四入口SHA匹配，根大厅/CF大厅相同；运动会两端backends.json、巫师牌两端runtime-config.json保留HTTPS，预览地址未改。验证失败走既有回滚，不靠人工覆盖产物宣称自动正常。

详细运动会步骤见 [athlete-https.md](athlete-https.md)，巫师牌见另一仓库 `docs/https-domain-transition.md`。

## 续期、验收与回滚

每个证书保留HTTP-01路由/webroot。核对certbot.timer状态、最近/下次触发；deploy hook先nginx -t再reload。合并后实际 `certbot renew --dry-run`；验证deploy hook使用 `--run-deploy-hooks` 并先审查hook，普通dry-run不代表hook运行。[Certbot官方文档](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates)。分别查三域证书链、SAN、到期日；本地配置生成/自签测试不代表可信公网证书或续期成功。

上线需逐项记录：四入口顶层导航、320/390px/桌面；原邀请与大厅邀请、玩家/观众、错误入口、刷新恢复；各游戏CF和国内双独立会话建入房/操作/聊天/断连/只读观战；静态资源状态与MIME；无混合内容、HTTPS只连HTTPS API/WSS、Socket.IO升级及心跳；国内不依赖CF；旧入口身份继续恢复；后续main不覆盖HTTPS；续期模拟与reload hook；实体手机/真实移动网络。

回滚先停大厅国内按钮/恢复受审查入口表，阻止新用户进入故障域。记录精确SHA/run，分别用既有受限入口回退对应游戏代码，保留当前SQLite。恢复本次备份的精确env/站点及入口配置，仅撤新大厅或相应HTTPS vhost，保留其他游戏、旧IP/8080/8081、CF、备份及证书文件。nginx -t后reload，复验旧邀请/身份。仓库和GitHub变量同步恢复，防止下次自动发布再切回。数据库灾难恢复须另行停服、保全当前库/WAL/SHM并确认数据损失范围，不是普通代码回滚步骤。

## 本地实际结果与未完成项

Windows/Edge测试，Node24.22.2官方Windows包经官方SHA256校验。大厅4项单元覆盖四入口、游戏/服务器/观战组合、敏感参数过滤、冲突/重复参数、HTTPS验证、存储禁用；4项Edge用例覆盖320/390/1440、四入口点击整页导航、刷新偏好、邀请/观战优先级、禁localStorage getter、错误配置，运行资源均本地。导航目标用测试替身，不代表真实新域联机。截图在忽略提交的 `.local/lobby-*.png`。真实Node和本地Worker的 `/lobby/`、`app.mjs`、`config.json` 均200且MIME正确；两端未知大厅路径仍沿用既有SPA HTML fallback，根域Nginx模板则明确404。

两套TS、Node/Worker构建、全套测试、真实本地Node/Worker联机及入口回归数量见PR最终记录。未验：生产Nginx语法/加载、真实子域DNS、新公网TLS/续期、HTTPS外网联机、实体手机/运营商、切换后自然main自动更新及线上失败回滚。本次旧公网入口只有只读探测，没有创建房间或重启。

操作者仍需完成：合并与正确合并消息；合并后安装工具，DNS/443/证书联系邮箱及证书操作，受信表/env/GitHub公开变量切换，以及上述真实验收。域名和完整备案号已确认。
