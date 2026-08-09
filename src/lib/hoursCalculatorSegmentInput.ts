/**
 * Hours Calculator — Mobile HH／MM segment digit rules（B2B）.
 * Shared AME keypad only appends／deletes；pad＋auto-advance 由 adapter 協調。
 */

export type HoursSegmentKind = "hh" | "mm";

export type HoursSegmentDigitResult =
	| { accept: false }
	| {
			accept: true;
			/** 若需寫成補零值（第一碼 3–9／6–9），AME 先寫入 candidate 後由 adapter patch */
			padTo?: string;
			/** 僅同組 HH→MM；MM 完成不跨組 */
			advanceTo?: string;
	  };

export const HOURS_AME_FIELD_IDS = [
	"start-hh",
	"start-mm",
	"end-hh",
	"end-mm",
	"break-hh",
	"break-mm",
] as const;

export type HoursAmeFieldId = (typeof HOURS_AME_FIELD_IDS)[number];

export function hoursFieldKind(fieldId: string): HoursSegmentKind | null {
	if (fieldId.endsWith("-hh")) return "hh";
	if (fieldId.endsWith("-mm")) return "mm";
	return null;
}

export function hoursPairMmField(hhFieldId: string): string | null {
	if (!hhFieldId.endsWith("-hh")) return null;
	return `${hhFieldId.slice(0, -3)}-mm`;
}

/**
 * HH：00–23；MM：00–59。
 * 不可能的第二碼直接阻擋；第一碼 3–9／6–9 補零。
 */
export function evaluateHoursSegmentDigit(
	kind: HoursSegmentKind,
	currentValue: string,
	digit: string,
	fieldId: string,
): HoursSegmentDigitResult {
	if (!/^[0-9]$/.test(digit)) {
		return { accept: false };
	}

	if (kind === "hh") {
		if (currentValue.length === 0) {
			const d = Number(digit);
			if (d >= 0 && d <= 2) {
				return { accept: true };
			}
			if (d >= 3 && d <= 9) {
				const mm = hoursPairMmField(fieldId);
				return {
					accept: true,
					padTo: `0${digit}`,
					advanceTo: mm ?? undefined,
				};
			}
			return { accept: false };
		}
		if (currentValue.length === 1) {
			const next = `${currentValue}${digit}`;
			if (Number(next) > 23) {
				return { accept: false };
			}
			const mm = hoursPairMmField(fieldId);
			return { accept: true, advanceTo: mm ?? undefined };
		}
		return { accept: false };
	}

	/* MM */
	if (currentValue.length === 0) {
		const d = Number(digit);
		if (d >= 0 && d <= 5) {
			return { accept: true };
		}
		if (d >= 6 && d <= 9) {
			return { accept: true, padTo: `0${digit}` };
		}
		return { accept: false };
	}
	if (currentValue.length === 1) {
		const next = `${currentValue}${digit}`;
		if (Number(next) > 59) {
			return { accept: false };
		}
		return { accept: true };
	}
	return { accept: false };
}

export type HoursSegmentStatus = "empty" | "incomplete" | "valid" | "invalid";

export function hoursSegmentStatus(kind: HoursSegmentKind, value: string): HoursSegmentStatus {
	if (value === "") {
		return "empty";
	}
	if (!/^\d+$/.test(value)) {
		return "invalid";
	}
	if (value.length === 1) {
		return "incomplete";
	}
	if (value.length !== 2) {
		return "invalid";
	}
	const n = Number(value);
	if (kind === "hh") {
		return n >= 0 && n <= 23 ? "valid" : "invalid";
	}
	return n >= 0 && n <= 59 ? "valid" : "invalid";
}

export function hoursGroupHasInvalidSegment(
	hh: string,
	mm: string,
): boolean {
	return (
		hoursSegmentStatus("hh", hh) === "invalid" ||
		hoursSegmentStatus("mm", mm) === "invalid"
	);
}

export type MobileClockCompleteResult =
	| { status: "empty" }
	| { status: "incomplete" }
	| { status: "complete"; hh: string; mm: string };

/**
 * Mobile Start／End completion（離開時間組後）。
 * HH 必要；MM 省略→00；單碼前補 0。
 * `__:30` → incomplete（不猜測 HH）；不改 Break duration 規則。
 */
export function completeMobileClockPair(hh: string, mm: string): MobileClockCompleteResult {
	const h = hh.trim();
	const m = mm.trim();

	if (h === "" && m === "") {
		return { status: "empty" };
	}
	/* 無 HH 不猜測（例如 __:30） */
	if (h === "") {
		return { status: "incomplete" };
	}
	if (!/^\d{1,2}$/.test(h)) {
		return { status: "incomplete" };
	}
	const hours = Number(h);
	if (hours < 0 || hours > 23) {
		return { status: "incomplete" };
	}

	let minutes = 0;
	if (m !== "") {
		if (!/^\d{1,2}$/.test(m)) {
			return { status: "incomplete" };
		}
		minutes = Number(m);
		if (minutes < 0 || minutes > 59) {
			return { status: "incomplete" };
		}
	}

	return {
		status: "complete",
		hh: String(hours).padStart(2, "0"),
		mm: String(minutes).padStart(2, "0"),
	};
}

export type BreakDurationParse =
	| { status: "empty" | "invalid" }
	| { status: "valid"; totalMinutes: number; hours: number; minutes: number };

/**
 * Mobile Break＝duration（非 clock）。
 * 空白 HH／MM 視為 0；單碼視為該數值（等同前補 0）；兩欄皆空 → empty。
 * Start／End 仍用 parseSegmentPair（須兩碼齊全）。
 */
export function parseBreakDurationSegments(hh: string, mm: string): BreakDurationParse {
	const hhRaw = hh.trim();
	const mmRaw = mm.trim();

	if (hhRaw === "" && mmRaw === "") {
		return { status: "empty" };
	}

	const readPart = (
		raw: string,
		kind: HoursSegmentKind,
	): number | "empty" | "invalid" => {
		if (raw === "") {
			return "empty";
		}
		if (!/^\d{1,2}$/.test(raw)) {
			return "invalid";
		}
		const n = Number(raw);
		if (kind === "hh" && (n < 0 || n > 23)) {
			return "invalid";
		}
		if (kind === "mm" && (n < 0 || n > 59)) {
			return "invalid";
		}
		return n;
	};

	const hoursPart = readPart(hhRaw, "hh");
	const minutesPart = readPart(mmRaw, "mm");
	if (hoursPart === "invalid" || minutesPart === "invalid") {
		return { status: "invalid" };
	}

	const hours = hoursPart === "empty" ? 0 : hoursPart;
	const minutes = minutesPart === "empty" ? 0 : minutesPart;

	return {
		status: "valid",
		totalMinutes: hours * 60 + minutes,
		hours,
		minutes,
	};
}
