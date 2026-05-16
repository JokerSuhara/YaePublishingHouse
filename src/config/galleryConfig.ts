import type { GalleryConfig } from "@/types/config";

// 相册配置
export const galleryConfig: GalleryConfig = {
	// 相册列表
	albums: [
		// 支持jpg/png/webp/avif/gif格式
		// id: 相册唯一标识符（用于目录命名和URL路径），比如设置：id: "firefly-2026", 对应 public/gallery/firefly-2026/目录
		// cover: 手动指定封面图（可选，不填会把cover.*文件作为封面图，如果没有cover.*文件，则使用第一张图片作为封面图）
		// name: 相册名称
		// description: 相册描述
		// location: 相册拍摄地点
		// date: 相册日期，格式为 YYYY-MM-DD，用于排序和显示
		// tags: 相册标签，用于分类和过滤
		// 每添加一个数组项就相当于添加了一个相册，记得在 public/gallery/ 目录下创建对应的子目录并放入图片
		{
			id: "buxianshan",
			name: "不显山",
			description: "不显山相册。",
			location: "不显山",
			date: "2026-05-16",
			tags: ["摄影", "风景"],
		},
		{
			id: "guzhen",
			name: "古镇",
			description: "古镇随拍。",
			location: "古镇",
			date: "2026-05-16",
			tags: ["摄影", "古镇"],
		},
		{
			id: "emei-mountain",
			name: "峨眉山",
			description: "峨眉山行记。",
			location: "峨眉山",
			date: "2026-05-16",
			tags: ["摄影", "山景"],
		},
		{
			id: "zhanyuan",
			name: "瞻园",
			description: "瞻园相册。",
			location: "瞻园",
			date: "2026-05-16",
			tags: ["摄影", "园林"],
		},
		{
			id: "yae-gallery",
			name: "老婆好看捏",
			description: "喜欢的图片收藏。",
			location: "收藏",
			date: "2026-05-16",
			tags: ["插画", "收藏"],
		},
	],

	// 瀑布流最小列宽(px)，浏览器根据容器宽度自动计算列数，默认 240
	// 值越小列数越多，值越大列数越少
	columnWidth: 320,
};
