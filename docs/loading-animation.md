# 首屏加载动画技术文档

## 目标

为博客增加一个只在首次进入或刷新页面时出现的加载过渡层。加载层覆盖主页面，通过透明毛玻璃模糊背景，中心显示四个点位。初始状态为 `· · · ·`，随后每一步随机选择一个点位替换为加载素材图标，全部替换完成后整体淡出进入主界面。

## 实现位置

主要实现集中在 `src/layouts/Layout.astro`：

- 在 frontmatter 中定义 `loadingImages` 静态资源路径。
- 在 `<head>` 中通过 `<link rel="preload" as="image">` 预加载加载图标。
- 在 `<body>` 顶部插入 `#site-loading-screen` 全屏遮罩 DOM。
- 使用内联脚本控制随机替换、无重复图标抽取、淡出和 DOM 移除。
- 在同文件的全局 `<style>` 中定义毛玻璃、点位、图标尺寸和入场动画。

## 静态资源

源素材来自根目录下的 `loading_page/`：

- `loading (1).png`
- `loading (2).png`
- `loading (3).png`
- `loading (4).png`

为了避免首屏额外加载过大的 PNG，已将素材转换为 160px WebP，输出到：

- `public/assets/loading/loading-1.webp`
- `public/assets/loading/loading-2.webp`
- `public/assets/loading/loading-3.webp`
- `public/assets/loading/loading-4.webp`

这些文件由浏览器直接通过 `/assets/loading/...` 访问，不参与 Astro 图片管线，适合首屏轻量预加载。

## 动画流程

1. 页面首次加载时，`#site-loading-screen` 作为 `fixed` 全屏层显示在最上方。
2. 中心区域渲染四个 `.site-loading-dot`，初始文本均为 `·`。
3. 脚本维护两个随机池：
   - `availableIndexes`：还没有被替换的点位索引。
   - `availableImages`：还没有使用过的加载图标。
4. 每一步从两个池中各随机抽取一个，将对应点位替换为图标。
5. 四个点位全部替换完成后，等待短暂停留时间。
6. 给遮罩添加 `.is-hiding`，触发透明度和毛玻璃淡出。
7. 淡出完成后移除遮罩 DOM，避免阻挡页面交互。

## 当前参数

常规动画参数：

- 初始等待：`250ms`
- 每步间隔：`455ms`
- 完成后停留：`310ms`
- 淡出时长：`650ms`
- DOM 移除延迟：`700ms`

无障碍减弱动画模式 `prefers-reduced-motion: reduce` 下会自动缩短等待、步进和淡出时间。

## 视觉样式

遮罩层：

- `position: fixed`
- `inset: 0`
- `z-index: 2147483647`
- 半透明背景
- `backdrop-filter: blur(18px) saturate(1.25)`

点位容器：

- 无背景
- 无边框
- 无圆角
- 无阴影
- 仅保留四列网格布局

桌面尺寸：

- 每个点位/图标：`6.75rem`
- 网格列宽：`7.6rem`
- 间距：`1.25rem`

移动端尺寸：

- 每个点位/图标：`4.75rem`
- 网格列宽：`5.15rem`
- 间距：`0.75rem`

图标入场动画 `loading-dot-pop`：

- 起始：`rotate(-28deg) scale(0.76)`，透明度为 0。
- 中段：`rotate(12deg) scale(1.07)`，形成小幅回弹。
- 结束：`rotate(0deg) scale(1)`，回到中心稳定状态。

## 与 Swup 的关系

该加载动画只在首次进入或刷新页面时出现，不接入 Swup 页面切换生命周期。脚本使用 `data-swup-ignore-script`，避免 Swup 替换页面时重复执行。

项目原有的 Swup 页面切换动画和顶部 `#progress-bar` 保持不变。

## 调整方式

如需调整整体时长，修改 `src/layouts/Layout.astro` 中内联脚本的参数：

```js
const stepDelay = reducedMotion ? 80 : 455;
const fadeDelay = reducedMotion ? 80 : 310;
window.setTimeout(advance, reducedMotion ? 40 : 250);
```

如需调整淡出速度，修改 CSS 和 DOM 移除延迟：

```css
transition: opacity 650ms ease, backdrop-filter 650ms ease;
```

```js
window.setTimeout(() => loader.remove(), reducedMotion ? 120 : 700);
```

如需调整图标大小，修改 `.site-loading-dot` 的 `width`、`height` 和 `.site-loading-dots` 的 `grid-template-columns`。

## 验证

本次改动已通过：

```bash
pnpm.cmd astro check
```

检查结果：0 errors、0 warnings、0 hints。
