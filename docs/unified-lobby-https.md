# 独立游戏大厅与国内 HTTPS

当前策略见 [独立站点部署与验证](site-editions.md)。旧大厅服务器选择、跨站自动跳转、国内自由昵称与聊天验收被本方案替代；过去公网状态保留在 [历史核查记录](lobby-deployment-audit-2026-11-05.md)，不作为本次已发布证明。

| 用途 | 国内 | 海外 |
| --- | --- | --- |
| 大厅 | https://magical-athlete-online.cn/ | https://magical-athlete.qiuh23.workers.dev/lobby/ |
| 运动会 | https://athlete.magical-athlete-online.cn/ | https://magical-athlete.qiuh23.workers.dev/ |
| 巫师牌 | https://wizard.magical-athlete-online.cn/ | https://wizard-friends.qiuh23.workers.dev/ |
| 卡坦岛 | https://catan.magical-athlete-online.cn/ | https://catan-friends.qiuh23.workers.dev/ |

`lobby/config.json`是构建使用的可信完整目标源，`scripts/build-lobby.mjs`分别裁剪国内 `dist/client/lobby/config.json` 与海外 `dist/browser/lobby/config.json`。每个公开配置仅含本站的大厅与三个游戏。页面没有站点切换控件，也不读取本地站点偏好。另一站邀请码只显示“此邀请不属于当前站点，请向房主确认原始邀请链接。”，不导航到另一站。

大厅不依赖CDN或游戏API；国内Nginx HTTPS根域仅允许反代现有Node `/lobby/`公开文件，API和Socket.IO仍由各游戏子域处理。Nginx模板保留ACME和TLS，关闭国内访问日志，故障日志继续保留；不扩大www-data对环境、凭据与数据库的权限。备案展示沿用已核实的京ICP备2026075006号-1。

国内旧HTTP根域若继续提供原游戏，仍反代cn模式的运动会Node而不重定向到新大厅，原浏览器身份可以继续从原入口恢复。所有新旧国内入口必须执行同一固定昵称/无交流策略。

部署前按 [配置迁移](site-editions.md)更新国内server.env和受信实例安装器；合并后由既有main自动发布，保持Cloudflare和阿里云预览/生产隔离。发布后分别核验大厅config只含三条本站入口、游戏返回大厅、邀请码拒绝、原身份恢复、模式marker、完整SHA和手机横屏。此次只提交源码与本地验证，不宣称DNS、TLS或线上服务已经切换。
