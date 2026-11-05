# 建房玩法直接展示 · 本地验收

2026-11-05，基于 `eea32a5`，仅调整客户端展示和交互。

- 比赛方案、七张地图、五个角色包、人数玩法、特殊赛事直接展示；建房玩法区无折叠、详情链接或重复摘要。
- 地图卡片可重复添加，显示已添加次数；有序列表支持上移、下移、移除。桌面四列，手机三列，窄屏两列；卡片和排序按钮均保留至少 44px 的触控高度。
- 自定义场数和地图顺序保留在编辑器草稿中，切换快捷方案后可恢复；创建、练习、人机各自保留草稿。角色包与特殊赛事选择独立保留。
- 缩短赛程不截断地图或赛事场次，超出范围的设置可直接修正；牌池不足、空地图、未选赛事场次会阻止提交并提示原因。
- 特殊赛事保持默认关闭；开启默认第 3 场，每个适用场次自动抽取一项事件。没有逐项启用随机事件的控件。
- “怎么玩”按基础与操作、地图与计分、角色包与人数、特殊赛事分类，菜单内包含计分表、地图机制、角色来源、网页差异和 36 项事件及组合限制。
- 共享规则、默认配置、序列化格式、服务器、Worker、历史引擎和权限判定未修改。普通玩家、观战者和锁定阶段仍只读。

本地检查结果：

- `pnpm typecheck`：通过（包含 Worker 与测试类型）。
- `pnpm build`：Node 客户端／服务器、浏览器构建通过；保留已有的大包体积提示。
- 103 项相关单元测试通过：`competition`、`room-config-capacity`、`room-management`、`three-player-mode`、`special-events`。
- 15 项 Chromium 浏览器用例通过：玩法可见性、全部角色包开关、重复地图／排序、自定义草稿、方案切换、异常修正、三套方案创建／刷新、房主权限、观战只读、锁定状态、练习／人机重开、各入口草稿、特殊赛事保存与刷新、规则菜单完整性、地图缩略图与角色禁用。
- 4 项 Chromium／WebKit 本地用例通过：手机与桌面操作全部玩法；连续横竖屏切换、建房只提交一次、聊天草稿与房间连接保留。新用例也验证牌池不足与修正、特殊赛事越界修正、36 项规则表和滚动后的分类导航。
- 覆盖宽度 320、360、390、430、568、667、768、800、844、932、1440 等尺寸；没有横向页面溢出。

复现主要检查：

```powershell
pnpm typecheck
pnpm build
pnpm exec tsx --test tests/competition.test.ts tests/room-config-capacity.test.ts tests/room-management.test.ts tests/three-player-mode.test.ts tests/special-events.test.ts
node node_modules/@playwright/test/cli.js test tests/browser/competition.spec.ts tests/browser/special-events.spec.ts tests/browser/home-entry.spec.ts --grep 'all gameplay controls|custom maps, duplicate|shortening a match|switching presets|the rules menu|guest and spectator|tour can be created|special event setup|首页入口先保持未选择|practice rematch|ai rematch'
node node_modules/@playwright/test/cli.js test tests/browser/new-track-scenes.spec.ts --grep 'setup exposes real'
node node_modules/@playwright/test/cli.js test -c playwright.room-experience.config.ts room-options.spec.ts room-layout.spec.ts --grep '手机与桌面|建房草稿'
```

截图来自内存本地房间服务：

- [桌面默认设置](desktop.png)
- [手机开启特殊赛事](mobile-events.png)
- [手机规则菜单](rules-events.png)

手机验证为浏览器尺寸／触控仿真与 WebKit，不代表实体 iPhone Safari、系统键盘、旋转权限或移动网络实测。未修改工作流、未手动触发远端 CI、未部署；审阅分支使用现有 `codex/review-only/` 约定和 `[skip ci]`。
