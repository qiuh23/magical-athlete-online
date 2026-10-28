# 飞艇脸部、尾翼与选卡技能提示

## 改动

飞艇使用 Blender 5.2.3 调整：删除凸出的球状脸颊，眼睛与嘴按艇身真实曲面采样贴合；保留银灰艇身，把薄尾翼移到艇尾，底部改为由短支柱连接的小吊舱。同步可编辑的 `assets/blender/toy-racers.blend`、高低画质 GLB、清单、模型预览与客户端缓存版本。

所有角色选项现在直接显示技能文字并保留独立的“详情 · 技能”入口。交换集市同时显示新抽角色与每名可替换角色的当前公开能力；蛋、电影制作人、僵尸等直接卡牌选项复用同一界面。双胞胎按该次冠军实际复制的能力展示，兼容同一角色多次夺冠。现役角色的提示包含已获得、复制及临时能力，并标识公开的禁用状态。

提示由既有私有 `pending` 投影补充，只有正在回答的玩家能读取。其他玩家和观众不会收到候选牌、交换集市后续玩家的抽牌或内部 context。查看详情不提交选择；保留、替换及全部选择后统一揭示的流程沿用原规则。

手机使用可滚动单列，桌面使用并排选项。增加角色选择面板的阅读空间，并保留键盘避让。技能和路线选项都可“收起选项”，缩成待选择提示条，以便查看棋盘、在场角色及其详情；“展开选项”恢复操作，新选择自动展开。收起与展开不提交动作、不改变待选状态。无规则结算、随机算法或 CI 工作流改动。

## 本地验证

- `pnpm typecheck`：客户端、Node 与 Worker 类型检查通过。
- 定向单元 **161/161**：选择投影、秘密信息、交换集市、角色详情、两档模型预算及静态/独立动画实例。
- 浏览器 **8 个定向用例**：桌面/手机各覆盖交换集市的比较、详情、收起后对照角色、展开、刷新、私密承诺和实际替换；蛋、电影制作人、重复冠军双胞胎的提示与真实选择；已有抽卡详情回归；飞艇玩家棋子与场地标记的两档载入、实际移动和刷新。
- `pnpm build` 与本地 Worker dry run 通过；构建只有既有的大 chunk 提示。
- 高/低模型分别为 **1,959,388 / 1,083,404 字节**；飞艇 **2,898 / 2,120 三角形、1 个 draw、5 个骨骼、5 段动画**，贴地 pivot 为 0。两档仍满足既有模型预算。
- 逐个比较原包与替换后包，其余 **35 名角色在两档的顶点属性和索引均一致**；其他角色的动画名称集合一致。见 [模型核验](model-verification.json)。

只运行上述本地定向检查，没有完整多人长局，没有新增或手动触发远端 CI。PR 创建后沿用仓库既有检查。手机为 390×844 的 Edge 浏览器视口，未作实体手机性能测量。

## 实测图

| 场景 | 证据 |
| --- | --- |
| Blender 调整前 | [原球状脸颊](blender-before.png) |
| Blender 调整后 | [贴合艇身的表情](blender-after.png)、[薄尾翼与吊舱背面](blender-rear.png) |
| 游戏内飞艇 | [桌面高画质](blimp-desktop-front.png)、[手机低画质](blimp-phone-front.png) |
| 交换集市技能比较 | [桌面](swap-desktop.png)、[手机](swap-phone.png) |
| 抽卡技能提示 | [桌面](draw-desktop.png)、[手机](draw-phone.png) |
| 收起后对照在场角色 | [桌面](collapsed-desktop.png)、[手机](collapsed-phone.png) |

## 单个模型重建

沿用项目的雕塑工具依赖；本轮使用 `@gltf-transform/* 4.3.0` 与 `meshoptimizer 0.24.0`，安装在本地忽略目录，不加入产品依赖。`SCULPT_NODE_MODULES` 可指定工具依赖目录，缺省沿用 `.tools/sculpt/node_modules`。以下命令在仓库根执行，`$blender` 指向 Blender 可执行文件：

```powershell
& $blender -b --python-exit-code 1 --python scripts/sculpt/build-samples.py -- --id=blimp
& $blender -b --python-exit-code 1 --python scripts/sculpt/integrate-originals.py -- --id=blimp
node scripts/sculpt/finalize-stage.mjs blimp
node scripts/sculpt/finalize-stage.mjs --economy blimp
node scripts/sculpt/assemble-originals.mjs --finalized blimp
```

`--finalized` 将已压缩的单角色导出装入原包，以无损方式重封已有量化数据，避免重新过滤其他角色的法线。导出后按真实 GLB 更新清单中的字节、三角形、bounds 与本次角色版本，再执行 `tests/3d-assets.test.ts`。Blender 材质节点按类型查找，兼容本机中文节点名称。

游戏近景使用已有的本地 `scripts/art-qa-build.mjs` 开放相机核验接口，再以 `BLIMP_MODEL_QA=1` 显式运行 `tests/browser/blimp-model.spec.ts`；生产构建不包含该接口。
