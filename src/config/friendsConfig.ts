import type { FriendLink, FriendsPageConfig } from "../types/config";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "猪猪博客",
		imgurl: "https://drawrain.me/images/pig8086.jpg",
		desc: "",
		siteurl: "https://www.zzwl.top/",
		tags: ["Blog"],
		weight: 9, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "AkibaSo",
		imgurl:
			"https://2890.ltd/wp-content/uploads/2024/11/1731209895-Icon1-1.png",
		desc: "念念不忘，必有回响",
		siteurl: "https://2890.ltd",
		tags: ["Blog"],
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "s1eepy的基地",
		imgurl:
			"https://yae-img.top/file/1778930482605_bacf3b3a1bd4334b0bd455893674bd07.webp",
		desc: "",
		siteurl: "http://s1eepy.xyz/",
		tags: ["Blog"],
		weight: 9, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	{
		title: "Drawrain's Blog",
		imgurl: "https://drawrain.me/_astro/avata.C6Wxqmbc_239Pcl.webp",
		desc: "",
		siteurl: "https://drawrain.me/",
		tags: ["Blog"],
		weight: 10, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},
	// {
	// 	title: "",
	// 	imgurl:"",
	// 	desc: "",
	// 	siteurl: "",
	// 	tags: ["Blog"],
	// 	weight: 10, // 权重，数字越大排序越靠前
	// 	enabled: true, // 是否启用
	// }
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
