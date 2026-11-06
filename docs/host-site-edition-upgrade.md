# 既有阿里云主机的站点配置升级

本次升级用于已有的生产与共享预览进程。它修复旧实例工具库没有 `disable-cn-audit.sh`、两个既有 `server.env` 缺少 `SITE_EDITION`、国内Origin仍含Cloudflare、旧审计任务仍在运行的问题。**它不部署游戏产物，也不重启游戏服务**；后续仍由原有已验证main自动发布流程激活相同提交。

## 精确来源与命令

运维先通过GitHub核验当前main完整SHA，再将该提交的受审源文件归档复制到主机的root私有临时目录；不要从未合并PR或不可信可写目录执行。脚本的 `--commit` 是运维已经核验的归档身份记录，不能替代归档来源/SHA校验。先检查再应用：

```bash
sudo python3 /root/reviewed-source/scripts/deploy/upgrade-site-editions.py --commit FULL_MAIN_SHA
sudo python3 /root/reviewed-source/scripts/deploy/upgrade-site-editions.py --commit FULL_MAIN_SHA --apply
```

检查仅显示需更新的路径和数量，不打印环境值、令牌或secret。应用时同时取得生产、预览和Nginx配置锁，在锁内重新读取计划；有发布正在占用锁时15秒内明确失败，等待原发布完成后重试。文件相同再次执行不写文件、不重载进程。变更前保存root私有回退副本到 `/var/backups/magical-athlete/site-edition-upgrade/`；Nginx验证或重载失败时还原本次全部文件，不删除备份。

## 本次固定变更

- 工具库 `/usr/local/lib/magical-athlete-deploy/`：`ci-install.mjs`、`unpack-ci-artifact.py`、`extract-release.py`、`target-paths.sh`、`update.sh`、`backup.sh`、`rollback.sh`、`security-preflight.sh`、`security-maintenance.sh`、`security-ops.py`、`disable-cn-audit.sh`；另更新固定入口 `/usr/local/sbin/magical-athlete-ci-install`。工具保持root所有，0644/入口0755。既有sudoers、账号、云角色与授权范围不变。
- 生产与预览 `/etc/magical-athlete{,-preview}/server.env`：设置 `SITE_EDITION=cn`、`BACKEND_ID=aliyun`、`NODE_ENV=production` 和cn单条同源registry。生产origin为 `https://athlete.magical-athlete-online.cn`，保留 `http://115.29.188.62` 与 `http://magical-athlete-online.cn` 两个旧Origin；预览仅 `http://115.29.188.62:8080`。移除两个环境的海外Origin。
- 精确保留既有 `PUBLIC_ACCESS_ENABLED`、`CONTROLLED_VALIDATION`、`SHARED_PREVIEW_ENABLED`、容量、secret、持久化目录和端口。兼容旧环境缺少 `CONTROLLED_VALIDATION`：旧服务原本将缺失视为false，升级只将该行为明确写为 `CONTROLLED_VALIDATION=false`；已配置true或false均保持，空值或非法值仍拒绝。`PUBLIC_ACCESS_ENABLED` 必须原本明确配置，绝不推断或放宽。既有生产quota14、预览quota1；路径或容量不匹配明确失败，不通过放宽门禁或增大额度完成升级。
- 只改四个精确Nginx文件 `magical-athlete`、`magical-athlete-https`、`magical-athlete-lobby`、`magical-athlete-preview`，每个server块显式关闭访问日志，保留故障日志与原代理/TLS/实时连接。不会匹配 `magical-athlete.before-http.*` 或修改未列出的站点。
- 停用精确旧任务 `/etc/cron.d/magical-athlete-security`、`/etc/cron.d/wizard-friends-security`、`/etc/cron.d/game-network-rotation` 以及 `/etc/logrotate.d/game-network`。这是三款国内站共同停止访问/交流审计的一次性主机配置迁移；既有私有日志、数据库、审计归档、故障数据和游戏数据全部保留。巫师牌、卡坦岛的环境、工具库和vhost由各仓库对应升级步骤处理。

## 升级后校验与发布边界

1. `--apply` 后再执行默认检查，预期0个变化。比较三个游戏的用户、sudoers、数据目录、配额及生产/预览门禁仍与升级前一致。
2. `nginx -t`成功；四个运动会active vhost没有新增访问日志，故障日志和WebSocket代理保留；上述旧审计任务不再激活。不要清空历史文件来验证停用。
3. 确认工具库包含当前main的完整固定清单，两个server.env分别明确cn，海外Origin已移除。脚本不输出secret，检查也不应将完整env贴到公开日志。
4. 运行原有Checks → Deploy checked backends自动发布最新已验证main；严格保留原提交/产物/runId/目标校验和生产/预览隔离。版本不匹配或旧无cn marker的回滚产物必须失败，不能退回开放国内聊天的旧版。
5. 游戏发布重启后，分别核验国内生产/预览 `/site-edition.json`、`/backends.json`、`/api/connectivity`、`/deployment.json` 与已验证完整SHA匹配，`/api/security/health`显示 `enabled:false`；海外Worker保持global与原功能。只有这一阶段完成才能记录“已发布”，仅主机配置升级不能算游戏已更新。

本地必要验证：`node --import tsx --test tests/deployment-upgrade.test.ts tests/ci-installer.test.ts`。不新增CI作业、不重新运行无关完整游戏回归。
