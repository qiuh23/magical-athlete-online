# 大厅与运动会首页验收 · 2026-11-06

基线是本轮拉取的最新 `origin/main`：`a8ada023e59ba428ca9c4941679e708c459b5789`。所有工作在新的独立 worktree 进行；原工作区没有切换分支、覆盖或清理。设计原则见 [DESIGN.md](DESIGN.md)，运动会首页细节见 [athlete-review.md](athlete-review.md)。

## 结果

- 大厅延续现有浅绿桌游视觉，放大正文与状态文字、梳理留白与按钮层级；三款游戏分别保留绿色、暖金与棕色主操作。手机不缩小成密集桌面界面。
- 三张卡片均完整呈现640×360插画，所有宽度 `aspect-ratio:16/9` + `object-fit:contain`。不裁切掩盖绘制问题。1366×768 下完整三卡和入口按钮仍在首屏。
- 卡坦岛大厅图原创重画：五种资源各有对应图案，18张数字牌、3个3:1示意码头、红蓝道路和房屋共用六角网格。不是游戏内3D地图修改。生成源码与几何验证一同提交，来源见 [art/README](../../../lobby/art/README.md)。
- 运动会保留怪咖与跑道，减少整页高饱和色；创建、加入、自己练习、人机四入口及所有建房配置仍直接可用。首页配置提交条改正常文档流，避免短横屏遮挡选项。
- 游戏规则、房间状态、联机协议、路由逻辑、部署文件和工作流没有改动；原main通过检查后发布阿里云及Cloudflare的流程继续沿用。

## 前后截图

截图来自本机实际运行页面，Edge / Playwright，deviceScaleFactor=1。逐张查看了桌面、手机竖屏和横屏，另检查320窄屏、768平板及1366×768小桌面。页面允许自然纵向滚动。

| 视口 | 修改前 | 修改后 |
| --- | --- | --- |
| 大厅桌面1440×1000 | [before](lobby-before-desktop.png) | [after](lobby-after-desktop.png) |
| 大厅竖屏390×844 | [before](lobby-before-portrait.png) | [after](lobby-after-portrait.png) |
| 大厅横屏844×390 | [before](lobby-before-landscape.png) | [after](lobby-after-landscape.png) |
| 大厅窄屏320×720 | [before](lobby-before-narrow.png) | [after](lobby-after-narrow.png) |
| 大厅平板768×1024 | [before](lobby-before-tablet.png) | [after](lobby-after-tablet.png) |
| 卡坦插画手机裁切核查 | [before](catan-art-before-portrait.png) | [after](catan-art-after-portrait.png) |
| 运动会桌面 | [before](athlete-before-desktop.png) | [after](athlete-after-desktop.png) |
| 运动会竖屏 | [before](athlete-before-portrait.png) | [after](athlete-after-portrait.png) |
| 运动会横屏 | [before](athlete-before-landscape.png) | [after](athlete-after-landscape.png) |

卡坦插画另保留五种宽度的独立区域截图 `catan-art-{before,after}-{desktop,portrait,landscape,narrow,tablet}.png`，可检查外圈、港口、道路交点和房屋底座；没有把游戏内地图当成大厅插图修复。

## 本地验证

- `npm run typecheck`、`npm run typecheck:release`、`npm run build`：通过。构建仍有既有较大JS chunk提示；本轮未引入运行时依赖。
- `npx --no-install wrangler deploy --dry-run`：通过，仅本地打包检查，未上传或发布。
- 现有release合同单测加新插图几何测试：**55/55通过**。覆盖双后端路由、身份隔离、邀请优先级、存储/创建恢复、部署打包及大厅所有同源素材。新几何测试验证19地块、72边、54交点、道路均落真实边线、房屋在同色道路端点、码头连接海岸，以及SVG与生成源码一致。
- `npx --no-install playwright test tests/browser/lobby.spec.ts tests/browser/home-entry.spec.ts tests/browser/dual-backend.spec.ts --reporter=list`：**28/28通过**。包含大厅三游戏六入口、两服整页切换、邀请/观战、禁用存储、配置漂移停止跳转、未开放状态、键盘焦点、减少动态效果、手机轻点、首页草稿与原建房选项、服务器探测与失败处理。
- `node docs/qa/entry-design/lobby-review.mjs`：真实本地HTTP服务的五视口检查通过（模块按正确MIME提供，未用生产页面代替本地代码）；3图均完整加载、比例与contain正确、无横向溢出、3px键盘焦点、卡坦邀请/返回选择通过，无pageerror。`--before`模式用于基线采集。
- 运动会真实本地运行与额外交互/对比度测量结果见 [athlete-review.md](athlete-review.md)。主入口默认/悬停/焦点/禁用对比分别7.08/9.04/7.08/5.19。
- 独立只读复核确认：卡坦插画红4段、蓝3段道路分别连续；3处房屋锚点均接同色道路；五资源图案与配色对应，桌面及窄屏完整；首页CSS未发现影响对局的选择器。

初次浏览器验收发现1366×768下卡片底部超出首屏，压缩顶部与卡片留白后，上述28项完整重跑通过；没有通过缩小字号、裁切插图或放宽测试解决。没有额外手动触发远端CI，也没有新增发布链路。

## 参考、来源与未验证项

参考 [Impeccable](https://github.com/pbakaus/impeccable) 的对比度/层级/响应式审查和 [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) 的题材艺术指导；公开资料只读，不安装或运行第三方脚本。UI UX Pro Max仅查看公开介绍，本轮无需采用额外设计体系。所有头像、卡面、图标沿用现有项目素材，卡坦大厅图为原创源码，详见设计规范与素材记录。没有新增远程图片、字体或第三方包。

未做实体iPhone/Android、系统键盘、真实移动网络或生产服务端到端验收；浏览器视口模拟不能代表实体Safari。本次仅提交PR，不合并或主动生产部署；必要自动PR检查沿用现有配置，正式发布由原main流程执行。
