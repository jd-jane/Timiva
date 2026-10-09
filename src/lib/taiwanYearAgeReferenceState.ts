/**
 * Taiwan Year & Age Reference — 互動狀態純函式（B2A）。
 * 模式切換／Reset／reverseView；換算只走 math evaluate。
 */
import { isEraId, type EraId } from "./japaneseEraConverterData.ts";
import {
	canEnterReverseView,
	canonicalEraForGregorian,
	evaluateTaiwanYearAge,
	getTyarCurrentYear,
	isTyarZodiacId,
	minguoRefForYear,
	type TyarCalendarMode,
	type TyarEvaluateOptions,
	type TyarEvaluation,
	type TyarQueryMode,
	type TyarReverseView,
	type TyarZodiacId,
} from "./taiwanYearAgeReferenceMath.ts";

export const TYAR_DEFAULT_ERA_ID: EraId = "reiwa";
export const TYAR_GREGORIAN_MAX_DIGITS = 4;
export const TYAR_MINGUO_MAX_DIGITS = 3;
export const TYAR_ERA_MAX_DIGITS = 2;
export const TYAR_AGE_MAX_DIGITS = 3;

export type TyarQaFixture =
	| "initial"
	| "year-1930"
	| "minguo-1930"
	| "era-1930"
	| "reverse"
	| "gregorian-1895"
	| "minguo-1"
	| "era-meiji-45";

export type TyarPageState = {
	queryMode: TyarQueryMode;
	calendarMode: TyarCalendarMode;
	gregorianRaw: string;
	minguoRaw: string;
	eraId: EraId;
	eraYearRaw: string;
	zodiacId: TyarZodiacId | "";
	ageRaw: string;
	reverseView: TyarReverseView;
};

export function capTyarInput(raw: string, maxDigits: number): string {
	return raw.length <= maxDigits ? raw : raw.slice(0, maxDigits);
}

export function createInitialTyarState(): TyarPageState {
	return {
		queryMode: "year",
		calendarMode: "gregorian",
		gregorianRaw: "",
		minguoRaw: "",
		eraId: TYAR_DEFAULT_ERA_ID,
		eraYearRaw: "",
		zodiacId: "",
		ageRaw: "",
		reverseView: "closest",
	};
}

export function resetTyarState(): TyarPageState {
	return createInitialTyarState();
}

export function evaluateTyarState(
	state: TyarPageState,
	options: TyarEvaluateOptions = {},
): TyarEvaluation {
	if (state.queryMode === "zodiac") {
		return evaluateTaiwanYearAge(
			{
				mode: "zodiac",
				zodiacId: state.zodiacId,
				ageRaw: state.ageRaw,
				reverseView: state.reverseView,
			},
			options,
		);
	}

	if (state.calendarMode === "minguo") {
		return evaluateTaiwanYearAge({ mode: "minguo", raw: state.minguoRaw }, options);
	}
	if (state.calendarMode === "era") {
		return evaluateTaiwanYearAge(
			{ mode: "era", eraId: state.eraId, rawYear: state.eraYearRaw },
			options,
		);
	}
	return evaluateTaiwanYearAge({ mode: "gregorian", raw: state.gregorianRaw }, options);
}

function gregorianFromValid(state: TyarPageState, options: TyarEvaluateOptions): number | null {
	const evaluation = evaluateTyarState(state, options);
	if (evaluation.status !== "valid") {
		return null;
	}
	return evaluation.result.kind === "exact"
		? evaluation.result.gregorianYear
		: evaluation.result.viewedYear;
}

export function switchTyarCalendarMode(
	state: TyarPageState,
	nextMode: TyarCalendarMode,
	options: TyarEvaluateOptions = {},
): TyarPageState {
	if (state.queryMode !== "year" || state.calendarMode === nextMode) {
		return state;
	}

	const gregorianYear = gregorianFromValid(state, options);
	const base: TyarPageState = {
		...state,
		calendarMode: nextMode,
		gregorianRaw: "",
		minguoRaw: "",
		eraYearRaw: "",
	};

	if (gregorianYear === null) {
		return nextMode === "era" ? { ...base, eraId: TYAR_DEFAULT_ERA_ID } : base;
	}

	if (nextMode === "gregorian") {
		return { ...base, gregorianRaw: String(gregorianYear) };
	}

	if (nextMode === "minguo") {
		const minguo = minguoRefForYear(gregorianYear);
		if (minguo.type === "year") {
			return { ...base, minguoRaw: String(minguo.year) };
		}
		if (minguo.type === "year-one") {
			return { ...base, minguoRaw: "1" };
		}
		/* 1862–1911：民國前只當結果、不可當 input → 切民國、raw 空、empty／Initial，非 invalid */
		return base;
	}

	const era = canonicalEraForGregorian(
		gregorianYear,
		options.nowYear ?? getTyarCurrentYear(),
	);
	if (!era) {
		return { ...base, eraId: TYAR_DEFAULT_ERA_ID };
	}
	return { ...base, eraId: era.eraId, eraYearRaw: String(era.eraYear) };
}

export function setTyarQueryMode(state: TyarPageState, queryMode: TyarQueryMode): TyarPageState {
	if (queryMode === "year") {
		return {
			...createInitialTyarState(),
			queryMode: "year",
		};
	}

	return {
		...createInitialTyarState(),
		queryMode: "zodiac",
	};
}

export function setTyarGregorianRaw(state: TyarPageState, raw: string): TyarPageState {
	return { ...state, gregorianRaw: capTyarInput(raw, TYAR_GREGORIAN_MAX_DIGITS) };
}

export function setTyarMinguoRaw(state: TyarPageState, raw: string): TyarPageState {
	return { ...state, minguoRaw: capTyarInput(raw, TYAR_MINGUO_MAX_DIGITS) };
}

export function setTyarEraYearRaw(state: TyarPageState, raw: string): TyarPageState {
	return { ...state, eraYearRaw: capTyarInput(raw, TYAR_ERA_MAX_DIGITS) };
}

export function setTyarEraId(state: TyarPageState, eraId: string): TyarPageState {
	return { ...state, eraId: isEraId(eraId) ? eraId : TYAR_DEFAULT_ERA_ID };
}

export function setTyarZodiacId(state: TyarPageState, zodiacId: string): TyarPageState {
	return {
		...state,
		zodiacId: isTyarZodiacId(zodiacId) ? zodiacId : "",
		reverseView: "closest",
	};
}

export function setTyarAgeRaw(state: TyarPageState, raw: string): TyarPageState {
	return {
		...state,
		ageRaw: capTyarInput(raw, TYAR_AGE_MAX_DIGITS),
		reverseView: "closest",
	};
}

export function setTyarReverseView(
	state: TyarPageState,
	reverseView: TyarReverseView,
	options: TyarEvaluateOptions = {},
): TyarPageState {
	if (state.queryMode !== "zodiac") {
		return state;
	}

	const evaluation = evaluateTyarState({ ...state, reverseView: "closest" }, options);
	if (evaluation.status !== "valid" || evaluation.result.kind !== "reverse") {
		return state;
	}
	if (!canEnterReverseView(evaluation.result, reverseView)) {
		return state;
	}
	return { ...state, reverseView };
}

/** QA fixture → 真實 state；production／QA 同一 evaluate。 */
export function stateFromTyarQaFixture(fixture: TyarQaFixture): TyarPageState {
	const initial = createInitialTyarState();
	if (fixture === "initial") {
		return initial;
	}
	if (fixture === "year-1930") {
		return { ...initial, gregorianRaw: "1930" };
	}
	if (fixture === "minguo-1930") {
		return { ...initial, calendarMode: "minguo", minguoRaw: "19" };
	}
	if (fixture === "era-1930") {
		return { ...initial, calendarMode: "era", eraId: "showa", eraYearRaw: "5" };
	}
	if (fixture === "reverse") {
		return { ...initial, queryMode: "zodiac", zodiacId: "rat", ageRaw: "90" };
	}
	if (fixture === "gregorian-1895") {
		return { ...initial, gregorianRaw: "1895" };
	}
	if (fixture === "minguo-1") {
		return { ...initial, calendarMode: "minguo", minguoRaw: "1" };
	}
	return { ...initial, calendarMode: "era", eraId: "meiji", eraYearRaw: "45" };
}
