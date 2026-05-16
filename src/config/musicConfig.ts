import type { MusicPlayerConfig } from "../types/config";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 禁用音乐播放器方法：
	// 模板默认侧边栏和导航栏两个都显示
	// 1. 侧边栏：在sidebarConfig.ts侧边栏配置把音乐组件enable设为false禁用即可
	// 2. 导航栏：在本配置文件把showInNavbar设为false禁用即可

	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "random",

	// 是否显启用歌词
	showLyrics: true,

	// Meting API 配置
	meting: {
		// Meting API 地址
		// 默认使用官方 API，也可以使用自定义 API
		api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "playlist",
		// 歌单/专辑/单曲 ID 或搜索关键词
		id: "17905064629",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/使一颗心免于哀伤-哼唱.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{
				name: "使一颗心免于哀伤",
				artist: "知更鸟 / HOYO-MiX / Chevy",
				url: "/assets/music/使一颗心免于哀伤-哼唱.mp3",
				cover: "/assets/music/cover/cover-001.jpg",
				lrc: "/assets/music/lrc/lrc-001.lrc",
			},
			{
				name: "Befall",
				artist: "尚雯婕",
				url: "/assets/music/尚雯婕 - Befall_L.ogg",
				cover: "/assets/music/cover/cover-002.jpg",
				lrc: "/assets/music/lrc/lrc-002.lrc",
			},
			{
				name: "Rubia",
				artist: "周深",
				url: "/assets/music/周深 - Rubia_L.ogg",
				cover: "/assets/music/cover/cover-003.jpg",
				lrc: "/assets/music/lrc/lrc-003.lrc",
			},
			{
				name: "Starfall",
				artist: "袁娅维TIA RAY",
				url: "/assets/music/袁娅维TIA RAY - Starfall_L.ogg",
				cover: "/assets/music/cover/cover-004.jpg",
				lrc: "/assets/music/lrc/lrc-004.lrc",
			},
			{
				name: "Nightglow",
				artist: "蔡健雅",
				url: "/assets/music/蔡健雅 - Nightglow_L.ogg",
				cover: "/assets/music/cover/cover-005.jpg",
				lrc: "/assets/music/lrc/lrc-005.lrc",
			},
			{
				name: "TruE",
				artist: "黄龄 / HOYO-MiX",
				url: "/assets/music/黄龄 _ HOYO-MiX - TruE_L.ogg",
				cover: "/assets/music/cover/cover-006.jpg",
				lrc: "/assets/music/lrc/lrc-006.lrc",
			},
			{
				name: "Regression",
				artist: "阿云嘎 / HOYO-MiX",
				url: "/assets/music/阿云嘎 _ HOYO-MiX - Regression_L.ogg",
				cover: "/assets/music/cover/cover-007.jpg",
				lrc: "/assets/music/lrc/lrc-007.lrc",
			},
			{
				name: "Moon Halo",
				artist: "茶理理理子 / TetraCalyx / hanser / HOYO-MiX",
				url: "/assets/music/茶理理理子 _ TetraCalyx _ hanser _ HOYO-MiX - Moon Halo_L.ogg",
				cover: "/assets/music/cover/cover-008.jpg",
				lrc: "/assets/music/lrc/lrc-008.lrc",
			},
			{
				name: "Da Capo",
				artist: "HOYO-MiX",
				url: "/assets/music/HOYO-MiX - Da Capo_L.ogg",
				cover: "/assets/music/cover/cover-009.jpg",
				lrc: "/assets/music/lrc/lrc-009.lrc",
			},
			{
				name: "IRAS 17514",
				artist: "HOYO-MiX",
				url: "/assets/music/HOYO-MiX - IRAS 17514_L.ogg",
				cover: "/assets/music/cover/cover-010.jpg",
				lrc: "/assets/music/lrc/lrc-010.lrc",
			},
			{
				name: "Pink Flavor",
				artist: "ChiliChill乐团",
				url: "/assets/music/ChiliChill乐团 - Pink Flavor_L.ogg",
				cover: "/assets/music/cover/cover-011.jpg",
				lrc: "/assets/music/lrc/lrc-011.lrc",
			},
			{
				name: "恋人心",
				artist: "魏新雨",
				url: "/assets/music/魏新雨 - 恋人心_L.ogg",
				cover: "/assets/music/cover/cover-012.jpg",
				lrc: "/assets/music/lrc/lrc-012.lrc",
			},
			{
				name: "桜のような恋でした (宛如樱花般的爱恋)",
				artist: "鹿乃",
				url: "/assets/music/鹿乃 - 桜のような恋でした (宛如樱花般的爱恋)_L.ogg",
				cover: "/assets/music/cover/cover-013.jpg",
				lrc: "/assets/music/lrc/lrc-013.lrc",
			},
			{
				name: "崩坏世界的歌姬 (Movie Ver.)",
				artist: "小林未郁",
				url: "/assets/music/小林未郁 - 崩坏世界的歌姬 (Movie Ver_)_L.ogg",
				cover: "/assets/music/cover/cover-014.jpg",
				lrc: "/assets/music/lrc/lrc-014.lrc",
			},
			{
				name: "Cyberangel",
				artist: "hanser",
				url: "/assets/music/hanser - Cyberangel_L.ogg",
				cover: "/assets/music/cover/cover-015.jpg",
				lrc: "/assets/music/lrc/lrc-015.lrc",
			},
			{
				name: "打上花火",
				artist: "Daoko / 米津玄師",
				url: "/assets/music/Daoko _ 米津玄師 - 打上花火_L.ogg",
				cover: "/assets/music/cover/cover-016.jpg",
				lrc: "/assets/music/lrc/lrc-016.lrc",
			},
			{
				name: "裏切り者のレクイエム (背叛者的镇魂曲) (Diavolo Ver.)",
				artist: "长谷川大祐",
				url: "/assets/music/长谷川大祐 - 裏切り者のレクイエム (背叛者的镇魂曲) (Diavolo Ver_)_L.ogg",
				cover: "/assets/music/cover/cover-017.jpg",
				lrc: "/assets/music/lrc/lrc-017.lrc",
			},
			{
				name: "Hell March 3",
				artist: "群星",
				url: "/assets/music/群星 - Hell March 3_L.ogg",
				cover: "/assets/music/cover/cover-018.jpg",
				lrc: "/assets/music/lrc/lrc-018.lrc",
			},
			{
				name: "Bury the Light",
				artist: "Casey Edwards / Victor Borba",
				url: "/assets/music/Casey Edwards _ Victor Borba - Bury the Light_L.ogg",
				cover: "/assets/music/cover/cover-019.jpg",
				lrc: "/assets/music/lrc/lrc-019.lrc",
			},
			{
				name: "RISE",
				artist: "The Glitch Mob / Mako / The Word Alive",
				url: "/assets/music/The Glitch Mob _ Mako _ The Word Alive - RISE_L.ogg",
				cover: "/assets/music/cover/cover-020.jpg",
				lrc: "/assets/music/lrc/lrc-020.lrc",
			},
			{
				name: "Enemy (from the series Arcane League of Legends)",
				artist: "Imagine Dragons / 英雄联盟",
				url: "/assets/music/Imagine Dragons _ 英雄联盟 - Enemy (from the series Arcane League of Legends)_L.ogg",
				cover: "/assets/music/cover/cover-021.jpg",
				lrc: "/assets/music/lrc/lrc-021.lrc",
			},
			{
				name: "Divine",
				artist: "MONJOE / ☆Taku Takahashi / Sweep / JUVENILE",
				url: "/assets/music/MONJOE _ ☆Taku Takahashi _ Sweep _ JUVENILE - Divine_L.ogg",
				cover: "/assets/music/cover/cover-022.jpg",
				lrc: "/assets/music/lrc/lrc-022.lrc",
			},
			{
				name: "梦樱言 (Single Version)",
				artist: "林簌",
				url: "/assets/music/林簌 - 梦樱言 (Single Version)_L.ogg",
				cover: "/assets/music/cover/cover-023.jpg",
				lrc: "/assets/music/lrc/lrc-023.lrc",
			},
			{
				name: "电子羊",
				artist: "某幻君",
				url: "/assets/music/某幻君 - 电子羊_L.ogg",
				cover: "/assets/music/cover/cover-024.jpg",
				lrc: "/assets/music/lrc/lrc-024.lrc",
			},
		],
	},
};
