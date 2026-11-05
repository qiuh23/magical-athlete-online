# 运动会：安全运行与最小人工处置

2026-11-05 基于 main `1771b54dec43b94aeded429ab7155a57fea329ab` 实施。整改处于 PR 代码阶段，未部署到 ECS、Cloudflare 或共享预览。生产只读核对、磁盘实测、网络日志轮转、增量备份及恢复、迁移和回滚见 [security-operations.md](security-operations.md)；自评六项及尚待属地确认的问题见 [公安备案填报参考.txt](公安备案填报参考.txt)、[security-applicability.md](security-applicability.md)。

## 复用和实际新增

保留已有房主、玩家/观战身份和重连凭据校验、精确 Origin 白名单、HTTP 和实时限流、SQLite FULL/WAL 事务、昵称 20 字与控制字符校验、聊天 500 字、每 10 秒最多 6 条、最近 100 条窗口。没有建立账号、实名采集、付费服务、机器审核或词库。新增的管理秘密与玩家/房主身份独立；房主凭据不能调用站长接口。

Node 的 `src/server/security-store.ts` 新建默认 `DATA_DIR/security.sqlite`（自定义房间库路径时为同目录；可用 `SECURITY_DB_PATH` 明确覆盖，运维脚本也必须同步）。数据库和 WAL/SHM 在支持 Unix 权限的文件系统上设为 0600；目录 0750。不得放入静态目录。表为 `security_events`、`moderation`、`security_evidence`；`security_health` 只有写探测时间。它们不引用房间表，不随房间关闭或 rooms.sqlite 回滚删除。

Cloudflare 复用现有 SQLite 型 `RoomRelay` namespace，使用独立命名对象 `security-ledger-v1` 保存日志、指定证据、处置状态和到期索引；无需新增付费服务、绑定或类迁移。普通房间关闭只清理该房间对象，不能触及独立安全对象。活跃房间同时持久保存处置状态，并与安全对象状态合并，避免长期开着的房间在标记周期结束后恢复旧内容。

## 字段和用途

`src/shared/security.ts` 用显式白名单构造事件：自增记录编号、发生时间、类别、到期时间、操作、结果、传输类型，以及存在且适用时的源 IP、房间码、随机成员编号、指定目标编号和人工原因。HTTP 不保存 URL 查询串、请求原文、Authorization、Cookie 或 User-Agent；实时日志不保存令牌、密码、聊天全文、完整手牌或游戏状态。原始端口和硬件特征不能从当前应用可靠取得，不能填为已经采集；反代网络字段及适用性见运维说明和待确认清单。

记录 HTTP/API 请求尝试、Socket.IO/Worker WebSocket 身份接入、安全发布（建房、加入、聊天、改名）、房间关闭和人工处置。Node 从已有可信代理配置取得 HTTP IP；Socket.IO 仅在 `TRUST_PROXY=1` 且对端是回环时使用 Nginx 覆盖的 X-Real-IP。Worker 使用 CF-Connecting-IP，并在转发 WebSocket 时覆盖内部来源头。游戏操作和聊天正文不复制到网络日志中。

网络及安全事件按 UTC 六个日历月计算（月底钳制到目标月最后一天），站长处置、保全/解除理由和指定证据按本次人工处置用途默认 90 天。这是代码采用的用途期限，并非认定所有此类记录的法定期限。保全目标及其保全理由不按到期任务删除；明确解除后恢复各自原到期时间，新增解除原因、时间记录。隐藏/限制标记默认六个月，活跃房间及保全关联标记继续用于防止内容重现。普通聊天仍是房间业务最近 100 条，不统一归入六个月网络日志；现有 rooms 备份另按备份轮换期限处理。

只在站长指定隐藏消息或处理昵称时保存相应原文/原昵称、消息/成员编号和时间等最小证据，不保存整间房或手牌。证据只能通过站长权限读取。举报人应提供服务器、房间码、消息编号、时间和原因；消息已经离开最近窗口或房间已关闭时，站点可能无法补取原文，不能承诺全部内容可追溯。

## 清理、容量与故障行为

Node 每 15 分钟分批处理最多 500 条到期事件及相应证据/标记；保全与活跃房间标记排除。执行 PASSIVE WAL checkpoint，不自动执行需要额外磁盘的全库 VACUUM。DELETE 释放的页可复用，不保证数据库文件立即变小；容量判定使用 page_count 减 freelist_count 的实际使用页，避免把可复用页当作永久占满。

Node 默认 `SECURITY_MIN_FREE_BYTES=67108864` 为保留空间、`SECURITY_DISK_WARN_RATIO=0.2` 为可用空间预警、`SECURITY_MAX_BYTES=1073741824` 为安全库使用页保护上限。三者可调整，不能理解为已证明六个月容量足够；须按运维实测和增长估算配置。低空间/达上限/写入失败不会删未到期或保全记录。必要记录先落盘，失败时明确报警并拒绝依赖它的新建房、加入、发言或改名。公开 `/api/security/health` 只返回 ok/warnings，并包含实际小写探测；它不返回路径、IP、令牌或私有内容。生命周期回调捕获存储错误，避免断线或到期触发未捕获异常而崩溃。

Worker 独立对象每 15 分钟用到期索引处理最多 500 项，保全项不参与自动删除。`SECURITY_MAX_BYTES` 默认 268435456，为序列化数据和保守额外开销的逻辑保护预算，非账户物理余量或计费额度；接近上限发预警，写不下时暂停相关新发布，健康接口保留 8 KiB 余量并做写探测。Cloudflare 实际存储、请求/读写与费用必须单独核对，不能借用 ECS 的容量说明。错误报警限频且不打印请求数据；本地日志告警仍需本人配置值守/远程通知。

## 一种简单站长工具

配置各后端自己的高熵 `SECURITY_ADMIN_TOKEN`，只接受 32～256 位 ASCII 字母/数字/下划线/短横线；至少用 32 个随机字节生成并以 base64url 编码，不能把“长度符合”当作随机性证明。ECS 放在已有受限服务环境文件，Worker 使用 secret binding；不要放入 wrangler vars、前端、命令行参数、URL、仓库或日志。两个后端建议使用不同值。未配置时站长接口拒绝访问，不影响原有房主功能。

`node scripts/stationmaster.mjs <HTTPS源站或本机SSH隧道> <六位房间码> inspect` 定位当前成员和最近聊天；`hide-chat <消息编号> <原因>` 隐藏一条，`reset-name <成员UUID> <原因>` 处理昵称并限制该身份发言/改名，`restrict-member <成员UUID> <原因>` 仅限制发布，`close-room <原因>` 关闭房间。工具从当前进程私密环境读取秘密，不接受秘密参数，不跟随重定向，也拒绝向远程明文 HTTP 发送秘密。Node 接口也要求 HTTPS 或没有转发头的直接回环连接。

工具的 `logs <after编号>` 查看分页元数据，`evidence <记录编号>` 查看指定证据，`hold <编号> <原因>` / `release-hold <编号> <原因>` 保全或解除。对应 API 是 `/api/stationmaster/rooms/:code`、`/api/stationmaster/logs`、`/api/stationmaster/evidence/:id`、`/api/stationmaster/logs/:id/hold`。读操作也只向站长开放。没有工单系统和完整后台；举报通过已确认公开邮箱 qiutian0808@163.com，人工处理和监管协助流程另见 [security-response-process.md](security-response-process.md)。

隐藏决策、目标编号、原因和指定证据在独立安全库同一事务提交，随后用占位内容替换服务器投影并通知在线玩家。重连、旧消息重试、旧房间快照恢复会重新应用独立处置标记。昵称处理替换成员名、聊天发送者和处理时点之前的历史文字事件；后续正常游戏记录仍可阅读。`contentRevision` 单调递增，旧快照、动画补页、旧昵称确认和聊天气泡缓存不能覆盖已处置内容。已记录的关闭决定即使房间清理写入失败也立即终止在线展示，后续由独立标记阻止重开。限制针对原随机成员身份，不声称能够识别换浏览器的新身份；需要时关闭房间。

## 本地验证证据

使用 Node 24.22.1，2026-11-05 最终 `node --import tsx --test tests/*.test.ts tests/host.test.mjs` **1483/1483 通过**（40.5 秒）。`tsc --noEmit`、`tsc -p tsconfig.worker.json --noEmit`、Vite 前端/浏览器构建、Node 服务构建均通过；Wrangler 4.151.3 的 `deploy --dry-run --outdir .local/security-worker-dry-run` 通过并明确退出，没有部署。前次整套有一次既有测试 listen(0) 命中 Undici 禁止端口、fetch 报 bad port；未修改生产逻辑或测试断言，最终整套原样复测通过。

本地日志位于 `.local/security-full-tests-final.log`、`.local/security-build.log`、`.local/security-browser-build.log`、`.local/security-worker-dry-run.log`（不纳入仓库）。`tests/security.test.ts` 覆盖权限、隐藏、昵称旧回执/创建回执、重启与重连、持有/解除理由、房间关闭清理失败、空间预算、数据库不可写、SQLite 空闲页复用和过期/断线不崩溃。`tests/relay.test.ts` 另外覆盖 Worker handler、独立 namespace、旧 room 快照恢复与持有/清理。

`node scripts/security-worker-smoke.mjs` 使用 Wrangler 现有依赖，在本机真实 Miniflare/workerd 及 SQLite 型 DO 验证 WebSocket 隐藏、昵称处理、进程重启/重连、独立日志/证据、保全/解除、容量上限拒绝建房和清理后恢复。最新通过时间为 **2026-11-05T04:07:36.384Z**（北京时间 12:07:36），同时记录于 `.local/security-worker-smoke-result.json`。到期数据由临时本地测试 harness 注入，然后执行实际 alarm；该入口不会编入生产源码。它不能证明实际经过六个月或 Cloudflare 生产额度、计费、告警投递和跨地区恢复已经验证。

最终构建另在本机 Chrome 的 390×844 与 1440×900 视口检查首页隐私说明、已确认邮箱和举报入口，正文调整为 14px 后复查可读、无横向溢出，无页面错误；测试阻止了无关外网资源访问。这是本机浏览器检查，不代表实体手机或生产入口已验收。

代码、模板、运行版本和部署可能变化。上线前须重新核对最新 main、应用秘密与代理来源、备份恢复、容量、联系人和属地要求；不能据此保证备案通过。
