# 国内 HTTP 与 HTTPS 入口

当前站点策略见 [独立站点部署与验证](site-editions.md)，旧选择服务器与跨站自动跳转方案已替代。国内新游戏入口为 https://athlete.magical-athlete-online.cn/，大厅为 https://magical-athlete-online.cn/。备案号沿用已核实的京ICP备2026075006号-1。

旧 `http://115.29.188.62/`、`http://magical-athlete-online.cn/` 如保留服务，继续反代国内Node，必须执行 `SITE_EDITION=cn`、固定体育昵称和无交流策略。HTTP、IP、HTTPS的浏览器身份按各自Origin保留；旧身份不自动搬迁、不跳转海外、不跨站查询。精确同站旧Origin列入Node部署白名单，Worker只接受其本站Origin。

源码中的 `publish-http.sh` 和 `publish.sh` 均要求可信server.env明确cn；保留原公网门禁、容量、ACME/TLS与Nginx配置校验。它们不会购买云资源。Node发布激活前检查国内产物marker，`disable-cn-audit.sh`关闭本游戏国内访问日志及审计cron，保留故障与游戏数据和历史私有记录。旧版不具备cn策略的产物不能用于回滚。

预览继续使用独立8080/3001端口与数据库，生产3000端口不复用预览状态。发布后分别检查国内HTTPS、保留HTTP与预览的模式、完整SHA、同源实时连接、昵称迁移和重连。合并、本机构建或历史HTTP验收不能当作本次实际发布证明。
