# 国内与海外独立部署

当前策略和迁移命令以 [独立站点部署与验证](site-editions.md) 为准；旧服务器选择、跨站自动跳转、国内聊天和安全审计方案已经替代。源码、本地验证和实际发布状态分别记录。

国内复用杭州阿里云ECS与已确认域名，海外复用Cloudflare Worker。共用规则引擎并保持两站入口、房间、身份和数据独立。Node使用 `SITE_EDITION=cn BACKEND_ID=aliyun` 和 `dist/client`，Worker使用 `SITE_EDITION=global` 和 `dist/browser`；公开配置只含本站单条同源API/WebSocket。生产缺失或产物/服务端模式不匹配会报错。

| 用途 | 国内 | 海外 |
| --- | --- | --- |
| 大厅 | https://magical-athlete-online.cn/ | https://magical-athlete.qiuh23.workers.dev/lobby/ |
| 运动会 | https://athlete.magical-athlete-online.cn/ | https://magical-athlete.qiuh23.workers.dev/ |

大厅各自含本站运动会、巫师牌和卡坦岛。国内固定随机体育昵称、无玩家交流；海外保留自由昵称与聊天。邀请、列表、恢复与返回大厅均限定本站，不能以URL参数、本地偏好或房间前缀切换策略。另一站邀请码只提示固定错误。

国内DNS、TLS、Nginx、Node持久化磁盘和旧IP/HTTP服务沿用既有资源，不需要新购资源。旧入口若继续运行，必须使用同一cn服务与匹配前端；保留原浏览器身份，不跨Origin迁移凭据。备案号沿用已核实的京ICP备2026075006号-1。[历史上线证据](lobby-deployment-audit-2026-11-05.md)仅表示当时状态，不能证明本次已发布。

运行环境示例见 `deploy/aliyun.env.example`。国内停止交流与访问安全审计，保留故障报告、游戏存档、身份恢复以及已有历史私有记录；Nginx访问日志关闭，不以清空数据库解决迁移。更新受信安装器与现有vhost的步骤见 [配置手册](site-editions.md)。

[现行自动发布](automatic-deployment.md)继续使用最新成功main构建与预览隔离；[HTTP/HTTPS手册](http-transition.md)说明旧入口与部署前提。本次不执行公网部署或合并。
