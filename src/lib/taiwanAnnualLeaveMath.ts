/**
 * Taiwan Annual Leave — pure math SSOT（B2A）。
 *
 * 曆年制：對齊勞動部 RestDays（calcr2.mol.gov.tw）當年度試算。
 * Rounding（自 RestDays rest_days.js 原文鎖定）：
 *   Math.ceil(Math.floor(x * 100) / 10) / 10
 * 文案「先計算至小數第2位，再判斷小數第2位若大於1則進位」即此實作
 * （實測：ceil(floor(x*100)/10)/10；非整數第2位時可能進位到一位小數）。
 *
 * 不做 DOM／UI／LocalStorage。
 *
 * UI 契約：主結果 → primaryDisplay；數值 → officialDays；rawDays 僅驗證／內部分段，不得當主結果。
 */

export type LeaveSystem = "anniversary" | "calendar-year";

export type CivilDate = {
	year: number;
	month: number; // 1–12
	day: number;
};

export type Tenure = {
	years: number;
	months: number;
	days: number;
};

/** RestDays rest_array（106/01/01 新制）：index = 足年數 */
export const REST_DAYS_BY_COMPLETED_YEARS = [
	0, 7, 10, 14, 14, 15, 15, 15, 15, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
	26, 27, 28, 29, 30, 30,
] as const;

/**
 * RestDays 進位：ceil(floor(x*100)/10)/10
 * 先截到百分位整數，再以 ceil(/10) 落到一位小數。
 */
export function restDaysRound(x: number): number {
	return Math.ceil(Math.floor(x * 100) / 10) / 10;
}

/** UI display：最多 1 位小數；整數不顯示 .0（對已官方 round 的值再 format） */
export function formatLeaveDisplay(days: number): string {
	const n = Number(days);
	if (!Number.isFinite(n)) return "?";
	const oneDecimal = Math.round(n * 10) / 10;
	if (Number.isInteger(oneDecimal)) return String(oneDecimal);
	return oneDecimal.toFixed(1);
}

export function daysInMonth(year: number, month: number): number {
	return new Date(year, month, 0).getDate();
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
	const av = a.year * 10000 + a.month * 100 + a.day;
	const bv = b.year * 10000 + b.month * 100 + b.day;
	return av - bv;
}

/** 到職周年日（含 2/29 → 非閏年改 2/28） */
export function anniversaryInYear(hire: CivilDate, year: number): CivilDate {
	if (hire.month === 2 && hire.day === 29 && daysInMonth(year, 2) < 29) {
		return { year, month: 2, day: 28 };
	}
	return { year, month: hire.month, day: hire.day };
}

function addMonths(date: CivilDate, months: number): CivilDate {
	const base = new Date(date.year, date.month - 1, date.day);
	const originalDay = date.day;
	base.setMonth(base.getMonth() + months);
	// 對齊 RestDays addDate2 type=5：若日被鉗制，改回該月 1 日
	if (base.getDate() !== originalDay) {
		return { year: base.getFullYear(), month: base.getMonth() + 1, day: 1 };
	}
	return { year: base.getFullYear(), month: base.getMonth() + 1, day: base.getDate() };
}

function addDays(date: CivilDate, delta: number): CivilDate {
	const base = new Date(date.year, date.month - 1, date.day);
	base.setDate(base.getDate() + delta);
	return { year: base.getFullYear(), month: base.getMonth() + 1, day: base.getDate() };
}

/**
 * RestDays Func_Seniority 語意：足年／足月／足日。
 */
export function seniorityParts(from: CivilDate, to: CivilDate): Tenure {
	let y = 0;
	let cursorY = from.year;
	const m0 = from.month;
	const d0 = from.day;

	while (true) {
		const next = { year: cursorY + 1, month: m0, day: d0 };
		if (compareCivil(next, to) > 0) break;
		cursorY += 1;
		y += 1;
	}

	let cursorM = m0;
	let cursorYear = cursorY;
	let months = 0;
	while (true) {
		let nm = cursorM + 1;
		let ny = cursorYear;
		if (nm === 13) {
			nm = 1;
			ny += 1;
		}
		const next = { year: ny, month: nm, day: d0 };
		if (compareCivil(next, to) > 0) break;
		cursorM = nm;
		cursorYear = ny;
		months += 1;
	}

	const prev = addDays(to, -1);
	const dimPrev = daysInMonth(prev.year, prev.month);
	let days = 0;
	if (to.day === 1 && d0 > dimPrev) {
		days = 0;
	} else {
		let dy = cursorYear;
		let dm = cursorM;
		let dd = d0;
		while (true) {
			dd += 1;
			const dim = daysInMonth(dy, dm);
			if (dd > dim) {
				dd = 1;
				dm += 1;
				if (dm === 13) {
					dm = 1;
					dy += 1;
				}
			}
			if (compareCivil({ year: dy, month: dm, day: dd }, to) > 0) break;
			days += 1;
			if (days > 400) break;
		}
	}

	return { years: y, months, days };
}

/**
 * RestDays 分段「當月天數」分母（以到職日所在月為準）。
 * hireDay > 1：from month/day=2 → next month/1
 * hireDay === 1：from prev-month/2 → hire-month/1
 */
function restDaysMonthLengthForSegment(
	leaveYearGregorian: number,
	hire: CivilDate,
	calEyear: number,
	segment: 0 | 1,
): number {
	const hireMonth = hire.month;
	const hireDay = hire.day;
	const baseYear = leaveYearGregorian - calEyear + (segment === 1 ? 1 : 0);

	if (hireDay > 1) {
		let from: CivilDate;
		let to: CivilDate;
		if (hireMonth === 12) {
			from = { year: baseYear, month: 12, day: 2 };
			to = { year: baseYear + 1, month: 1, day: 1 };
		} else {
			from = { year: baseYear, month: hireMonth, day: 2 };
			to = { year: baseYear, month: hireMonth + 1, day: 1 };
		}
		return seniorityParts(from, to).days + 1;
	}

	if (hireMonth === 1) return 31;
	const from = {
		year: hireMonth - 1 === 0 ? baseYear - 1 : baseYear,
		month: hireMonth === 1 ? 12 : hireMonth - 1,
		day: 2,
	};
	const to = { year: baseYear, month: hireMonth, day: 1 };
	return seniorityParts(from, to).days + 1;
}

export function statutoryDaysForTenure(tenure: Tenure): number {
	const totalMonths = tenure.years * 12 + tenure.months;
	if (totalMonths < 6) return 0;
	if (tenure.years < 1) return 3;
	const completedYears = tenure.years;
	const idx = Math.min(completedYears, REST_DAYS_BY_COMPLETED_YEARS.length - 1);
	return REST_DAYS_BY_COMPLETED_YEARS[idx] ?? 30;
}

export function nextAnniversaryTier(
	hire: CivilDate,
	asOf: CivilDate,
	currentDays: number,
): { date: CivilDate; days: number } | null {
	if (currentDays >= 30) return null;

	const tenure = seniorityParts(hire, asOf);
	if (tenure.years === 0 && tenure.months < 6) {
		return { date: addMonths(hire, 6), days: 3 };
	}

	const nextYearCount = tenure.years + 1;
	const nextDate = anniversaryInYear(hire, hire.year + nextYearCount);
	const nextDays =
		REST_DAYS_BY_COMPLETED_YEARS[Math.min(nextYearCount, REST_DAYS_BY_COMPLETED_YEARS.length - 1)] ??
		30;
	if (nextDays <= currentDays && currentDays < 30) {
		for (let y = nextYearCount; y <= 25; y++) {
			const d = REST_DAYS_BY_COMPLETED_YEARS[Math.min(y, 25)] ?? 30;
			if (d > currentDays) {
				return { date: anniversaryInYear(hire, hire.year + y), days: d };
			}
		}
		return null;
	}
	return { date: nextDate, days: Math.min(nextDays, 30) };
}

function formatTenureZh(t: Tenure): string {
	const parts: string[] = [];
	if (t.years > 0) parts.push(`${t.years} 年`);
	if (t.months > 0) parts.push(`${t.months} 個月`);
	if (t.days > 0 || parts.length === 0) parts.push(`${t.days} 日`);
	return parts.join(" ");
}

export type AnniversaryResult = {
	/** 內部值；週年制等於 officialDays（無分段差異） */
	rawDays: number;
	/** 法定級距數值；UI 需要數值時用此欄 */
	officialDays: number;
	/** UI 主結果字串；與 primaryDisplay 同源規則 */
	display: string;
	tenure: Tenure;
	next: { date: CivilDate; days: number } | null;
	isMax: boolean;
	formulaLines: string[];
};

export function evaluateAnniversary(hire: CivilDate, asOf: CivilDate): AnniversaryResult {
	if (compareCivil(hire, asOf) > 0) {
		throw new Error("hire date after asOf");
	}
	const tenure = seniorityParts(hire, asOf);
	const officialDays = statutoryDaysForTenure(tenure);
	const next = nextAnniversaryTier(hire, asOf, officialDays);
	const formulaLines = [
		`週年制 · 年資 ${formatTenureZh(tenure)}`,
		`法定級距 ${formatLeaveDisplay(officialDays)} 天`,
	];
	return {
		rawDays: officialDays,
		officialDays,
		display: formatLeaveDisplay(officialDays),
		tenure,
		next,
		isMax: officialDays >= 30,
		formulaLines,
	};
}

export type CalendarYearResult = {
	/**
	 * 內部分段 round 後加總（驗證用）。
	 * 不保證與 officialDays 相同（例：1/1 足年對齊時 raw 可為 10、official 為 3／7）。
	 * 不得作為 UI 主結果。
	 */
	rawDays: number;
	/** RestDays「給假日期當年度之特休日數」；需要數值時用此欄（勿用 rawDays） */
	officialDays: number;
	/** UI 主結果字串（最多 1 位小數；整數無 .0）。主顯示用 primaryDisplay／本欄，勿用 rawDays */
	display: string;
	leaveYear: number;
	leavePeriod: { start: CivilDate; end: CivilDate };
	formulaLines: string[];
	formulaExpression: string;
	tenureAtYearStart: Tenure;
	/** 分段 0／1 在最終 round 後的日數（供驗證） */
	segmentDays: { first: number; second: number };
};

/**
 * 對齊 RestDays Caculate_calendardate(leaveYear/1/1)。
 * 給假年 = leaveYear；假設全年在職。
 */
export function evaluateCalendarYear(hire: CivilDate, leaveYear: number): CalendarYearResult {
	const enddate: CivilDate = { year: leaveYear, month: 1, day: 1 };
	const end_date = new Date(leaveYear, 0, 1);

	const tenureAtStart = seniorityParts(hire, enddate);
	const calendar_year = tenureAtStart.years;
	const calendar_month = tenureAtStart.months;
	const calendar_day = tenureAtStart.days;

	let indexY = Math.min(calendar_year, 25);

	const startdate_array = [hire.year, hire.month, hire.day];
	const enddate_array = [leaveYear, 1, 1];

	let cal_syear = 0;
	let cal_eyear = 0;
	if (startdate_array[1] > enddate_array[1]) {
		cal_syear = 0;
		cal_eyear = 0;
	} else if (startdate_array[1] < enddate_array[1]) {
		cal_syear = 1;
		cal_eyear = 0;
	} else if (startdate_array[2] > enddate_array[2]) {
		cal_syear = 0;
		cal_eyear = 0;
	} else {
		cal_syear = 1;
		cal_eyear = 0;
	}

	let days = restDaysMonthLengthForSegment(leaveYear, hire, cal_eyear, 0);

	// 第一段終點：周年（2/29 → 3/1，RestDays 曆年制特例）
	let c1 = hire.month;
	let c2 = hire.day;
	if (hire.month === 2 && hire.day === 29) {
		c1 = 3;
		c2 = 1;
	}

	const seg0From: CivilDate = {
		year: leaveYear - cal_syear,
		month: 1,
		day: 1,
	};
	const seg0To: CivilDate = {
		year: leaveYear - cal_eyear,
		month: c1,
		day: c2,
	};
	const seg0 = seniorityParts(seg0From, seg0To);
	const calendar_month_0 = seg0.months;
	const calendar_day_0 = seg0.days;

	let calendar_restday_0 = 0;
	let calendarday_rule_0 = "";

	if (calendar_year === 0) {
		if (
			end_date.getFullYear() - 1911 === 106 &&
			end_date.getMonth() + 1 === 1 &&
			end_date.getDate() === 1
		) {
			calendar_restday_0 = 3 * 12;
			calendarday_rule_0 = "3";
		} else if (calendar_month === 6 && calendar_day === 0) {
			calendar_restday_0 = 3 * 12;
			calendarday_rule_0 = "3";
		} else if (calendar_month >= 6 && (hire.year >= 2017 || calendar_month < 12)) {
			calendar_restday_0 = 3 * (calendar_month_0 + calendar_day_0 / days) * 2;
			calendarday_rule_0 = `(${calendar_month_0} + ${calendar_day_0}/${days} )/6 * 3`;
		} else {
			calendar_restday_0 = 3 * 12;
			calendarday_rule_0 = "3";
		}
	} else {
		const tier = REST_DAYS_BY_COMPLETED_YEARS[indexY] ?? 30;
		calendar_restday_0 = tier * (calendar_month_0 + calendar_day_0 / days);
		calendarday_rule_0 = `(${calendar_month_0} + ${calendar_day_0}/${days} )/12 * ${tier}`;
	}

	days = restDaysMonthLengthForSegment(leaveYear, hire, cal_eyear, 1);

	const seg1From: CivilDate = {
		year: leaveYear - cal_syear + 1,
		month: 1,
		day: 1,
	};
	const seg1To: CivilDate = {
		year: leaveYear - cal_eyear + 1,
		month: c1,
		day: c2,
	};
	const seg1 = seniorityParts(seg1From, seg1To);
	const calendar_month_1 = seg1.months;
	const calendar_day_1 = seg1.days;

	if (indexY > 24) indexY = 24;
	const nextTier = REST_DAYS_BY_COMPLETED_YEARS[indexY + 1] ?? 30;
	let calendar_restday_1 = nextTier * (calendar_month_1 + calendar_day_1 / days);
	const calendarday_rule_1 = ` + (${nextTier} - (${calendar_month_1} + ${calendar_day_1}/${days} )/12 * ${nextTier})`;

	calendar_restday_0 = restDaysRound(calendar_restday_0 / 12);
	calendar_restday_1 = restDaysRound(calendar_restday_1 / 12);
	calendar_restday_1 = restDaysRound(nextTier - calendar_restday_1);

	let calendar_restday_amt = restDaysRound(calendar_restday_0 + calendar_restday_1);

	if (calendar_restday_amt > nextTier && calendar_year > 0) {
		calendar_restday_amt = nextTier;
		calendar_restday_1 = restDaysRound(nextTier - calendar_restday_0);
	}

	let formulaExpression = `計算公式 = ${calendarday_rule_0}${calendarday_rule_1}`;
	let officialDays = calendar_restday_amt;
	const rawDays = calendar_restday_amt;

	// RestDays UI：足年對齊（tenure months/days = 0）時直接顯示整數級距
	if (tenureAtStart.months === 0 && tenureAtStart.days === 0) {
		if (tenureAtStart.years === 0) {
			officialDays = 3;
			formulaExpression = "計算公式 = 3";
		} else {
			officialDays = REST_DAYS_BY_COMPLETED_YEARS[Math.min(tenureAtStart.years, 25)] ?? 30;
			formulaExpression = `計算公式 = ${officialDays}`;
		}
	}

	const formulaLines = buildCalendarFormulaLines(formulaExpression, officialDays);

	return {
		rawDays,
		officialDays,
		display: formatLeaveDisplay(officialDays),
		leaveYear,
		leavePeriod: {
			start: { year: leaveYear, month: 1, day: 1 },
			end: { year: leaveYear, month: 12, day: 31 },
		},
		formulaLines,
		formulaExpression,
		tenureAtYearStart: tenureAtStart,
		segmentDays: { first: calendar_restday_0, second: calendar_restday_1 },
	};
}

function buildCalendarFormulaLines(expression: string, official: number): string[] {
	const body = expression.replace(/^計算公式 = /, "").trim();
	if (body === "3") return ["3 天"];
	if (/^\d+(\.\d+)?$/.test(body)) return [`${formatLeaveDisplay(official)} 天`];
	return [body, `＝ ${formatLeaveDisplay(official)} 天`];
}

export type EvaluateInput = {
	hire: CivilDate;
	asOf: CivilDate;
	leaveSystem: LeaveSystem;
};

/**
 * UI 契約（B2B+）：
 * - 主結果字串 → primaryDisplay
 * - 需要數值 → officialDays
 * - rawDays 僅內部分段／驗證；不得當主結果
 */
export type EvaluateResult =
	| {
			status: "anniversary";
			/** UI 主結果字串 */
			primaryDisplay: string;
			/** 官方／法定數值 */
			officialDays: number;
			/** 驗證用；週年制通常等於 officialDays */
			rawDays: number;
			tenure: Tenure;
			next: AnniversaryResult["next"];
			isMax: boolean;
			formulaLines: string[];
	  }
	| {
			status: "calendar-year";
			/** UI 主結果字串（勿用 rawDays） */
			primaryDisplay: string;
			/** RestDays 對齊數值（勿用 rawDays） */
			officialDays: number;
			/** 內部分段／驗證值；可不等於 officialDays */
			rawDays: number;
			leaveYear: number;
			leavePeriod: CalendarYearResult["leavePeriod"];
			tenureAtYearStart: Tenure;
			formulaLines: string[];
			formulaExpression: string;
			segmentDays: CalendarYearResult["segmentDays"];
	  };

export function evaluateTaiwanAnnualLeave(input: EvaluateInput): EvaluateResult {
	const { hire, asOf, leaveSystem } = input;
	if (leaveSystem === "anniversary") {
		const r = evaluateAnniversary(hire, asOf);
		return {
			status: "anniversary",
			primaryDisplay: r.display,
			officialDays: r.officialDays,
			rawDays: r.rawDays,
			tenure: r.tenure,
			next: r.next,
			isMax: r.isMax,
			formulaLines: r.formulaLines,
		};
	}
	const leaveYear = asOf.year;
	const r = evaluateCalendarYear(hire, leaveYear);
	return {
		status: "calendar-year",
		primaryDisplay: r.display,
		officialDays: r.officialDays,
		rawDays: r.rawDays,
		leaveYear: r.leaveYear,
		leavePeriod: r.leavePeriod,
		tenureAtYearStart: r.tenureAtYearStart,
		formulaLines: r.formulaLines,
		formulaExpression: r.formulaExpression,
		segmentDays: r.segmentDays,
	};
}
