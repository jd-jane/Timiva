/**
 * Adaptive Mobile Editor — numeric draft helpers（B7／B8）.
 * Digits only · no decimals／negatives · no native input coupling.
 * maxLength／allowEmpty come from per-field config（not a field DSL）.
 * maxLength: number = digit cap；null = no AME digit-count truncate（tool validate owns safety）.
 */

/** Lab Mixed／Numeric default max length（configs must still pass explicitly）. */
export const AME_NUMERIC_MAX_LEN = 4;

/** @deprecated Lab Mixed fixture ids — prefer AmeNumericFieldConfig.id */
export const AME_NUMERIC_FIELDS = ["years", "months", "weeks", "days"] as const;
export type AmeNumericFieldId = (typeof AME_NUMERIC_FIELDS)[number];

export const AME_NUMERIC_FIELD_DAYS: AmeNumericFieldId = "days";

export const AME_NUMERIC_LABELS: Record<AmeNumericFieldId, string> = {
	years: "Years",
	months: "Months",
	weeks: "Weeks",
	days: "Days",
};

export type AmeMaxLength = number | null;

export function isAmeNumericFieldId(value: string | null | undefined): value is AmeNumericFieldId {
	return value === "years" || value === "months" || value === "weeks" || value === "days";
}

/**
 * Append one digit.
 * - number maxLength: ignore digits at／beyond the cap
 * - null maxLength: never truncate（Decision C）
 */
export function appendAmeDigit(
	current: string,
	digit: string,
	maxLength: AmeMaxLength = AME_NUMERIC_MAX_LEN,
): string {
	if (!/^[0-9]$/.test(digit)) {
		return current;
	}
	if (maxLength === null) {
		return `${current}${digit}`;
	}
	const limit = Math.max(0, Math.floor(maxLength));
	if (current.length >= limit) {
		return current;
	}
	return `${current}${digit}`;
}

/** Delete the last digit. Empty stays empty（no error）. */
export function deleteAmeDigit(current: string): string {
	if (current.length === 0) {
		return current;
	}
	return current.slice(0, -1);
}

/** Clear draft to empty string（no error）. */
export function clearAmeDigits(): string {
	return "";
}

/**
 * After delete／clear: if allowEmpty is false and value would be empty, use "0".
 * Tool validate() still owns Done acceptance.
 */
export function normalizeAmeNumericAfterEdit(value: string, allowEmpty: boolean): string {
	if (value === "" && !allowEmpty) {
		return "0";
	}
	return value;
}

/** Digits-only check；empty allowed. number maxLength caps length；null = any digit length. */
export function isAmeNumericValue(value: string, maxLength: AmeMaxLength = AME_NUMERIC_MAX_LEN): boolean {
	if (value === "") {
		return true;
	}
	if (!/^\d+$/.test(value)) {
		return false;
	}
	if (maxLength === null) {
		return true;
	}
	const limit = Math.max(0, Math.floor(maxLength));
	return value.length <= limit;
}

export function ameNumericLiveMessage(label: string, value: string): string {
	if (value === "") {
		return `${label} empty`;
	}
	return `${label} ${value}`;
}

export function ameAnyNumericFilled(values: Record<string, string>, ids: readonly string[]): boolean {
	return ids.some((id) => (values[id] ?? "") !== "");
}
