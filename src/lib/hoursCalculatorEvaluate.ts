/**
 * Hours Calculator — shared evaluation（B2C）.
 * Desktop range／break parse 與 Mobile segments 皆映射至此，再輸出 RS／capsule／! flags。
 * 不改 Desktop parser contract；不改 Mobile digit gate。
 */
import {
	computeGrossDuration,
	formatBreakDeduction,
	formatNaturalDuration,
	formatNormalizedRange,
	formatSupportLine1,
	formatTimeOfDay,
	zeroSupport,
	type BreakParseResult,
	type HoursLocale,
	type RangeParseResult,
	type TimeOfDay,
} from "./hoursCalculatorTimeInput.ts";
import {
	hoursSegmentStatus,
	parseBreakDurationSegments as parseBreakDurationCore,
} from "./hoursCalculatorSegmentInput.ts";

export type HoursEvaluation = {
	primary: string;
	/** support 第一行：decimal · minutes（· overnight） */
	supportLine1: string;
	/** support 第二行：break deduction；無則 null */
	supportLine2: string | null;
	/**
	 * 預設組裝（Portrait／Desktop：兩行 \\n）。
	 * Landscape 由 publish 改為 `line1 / line2`。
	 */
	support: string;
	/** Capsule 主文：empty label 或 `09:00 — 18:00` */
	capsuleRange: string;
	capsuleNextDay: boolean;
	rangeInvalid: boolean;
	/** 格式非法或 break > gross */
	breakInvalid: boolean;
	/** break > gross（Mobile semantic !）；格式非法不算 */
	breakExceedsGross: boolean;
};

export type SegmentPairParse =
	| { status: "empty" | "incomplete" | "invalid" }
	| { status: "valid"; time: TimeOfDay };

/** HH／MM 兩碼成對；半組不視為完整時間（Start／End clock） */
export function parseSegmentPair(hh: string, mm: string): SegmentPairParse {
	const hhStatus = hoursSegmentStatus("hh", hh);
	const mmStatus = hoursSegmentStatus("mm", mm);

	if (hhStatus === "empty" && mmStatus === "empty") {
		return { status: "empty" };
	}
	if (hhStatus === "invalid" || mmStatus === "invalid") {
		return { status: "invalid" };
	}
	if (hhStatus === "valid" && mmStatus === "valid") {
		return {
			status: "valid",
			time: { hours: Number(hh), minutes: Number(mm) },
		};
	}
	return { status: "incomplete" };
}

export function rangeFromSegmentPairs(
	start: SegmentPairParse,
	end: SegmentPairParse,
): RangeParseResult {
	if (start.status === "empty" && end.status === "empty") {
		return { status: "empty" };
	}
	if (start.status === "invalid" || end.status === "invalid") {
		return { status: "invalid" };
	}
	if (start.status !== "valid" || end.status !== "valid") {
		return { status: "incomplete" };
	}
	return {
		status: "valid",
		start: start.time,
		end: end.time,
		normalized: formatNormalizedRange(start.time, end.time),
	};
}

/** Mobile Break duration → BreakParseResult（空白＝0；單碼有效） */
export function parseBreakDurationSegments(hh: string, mm: string): BreakParseResult {
	const core = parseBreakDurationCore(hh, mm);
	if (core.status === "empty" || core.status === "invalid") {
		return { status: core.status };
	}
	return {
		status: "valid",
		totalMinutes: core.totalMinutes,
		normalized: formatTimeOfDay({ hours: core.hours, minutes: core.minutes }),
	};
}

/** Capsule 用 em dash；不顯示半組時間 */
export function formatCapsuleRange(start: TimeOfDay, end: TimeOfDay): string {
	return `${formatTimeOfDay(start)} — ${formatTimeOfDay(end)}`;
}

/**
 * 共用計算 truth → ResultSummary／capsule／invalid flags。
 * break invalid（格式或 > gross）→ primary／support 用 gross；不顯示 deduction line。
 */
export function evaluateHoursResult(args: {
	locale: HoursLocale;
	range: RangeParseResult;
	breakParsed: BreakParseResult;
	capsuleEmptyLabel: string;
}): HoursEvaluation {
	const { locale, range, breakParsed, capsuleEmptyLabel } = args;

	if (range.status !== "valid") {
		const line1 = zeroSupport(locale);
		return {
			primary: formatNaturalDuration(0, locale),
			supportLine1: line1,
			supportLine2: null,
			support: line1,
			capsuleRange: capsuleEmptyLabel,
			capsuleNextDay: false,
			rangeInvalid: range.status === "invalid",
			breakInvalid: breakParsed.status === "invalid",
			breakExceedsGross: false,
		};
	}

	const gross = computeGrossDuration(range.start, range.end);
	let netMinutes = gross.minutes;
	let breakLine: string | null = null;
	let breakInvalid = false;
	let breakExceedsGross = false;

	if (breakParsed.status === "invalid") {
		breakInvalid = true;
	} else if (breakParsed.status === "valid") {
		if (breakParsed.totalMinutes === 0) {
			/* blank／00:00：不扣除 */
		} else if (breakParsed.totalMinutes > gross.minutes) {
			breakInvalid = true;
			breakExceedsGross = true;
		} else {
			netMinutes = gross.minutes - breakParsed.totalMinutes;
			breakLine = formatBreakDeduction(breakParsed.totalMinutes, locale);
		}
	}

	const primary = formatNaturalDuration(netMinutes, locale);
	const line1 = formatSupportLine1(netMinutes, gross.nextDay, locale);
	const support = breakLine ? `${line1}\n${breakLine}` : line1;

	return {
		primary,
		supportLine1: line1,
		supportLine2: breakLine,
		support,
		capsuleRange: formatCapsuleRange(range.start, range.end),
		capsuleNextDay: gross.nextDay,
		rangeInvalid: false,
		breakInvalid,
		breakExceedsGross,
	};
}
