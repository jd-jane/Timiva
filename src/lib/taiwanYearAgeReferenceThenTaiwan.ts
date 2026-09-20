/**
 * Taiwan Year & Age Reference —「那時的台灣」content buckets（B1A SSOT）。
 * 生活感年代文案，不是學術分期。純資料、無 DOM、無 year lookup。
 * 2010 起不顯示（無 bucket）。B2 再接結果區。
 */

export type ThenTaiwanBucket = {
	startYear: number;
	endYear: number;
	zhText: string;
	enText: string;
};

/** 含此年為止可顯示；2010 起不顯示。 */
export const THEN_TAIWAN_DISPLAY_UNTIL = 2009;

export const THEN_TAIWAN_BUCKETS: readonly ThenTaiwanBucket[] = [
	{
		startYear: 1862,
		endYear: 1884,
		zhText: "清治後期、開港貿易連結世界。",
		enText:
			"Late Qing rule, when treaty ports tied Taiwan more closely to world trade.",
	},
	{
		startYear: 1885,
		endYear: 1894,
		zhText: "建省推動新政，鐵路與新建設讓台灣近代樣貌逐漸成形。",
		enText:
			"Taiwan became a province, and new reforms, railways, and construction gradually gave the island a more modern shape.",
	},
	{
		startYear: 1895,
		endYear: 1919,
		zhText: "政權更替後，新的制度、學校與公共設施逐步走進日常。",
		enText:
			"After a change of government, new systems, schools, and public facilities slowly entered everyday life.",
	},
	{
		startYear: 1920,
		endYear: 1936,
		zhText: "喫茶店、戲院與新文化活動興起，城市生活有了更多新的交流方式。",
		enText:
			"Teahouses, theaters, and new cultural activities took hold, and city life found more ways to mix and meet.",
	},
	{
		startYear: 1937,
		endYear: 1945,
		zhText: "二戰戰火波及台灣，物資短缺與空襲改變了生活。",
		enText:
			"World War II reached Taiwan; shortages and air raids changed daily life.",
	},
	{
		startYear: 1946,
		endYear: 1959,
		zhText: "戰後生活重新起步，社會在重建中進入長期戒嚴。",
		enText:
			"Postwar life started over, and amid rebuilding Taiwan entered a long period of martial law.",
	},
	{
		startYear: 1960,
		endYear: 1979,
		zhText: "工廠與外銷快速成長，工作機會與城市生活也跟著改變。",
		enText:
			"Factories and exports grew quickly, and jobs and city life changed with them.",
	},
	{
		startYear: 1980,
		endYear: 1990,
		zhText:
			"經濟快速起飛，股市與消費熱潮讓「台灣錢淹腳目」成為時代印象。",
		enText:
			"The economy took off quickly, and a boom in stocks and spending left the impression that Taiwan was awash in money.",
	},
	{
		startYear: 1991,
		endYear: 1999,
		zhText: "社會逐步開放，從國會改選到總統直選，民主慢慢走進日常。",
		enText:
			"Society opened up step by step, from full legislative elections to the first direct presidential election, and democracy slowly entered everyday life.",
	},
	{
		startYear: 2000,
		endYear: 2009,
		zhText: "網路、手機與高鐵走進日常，生活的距離和節奏都開始改變。",
		enText:
			"The internet, mobile phones, and high-speed rail entered daily life, and both distance and pace began to change.",
	},
];
