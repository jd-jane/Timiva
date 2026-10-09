/**
 * Taiwan Year & Age Reference — 換算／validation SSOT（B2A）。
 * 不碰 DOM／CSS。不呼叫 JEC evaluateJapaneseEra／findEraForGregorianYear。
 * 年號資料 reuse japaneseEraConverterData（id／offset／TRANSITION_YEARS）。
 */
import {
	eraYearToGregorian,
	getEra,
	getTransition,
	isEraId,
	type EraId,
} from "./japaneseEraConverterData.ts";
import { yearStemBranch, yearStemBranchIndex } from "./lunar/lunarStemBranch.ts";
import type { StemBranch } from "./lunar/lunarTypes.ts";

export const TYAR_MIN_YEAR = 1862;
export const TYAR_MEIJI_START_YEAR = 1868;
export const TYAR_MINGUO_EPOCH = 1912;
export const TYAR_PROACTIVE_ERA_START = 1895;
export const TYAR_PROACTIVE_ERA_END = 1945;
export const TYAR_REVERSE_AGE_MIN = 0;
export const TYAR_REVERSE_AGE_MAX = 120;
export const TYAR_ZODIAC_CYCLE = 12;

export const TYAR_ZODIAC_IDS = [
	"rat",
	"ox",
	"tiger",
	"rabbit",
	"dragon",
	"snake",
	"horse",
	"goat",
	"monkey",
	"rooster",
	"dog",
	"pig",
] as const;

export type TyarZodiacId = (typeof TYAR_ZODIAC_IDS)[number];

export type TyarCalendarMode = "gregorian" | "minguo" | "era";
export type TyarQueryMode = "year" | "zodiac";
export type TyarReverseView = "closest" | "previous" | "next";

export type TyarEvaluateOptions = {
	nowYear?: number;
};

export type TyarErrorReason =
	| "non-numeric"
	| "decimal"
	| "negative"
	| "zero"
	| "below-min"
	| "above-max"
	| "era-unknown"
	| "era-year-invalid"
	| "zodiac-unknown"
	| "age-out-of-range"
	| "reverse-empty";

export type TyarMinguoRef =
	| { type: "year"; year: number }
	| { type: "year-one" }
	| { type: "before"; years: number };

export type TyarEraRef = {
	eraId: EraId;
	eraYear: number;
};

export type TyarYearFacts = {
	gregorianYear: number;
	age: number;
	minguo: TyarMinguoRef;
	canonicalEra: TyarEraRef | null;
	proactiveEra: boolean;
	stemBranch: StemBranch;
	zodiacId: TyarZodiacId;
};

export type TyarReverseTriplet = {
	target: number;
	closestYear: number;
	previousYear: number | null;
	nextYear: number | null;
};

type ParsedYear =
	| { status: "empty" }
	| { status: "incomplete" }
	| { status: "invalid"; reason: TyarErrorReason }
	| { status: "ok"; year: number };

export type TyarGregorianInput = {
	mode: "gregorian";
	raw: string;
};

export type TyarMinguoInput = {
	mode: "minguo";
	raw: string;
};

export type TyarEraInput = {
	mode: "era";
	eraId: string;
	rawYear: string;
};

export type TyarYearInput = TyarGregorianInput | TyarMinguoInput | TyarEraInput;

export type TyarReverseInput = {
	mode: "zodiac";
	zodiacId: string;
	ageRaw: string;
	reverseView: TyarReverseView;
};

export type TyarInput = TyarYearInput | TyarReverseInput;

export type TyarExactResult = TyarYearFacts & {
	kind: "exact";
	source: TyarCalendarMode;
	showEraInPrimary: boolean;
};

export type TyarReverseResult = TyarReverseTriplet & {
	kind: "reverse";
	reverseView: TyarReverseView;
	viewedYear: number;
	viewed: TyarYearFacts;
};

export type TyarEvaluation =
	| { status: "empty" }
	| { status: "incomplete" }
	| { status: "invalid"; reason: TyarErrorReason }
	| { status: "valid"; result: TyarExactResult | TyarReverseResult };

export function getTyarCurrentYear(now = new Date()): number {
	return now.getFullYear();
}

export function isTyarZodiacId(value: string): value is TyarZodiacId {
	return (TYAR_ZODIAC_IDS as readonly string[]).includes(value);
}

export function zodiacIdForYear(year: number): TyarZodiacId {
	return TYAR_ZODIAC_IDS[yearStemBranchIndex(year) % TYAR_ZODIAC_CYCLE];
}

export function isProactiveEraYear(year: number): boolean {
	return year >= TYAR_PROACTIVE_ERA_START && year <= TYAR_PROACTIVE_ERA_END;
}

export function isSupportedResultYear(year: number, nowYear: number): boolean {
	return Number.isInteger(year) && year >= TYAR_MIN_YEAR && year <= nowYear;
}

export function minguoRefForYear(gregorianYear: number): TyarMinguoRef {
	if (gregorianYear === TYAR_MINGUO_EPOCH) {
		return { type: "year-one" };
	}
	if (gregorianYear > TYAR_MINGUO_EPOCH) {
		return { type: "year", year: gregorianYear - (TYAR_MINGUO_EPOCH - 1) };
	}
	return { type: "before", years: TYAR_MINGUO_EPOCH - gregorianYear };
}

export function minguoYearToGregorian(minguoYear: number): number {
	return minguoYear + (TYAR_MINGUO_EPOCH - 1);
}

/** TYAR 和曆年上下限：明治可 1–45；不套 JEC Meiji minYear=6。 */
export function tyarEraYearMax(eraId: EraId, nowYear: number): number {
	if (eraId === "reiwa") {
		return Math.max(1, nowYear - getEra("reiwa").offset);
	}
	return getEra(eraId).maxYear;
}

export function tyarEraYearMin(eraId: EraId): number {
	return eraId === "meiji" ? 1 : getEra(eraId).minYear;
}

export function isTyarEraYearAllowed(eraId: EraId, eraYear: number, nowYear: number): boolean {
	if (!Number.isInteger(eraYear) || eraYear < tyarEraYearMin(eraId) || eraYear > tyarEraYearMax(eraId, nowYear)) {
		return false;
	}
	const gregorianYear = eraYearToGregorian(eraId, eraYear);
	return isSupportedResultYear(gregorianYear, nowYear);
}

/** 西元／民國 → 和曆 canonical：改元年用 TRANSITION_YEARS.before（較早側）。 */
export function canonicalEraForGregorian(gregorianYear: number, nowYear: number): TyarEraRef | null {
	if (!isSupportedResultYear(gregorianYear, nowYear) || gregorianYear < TYAR_MEIJI_START_YEAR) {
		return null;
	}

	const transition = getTransition(gregorianYear);
	if (transition) {
		return { eraId: transition.before.eraId, eraYear: transition.before.eraYear };
	}

	for (const eraId of ["meiji", "taisho", "showa", "heisei", "reiwa"] as const) {
		const eraYear = gregorianYear - getEra(eraId).offset;
		if (isTyarEraYearAllowed(eraId, eraYear, nowYear)) {
			return { eraId, eraYear };
		}
	}

	return null;
}

export function buildYearFacts(gregorianYear: number, nowYear: number): TyarYearFacts | null {
	if (!isSupportedResultYear(gregorianYear, nowYear)) {
		return null;
	}

	return {
		gregorianYear,
		age: nowYear - gregorianYear,
		minguo: minguoRefForYear(gregorianYear),
		canonicalEra: canonicalEraForGregorian(gregorianYear, nowYear),
		proactiveEra: isProactiveEraYear(gregorianYear),
		stemBranch: yearStemBranch(gregorianYear),
		zodiacId: zodiacIdForYear(gregorianYear),
	};
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

	if (incompleteBelowDigits !== null && trimmed.length < incompleteBelowDigits) {
		if (/^0+$/.test(trimmed)) {
			return { status: "invalid", reason: "zero" };
		}
		return { status: "incomplete" };
	}

	if (/^0+$/.test(trimmed)) {
		return { status: "invalid", reason: "zero" };
	}

	const year = Number.parseInt(trimmed, 10);
	if (year === 0) {
		return { status: "invalid", reason: "zero" };
	}
	return { status: "ok", year };
}

function parseAgeToken(raw: string): ParsedYear {
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

	const year = Number.parseInt(trimmed, 10);
	if (!Number.isInteger(year)) {
		return { status: "invalid", reason: "non-numeric" };
	}
	return { status: "ok", year };
}

function rangeInvalid(year: number, nowYear: number): TyarErrorReason {
	return year < TYAR_MIN_YEAR ? "below-min" : year > nowYear ? "above-max" : "below-min";
}

function toExact(
	source: TyarCalendarMode,
	facts: TyarYearFacts,
): TyarExactResult {
	return {
		kind: "exact",
		source,
		showEraInPrimary: source === "era" || facts.proactiveEra,
		...facts,
	};
}

export function evaluateGregorianYear(raw: string, options: TyarEvaluateOptions = {}): TyarEvaluation {
	const nowYear = options.nowYear ?? getTyarCurrentYear();
	const parsed = parseYearToken(raw, 4);
	if (parsed.status !== "ok") {
		return parsed.status === "invalid" ? { status: "invalid", reason: parsed.reason } : { status: parsed.status };
	}
	if (!isSupportedResultYear(parsed.year, nowYear)) {
		return { status: "invalid", reason: rangeInvalid(parsed.year, nowYear) };
	}
	const facts = buildYearFacts(parsed.year, nowYear);
	if (!facts) {
		return { status: "invalid", reason: rangeInvalid(parsed.year, nowYear) };
	}
	return { status: "valid", result: toExact("gregorian", facts) };
}

export function evaluateMinguoYear(raw: string, options: TyarEvaluateOptions = {}): TyarEvaluation {
	const nowYear = options.nowYear ?? getTyarCurrentYear();
	const parsed = parseYearToken(raw, null);
	if (parsed.status !== "ok") {
		return parsed.status === "invalid" ? { status: "invalid", reason: parsed.reason } : { status: parsed.status };
	}
	if (parsed.year < 1) {
		return { status: "invalid", reason: "zero" };
	}
	const gregorianYear = minguoYearToGregorian(parsed.year);
	if (!isSupportedResultYear(gregorianYear, nowYear)) {
		return { status: "invalid", reason: rangeInvalid(gregorianYear, nowYear) };
	}
	const facts = buildYearFacts(gregorianYear, nowYear);
	if (!facts) {
		return { status: "invalid", reason: rangeInvalid(gregorianYear, nowYear) };
	}
	return { status: "valid", result: toExact("minguo", facts) };
}

export function evaluateEraYear(
	eraIdRaw: string,
	rawYear: string,
	options: TyarEvaluateOptions = {},
): TyarEvaluation {
	const nowYear = options.nowYear ?? getTyarCurrentYear();
	if (!isEraId(eraIdRaw.trim())) {
		return { status: "invalid", reason: "era-unknown" };
	}
	const eraId = eraIdRaw.trim() as EraId;
	const parsed = parseYearToken(rawYear, null);
	if (parsed.status !== "ok") {
		return parsed.status === "invalid" ? { status: "invalid", reason: parsed.reason } : { status: parsed.status };
	}
	if (!isTyarEraYearAllowed(eraId, parsed.year, nowYear)) {
		return { status: "invalid", reason: "era-year-invalid" };
	}
	const gregorianYear = eraYearToGregorian(eraId, parsed.year);
	const facts = buildYearFacts(gregorianYear, nowYear);
	if (!facts) {
		return { status: "invalid", reason: rangeInvalid(gregorianYear, nowYear) };
	}
	return { status: "valid", result: toExact("era", facts) };
}

export function sameZodiacYears(zodiacId: TyarZodiacId, nowYear: number): number[] {
	const years: number[] = [];
	for (let year = TYAR_MIN_YEAR; year <= nowYear; year += 1) {
		if (zodiacIdForYear(year) === zodiacId) {
			years.push(year);
		}
	}
	return years;
}

export function evaluateReverseTriplet(
	zodiacId: TyarZodiacId,
	age: number,
	nowYear: number,
): TyarReverseTriplet | null {
	if (age < TYAR_REVERSE_AGE_MIN || age > TYAR_REVERSE_AGE_MAX) {
		return null;
	}

	const target = nowYear - age;
	const years = sameZodiacYears(zodiacId, nowYear);
	if (years.length === 0) {
		return null;
	}

	let closestYear = years[0];
	let bestDistance = Math.abs(years[0] - target);
	for (let i = 1; i < years.length; i += 1) {
		const year = years[i];
		const distance = Math.abs(year - target);
		if (distance < bestDistance || (distance === bestDistance && year > closestYear)) {
			closestYear = year;
			bestDistance = distance;
		}
	}

	const previousYear = closestYear - TYAR_ZODIAC_CYCLE;
	const nextYear = closestYear + TYAR_ZODIAC_CYCLE;

	return {
		target,
		closestYear,
		previousYear: isSupportedResultYear(previousYear, nowYear) ? previousYear : null,
		nextYear: isSupportedResultYear(nextYear, nowYear) ? nextYear : null,
	};
}

export function resolveReverseView(
	triplet: TyarReverseTriplet,
	reverseView: TyarReverseView,
): TyarReverseView {
	if (reverseView === "previous" && triplet.previousYear === null) {
		return "closest";
	}
	if (reverseView === "next" && triplet.nextYear === null) {
		return "closest";
	}
	return reverseView;
}

export function viewedYearForReverse(
	triplet: TyarReverseTriplet,
	reverseView: TyarReverseView,
): number {
	const view = resolveReverseView(triplet, reverseView);
	if (view === "previous" && triplet.previousYear !== null) {
		return triplet.previousYear;
	}
	if (view === "next" && triplet.nextYear !== null) {
		return triplet.nextYear;
	}
	return triplet.closestYear;
}

export function canEnterReverseView(triplet: TyarReverseTriplet, reverseView: TyarReverseView): boolean {
	if (reverseView === "closest") {
		return true;
	}
	if (reverseView === "previous") {
		return triplet.previousYear !== null;
	}
	return triplet.nextYear !== null;
}

export function evaluateReverseLookup(
	zodiacIdRaw: string,
	ageRaw: string,
	reverseView: TyarReverseView,
	options: TyarEvaluateOptions = {},
): TyarEvaluation {
	const nowYear = options.nowYear ?? getTyarCurrentYear();
	const zodiacTrim = zodiacIdRaw.trim();
	const ageParsed = parseAgeToken(ageRaw);

	if (!zodiacTrim && ageParsed.status === "empty") {
		return { status: "empty" };
	}
	if (!zodiacTrim || ageParsed.status === "empty") {
		return { status: "incomplete" };
	}
	if (!isTyarZodiacId(zodiacTrim)) {
		return { status: "invalid", reason: "zodiac-unknown" };
	}
	if (ageParsed.status !== "ok") {
		return { status: "invalid", reason: ageParsed.reason };
	}
	if (ageParsed.year < TYAR_REVERSE_AGE_MIN || ageParsed.year > TYAR_REVERSE_AGE_MAX) {
		return { status: "invalid", reason: "age-out-of-range" };
	}

	const triplet = evaluateReverseTriplet(zodiacTrim, ageParsed.year, nowYear);
	if (!triplet) {
		return { status: "invalid", reason: "reverse-empty" };
	}

	const view = resolveReverseView(triplet, reverseView);
	const viewedYear = viewedYearForReverse(triplet, view);
	const viewed = buildYearFacts(viewedYear, nowYear);
	if (!viewed) {
		return { status: "invalid", reason: "reverse-empty" };
	}

	return {
		status: "valid",
		result: {
			kind: "reverse",
			...triplet,
			reverseView: view,
			viewedYear,
			viewed,
		},
	};
}

export function evaluateTaiwanYearAge(input: TyarInput, options: TyarEvaluateOptions = {}): TyarEvaluation {
	if (input.mode === "gregorian") {
		return evaluateGregorianYear(input.raw, options);
	}
	if (input.mode === "minguo") {
		return evaluateMinguoYear(input.raw, options);
	}
	if (input.mode === "era") {
		return evaluateEraYear(input.eraId, input.rawYear, options);
	}
	return evaluateReverseLookup(input.zodiacId, input.ageRaw, input.reverseView, options);
}
