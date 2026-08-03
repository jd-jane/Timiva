/**
 * Date Calculator — pure civil-date math (B2.1).
 *
 * Gregorian Y-M-D only. No DOM, locale, timezone, or JavaScript Date arithmetic.
 * Fixed step order: Year → Month → Week → Day. Clamp month-end on Year／Month steps.
 */

export type CivilDate = {
	year: number;
	month: number;
	day: number;
};

export type Direction = "add" | "subtract";

export type Duration = {
	years: number;
	months: number;
	weeks: number;
	days: number;
};

export type DurationUnit = "years" | "months" | "weeks" | "days";

export type CalculateDateFailureReason =
	| "invalid-start-date"
	| "invalid-direction"
	| "invalid-duration"
	| "out-of-range";

export type CalculateDateResult =
	| { ok: true; date: CivilDate }
	| {
			ok: false;
			reason: CalculateDateFailureReason;
			/** First failing duration unit when reason is invalid-duration or out-of-range. */
			unit?: DurationUnit;
	  };

export const DATE_CALCULATOR_MIN: CivilDate = {
	year: 1900,
	month: 1,
	day: 1,
};

export const DATE_CALCULATOR_MAX: CivilDate = {
	year: 2200,
	month: 12,
	day: 31,
};

const DURATION_UNITS: readonly DurationUnit[] = [
	"years",
	"months",
	"weeks",
	"days",
];

export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
	if (month === 2) {
		return isLeapYear(year) ? 29 : 28;
	}

	if (month === 4 || month === 6 || month === 9 || month === 11) {
		return 30;
	}

	if (month >= 1 && month <= 12) {
		return 31;
	}

	return 0;
}

function isSafeNonNegativeInteger(value: unknown): value is number {
	return (
		typeof value === "number" &&
		Number.isSafeInteger(value) &&
		value >= 0
	);
}

function isFiniteSafeInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value);
}

/** Lexicographic compare: negative if a < b, 0 if equal, positive if a > b. */
export function compareCivilDates(a: CivilDate, b: CivilDate): number {
	if (a.year !== b.year) {
		return a.year - b.year;
	}
	if (a.month !== b.month) {
		return a.month - b.month;
	}
	return a.day - b.day;
}

export function isCivilDateInRange(date: CivilDate): boolean {
	return (
		compareCivilDates(date, DATE_CALCULATOR_MIN) >= 0 &&
		compareCivilDates(date, DATE_CALCULATOR_MAX) <= 0
	);
}

export function isValidCivilDate(date: unknown): date is CivilDate {
	if (date === null || typeof date !== "object") {
		return false;
	}

	const candidate = date as CivilDate;
	const { year, month, day } = candidate;

	if (
		!isFiniteSafeInteger(year) ||
		!isFiniteSafeInteger(month) ||
		!isFiniteSafeInteger(day)
	) {
		return false;
	}

	if (month < 1 || month > 12 || day < 1) {
		return false;
	}

	return day <= daysInMonth(year, month);
}

export function isValidSupportedStartDate(date: unknown): date is CivilDate {
	return isValidCivilDate(date) && isCivilDateInRange(date);
}

/**
 * Safe integer addition. Returns null when the sum is not a safe integer.
 */
function safeAdd(a: number, b: number): number | null {
	if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
		return null;
	}

	const sum = a + b;
	if (!Number.isSafeInteger(sum)) {
		return null;
	}

	return sum;
}

/**
 * Safe integer multiplication. Returns null on overflow of the safe-integer range.
 */
function safeMul(a: number, b: number): number | null {
	if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
		return null;
	}

	if (a === 0 || b === 0) {
		return 0;
	}

	const absA = Math.abs(a);
	const absB = Math.abs(b);
	if (absA > Math.floor(Number.MAX_SAFE_INTEGER / absB)) {
		return null;
	}

	const product = a * b;
	if (!Number.isSafeInteger(product)) {
		return null;
	}

	return product;
}

/**
 * Gregorian civil → serial day count (Howard Hinnant days_from_civil).
 * Epoch is 1970-01-01 = 0 (Unix day number). Pure integer math; no Date.
 */
export function civilToDayNumber(date: CivilDate): number {
	let y = date.year;
	const m = date.month;
	const d = date.day;

	y -= m <= 2 ? 1 : 0;
	const era = Math.floor(y / 400);
	const yoe = y - era * 400;
	const doy =
		Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
	const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
	return era * 146097 + doe - 719468;
}

/**
 * Serial day count → Gregorian civil (Howard Hinnant civil_from_days).
 */
export function dayNumberToCivil(dayNumber: number): CivilDate {
	const z = dayNumber + 719468;
	const era = Math.floor(z / 146097);
	const doe = z - era * 146097;
	const yoe = Math.floor(
		(doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) /
			365,
	);
	let y = yoe + era * 400;
	const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
	const mp = Math.floor((5 * doy + 2) / 153);
	const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
	const m = mp < 10 ? mp + 3 : mp - 9;
	y += m <= 2 ? 1 : 0;
	return { year: y, month: m, day: d };
}

function signedDelta(direction: Direction, amount: number): number {
	return direction === "add" ? amount : -amount;
}

function applyYearStep(date: CivilDate, delta: number): CivilDate | null {
	const newYear = safeAdd(date.year, delta);
	if (newYear === null) {
		return null;
	}

	const dim = daysInMonth(newYear, date.month);
	if (dim < 1) {
		return null;
	}

	return {
		year: newYear,
		month: date.month,
		day: Math.min(date.day, dim),
	};
}

/**
 * Single Month step: jump to target year-month via absolute month index, then clamp day.
 * Does not loop month-by-month; months > 11 stay one step.
 */
function applyMonthStep(date: CivilDate, delta: number): CivilDate | null {
	const yearAsMonths = safeMul(date.year, 12);
	if (yearAsMonths === null) {
		return null;
	}

	const absMonth = safeAdd(yearAsMonths, date.month - 1);
	if (absMonth === null) {
		return null;
	}

	const nextAbs = safeAdd(absMonth, delta);
	if (nextAbs === null) {
		return null;
	}

	const year = Math.floor(nextAbs / 12);
	const month0 = nextAbs - year * 12;
	const month = month0 + 1;
	const dim = daysInMonth(year, month);
	if (dim < 1) {
		return null;
	}

	return {
		year,
		month,
		day: Math.min(date.day, dim),
	};
}

function applyDayStep(date: CivilDate, delta: number): CivilDate | null {
	const base = civilToDayNumber(date);
	if (!Number.isSafeInteger(base)) {
		return null;
	}

	const next = safeAdd(base, delta);
	if (next === null) {
		return null;
	}

	const candidate = dayNumberToCivil(next);
	if (!isValidCivilDate(candidate)) {
		return null;
	}

	return candidate;
}

function validateDuration(
	duration: unknown,
): { ok: true; duration: Duration } | { ok: false; unit: DurationUnit } {
	if (duration === null || typeof duration !== "object") {
		return { ok: false, unit: "years" };
	}

	const value = duration as Duration;

	for (const unit of DURATION_UNITS) {
		if (!isSafeNonNegativeInteger(value[unit])) {
			return { ok: false, unit };
		}
	}

	return {
		ok: true,
		duration: {
			years: value.years,
			months: value.months,
			weeks: value.weeks,
			days: value.days,
		},
	};
}

function failStep(unit: DurationUnit): CalculateDateResult {
	return { ok: false, reason: "out-of-range", unit };
}

function applyCheckedStep(
	current: CivilDate,
	unit: DurationUnit,
	amount: number,
	direction: Direction,
): CalculateDateResult {
	if (amount === 0) {
		return { ok: true, date: current };
	}

	const delta = signedDelta(direction, amount);
	let candidate: CivilDate | null = null;

	if (unit === "years") {
		candidate = applyYearStep(current, delta);
	} else if (unit === "months") {
		candidate = applyMonthStep(current, delta);
	} else if (unit === "weeks") {
		const dayDelta = safeMul(delta, 7);
		if (dayDelta === null) {
			return failStep("weeks");
		}
		candidate = applyDayStep(current, dayDelta);
	} else {
		candidate = applyDayStep(current, delta);
	}

	if (candidate === null || !isCivilDateInRange(candidate)) {
		return failStep(unit);
	}

	return { ok: true, date: candidate };
}

/**
 * Primary entry: start ± duration with fixed Year → Month → Week → Day steps.
 */
export function calculateDate(
	start: unknown,
	direction: unknown,
	duration: unknown,
): CalculateDateResult {
	if (!isValidSupportedStartDate(start)) {
		return { ok: false, reason: "invalid-start-date" };
	}

	if (direction !== "add" && direction !== "subtract") {
		return { ok: false, reason: "invalid-direction" };
	}

	const durationCheck = validateDuration(duration);
	if (!durationCheck.ok) {
		return {
			ok: false,
			reason: "invalid-duration",
			unit: durationCheck.unit,
		};
	}

	const { years, months, weeks, days } = durationCheck.duration;
	let current: CivilDate = {
		year: start.year,
		month: start.month,
		day: start.day,
	};

	const yearStep = applyCheckedStep(current, "years", years, direction);
	if (!yearStep.ok) {
		return yearStep;
	}
	current = yearStep.date;

	const monthStep = applyCheckedStep(current, "months", months, direction);
	if (!monthStep.ok) {
		return monthStep;
	}
	current = monthStep.date;

	const weekStep = applyCheckedStep(current, "weeks", weeks, direction);
	if (!weekStep.ok) {
		return weekStep;
	}
	current = weekStep.date;

	const dayStep = applyCheckedStep(current, "days", days, direction);
	if (!dayStep.ok) {
		return dayStep;
	}

	return { ok: true, date: dayStep.date };
}
