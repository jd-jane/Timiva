/**
 * Japanese Era Converter — 換算／validation SSOT（B2A）。
 * 不碰 DOM／CSS。Formatter 只讀本模組結果，不再判斷合法性。
 */
import {
	ERA_BY_ID,
	GREGORIAN_MAX,
	GREGORIAN_MIN,
	eraYearToGregorian,
	findEraForGregorianYear,
	getEra,
	getPartialYearRange,
	getTransition,
	isEraId,
	type EraId,
	type MonthDay,
	type TransitionPart,
} from "./japaneseEraConverterData.ts";

export type JecInputMode = "gregorian" | "era";

export type JecGregorianInput = {
	mode: "gregorian";
	raw: string;
};

export type JecEraInput = {
	mode: "era";
	eraId: string;
	rawYear: string;
};

export type JecInput = JecGregorianInput | JecEraInput;

export type JecErrorReason =
	| "gregorian-below-min"
	| "gregorian-above-max"
	| "era-below-min"
	| "era-above-max"
	| "era-unknown"
	| "non-numeric"
	| "decimal"
	| "negative"
	| "zero";

export type JecEraYear = {
	eraId: EraId;
	eraYear: number;
};

export type JecDateRange = {
	start: MonthDay;
	end: MonthDay;
};

export type JecTransitionPart = JecEraYear & {
	range: JecDateRange;
};

export type JecEvaluateOptions = {
	/** 測試可注入；預設為執行當下的西元年。 */
	nowYear?: number;
};

type ParsedYear =
	| { status: "empty" }
	| { status: "incomplete" }
	| { status: "invalid"; reason: JecErrorReason }
	| { status: "ok"; year: number };

export type JecEvaluation =
	| { status: "empty" }
	| { status: "incomplete" }
	| {
			status: "invalid";
			reason: JecErrorReason;
			range?: { min: number; max: number };
	  }
	| {
			status: "valid";
			kind: "single";
			source: JecInputMode;
			gregorianYear: number;
			era: JecEraYear;
			transitionParts: null;
			partialYearRange: null;
			futureReiwaAssumption: boolean;
	  }
	| {
			status: "valid";
			kind: "gregorian-transition";
			source: "gregorian";
			gregorianYear: number;
			era: null;
			transitionParts: [JecTransitionPart, JecTransitionPart];
			partialYearRange: null;
			futureReiwaAssumption: false;
	  }
	| {
			status: "valid";
			kind: "era-partial-year";
			source: "era";
			gregorianYear: number;
			era: JecEraYear;
			transitionParts: null;
			partialYearRange: JecDateRange;
			futureReiwaAssumption: boolean;
	  };

export function getCurrentGregorianYear(now = new Date()): number {
	return now.getFullYear();
}

function parseYearToken(raw: string, incompleteBelowDigits: number | null): ParsedYear {
	const trimmed = raw.trim();
	if (trimmed.length === 0) {
		return { status: "empty" };
	}
	if (trimmed.startsWith("-")) {
		return { status: "invalid", reason: "negative" };
	}
	if (trimmed.includes(".")) {
		return { status: "invalid", reason: "decimal" };
	}
	if (!/^\d+$/.test(trimmed)) {
		return { status: "invalid", reason: "non-numeric" };
	}
	if (/^0+$/.test(trimmed)) {
		return { status: "invalid", reason: "zero" };
	}
	if (incompleteBelowDigits !== null && trimmed.length < incompleteBelowDigits) {
		return { status: "incomplete" };
	}

	const year = Number.parseInt(trimmed, 10);
	if (year === 0) {
		return { status: "invalid", reason: "zero" };
	}
	return { status: "ok", year };
}

function futureReiwaAssumption(
	eraId: EraId,
	gregorianYear: number,
	nowYear: number,
): boolean {
	return eraId === "reiwa" && gregorianYear > nowYear;
}

function toTransitionPart(part: TransitionPart): JecTransitionPart {
	return {
		eraId: part.eraId,
		eraYear: part.eraYear,
		range: { start: part.start, end: part.end },
	};
}

function evaluateGregorian(raw: string, nowYear: number): JecEvaluation {
	const parsed = parseYearToken(raw, 4);
	if (parsed.status === "empty") {
		return { status: "empty" };
	}
	if (parsed.status === "incomplete") {
		return { status: "incomplete" };
	}
	if (parsed.status === "invalid") {
		return { status: "invalid", reason: parsed.reason };
	}

	const gregorianYear = parsed.year;
	if (gregorianYear < GREGORIAN_MIN) {
		return {
			status: "invalid",
			reason: "gregorian-below-min",
			range: { min: GREGORIAN_MIN, max: GREGORIAN_MAX },
		};
	}
	if (gregorianYear > GREGORIAN_MAX) {
		return {
			status: "invalid",
			reason: "gregorian-above-max",
			range: { min: GREGORIAN_MIN, max: GREGORIAN_MAX },
		};
	}

	const transition = getTransition(gregorianYear);
	if (transition) {
		return {
			status: "valid",
			kind: "gregorian-transition",
			source: "gregorian",
			gregorianYear,
			era: null,
			transitionParts: [
				toTransitionPart(transition.before),
				toTransitionPart(transition.after),
			],
			partialYearRange: null,
			futureReiwaAssumption: false,
		};
	}

	const matched = findEraForGregorianYear(gregorianYear);
	if (!matched) {
		return {
			status: "invalid",
			reason: "gregorian-below-min",
			range: { min: GREGORIAN_MIN, max: GREGORIAN_MAX },
		};
	}

	return {
		status: "valid",
		kind: "single",
		source: "gregorian",
		gregorianYear,
		era: { eraId: matched.era.id, eraYear: matched.eraYear },
		transitionParts: null,
		partialYearRange: null,
		futureReiwaAssumption: futureReiwaAssumption(
			matched.era.id,
			gregorianYear,
			nowYear,
		),
	};
}

function evaluateEra(eraIdRaw: string, rawYear: string, nowYear: number): JecEvaluation {
	const trimmedId = eraIdRaw.trim();
	if (!trimmedId) {
		return { status: "incomplete" };
	}
	if (!isEraId(trimmedId)) {
		return { status: "invalid", reason: "era-unknown" };
	}

	const era = getEra(trimmedId);
	const parsed = parseYearToken(rawYear, null);
	if (parsed.status === "empty") {
		return { status: "incomplete" };
	}
	if (parsed.status === "invalid") {
		return { status: "invalid", reason: parsed.reason };
	}

	const eraYear = parsed.year;
	if (eraYear < era.minYear) {
		return {
			status: "invalid",
			reason: "era-below-min",
			range: { min: era.minYear, max: era.maxYear },
		};
	}
	if (eraYear > era.maxYear) {
		return {
			status: "invalid",
			reason: "era-above-max",
			range: { min: era.minYear, max: era.maxYear },
		};
	}

	const gregorianYear = eraYearToGregorian(trimmedId, eraYear);
	if (gregorianYear < GREGORIAN_MIN || gregorianYear > GREGORIAN_MAX) {
		return {
			status: "invalid",
			reason: "era-above-max",
			range: { min: era.minYear, max: era.maxYear },
		};
	}

	const partial = getPartialYearRange(trimmedId, eraYear);
	const assumption = futureReiwaAssumption(trimmedId, gregorianYear, nowYear);
	const eraValue: JecEraYear = { eraId: trimmedId, eraYear };

	if (partial) {
		return {
			status: "valid",
			kind: "era-partial-year",
			source: "era",
			gregorianYear,
			era: eraValue,
			transitionParts: null,
			partialYearRange: { start: partial.start, end: partial.end },
			futureReiwaAssumption: assumption,
		};
	}

	return {
		status: "valid",
		kind: "single",
		source: "era",
		gregorianYear,
		era: eraValue,
		transitionParts: null,
		partialYearRange: null,
		futureReiwaAssumption: assumption,
	};
}

export function evaluateJapaneseEra(
	input: JecInput,
	options: JecEvaluateOptions = {},
): JecEvaluation {
	const nowYear = options.nowYear ?? getCurrentGregorianYear();

	if (input.mode === "gregorian") {
		return evaluateGregorian(input.raw, nowYear);
	}

	return evaluateEra(input.eraId, input.rawYear, nowYear);
}

export function isJecValid(
	result: JecEvaluation,
): result is Extract<JecEvaluation, { status: "valid" }> {
	return result.status === "valid";
}

/** 供測試與文件對照：Reiwa 上限對應西元 2100。 */
export function reiwaMaxEraYear(): number {
	return ERA_BY_ID.reiwa.maxYear;
}
