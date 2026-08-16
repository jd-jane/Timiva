/**
 * Japanese Era Converter — Desktop 互動狀態（B2B）。
 * 模式切換／Reset／輸入狀態的純邏輯；換算仍只走 evaluate。
 */
import { isEraId, type EraId } from "./japaneseEraConverterData.ts";
import {
	evaluateJapaneseEra,
	type JecEvaluateOptions,
	type JecEvaluation,
} from "./japaneseEraConverterEvaluate.ts";

export type JecDesktopMode = "gregorian" | "era";

export type JecDesktopState = {
	mode: JecDesktopMode;
	gregorianRaw: string;
	eraId: EraId;
	eraYearRaw: string;
};

export const DEFAULT_ERA_ID: EraId = "reiwa";
export const GREGORIAN_INPUT_MAX_DIGITS = 4;
export const ERA_INPUT_MAX_DIGITS = 2;

/** 只限制字元長度，不改寫成合法年份、不碰 B2A range。 */
export function capYearInput(raw: string, maxDigits: number): string {
	if (raw.length <= maxDigits) {
		return raw;
	}
	return raw.slice(0, maxDigits);
}

/** 鍵盤／paste 共用：超出上限的字元直接忽略，不自動換成其他有效年份。 */
export function applyYearInputInsert(
	current: string,
	insert: string,
	selectionStart: number,
	selectionEnd: number,
	maxDigits: number,
): string {
	const start = Math.max(0, Math.min(selectionStart, current.length));
	const end = Math.max(start, Math.min(selectionEnd, current.length));
	const room = maxDigits - (current.length - (end - start));
	if (room <= 0) {
		return current;
	}
	return `${current.slice(0, start)}${insert.slice(0, room)}${current.slice(end)}`;
}

export function createInitialDesktopState(): JecDesktopState {
	return {
		mode: "gregorian",
		gregorianRaw: "",
		eraId: DEFAULT_ERA_ID,
		eraYearRaw: "",
	};
}

export function resolveEraId(value: string): EraId {
	return isEraId(value) ? value : DEFAULT_ERA_ID;
}

export function evaluateDesktopState(
	state: JecDesktopState,
	options: JecEvaluateOptions = {},
): JecEvaluation {
	if (state.mode === "gregorian") {
		return evaluateJapaneseEra({ mode: "gregorian", raw: state.gregorianRaw }, options);
	}

	return evaluateJapaneseEra(
		{ mode: "era", eraId: state.eraId, rawYear: state.eraYearRaw },
		options,
	);
}

export function setGregorianRaw(state: JecDesktopState, raw: string): JecDesktopState {
	return { ...state, gregorianRaw: capYearInput(raw, GREGORIAN_INPUT_MAX_DIGITS) };
}

export function setEraYearRaw(state: JecDesktopState, raw: string): JecDesktopState {
	return { ...state, eraYearRaw: capYearInput(raw, ERA_INPUT_MAX_DIGITS) };
}

export function setDesktopEraId(state: JecDesktopState, eraId: string): JecDesktopState {
	return { ...state, eraId: resolveEraId(eraId) };
}

/**
 * Gregorian → era：
 *   valid single → 帶入對應年號與年份
 *   transition／empty／invalid／incomplete → Reiwa、年份空白
 * Era → Gregorian：
 *   valid → 帶入西元年（transition year 由後續 Gregorian evaluate 顯示雙年號）
 *   empty／incomplete／invalid → 西元空白
 */
export function switchDesktopMode(
	state: JecDesktopState,
	options: JecEvaluateOptions = {},
): JecDesktopState {
	const evaluation = evaluateDesktopState(state, options);

	if (state.mode === "gregorian") {
		if (evaluation.status === "valid" && evaluation.kind === "single") {
			return {
				mode: "era",
				gregorianRaw: "",
				eraId: evaluation.era.eraId,
				eraYearRaw: String(evaluation.era.eraYear),
			};
		}

		return {
			mode: "era",
			gregorianRaw: "",
			eraId: DEFAULT_ERA_ID,
			eraYearRaw: "",
		};
	}

	if (evaluation.status === "valid") {
		return {
			mode: "gregorian",
			gregorianRaw: String(evaluation.gregorianYear),
			eraId: state.eraId,
			eraYearRaw: "",
		};
	}

	return {
		mode: "gregorian",
		gregorianRaw: "",
		eraId: state.eraId,
		eraYearRaw: "",
	};
}

export function resetDesktopState(): JecDesktopState {
	return createInitialDesktopState();
}
