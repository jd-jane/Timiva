/**
 * Japanese Era Converter — 固定年號／改元資料（B2A）。
 * 純資料，無 DOM。日期邊界依 product spec §9.2／§28，不自行改寫。
 */

export const GREGORIAN_MIN = 1873;
export const GREGORIAN_MAX = 2100;

export type EraId = "meiji" | "taisho" | "showa" | "heisei" | "reiwa";

export type MonthDay = {
	month: number;
	day: number;
};

export type EraDefinition = {
	id: EraId;
	en: "Meiji" | "Taisho" | "Showa" | "Heisei" | "Reiwa";
	zh: "明治" | "大正" | "昭和" | "平成" | "令和";
	/** Era year + offset = Gregorian year */
	offset: number;
	minYear: number;
	maxYear: number;
};

export type TransitionPart = {
	eraId: EraId;
	eraYear: number;
	start: MonthDay;
	end: MonthDay;
};

export type TransitionYear = {
	gregorianYear: number;
	before: TransitionPart;
	after: TransitionPart;
};

export const ERAS: readonly EraDefinition[] = [
	{
		id: "meiji",
		en: "Meiji",
		zh: "明治",
		offset: 1867,
		minYear: 6,
		maxYear: 45,
	},
	{
		id: "taisho",
		en: "Taisho",
		zh: "大正",
		offset: 1911,
		minYear: 1,
		maxYear: 15,
	},
	{
		id: "showa",
		en: "Showa",
		zh: "昭和",
		offset: 1925,
		minYear: 1,
		maxYear: 64,
	},
	{
		id: "heisei",
		en: "Heisei",
		zh: "平成",
		offset: 1988,
		minYear: 1,
		maxYear: 31,
	},
	{
		id: "reiwa",
		en: "Reiwa",
		zh: "令和",
		offset: 2018,
		minYear: 1,
		maxYear: GREGORIAN_MAX - 2018,
	},
] as const;

export const ERA_BY_ID: Readonly<Record<EraId, EraDefinition>> = Object.fromEntries(
	ERAS.map((era) => [era.id, era]),
) as Readonly<Record<EraId, EraDefinition>>;

/**
 * 改元西元年。前段／後段日期含首尾日。
 * 1912-07-30 大正；1926-12-25 昭和；1989-01-08 平成；2019-05-01 令和。
 */
export const TRANSITION_YEARS: readonly TransitionYear[] = [
	{
		gregorianYear: 1912,
		before: {
			eraId: "meiji",
			eraYear: 45,
			start: { month: 1, day: 1 },
			end: { month: 7, day: 29 },
		},
		after: {
			eraId: "taisho",
			eraYear: 1,
			start: { month: 7, day: 30 },
			end: { month: 12, day: 31 },
		},
	},
	{
		gregorianYear: 1926,
		before: {
			eraId: "taisho",
			eraYear: 15,
			start: { month: 1, day: 1 },
			end: { month: 12, day: 24 },
		},
		after: {
			eraId: "showa",
			eraYear: 1,
			start: { month: 12, day: 25 },
			end: { month: 12, day: 31 },
		},
	},
	{
		gregorianYear: 1989,
		before: {
			eraId: "showa",
			eraYear: 64,
			start: { month: 1, day: 1 },
			end: { month: 1, day: 7 },
		},
		after: {
			eraId: "heisei",
			eraYear: 1,
			start: { month: 1, day: 8 },
			end: { month: 12, day: 31 },
		},
	},
	{
		gregorianYear: 2019,
		before: {
			eraId: "heisei",
			eraYear: 31,
			start: { month: 1, day: 1 },
			end: { month: 4, day: 30 },
		},
		after: {
			eraId: "reiwa",
			eraYear: 1,
			start: { month: 5, day: 1 },
			end: { month: 12, day: 31 },
		},
	},
] as const;

export const TRANSITION_BY_GREGORIAN: ReadonlyMap<number, TransitionYear> = new Map(
	TRANSITION_YEARS.map((row) => [row.gregorianYear, row]),
);

export function isEraId(value: string): value is EraId {
	return value in ERA_BY_ID;
}

export function getEra(id: EraId): EraDefinition {
	return ERA_BY_ID[id];
}

export function eraYearToGregorian(id: EraId, eraYear: number): number {
	return eraYear + ERA_BY_ID[id].offset;
}

export function getTransition(gregorianYear: number): TransitionYear | undefined {
	return TRANSITION_BY_GREGORIAN.get(gregorianYear);
}

/** 該年號年若只覆蓋西元年的一段日期，回傳該段；全年有效則 null。 */
export function getPartialYearRange(
	id: EraId,
	eraYear: number,
): TransitionPart | null {
	for (const row of TRANSITION_YEARS) {
		if (row.before.eraId === id && row.before.eraYear === eraYear) {
			return row.before;
		}
		if (row.after.eraId === id && row.after.eraYear === eraYear) {
			return row.after;
		}
	}
	return null;
}

export function findEraForGregorianYear(
	gregorianYear: number,
): { era: EraDefinition; eraYear: number } | null {
	if (getTransition(gregorianYear)) {
		return null;
	}

	for (const era of ERAS) {
		const eraYear = gregorianYear - era.offset;
		if (eraYear >= era.minYear && eraYear <= era.maxYear) {
			return { era, eraYear };
		}
	}

	return null;
}
