export type YearProgressSnapshot = {
	year: number;
	monthIndex: number;
	percent: number;
	daysPassed: number;
	daysRemaining: number;
	totalDays: 365 | 366;
	segmentFills: number[];
};

/** Calendar ordinal: days since Unix epoch using local Y-M-D as UTC calendar date. */
export function localDateOrdinal(
	year: number,
	monthIndex: number,
	day: number,
): number {
	return Math.floor(Date.UTC(year, monthIndex, day) / 86_400_000);
}

export function daysBetweenLocalDates(
	y1: number,
	m1: number,
	d1: number,
	y2: number,
	m2: number,
	d2: number,
): number {
	return localDateOrdinal(y2, m2, d2) - localDateOrdinal(y1, m1, d1);
}

export function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getTotalDaysInYear(year: number): 365 | 366 {
	return isLeapYear(year) ? 366 : 365;
}

export function calculateSegmentFills(now: Date): number[] {
	const year = now.getFullYear();
	const currentMonth = now.getMonth();
	const fills: number[] = [];

	for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
		if (monthIndex < currentMonth) {
			fills.push(1);
		} else if (monthIndex > currentMonth) {
			fills.push(0);
		} else {
			const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
			const monthEnd = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
			const totalMs = monthEnd.getTime() - monthStart.getTime();
			const elapsedMs = now.getTime() - monthStart.getTime();
			const fill =
				totalMs > 0
					? Math.min(1, Math.max(0, elapsedMs / totalMs))
					: 0;
			fills.push(fill);
		}
	}

	return fills;
}

export function calculateYearProgress(now: Date): YearProgressSnapshot {
	const year = now.getFullYear();
	const monthIndex = now.getMonth();
	const day = now.getDate();

	const daysPassed = daysBetweenLocalDates(year, 0, 1, year, monthIndex, day);
	const totalDays = getTotalDaysInYear(year);
	const daysRemaining = totalDays - daysPassed;

	const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
	const nextYearStart = new Date(year + 1, 0, 1, 0, 0, 0, 0);

	let percent = 0;
	if (now.getTime() < nextYearStart.getTime()) {
		const elapsedMs = now.getTime() - yearStart.getTime();
		const totalMs = nextYearStart.getTime() - yearStart.getTime();
		const rawPercent = Math.floor((elapsedMs / totalMs) * 100);
		percent = Math.min(Math.max(rawPercent, 0), 99);
	}

	return {
		year,
		monthIndex,
		percent,
		daysPassed,
		daysRemaining,
		totalDays,
		segmentFills: calculateSegmentFills(now),
	};
}
