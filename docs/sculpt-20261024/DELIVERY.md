# 全角色 3D 手办交付

## 范围与基线

- 基线：`7467c208b3247af9d4348616366af63bac4f7311`，独立工作分支 `art/all-character-sculpt`。
- 完成 **151 个角色 ID＋2 个独立形态/模块**：原版36、Second Wind36＋变身/野猪2、Extra Mile31、Leaf18、Wurstii30。没有开放 Box，也没有修改地图、规则、技能、随机数、联网协议或二维 SVG 头像。
- 包含原版高/低质量总包、独立香蕉高/低版、各扩展 GLB、可编辑 Blender 源、制作脚本、清单、完整四视图与真实游戏截图/录像。
- 没有推送、创建 PR、合并或部署。局部版本已提交到本地 Git，提交号见包内 `baseline.json`。

## 主要变化

不是统一换色：重新构造了长肢、软体、四足、车辆、房屋、蛇/鱼、卡牌、植物和多体组合。奇奇与蒂蒂保留两位，蓬蓬海鹦保留一大三小，塔尔斯保留双尾；伯特、埃里克、奥拉夫依据附件角色而非同名人物。香蕉实际覆盖路径已同步更新。

除原版与香蕉的既有低模外，四个扩展包高低画质共用同一几何，沿用材质和阴影差异，没有宣称新增独立低模。

五种局部骨骼状态为 idle、move、skill、fall、recover；世界位移、绊倒倾角和起立仍由原有游戏链路控制。支持独立实例、减少动效静态绑定、Bite Mark 正常/变身切换，以及骑士和马力欧分别使用独立野猪模块。

增加了贴面五官、衣物厚度、工具握持、轮轴、轮子旋转和连续弯曲结构。逐张侧背检查后修正了香蕉腿脚、尺蠖接缝、锅柄、车架、镜头、持弓、衣服交叠及食人花实际开口等问题。单角色材质绘制单元合并为1，保留顶点颜色，不在模型中烘焙玩家底座和编号。

## 来源与设计补全

- 原版：实际查看发行商规则 PDF 的角色卡页22–25（GamersHQ 镜像）。
- Second Wind：实际查看登记作者站的36张卡图；变身和未展示部分明确作为项目设计。
- Extra Mile：实际查看作者 `ExtraMile.pdf` 的卡面页1、3、5、7。
- Leaf：本轮未取得原作者 PNG，依据仓库 SVG 和登记识别特征，不冒称原作者原图。
- Wurstii：实际查看用户包内30张卡面裁图。鲤鱼王参考卡是灰度图，其橙/白/黄色彩依据已有 SVG/角色识别，不声称来自灰度图。
- 背面、底面、完整体积和关节均含项目的立体解释，不是原作者批准的精确生产模型。

## 验证结果

- `pnpm typecheck`、`pnpm build`。
- 172 项资源、材质、绑定、动画、头像、地图坐标/相机/路径和恢复相关单元检查。
- 153 个逻辑形态的实际 GLB 解码、绑定/静态克隆、五动画每段65个时间点检查；153 个单件源重开，闭合边/松散边审计；原版36和Second Wind38总源另行重开核对。
- 63 项功能性浏览器检查：47项全角色/拥挤/动作场景；6项桌面与两种手机宽度的普通场景；2项正常/变身及跨角色坐骑切换；2项真实高低资源失败与恢复；6项静态模块/画质场景。
- 2项独立的30帧场景测量。未删除预算断言；旧生成器/固定骨骼/嘴部顶点等实现断言改为当前源审计及等效几何/独立动画检查。恢复测试同时拦截真实的总包和独立香蕉路径，保留两个失败占位与恢复断言。
- 生产构建仍有既有的大 JavaScript 分块警告；没有为这次角色工作重写加载框架。

移动录像使用真实掷骰流程；技能、绊倒、起立和形态切换的专项验收通过测试夹具向真实游戏场景注入相应状态/展示事件。它们验证渲染链路，不等于逐一复测151名角色的全部技能组合。

## 规格和开销

最终准确数值见 `manifest.json`、`character-specifications.csv` 和各资源包原路径下的 manifest。原版高包约1.79MiB、202,453三角面；低包约1.01MiB、76,199三角面。独立香蕉约44.5KB/38.3KB。

相较基线，Second Wind、Extra Mile 和 Leaf 的部分造型使用了更多几何来完成曲线、衣物及附件；没有统一翻倍预算。每件仍符合原有面数/文件上限。角色绘制单元由原版171→36、Second Wind199→38、Extra Mile145→31、Leaf85→18，Wurstii维持30件各1单元。此数字不包括地图、玩家底座与阴影重复绘制。

实测环境是 Linux 云端 Chromium、ANGLE Vulkan **SwiftShader 软件渲染**，不是实体手机。稳定八人场景、不截图的30帧测量：

- 1280×900高画质：CPU提交中位约3.45ms，渲染起始间隔中位约898ms。
- 360×800低画质：CPU提交中位约2.40ms，渲染起始间隔中位约60ms。

高画质在这台软件渲染环境明显慢。CPU提交耗时不是GPU完成时间，按需空闲间隔也不是帧率。**不能据此宣称真机流畅或已达到目标手机性能。**真实手机GPU、温度、内存和浏览器仍需在目标设备验证。每个场景的 draw calls、三角面、网络资源和原始测量保留在验证记录中。

## 看图与源文件

- `evidence/catalog/`：21张分包联系表，逐角色正面、侧面、背面与3/4视角。
- `evidence/glb-previews/`：612张四视图，来自最终 GLB 解码后独立导入 Blender；WebP仅是原渲染的压缩编码，不是生成效果图。
- `evidence/hero-previews/`：代表角色768×960近景。
- `evidence/game-*/`：真实浏览器截图，交付时编码为JPEG以控制包体；日志中的PNG名对应同名JPEG，画面内容未改动。
- `evidence/game-video/`：真实游戏WebGL画布录制的MP4，不含DOM HUD，不是离线动画渲染。
- `changes/public/models/*/avatars/`：新的模型预览。选牌 SVG 与原有二维头像保持不变。

单件 `.blend` 内保留 `EDIT-{id}` 可编辑部件和 `toy_{id}` 游戏导出对象；编辑时隐藏 GAME、显示 EDIT，避免双层重叠。原版总源按角色集合组织，默认显示 coach；其余角色可在 Outliner 开启。Second Wind 总源同理，独立文件是单件导出的主源。

## 接入

1. 备份工作区，在参考提交或已核对兼容的新基线上创建独立分支。
2. 在仓库根目录先执行 `git apply --check code.patch`，通过后再 `git apply code.patch`。若基线不同产生冲突，逐项合并，不要强行覆盖后续改动。
3. 将 `changes/assets/`、`changes/public/models/`、`changes/docs/` 中的相应文件复制到仓库。`changes/src/`、`changes/scripts/`、`changes/tests/` 是完整修改文件供核对；已经应用补丁时不要重复覆盖本地新改动。
4. 运行下面的检查。加载URL已使用 `authored-sculpt-final-20261024`，避免旧缓存。

```sh
pnpm typecheck
pnpm build
node --import tsx --test tests/3d-assets.test.ts tests/second-wind-models.test.ts tests/expansion-models.test.ts tests/wurstii-assets.test.ts tests/toy-model-instance.test.ts tests/mouth-surfaces.test.ts tests/revolutionary-sculpt.test.ts tests/avatars.test.ts tests/banana-reference.test.ts tests/pawn-materials.test.ts tests/asset-recovery.test.ts tests/bridges-display.test.ts tests/camera.test.ts tests/pawn-motion.test.ts
```

制作版本：Blender4.3.2；原版总源/经济版组装Blender5.2.2 LTS；Node24.22.1、pnpm11.25.0。制作工具使用 glTF-Transform4.5.1 和 meshoptimizer1.3.0，仅用于离线资源加工，不增加游戏渲染框架。

如需重建，先安装项目依赖，再按以下方式准备离线工具，并设置 Blender 可执行文件路径：

```sh
npm install --prefix .tools/sculpt @gltf-transform/core@4.5.1 @gltf-transform/extensions@4.5.1 @gltf-transform/functions@4.5.1 meshoptimizer@1.3.0
BLENDER=/path/to/blender-4.3.2 BLENDER_ASSEMBLY=/path/to/blender-5.2.2 bash scripts/sculpt/rebuild.sh
```

预览联系表脚本另需 Python Pillow。生产 `pnpm build` 不会重生美术；不要用旧的历史 `generate-*.py` 覆盖本轮资源。浏览器验收需先运行 `node scripts/art-qa-build.mjs` 生成专用观察构建；正常发布必须重新运行 `pnpm build`，观察入口不进入生产包。

## 限制

未做实体手机性能验收，也未验证每个角色的所有技能连锁。八人同格仍会遮挡部分身体，保留原编号和角色详情入口，没有重做拥挤布局。Leaf原作者图缺失及所有不可见侧背补全已明确登记。美术仍需由你做最终审美审查；这里的“完成”表示资源覆盖与上述本地验收完成，不代表原作者认可或全平台零缺陷。

专项浏览器复现（不作为生产包入口）：

```sh
node scripts/art-qa-build.mjs
pnpm exec playwright test -c playwright.sculpt.config.ts
SCULPT_FORMS=1 pnpm exec playwright test -c playwright.sculpt.config.ts --grep "sculpt samples"
# 测试后恢复正常生产构建
pnpm build
```

专用配置启用 SCULPT_QA；普通生产端到端测试不依赖观察入口。可通过 PLAYWRIGHT_CHROMIUM_EXECUTABLE 指定已安装的 Chromium；SCULPT_SOFTWARE=1 仅用于需要软件渲染的云端复现。
