# 首屏加载动画说明

## 目标

在首次进入或刷新页面时显示全屏加载层：背景使用毛玻璃遮罩，中间显示四个点位，随机逐个替换为加载图标，全部替换完成后淡出并移除 DOM。

实现文件：`src/layouts/Layout.astro`

## 核心技术栈

- Astro Layout：在全站基础布局中插入加载层 DOM、预加载资源和内联脚本。
- 原生 JavaScript：控制随机抽取、点位替换、动画节奏、淡出和 DOM 移除。
- CSS Grid：排列四个加载点位。
- CSS Animation / Transition：实现图标弹入动画和遮罩淡出。
- WebP 静态资源：加载图标放在 `public/assets/loading/`，通过 `/assets/loading/...` 直接访问。
- Swup 兼容：脚本使用 `data-swup-ignore-script`，避免页面切换时重复执行。

## 关键代码

### 1. 加载图标路径

```ts
const loadingImages = [
	url("/assets/loading/loading-1.webp"),
	url("/assets/loading/loading-2.webp"),
	url("/assets/loading/loading-3.webp"),
	url("/assets/loading/loading-4.webp"),
];
```

### 2. 预加载图标

```astro
{loadingImages.map((image) => <link rel="preload" as="image" href={image} />)}
```

### 3. 加载层 DOM

```astro
<div id="site-loading-screen" aria-hidden="true">
	<div class="site-loading-dots">
		<span class="site-loading-dot">·</span>
		<span class="site-loading-dot">·</span>
		<span class="site-loading-dot">·</span>
		<span class="site-loading-dot">·</span>
	</div>
</div>
```

### 4. 随机替换和淡出逻辑

```astro
<script is:inline data-swup-ignore-script define:vars={{ loadingImages }}>
	(() => {
		const loader = document.getElementById("site-loading-screen");
		if (!loader) return;

		const dots = Array.from(loader.querySelectorAll(".site-loading-dot"));
		const availableIndexes = dots.map((_, index) => index);
		const availableImages = [...loadingImages];
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const stepDelay = reducedMotion ? 80 : 455;
		const fadeDelay = reducedMotion ? 80 : 310;
		let currentStep = 0;

		const pickRandom = (items) => {
			const randomIndex = Math.floor(Math.random() * items.length);
			return items.splice(randomIndex, 1)[0];
		};

		const finish = () => {
			window.setTimeout(() => {
				loader.classList.add("is-hiding");
				window.setTimeout(() => loader.remove(), reducedMotion ? 120 : 700);
			}, fadeDelay);
		};

		const advance = () => {
			if (currentStep >= dots.length || availableIndexes.length === 0) {
				finish();
				return;
			}

			const dotIndex = pickRandom(availableIndexes);
			const image = pickRandom(availableImages);
			const dot = dots[dotIndex];

			dot.classList.add("is-image");
			dot.textContent = "";
			dot.innerHTML = `<img src="${image}" alt="" decoding="async" />`;

			currentStep += 1;
			currentStep >= dots.length ? finish() : window.setTimeout(advance, stepDelay);
		};

		window.setTimeout(advance, reducedMotion ? 40 : 250);
	})();
</script>
```

### 5. 遮罩和淡出样式

```css
#site-loading-screen {
	position: fixed;
	inset: 0;
	z-index: 2147483647;
	display: grid;
	place-items: center;
	backdrop-filter: blur(18px) saturate(1.25);
	-webkit-backdrop-filter: blur(18px) saturate(1.25);
	transition: opacity 650ms ease, backdrop-filter 650ms ease;
}

#site-loading-screen.is-hiding {
	opacity: 0;
	backdrop-filter: blur(0) saturate(1);
	-webkit-backdrop-filter: blur(0) saturate(1);
	pointer-events: none;
}
```

### 6. 点位布局和入场动画

```css
.site-loading-dots {
	display: grid;
	grid-template-columns: repeat(4, 7.6rem);
	gap: 1.25rem;
}

.site-loading-dot {
	display: grid;
	width: 8.75rem;
	height: 8.75rem;
	place-items: center;
	font-size: 4.85rem;
}

.site-loading-dot.is-image {
	animation: loading-dot-pop 220ms cubic-bezier(0.2, 0.9, 0.35, 1.25) both;
}

.site-loading-dot img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

@keyframes loading-dot-pop {
	from {
		opacity: 0;
		transform: rotate(-60deg) scale(0.76);
	}
	68% {
		opacity: 1;
		transform: rotate(30deg) scale(1.07);
	}
	to {
		opacity: 1;
		transform: rotate(0deg) scale(1);
	}
}
```

## 参数位置

- 初始等待：`window.setTimeout(advance, reducedMotion ? 40 : 250)`
- 每步间隔：`stepDelay = reducedMotion ? 80 : 455`
- 完成后停留：`fadeDelay = reducedMotion ? 80 : 310`
- 淡出时间：`transition: opacity 650ms ease`
- DOM 移除延迟：`loader.remove()` 外层 `setTimeout` 的 `700ms`

## 静态资源

- 原始素材：`loading_page/loading (1).png` 到 `loading (4).png`
- 页面使用：`public/assets/loading/loading-1.webp` 到 `loading-4.webp`
