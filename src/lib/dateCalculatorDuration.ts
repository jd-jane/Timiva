/**
 * Date Calculator — Direction／Duration state (B2.5).
 *
 * One shared state for Desktop、Portrait Sheet、Landscape Panel.
 * Pure logic only: no DOM, no calculateDate, no ResultSummary.
 */
import type { Direction, Duration, DurationUnit } from "./dateCalculatorMath.ts";

export type { Direction, Duration, DurationUnit };

export type DurationUnitStatus = "empty" | "valid" | "invalid";

export type DurationUnitSnapshot = {
	/** Raw text as typed；invalid 時保留使用者輸入以便修正。 */
	raw: string;
	/** Normalized display（前導零已移除）。 */
	display: string;
	/** Effective value for calculation；empty 與 invalid 皆為 0。 */
	value: number;
	status: DurationUnitStatus;
};

export type DurationSnapshot = {
	direction: Direction;
	units: Record<DurationUnit, DurationUnitSnapshot>;
	/** Effective duration；invalid／empty 單位以 0 計。 */
	duration: Duration;
	hasInvalidUnit: boolean;
};

export type DateCalculatorDurationController = {
	getSnapshot: () => DurationSnapshot;
	subscribe: (listener: (snapshot: DurationSnapshot) => void) => () => void;
	setDirection: (direction: Direction) => DurationSnapshot;
	setDurationUnit: (unit: DurationUnit, raw: string) => DurationSnapshot;
	clearDurationUnit: (unit: DurationUnit) => DurationSnapshot;
	normalizeDurationUnit: (unit: DurationUnit) => DurationSnapshot;
	reset: () => DurationSnapshot;
	destroy: () => void;
};

export const DURATION_UNITS: readonly DurationUnit[] = [
	"years",
	"months",
	"weeks",
	"days",
];

export const DEFAULT_DIRECTION: Direction = "add";

export function isDirection(value: unknown): value is Direction {
	return value === "add" || value === "subtract";
}

/** 只接受非負十進位整數字串；拒絕正負號、小數、指數、空白與其他文字。 */
export function isValidDurationInput(raw: string): boolean {
	if (!/^\d+$/.test(raw)) {
		return false;
	}

	const value = Number(raw);
	return Number.isSafeInteger(value) && value >= 0;
}

/** `00012` → `12`；`000` → `0`。 */
export function normalizeDurationDigits(raw: string): string {
	const trimmed = raw.replace(/^0+(?=\d)/, "");
	return trimmed.length > 0 ? trimmed : raw;
}

function emptyUnitSnapshot(): DurationUnitSnapshot {
	return { raw: "", display: "", value: 0, status: "empty" };
}

function unitSnapshotFromRaw(raw: string): DurationUnitSnapshot {
	if (raw.length === 0) {
		return emptyUnitSnapshot();
	}

	if (!isValidDurationInput(raw)) {
		/* invalid 不保留該欄上一筆 valid 數值 */
		return { raw, display: raw, value: 0, status: "invalid" };
	}

	const display = normalizeDurationDigits(raw);
	return { raw, display, value: Number(display), status: "valid" };
}

function cloneUnits(
	units: Record<DurationUnit, DurationUnitSnapshot>,
): Record<DurationUnit, DurationUnitSnapshot> {
	return {
		years: { ...units.years },
		months: { ...units.months },
		weeks: { ...units.weeks },
		days: { ...units.days },
	};
}

function buildSnapshot(
	direction: Direction,
	units: Record<DurationUnit, DurationUnitSnapshot>,
): DurationSnapshot {
	return {
		direction,
		units: cloneUnits(units),
		duration: {
			years: units.years.value,
			months: units.months.value,
			weeks: units.weeks.value,
			days: units.days.value,
		},
		hasInvalidUnit: DURATION_UNITS.some(
			(unit) => units[unit].status === "invalid",
		),
	};
}

export function createDurationController(options?: {
	onChange?: (snapshot: DurationSnapshot) => void;
}): DateCalculatorDurationController {
	let direction: Direction = DEFAULT_DIRECTION;
	let units: Record<DurationUnit, DurationUnitSnapshot> = {
		years: emptyUnitSnapshot(),
		months: emptyUnitSnapshot(),
		weeks: emptyUnitSnapshot(),
		days: emptyUnitSnapshot(),
	};
	let destroyed = false;
	const listeners = new Set<(snapshot: DurationSnapshot) => void>();

	const emit = (): DurationSnapshot => {
		const snapshot = buildSnapshot(direction, units);
		if (destroyed) {
			return snapshot;
		}
		options?.onChange?.(snapshot);
		for (const listener of listeners) {
			listener(snapshot);
		}
		return snapshot;
	};

	return {
		getSnapshot: () => buildSnapshot(direction, units),

		subscribe: (listener) => {
			if (destroyed) {
				return () => {};
			}
			listeners.add(listener);
			return () => listeners.delete(listener);
		},

		setDirection: (next) => {
			if (destroyed || !isDirection(next) || next === direction) {
				return buildSnapshot(direction, units);
			}
			direction = next;
			return emit();
		},

		setDurationUnit: (unit, raw) => {
			if (destroyed || !DURATION_UNITS.includes(unit)) {
				return buildSnapshot(direction, units);
			}
			units = { ...units, [unit]: unitSnapshotFromRaw(raw) };
			return emit();
		},

		clearDurationUnit: (unit) => {
			if (destroyed || !DURATION_UNITS.includes(unit)) {
				return buildSnapshot(direction, units);
			}
			/* 只把該單位變回 0；其他單位維持原狀 */
			units = { ...units, [unit]: emptyUnitSnapshot() };
			return emit();
		},

		normalizeDurationUnit: (unit) => {
			if (destroyed || !DURATION_UNITS.includes(unit)) {
				return buildSnapshot(direction, units);
			}
			const current = units[unit];
			if (current.status !== "valid" || current.raw === current.display) {
				return buildSnapshot(direction, units);
			}
			units = {
				...units,
				[unit]: { ...current, raw: current.display },
			};
			return emit();
		},

		reset: () => {
			if (destroyed) {
				return buildSnapshot(direction, units);
			}
			direction = DEFAULT_DIRECTION;
			units = {
				years: emptyUnitSnapshot(),
				months: emptyUnitSnapshot(),
				weeks: emptyUnitSnapshot(),
				days: emptyUnitSnapshot(),
			};
			return emit();
		},

		destroy: () => {
			destroyed = true;
			listeners.clear();
		},
	};
}
