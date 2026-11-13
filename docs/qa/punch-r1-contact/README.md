# 新拳套 r1：有限真实事件接触

这是新的有限重建，不是遗失旧源码、31条参考或旧通用拳套的恢复。机械源及可编辑 Blend 见 `art/mechanisms/punch-rebuild-r1/`。机械检查点 359b8be 仍单独保存，原报告不改写。

## 本轮实际范围

- Wild 23 前进：真实事件路径 23→24→25。
- Wild 24 后退：真实事件路径 24→23→22。
- 香蕉：完整/经济画质，各横向/竖向布局，8例。
- Coach：完整画质，两布局，4例。经济Coach及其他形态不获证。
- 单个已加载、冻结骨骼的直立角色，实际比例1.65、中心站位，无附近居民、并发运动或额外目标。人物不随compact额外旋转。
- 有界真实三角面表面查询产生候选。运行时只消费经过完整检查的精确形状hash、固定安装矩阵、真实path、场景hash和接触三角见证。不是对所有151角色即时安全求解。
- 650、850、1700ms用同一presentation归一化函数；650ms以下、晚加载、未知输入保持原规则/路径和非接触提示。

## 安装及动作

固定安装坐标以真实箭头第一段方向建立局部坐标，23偏置为[-.55,0,-.36]，24为[-.55,0,-.25]。初始方案的23固定脚与看台支座相交，23最终向场外移110mm后重新检查；没有移动看台，也没有在触发时追随人物移动整架。

`mount-envelope.json`记录四个精确世界矩阵、停放及动作包络。脚底约Y=.20；新增真实脚座外扩20mm，顶部贴脚底，主板底面Y=.1039999967。23五点都贴同一高地；24跨台地边缘，中心另加160mm见方的固定支承，底面Y=.0189999996接实际中心地表，外侧为有明确支承的悬挑。世界检查记录五个实际地表射线点及缺失点，不把悬挑写成整底贴地。

顺序为：收纳→调向（拳/伸缩臂均收回）→伸臂→拳面接触→收拳→人物沿原path移走→收臂→返回park。触发阶段固定root不动，真实弹簧morph同步。中断不瞬间扫回park，而是隐藏该设备并保持正常规则位移。新会话、新事件、加载、画质、形态、targets、path、时窗改变均重新检查；同一事件不重复授权。

## 验证与边界

- 12×401个人物/设备样本：非软拳硬件碰撞0。软拳仅在接触时间域内，最大沿真实移动方向平移至分离的距离18.304mm。这个量不是最小穿透深度。
- 12×101个完整世界样本：真实新环境、灯、道路、两档软垫、非Punch静止硬件及新增基础、另一个r1停放、实际人物path均纳入。仅允许明确地表支承接触及脚底/基础顶面接触。
- 12×101个真实关节姿态：未发现新增非装配表面交叉。保留的刚性焊接、端部弹簧连接单独列在 `self-runtime.json`，不称整机所有零件零交叉。新增嵌套闭合管的空腔/间隙/止挡另由原机械解析检查覆盖。
- Coach最初三个候选软拳位移至分离为38–44mm，已拒绝。同一搜索加入接触时间域和20mm上限后找到合格候选；没有缩人、增加行程或移动root。
- 非Punch模块另有最终安装/包络/基础的独立动作排除检查。两份输入必须匹配，不能把互相缺省的两个报告当组合通过。
- 不是连续时间的完备碰撞证明，不是全角色/多人覆盖，不是实际WebGL/手机HUD或FPS验收。

## 证据文件

原始 `actor-provisional.json`、`actor-coach.json`、`world-provisional.json` 保留原命名及有限检查说明。最终授权由 `release-evidence.json` 将其SHA、当前精确场景源、12条候选及自碰报告绑定；仅改原始文件名不能升级验证状态。

`src/client/scene/mechanisms/punch-r1/evidence.json` 是运行时有限表。`evidence.ts` 导出 R1_EVIDENCE / R1_SCENE_HASH。任何模型/几何/布局变化均须重新核验，不仅改hash让测试通过。

## 本地重跑

在合并非Punch场景组件的独立仓库中：

1. `node --import tsx scripts/recovery/punch-r1/contact.ts`
2. `R1_CHARACTER=coach node --import tsx scripts/recovery/punch-r1/contact.ts`
3. `node --import tsx scripts/recovery/punch-r1/world.ts`
4. `node --import tsx scripts/recovery/punch-r1/bounds.ts`
5. `node --import tsx scripts/recovery/punch-r1/self-poses.ts`
6. `blender -b --python-exit-code 1 --python scripts/recovery/punch-r1/self.py`
7. 检查全部结果后才运行 `node --import tsx scripts/recovery/punch-r1/finalize.ts`。
8. `node --import tsx --test tests/punch-r1-*.test.ts tests/punch-rebuild-r1.test.ts`

开发时可用 R1_SCENE_ROOT 指向精确的非Punch独立工作树。正式组合仓库无需该变量。Blender4.3.2，Node24，项目锁定依赖；BVH使用项目drei依赖，不下载未知碰撞代码。

## 成本

真实GLB474808字节、22 primitives、9612三角。只安装两台，共享缓存geometry/material，最多两台可见时19224三角加36三角基础；最多46个普通draw，不算整个地图。低画质关闭设备投影。活动期间另一台会按隔离守卫隐藏，不新增灯、独立计时器或常驻RAF。没有声称FPS提升。

## 组合接线契约

见 `INTEGRATION.md`。此提交提供完整controller/Layer/证据及真实事件测试；Board3D的最后共享接线在独立release候选完成，接线断言和整树检查之后才算实际运行时交付。这里不改默认开关、不推送或部署。
