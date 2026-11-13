# 拳套机械重建 r1：有限机械检查点

## 版本与用途

这是从公开 PR #66 旧拳套外观重新制作的 **punch-rebuild-r1**，不是丢失的 adjustable-v1 的忠实恢复，也不继承其 31 条轨迹或碰撞结论。

基线为已恢复的旧 PR #66 + 缓存兼容提交 `1cb3194912b25e5d0839ca06a0fe4f3fc6d89f49`。本检查点只增加美术源、独立驱动和测试，不替换 `public` 生产模型，不改变游戏规则或触发路径。`productionApproved=false`。

输入：`public/models/mechanisms/punch_outboard_joint.glb`，SHA256 `ff8a8d4431fd08d4cc0111133ad9f0af1ea8abf3197131f5f6c6dfba0d6fa956`。

## 实际改动

- 保留原拳套、弹簧 morph、导轨、固定脚架和轴承外观。用三段真实空心矩形管替换旧实心臂，新增两级各 0–150 mm 的伸缩关节、导向口与止挡环。
- 拳头方向独立于摆臂：counter = headYaw - boomYaw。伸拳仍用原 slider 与同步弹簧 morph。
- 整个动作不平移或缩放固定根。管体与导向段是真实壁厚/空腔，不是实体互相吞没。
- 修复旧源中的固定柱顶盖与横托顶面共面：仅将 72 个拆分顶点（24 个实际位置）从 Blender Z=.26 降至 .24 m。横托顶面、柱脚、关节与工作头不动，固定连接仍有重叠。结构图原黑椭圆是这处共面伪影，不是缺面。
- 所有新件用 `PUNCH_R1_` 命名并写入版本元数据。Blend 保留可编辑倒角，GLB 使用评估后几何。

## 有限驱动合同

完整字段见 `art/mechanisms/punch-rebuild-r1/contract.json`。

- boomYaw：30–90°；headYaw：0–30°。
- 总 reach：0–.30 m，两级同步各 reach/2；stroke：0–.35 m。
- 固定原工作高度，没有升降，也没有 360° 通用作业域。
- 先收拳才能改朝向/伸缩；先收伸缩臂才能转向。取消只收拳并保持当时朝向/伸长，不扫回停放姿态。
- 演示顺序为 park → aim → reach → strike → stroke retract → reach retract → park；仅依赖归一化进度，没有自建计时器。
- `sample()` 是低层确定性姿态写入。调用方仍须使用阶段约束，并在未来单独完成目标、路径和环境准入；它不是碰撞求解器。

## 已执行检查

- 81 个实际评估网格姿态：摆臂、拳头朝向、伸缩、伸拳各三个值。新增零件没有未列明的表面相交。
- 九个新闭合实体均无非流形边，体积为正。
- 实际倒角网格截面，两轴各四次射线交点，确认空腔与壁厚。管壁 8/10/12 mm；止挡/导向环壁厚 10/12/14 mm。
- 两级管体最小径向净空约 13/15 mm，导向口与止挡环间隙均约 3 mm；全行程最小轴向重叠 110/90 mm。端面只在合法行程端点相接。
- 轴向区间与截面解析检查排除了新增嵌套管在合法同步行程中“表面不交但实体藏入壁厚”的情况。该结论不扩展到原合批支承/头架。
- 总伸长 .32 m 的故意越界负例产生 53 对三角接触，驱动也拒绝越界。
- 17 姿态 GLB 冷回导：9612 三角保持，双向顶点最大误差低于 0.000001 m，完整数值见 `validation.json`。
- Three 实际 GLB 驱动测试：固定根、独立朝向、真实 morph、倒序采样、1000 步演示阶段约束、101 步只收拳取消。另有证据绑定测试，防止模型变化而误用当前报告。
- 主工程与 Worker 类型检查通过。此检查点没有重复宣称已恢复旧新版全游戏测试结果。

`raw-contacts.json` 保留原头架/固定焊接接口、弹簧端部等原始表面接触记录。明确列出的新增固定连接及止挡接触见 `validation.json`；**没有声称整机零相交或连续全域无碰**。

## 可查看与重跑

- 编辑源：`art/mechanisms/punch-rebuild-r1/punch-rebuild-r1.blend`
- 运行资源：同目录 `punch-rebuild-r1.glb`
- 真实材质视图：`structure-opaque.png`
- 透明壳结构检查图：`structure-transparent.png`。透明与金色止挡仅用于这张技术图，不写回模型。
- 两张图都是离线机械结构图，不是游戏截图、手机画面或性能验证。

从仓库根执行，需 Blender 4.3.2、Node 24 与项目锁定依赖：

```sh
blender -b --python-exit-code 1 --python art/mechanisms/punch-rebuild-r1/build.py
blender -b --python-exit-code 1 --python art/mechanisms/punch-rebuild-r1/inspect_contacts.py
blender -b --python-exit-code 1 --python art/mechanisms/punch-rebuild-r1/validate.py
blender -b --python-exit-code 1 --python art/mechanisms/punch-rebuild-r1/check_sections.py
blender -b --python-exit-code 1 --python art/mechanisms/punch-rebuild-r1/render_structure.py -- --opaque
blender -b --python-exit-code 1 --python art/mechanisms/punch-rebuild-r1/render_structure.py
node --import tsx --test tests/punch-rebuild-r1.test.ts
pnpm typecheck
```

环境中的 tsx CLI 建立临时 IPC pipe 曾受限制，因此测试用同一 tsx loader 与 Node test runner 执行原测试文件，没有删改断言或修改权限。生成器可重建相同几何；Blend 元数据不承诺字节级再生成一致。

## 仍未完成的实际游戏能力

这里尚无棋子接触、真实地图、邻装置/旁观者、浏览器或手机 FPS 证明。不能把整个候选角度盒视为连续无碰批准，也不能让旧 Wild24 证书换 GLB 后继续放行。

下一阶段需新 rig/domain/phase consumer，基于已加载实际角色三角面、固定 mount、真实 motion.path 第一条边求接触，冻结 slot/scale/朝向并沿原 path+stride 移动。先验证前进与后退各一锚、横竖布局与两画质，再加入有限不同体型、已倒、旁观者、邻人、曲线及中断反例。必须在新环境精确输入上验证完整阶段，暂停使用共享时钟，变化/晚加载/skip 时保守取消，不能原地硬转或移动固定根追人。

域外仍按原游戏规则执行非接触提示；这不是完整功能已完成的替代说法。
