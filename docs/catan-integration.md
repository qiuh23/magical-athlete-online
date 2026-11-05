# 卡坦岛接入与上线门禁（2026-11-05）

> 后续上线阶段：用户已明确批准合并 PR、双端部署及真实验收通过后启用入口。大厅 PR #52 与卡坦岛 PR #1 已合并并完成首次双端发布；独立 DNS、TLS、服务、OIDC/STS 发布身份、Cloudflare Worker 已核验。当前准备在验收完成后通过本次配置更新开放两服入口；下文“只准备代码/待授权”保留为初始阶段记录，不能覆盖这项后续授权。最终真实验收与回滚结果在合并本次启用配置前补充。

本次只准备代码与 PR。两个大厅中的卡坦岛均为 `enabled:false`，显示“未上线 · 敬请期待”；没有合并、修改生产、创建线上测试房或购买服务。不可把本地验证当作生产验收。

## 本次改动

复用本仓库 `lobby/`，增加原创 SVG 小岛插图和“卡坦岛好友桌”介绍，沿用绿色与纸张色调、44px 操作和手机单列布局。游戏注册表统一保存名称、房码格式和观战能力；严格配置验证包含三个游戏、两服以及六个互不相同的游戏来源。卡坦岛仅展示实际具备的 3–4 人、电脑练习能力，不提供观战入口。

服务器选择仍然整页前往对应大厅；游戏卡只进入当前大厅所属服务器。卡坦岛大厅邀请使用 `?game=catan&room=A-ABC234` 或 `?game=catan&room=C-ABC234`；禁用的入口不会跳转、不会回退到另一服。上线后进入 `https://对应游戏来源/?room=A-ABC234` 或 C 前缀。重复、冲突、错误房码和卡坦岛观战邀请明确拒绝。只重建公开参数，不携带身份、任意跳转地址或 fragment。现有运动会/巫师牌邀请及观战路径保留。

## 自动更新

大厅只属于 `qiuh23/magical-athlete-online`。现有 `Checks → Deploy checked backends` 在最新 main 必要检查通过后，将同一份大厅分别带入阿里云 Node 的 `/lobby/` 和 Cloudflare `/lobby/`；不增加新的部署工作流。国内 apex 通过现有 Node 反代获得更新。卡坦岛自己的代码由 `qiuh23/catan-friends` 的独立检查与成对发布链负责，只发布卡坦岛的 Node 和 Worker。

巫师牌无需代码更改：它现有的“游戏大厅”链接已经按本服回到同一个大厅。当前 main 是 `1f564076d5794815eb72676e512314b1e1ade0a2`；只读核查其 GitHub Verify → 阿里云链和原有 CF Builds 分工，不新增第二条同目标发布链。

审查分支提交使用 `[skip ci]`，避免当前运动会 own-repo PR 检查成功后自动覆盖共享预览；draft 本身不阻止该行为。合并获准后，合并提交消息必须去掉 `[skip ci]`，以运行 main 必要检查和原有成对发布链。生产与预览、旧 HTTP/IP 入口、数据库、备份和回滚机制均沿用原有配置。

## 上线前需要批准的操作

1. 审查并合并卡坦岛 PR；按其 `docs/aliyun-deployment.md` 和 `docs/automatic-deployment.md` 核实独立 DNS、TLS、Nginx、服务/用户/端口、存档与备份、专用 OIDC/STS 发布角色、Cloudflare 账号/权限、production 环境与发布门禁。卡坦岛 DNS/证书/Worker/服务目前不存在，不能跳过这些准备。
2. 本仓库 `deploy/nginx-lobby.conf.template` 的公开资源白名单从 `art/(athlete|wizard)\.svg` 扩展为 `art/(athlete|wizard|catan)\.svg`。现网 Nginx 不是随代码自动覆盖，须由管理员备份当前配置、只应用这一行、`nginx -t` 成功后 reload。不得扩大目录权限或改动旧站点/预览。未执行该步骤前国内大厅的插图会 404，因此须在获准发布大厅前完成这项准备。
3. 合并本 PR（合并消息不带 skip 标记），等待现有链更新两大厅；此时卡坦岛仍保持关闭。
4. 对卡坦岛两生产环境分别实测建房、三人加入、邀请的原服绑定、同步与隐藏信息、刷新/重连、存档恢复、HTTPS/WSS/静态资源、错误 Origin、发布失败回滚和数据不覆盖；再复查旧两个游戏、旧链接与预览。
5. 全部真实验收通过并再次获准后，仅在本仓库 `lobby/config.json` 将通过验收的卡坦岛环境设为 `enabled:true`，经 PR/main 检查随原大厅链发布。两个环境的上线状态独立；不能为了打开入口跳过验收。

若尚未批准生产操作，可直接审查本地截图与两个 PR，无需修改任何云资源。

## 验证与边界

- `npm run typecheck:release`、`npm run build` 通过；构建既有大包提示，不新增依赖。
- `node --import tsx --test tests/lobby.test.ts tests/lobby-resources.test.ts`：7/7，含六个入口、卡坦岛关闭、服务器冲突/参数净化/错误配置、资源白名单、两份产物一致。
- `playwright test tests/browser/lobby.spec.ts`：11/11，覆盖双大厅整页切换/刷新、模拟启用后的三游戏六入口/触屏、十种合法邀请组合、卡坦岛观战拒绝、存储受限、配置漂移终止循环以及 320–1440px 布局。
- [桌面截图](qa/catan-lobby/desktop.png)、[手机截图](qa/catan-lobby/mobile.png) 是本地浏览器拦截生产形状 URL 的启用配置，三个游戏均按本服入口开放；关闭状态继续用独立 fixture 测试。截图不是生产、真实手机或 Safari 验收。
- 卡坦岛 Node/Worker 规则、网络、浏览器与持久化验证详见其 PR；生产环境须在授权后验证。

## 回滚

卡坦岛入口问题先把对应 `enabled` 设为 false，经本仓库原链发布；它不会删除任何房间或身份。大厅代码通过原运动会发布器回到上一已验证版本；回滚本地模板不等于回滚现网 Nginx，管理员只恢复自己的白名单备份并测试后 reload。卡坦岛游戏代码回滚走它自己的独立发布链，不发布运动会或巫师牌、不回滚存档。不得把两服数据互拷当作回滚或迁移。

## 作者与授权

原游戏来自 [Jack15678/catan-friends](https://github.com/Jack15678/catan-friends)。Fork 保留 GitHub parent、upstream remote 和原提交历史。用户确认已获朋友授权并要求跳过邮件核对；本次没有读取邮件，也没有为原项目添加或宣称开源许可证。大厅插画为本次原创矢量图，不使用官方 CATAN 美术。
