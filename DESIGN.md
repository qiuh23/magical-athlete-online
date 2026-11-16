---
name: 胡闹运动会 · 纸面嘉年华
description: 以角色和赛道为主体，用纸面面板、明亮品牌色和硬阴影组织比赛信息。
colors:
  primary: '#f44735'
  text: '#25464c'
  muted: '#5b7268'
  paper: '#fffdf4'
  line: '#c0cbb7'
  accent: '#254de4'
  focus: '#254de4'
typography:
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif
  title:
    fontFamily: '"Arial Black", var(--ui-font)'
rounded:
  control: 14px
  panel: 14px
spacing:
  base: 4px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#fffdf4'
    rounded: '{rounded.control}'
    padding: 12px 16px
---

# 胡闹运动会 · 纸面嘉年华

## Overview
角色与赛道是比赛画面的主体。界面使用温暖纸面、深青文字、鲜明品牌色和偏移硬阴影；房间、比赛菜单与操作面板沿用相同的表面和控件语言。

## Colors
正文使用 `--ui-text`，说明使用 `--ui-text-muted`；纸面使用 `--paper`，浮层表面使用 `--ui-surface`。控件默认、悬停和激活分别使用 `--ui-control`、`--ui-control-hover`、`--ui-control-active`。细分隔线使用 `--ui-border`，控件轮廓使用 `--ui-control-border`。

品牌黄、红、蓝、绿、粉对应 `--brand-yellow`、`--brand-red`、`--brand-blue`、`--brand-green`、`--brand-pink`。常规主按钮使用品牌红；首页入口面板内的主按钮使用 `--ui-text` 作背景、`--paper` 作文字。强调和焦点分别由 `--ui-accent`、`--ui-focus` 提供。排名金、银、铜使用 `--rank-gold`、`--rank-silver`、`--rank-bronze`，其中金色引用 `--ui-gold`。

场景材质、角色美术和灯光保留各自表达，不把场景颜色当作界面文字或控件色。

## Typography
全局界面字体使用 `--ui-font`，数字启用 `tabular-nums`。倒计时、选手席位、浮动分数、骰子结果和对决数值使用 `--font-display`；另定义印刷字体 `--font-print` 与阅读字体 `--font-reading`。

组件字号记录的是具体选择器，不作为全站统一字号：

| 场景 | 字号 / 行高 / 字重 |
|---|---|
| `.race-menu-content` | `14px / 1.6 / 400`，`--ui-font` |
| 常规 `.button` | `14px / 1.4` |
| 首页配置提交按钮 | `16px`，最小高度 `48px` |
| `.modal-header h2` | `20px / 1.4 / 600`；宽度 ≤ `650px` 时 `18px` |
| 比赛菜单面板标题 | `16px / 1.4 / 600` |
| 桌面首页主标题 | 宽度 ≥ `1000px` 且未进入配置时，`clamp(32px, 5vw, 96px)` |

## Layout
首页尚未进入配置、视口宽度 ≥ `1000px` 时，主视觉与入口分为 `1.1fr / 1fr` 两列，列间距 `32px`；入口按钮为两列。进入配置后隐藏主视觉，把空间留给操作。

房间操作条、席位与配置面板沿用统一控件。沉浸比赛菜单贴边显示，桌面宽度上限 `320px`；横屏且高度 ≤ `600px` 时宽度为 `min(300px,44vw)`。菜单有独立滚动区，不用普通比赛菜单模糊整个赛场。

宽度 ≤ `650px` 时调整顶栏、按钮和弹窗标题。横屏高度 ≤ `570px` 时弹窗最大高度为 `calc(100dvh - 16px)`，遮罩内边距 `8px`。菜单、聊天等局部布局还按方向、宽度与高度组合查询处理。

## Elevation & Depth
- `--shadow-1`：`0 2px 8px rgba(35,73,65,.10)`，轻量浮动控件。
- `--shadow-2`：`0 8px 24px rgba(35,73,65,.18)`，比赛菜单等浮动面板。
- `--shadow-3`：`0 16px 48px rgba(35,73,65,.26)`，弹窗。
- `--shadow-hard`：`3px 4px 0 #25464c`，纸面按钮的偏移硬阴影。

层级由 `--z-base`、`--z-sticky`、`--z-dock`、`--z-banner`、`--z-menu`、`--z-modal`、`--z-toast` 管理。

## Shapes
圆角档位为 `--radius-sm`、`--radius-md`、`--radius-lg`。常规按钮和面板使用大圆角；首页入口面板按钮与浮动选择按钮使用中圆角。图标采用圆头、圆连接，`stroke-width: 1.7`。赛道、机关和角色的三维轮廓独立于界面圆角。

## Tokens
游戏基础 token 的源码为 `src/client/ui-theme.css`；下表保持原始值，包括 `var(...)` 别名。`.impeccable/design.json` 的 `extensions.tokens` 是同一组基础值的镜像。本文 frontmatter 中 `primary` 对应 `--brand-red`，`text/muted/paper/line/accent/focus` 分别对应 `--ui-text/--ui-text-muted/--paper/--ui-border/--ui-accent/--ui-focus`；字体、圆角与基础间距也直接引用本表。

| Token | 值 |
|---|---|
| `--ui-font` | `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif` |
| `--font-display` | `"Arial Black", var(--ui-font)` |
| `--font-print` | `Georgia, "Times New Roman", serif` |
| `--font-reading` | `"Noto Serif SC", "Songti SC", "STSong", "SimSun", serif` |
| `--ui-text` | `#25464c` |
| `--ui-text-muted` | `#5b7268` |
| `--paper` | `#fffdf4` |
| `--brand-yellow` | `#ffda27` |
| `--brand-red` | `#f44735` |
| `--brand-blue` | `#254de4` |
| `--brand-green` | `#b5d66b` |
| `--brand-pink` | `#f6a8d0` |
| `--ui-surface` | `rgba(255,253,244,.96)` |
| `--ui-control` | `#f2f1e5` |
| `--ui-control-hover` | `#fff2bf` |
| `--ui-control-active` | `#e5edda` |
| `--ui-border` | `#c0cbb7` |
| `--ui-control-border` | `#9caf9f` |
| `--ui-accent` | `#254de4` |
| `--ui-gold` | `#b57422` |
| `--rank-gold` | `var(--ui-gold)` |
| `--rank-silver` | `#7d8a84` |
| `--rank-bronze` | `#a06a3b` |
| `--ui-focus` | `#254de4` |
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `14px` |
| `--ui-space` | `4px` |
| `--shadow-1` | `0 2px 8px rgba(35,73,65,.10)` |
| `--shadow-2` | `0 8px 24px rgba(35,73,65,.18)` |
| `--shadow-3` | `0 16px 48px rgba(35,73,65,.26)` |
| `--shadow-hard` | `3px 4px 0 #25464c` |
| `--z-base` | `0` |
| `--z-sticky` | `10` |
| `--z-dock` | `20` |
| `--z-banner` | `30` |
| `--z-menu` | `40` |
| `--z-modal` | `50` |
| `--z-toast` | `60` |
| `--duration-1` | `120ms` |
| `--duration-2` | `180ms` |
| `--duration-3` | `240ms` |
| `--ui-touch-size` | `44px` |

条件覆盖：`(prefers-reduced-motion: reduce)` 内的 `:root`，以及 `html[data-motion="reduce"]`，都把 `--duration-1`、`--duration-2`、`--duration-3` 设为 `0ms`。

## Components
- 主按钮：常规背景为 `--brand-red`，文字为 `--paper`，`2px` 深青边框和 `--shadow-hard`；首页入口面板内使用深青底、纸面文字、`1px` 边框和中圆角。常规内边距 `12px 16px`，内部间距 `calc(var(--ui-space) * 2)`。
- 触控：基础触控尺寸由 `--ui-touch-size` 提供；关闭、声音和比赛图标控件使用该最小宽高。首页配置提交按钮最小高度为 `48px`。
- 焦点：通用 `:focus-visible` 使用 `2px solid var(--ui-focus)`，`outline-offset: 2px`。
- 动效：通用 `button` 的背景、边框和阴影使用 `--duration-2`；`.button` 覆盖为变换与阴影使用 `--duration-1`。两处缓动均为 `cubic-bezier(.2,.7,.3,1)`；三个时长 token 及减弱动态覆盖见上表。
- 弹窗：纸面背景、`--ui-control-border` 边框、`--radius-lg` 与 `--shadow-3`。常态最大高度 `calc(100dvh - 24px)`；标题栏内边距 `12px 16px`，窄屏为 `8px 12px`。遮罩使用 `color-mix(in srgb, var(--ui-text) 40.000%, transparent)` 和 `blur(5px)`。
- 比赛菜单：使用 `--ui-surface` 和 `--shadow-2`，独立滚动；重要比赛信息与场地留在菜单之外。

## Do's and Don'ts
- 保留纸面、鲜明品牌色、硬阴影和角色展示的嘉年华身份。
- 信息面板、按钮和文字使用对应的语义 token；同一用途沿用同一 token。
- 让操作、选手和赛道保持视觉主次；场景装饰不承担必要操作提示。
- 不把某个组件的字号或几何尺寸推广为所有组件的默认值。
