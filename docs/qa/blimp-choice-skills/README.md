# 飞艇脸部、尾翼与选卡技能提示

## 改动

飞艇使用 Blender 5.2.3 调整：删除凸出的球状脸颊，眼睛与嘴按艇身真实曲面采样贴合；保留银灰艇身，把薄尾翼移到艇尾，底部改为由短支柱连接的小吊舱。同步可编辑的 `assets/blender/toy-racers.blend`、高低画质 GLB、清单、模型预览与客户端缓存版本。

所有角色选项现在直接显示技能文字并保留独立的“详情 · 技能”入口。交换集市同时显示新抽角色与每名可替换角色的当前公开能力；蛋、电影制作人、僵尸等直接卡牌选项复用同一界面。双胞胎按该次冠军实际复制的能力展示，兼容同一角色多次夺冠。现役角色的提示包含已获得、复制及临时能力，并标识公开的禁用状态。

提示由既有私有 `pending` 投影补充，只有正在回答的玩家能读取。其他玩家和观众不会收到候选牌、交换集市后续玩家的抽牌或内部 context。查看详情不提交选择；保留、替换及全部选择后统一揭示的流程沿用原规则。

手机使用可滚动单列，桌面使用并排选项。增加角色选择面板的阅读空间，并保留键盘避让。技能和路线选项都可“收起选项”，缩成待选择提示条，以便查看棋盘、在场角色及其详情；“展开选项”恢复操作，新选择自动展开。收起与展开不提交动作、不改变待选状态。无规则结算、随机算法或 CI 工作流改动。

聊天入口和面板也移到下方：手机在左下角打开底部面板；桌面在右侧靠下，位于掷骰区域上方。聊天自身的实际高度为选项和在场角色预留空间，选择面板的长短不会反过来移动聊天。手机键盘弹出、短横屏和连续新消息均保留小地图与选项的可操作区域。

## 本地验证

- `pnpm typecheck`：客户端、Node 与 Worker 类型检查通过。
- 完整单元 **1444/1444**：本次 CI 修复执行仓库既有 `pnpm test` 入口，包含原先的 183 项选择、模型和聊天定向检查，以及模型审计新鲜度检查。
- 浏览器 **12 个定向用例**：桌面/手机各覆盖交换集市的比较、详情、收起后对照角色、展开、刷新、私密承诺和实际替换；蛋、电影制作人、重复冠军双胞胎的提示与真实选择；已有抽卡详情回归；飞艇玩家棋子与场地标记的两档载入、实际移动和刷新；既有聊天布局4项覆盖桌面、小电脑、手机和短横屏，同时检查3条实时消息、发送、输入、软键盘模拟及小地图/选项矩形不相交与按钮可点击。
- `pnpm build` 与本地 Worker dry run 通过；构建只有既有的大 chunk 提示。
- 高/低模型分别为 **1,962,520 / 1,082,256 字节**；飞艇 **3,738 / 2,120 三角形、1 个 draw、5 个骨骼、5 段动画**，贴地 pivot 为 0。两档仍满足既有模型预算。
- 逐个比较原包与替换后包，其余 **35 名角色在两档的顶点属性和索引均一致**；其他角色的动画名称集合一致。见 [模型核验](model-verification.json)。

没有完整多人浏览器长局，没有新增或手动触发远端 CI。PR 沿用仓库既有检查。手机为 390×844 的 Edge 浏览器视口，未作实体手机性能测量。

## CI #157 失败与复核

[失败日志](https://github.com/qiuh23/magical-athlete-online/actions/runs/40697341411/job/122847523020) 对应提交 `d1fec068`：完整单元 1444 项中 1443 通过，`tests/mouth-surfaces.test.ts` 失败。飞艇已改写共享的 `toy-racers.blend` 与 GLB，但 `source-audit.json` 保留旧哈希；断言首先显示同属该文件的 `alchemist`，并非炼金术士几何发生变化。浏览器步骤尚未执行，“无测试截图 artifact”和 Node 20 提示不是本次失败原因。

重新打开实际 Blender 源文件后，还发现飞艇表情贴片共有 120 条开放边缘。为保持闭合几何，给每块贴片增加薄侧壁和藏在艇身内的背面，保留原可见曲面与轮廓。重新导出两档模型，原版 36 个角色实际审计均为 0 条开放边缘、0 条孤立边；表情的两个眼睛与嘴也重新测量贴合距离。

`audit-sources.py --original-catalog` 现在能直接重开共享源文件，复核全部 36 个角色后再合并更新原有 153 条审计记录。历史嘴部修复证据和其他扩展审计保持原样，未跳过或放宽原有断言。目录源审计同步重建，失败提示补充具体过期文件路径。

本地先复现同一哈希断言，再确认原失败检查通过；完整 `pnpm test` **1444/1444**，约 23.3 秒。双档资源预算检查通过，飞艇桌面高画质与手机低画质两项实际载入、移动、刷新再次通过；此前选卡及聊天专项无需重复长局。

## 实测图

| 场景 | 证据 |
| --- | --- |
| Blender 调整前 | [原球状脸颊](blender-before.png) |
| Blender 调整后 | [贴合艇身的表情](blender-after.png)、[薄尾翼与吊舱背面](blender-rear.png) |
| 游戏内飞艇 | [桌面高画质](blimp-desktop-front.png)、[手机低画质](blimp-phone-front.png) |
| 交换集市技能比较 | [桌面](swap-desktop.png)、[手机](swap-phone.png) |
| 抽卡技能提示 | [桌面](draw-desktop.png)、[手机](draw-phone.png) |
| 收起后对照在场角色 | [桌面](collapsed-desktop.png)、[手机](collapsed-phone.png) |
| 聊天下移且保留选项和小地图 | [桌面](chat-desktop.png)、[小电脑](chat-small-desktop.png)、[手机](chat-phone.png)、[短横屏](chat-landscape.png) |
| 连续新消息也避让选项和小地图 | [桌面](chat-notice-desktop.png)、[手机](chat-notice-phone.png)、[短横屏](chat-notice-landscape.png) |

## 单个模型重建

沿用项目的雕塑工具依赖；本轮使用 `@gltf-transform/* 4.3.0` 与 `meshoptimizer 0.24.0`，安装在本地忽略目录，不加入产品依赖。`SCULPT_NODE_MODULES` 可指定工具依赖目录，缺省沿用 `.tools/sculpt/node_modules`。以下命令在仓库根执行，`$blender` 指向 Blender 可执行文件：

```powershell
& $blender -b --python-exit-code 1 --python scripts/sculpt/build-samples.py -- --id=blimp
& $blender -b --python-exit-code 1 --python scripts/sculpt/integrate-originals.py -- --id=blimp
node scripts/sculpt/finalize-stage.mjs blimp
node scripts/sculpt/finalize-stage.mjs --economy blimp
node scripts/sculpt/assemble-originals.mjs --finalized blimp
```

`--finalized` 将已压缩的单角色导出装入原包，以无损方式重封已有量化数据，避免重新过滤其他角色的法线。导出后按真实 GLB 更新清单中的字节、三角形、bounds 与本次角色版本，再刷新实际源文件审计并验证：

```powershell
& $blender -b --python-exit-code 1 --python scripts/sculpt/audit-sources.py -- --original-catalog
& $blender -b --python-exit-code 1 --python scripts/sculpt/audit-catalogs.py
pnpm exec tsx --test tests/mouth-surfaces.test.ts tests/3d-assets.test.ts
```

Blender 材质节点按类型查找，兼容本机中文节点名称。

游戏近景使用已有的本地 `scripts/art-qa-build.mjs` 开放相机核验接口，再以 `BLIMP_MODEL_QA=1` 显式运行 `tests/browser/blimp-model.spec.ts`；生产构建不包含该接口。
