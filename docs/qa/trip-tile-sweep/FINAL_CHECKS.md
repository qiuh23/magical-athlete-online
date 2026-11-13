# 本地最终工程检查

基线：PR #69，`2690d066e055146f12a6d808d42e074eac04a9fa`。
本轮仅本地增量，没有GitHub写入，没有实际部署。

## 工程检查

2026-11-13，源码冻结后：

- 完整单元/host测试：1,758 / 1,758 通过，失败0、跳过0。
- 主工程和测试TypeScript检查：通过。
- Worker TypeScript检查：通过。
- 动作QA TypeScript检查：通过。
- 国内client/server与海外browser双构建：通过。
- Wrangler Worker dry-run：通过，未执行部署。
- `git diff --check`：通过。
- 独立实际网格代表性矩阵：140例，失败0、资源失败0。
- 全部151可选角色的双绊杆原型单占格检查：302例，失败0、资源失败0。
- 两轮几何检查前后16份相关源码hash一致，并与最终工作树逐一复核一致。
- 原`ToyCharacter.tsx`与基线逐字一致；既有认证/hash证据测试通过，旧证据没有改写。
- 游戏规则、服务端、Worker源代码和public GLB素材没有改动。

执行命令：

```sh
node --import tsx --test tests/*.test.ts tests/host.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.worker.json --noEmit
node node_modules/typescript/bin/tsc -p qa/tsconfig.motion.json --noEmit
node scripts/build-sites.mjs
XDG_CONFIG_HOME=/tmp/mechanism-motion-wrangler-config node node_modules/wrangler/bin/wrangler.js deploy --dry-run --outdir /tmp/trip-sweep-worker-dry-run
git diff --check
```

Vite仍有超过500kB产物块的提示；这不是失败，也未据此声称性能改善。
性能求解测量只代表当前离线环境，不是真机FPS或浏览器流畅度保证。

## 同步与安全边界

普通速度机关演出由1,600ms变2,000ms（时长+25%，速度约-20%），
所有相关表现消费同一beat时钟；普通走路/角色技能/起身不额外减速。
角色接触反应、命中特效和回收使用同一归一化时间轴。
下一段动作仍由终帧绘制屏障交接，不依靠另设的模型计时器。
快进保留1,000ms下限；减弱动画仍按原设置停放机关并直接呈现规则结果。

新横扫不改变权威受击目标。素材在展开前尚未就绪，或当前布局找不到
覆盖所有目标且避开无关棋子的路径时，停放装置并显示本次省略演出的说明，
不伪造命中、不让旁观者倒地，规则结果照常结算。

151角色检查把每个真实模型投影到同一已确认绊倒演出中，不能解释为所有
角色技能触发条件或所有动态形态的全排列测试。
独立实际网格几何矩阵、有限验证范围及明确限制见同目录专项报告。
离线渲染预览不是浏览器游戏截图。本环境未完成实际浏览器GPU或真机操作验证，
不得把离线201帧采样或单占格角色检查说成任意排布的连续碰撞认证。
