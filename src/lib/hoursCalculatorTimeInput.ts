/**
 * Hours Calculator — Desktop time range／break parse、normalize、duration helpers.
 * B2C：Mobile segments 經 hoursCalculatorEvaluate 共用 duration／format helpers。
 */

export type HoursLocale = "en" | "zh";

export type ParseStatus = "empty" | "incomplete" | "invalid" | "valid";

export type TimeOfDay = {
	hours: number;
	minutes: number;
};

export type RangeParseResult =
	| { status: "empty" | "incomplete" | "invalid" }
	| {
			status: "valid";
			start: TimeOfDay;
			end: TimeOfDay;
			normalized: string;
	  };

export type BreakParseResult =
	| { status: "empty" | "incomplete" | "invalid" }
	| {
			status: "valid";
			totalMinutes: number;
			normalized: string;
	  };

export type GrossDuration = {
	minutes: number;
	nextDay: boolean;
};

const RANGE_SEP = /[-–—]/;
const ONLY_DIGITS = /^\d+$/;

function isHour(value: number): boolean {
	return Number.isInteger(value) && value >= 0 && value <= 23;
}

function isMinute(value: number): boolean {
	return Number.isInteger(value) && value >= 0 && value <= 59;
}

export function formatTimeOfDay(time: TimeOfDay): string {
	return `${String(time.hours).padStart(2, "0")}:${String(time.minutes).padStart(2, "0")}`;
}

export function formatNormalizedRange(start: TimeOfDay, end: TimeOfDay): string {
	return `${formatTimeOfDay(start)} – ${formatTimeOfDay(end)}`;
}

function parseClockToken(raw: string): { status: ParseStatus; time?: TimeOfDay } {
	const token = raw.trim();
	if (!token) {
		return { status: "incomplete" };
	}

	/* 拒絕小數點／字母等非規格字元 */
	if (/[^\d:]/.test(token)) {
		return { status: "invalid" };
	}

	if (token.includes(":")) {
		const match = /^(\d{1,2}):(\d{0,2})$/.exec(token);
		if (!match) {
			return { status: "invalid" };
		}
		const hourRaw = match[1];
		const minuteRaw = match[2];
		if (minuteRaw.length < 2) {
			return { status: "incomplete" };
		}
		const hours = Number(hourRaw);
		const minutes = Number(minuteRaw);
		if (!isHour(hours) || !isMinute(minutes)) {
			return { status: "invalid" };
		}
		return { status: "valid", time: { hours, minutes } };
	}

	if (!ONLY_DIGITS.test(token)) {
		return { status: "invalid" };
	}

	const len = token.length;
	if (len <= 2) {
		return { status: "incomplete" };
	}
	if (len === 3) {
		const hours = Number(token.slice(0, 1));
		const minutes = Number(token.slice(1));
		if (!isHour(hours) || !isMinute(minutes)) {
			return { status: "invalid" };
		}
		return { status: "valid", time: { hours, minutes } };
	}
	if (len === 4) {
		const hours = Number(token.slice(0, 2));
		const minutes = Number(token.slice(2));
		if (!isHour(hours) || !isMinute(minutes)) {
			return { status: "invalid" };
		}
		return { status: "valid", time: { hours, minutes } };
	}

	return { status: "invalid" };
}

/**
 * Desktop 主時間區間。
 * 接受：09:00-18:00／9:00-18:00／含空格／en dash／0900-1800／900-1800
 * 拒絕：09001800、點號、AM／PM、自然語言
 */
export function parseRangeInput(raw: string): RangeParseResult {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { status: "empty" };
	}

	const sepMatch = RANGE_SEP.exec(trimmed);
	if (!sepMatch || sepMatch.index === undefined) {
		/* 無分隔：6–8 位純數字視為完整但非法（如 09001800）；其餘未完成 */
		if (/^\d{6,8}$/.test(trimmed)) {
			return { status: "invalid" };
		}
		if (/[^\d:\s]/.test(trimmed)) {
			return { status: "invalid" };
		}
		return { status: "incomplete" };
	}

	const left = trimmed.slice(0, sepMatch.index).trim();
	const right = trimmed.slice(sepMatch.index + sepMatch[0].length).trim();
	if (!left || !right) {
		return { status: "incomplete" };
	}

	const start = parseClockToken(left);
	const end = parseClockToken(right);

	if (start.status === "incomplete" || end.status === "incomplete") {
		return { status: "incomplete" };
	}
	if (start.status === "invalid" || end.status === "invalid" || !start.time || !end.time) {
		return { status: "invalid" };
	}

	return {
		status: "valid",
		start: start.time,
		end: end.time,
		normalized: formatNormalizedRange(start.time, end.time),
	};
}

/**
 * Desktop 休息時長。
 * 接受：00:30／0:30／30／130／0130／1:30 → 正規化 HH:MM
 */
export function parseBreakInput(raw: string): BreakParseResult {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { status: "empty" };
	}

	if (/[^\d:]/.test(trimmed)) {
		return { status: "invalid" };
	}

	if (trimmed.includes(":")) {
		const match = /^(\d{1,2}):(\d{0,2})$/.exec(trimmed);
		if (!match) {
			return { status: "invalid" };
		}
		const minuteRaw = match[2];
		if (minuteRaw.length < 2) {
			return { status: "incomplete" };
		}
		const hours = Number(match[1]);
		const minutes = Number(minuteRaw);
		if (!isHour(hours) || !isMinute(minutes)) {
			return { status: "invalid" };
		}
		const totalMinutes = hours * 60 + minutes;
		return {
			status: "valid",
			totalMinutes,
			normalized: formatTimeOfDay({ hours, minutes }),
		};
	}

	if (!ONLY_DIGITS.test(trimmed)) {
		return { status: "invalid" };
	}

	const len = trimmed.length;
	if (len === 1) {
		return { status: "incomplete" };
	}
	if (len === 2) {
		const minutes = Number(trimmed);
		if (!isMinute(minutes)) {
			return { status: "invalid" };
		}
		return {
			status: "valid",
			totalMinutes: minutes,
			normalized: formatTimeOfDay({ hours: 0, minutes }),
		};
	}
	if (len === 3) {
		const hours = Number(trimmed.slice(0, 1));
		const minutes = Number(trimmed.slice(1));
		if (!isHour(hours) || !isMinute(minutes)) {
			return { status: "invalid" };
		}
		return {
			status: "valid",
			totalMinutes: hours * 60 + minutes,
			normalized: formatTimeOfDay({ hours, minutes }),
		};
	}
	if (len === 4) {
		const hours = Number(trimmed.slice(0, 2));
		const minutes = Number(trimmed.slice(2));
		if (!isHour(hours) || !isMinute(minutes)) {
			return { status: "invalid" };
		}
		return {
			status: "valid",
			totalMinutes: hours * 60 + minutes,
			normalized: formatTimeOfDay({ hours, minutes }),
		};
	}

	return { status: "invalid" };
}

/** 原始時長：end < start → 隔天；相等 → 0 */
export function computeGrossDuration(start: TimeOfDay, end: TimeOfDay): GrossDuration {
	const startMin = start.hours * 60 + start.minutes;
	const endMin = end.hours * 60 + end.minutes;
	if (endMin === startMin) {
		return { minutes: 0, nextDay: false };
	}
	if (endMin > startMin) {
		return { minutes: endMin - startMin, nextDay: false };
	}
	return { minutes: 24 * 60 - startMin + endMin, nextDay: true };
}

/** 小數時數：最多 2 位、去尾 0 */
export function formatDecimalHours(totalMinutes: number, locale: HoursLocale): string {
	const hours = totalMinutes / 60;
	let body: string;
	if (Number.isInteger(hours)) {
		body = String(hours);
	} else {
		body = hours
			.toFixed(2)
			.replace(/(\.\d*?[1-9])0+$/, "$1")
			.replace(/\.0+$/, "");
	}
	return locale === "zh" ? `${body} 小時` : `${body} ${hours === 1 ? "hour" : "hours"}`;
}

export function formatNaturalDuration(totalMinutes: number, locale: HoursLocale): string {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (locale === "zh") {
		if (totalMinutes === 0) return "0 小時 0 分鐘";
		if (hours === 0) return `${minutes} 分鐘`;
		if (minutes === 0) return `${hours} 小時`;
		return `${hours} 小時 ${minutes} 分鐘`;
	}

	/* EN primary：hr／min（對齊 B1B Owner 確認） */
	if (totalMinutes === 0) return "0 hr 0 min";
	if (hours === 0) return `${minutes} min`;
	if (minutes === 0) return `${hours} hr`;
	return `${hours} hr ${minutes} min`;
}

function formatSupportMinutes(totalMinutes: number, locale: HoursLocale): string {
	if (locale === "zh") {
		return `${totalMinutes} 分鐘`;
	}
	return `${totalMinutes} ${totalMinutes === 1 ? "minute" : "minutes"}`;
}

export function formatSupportLine1(
	totalMinutes: number,
	nextDay: boolean,
	locale: HoursLocale,
): string {
	const parts = [
		formatDecimalHours(totalMinutes, locale),
		formatSupportMinutes(totalMinutes, locale),
	];
	if (nextDay) {
		parts.push(locale === "zh" ? "隔天" : "Next day");
	}
	return parts.join(" · ");
}

/** support line 2：有效休息 > 0 */
export function formatBreakDeduction(breakMinutes: number, locale: HoursLocale): string {
	const hours = Math.floor(breakMinutes / 60);
	const minutes = breakMinutes % 60;

	if (locale === "zh") {
		if (hours === 0) return `已扣除 ${minutes} 分鐘休息時間`;
		if (minutes === 0) return `已扣除 ${hours} 小時休息時間`;
		return `已扣除 ${hours} 小時 ${minutes} 分鐘休息時間`;
	}

	if (hours === 0) {
		return `${minutes} ${minutes === 1 ? "minute" : "minutes"} of break time deducted`;
	}
	if (minutes === 0) {
		return `${hours} ${hours === 1 ? "hour" : "hours"} of break time deducted`;
	}
	return `${hours} ${hours === 1 ? "hour" : "hours"} ${minutes} ${
		minutes === 1 ? "minute" : "minutes"
	} of break time deducted`;
}

export function zeroSupport(locale: HoursLocale): string {
	return locale === "zh" ? "0 小時 · 0 分鐘" : "0 hours · 0 minutes";
}
