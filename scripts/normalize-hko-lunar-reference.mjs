/**
 * Normalize HKO Gregorian–Lunar text tables → independent reference.
 *
 * Source: scripts/fixtures/hko-text/T{YYYY}e.txt (official HKO English tables)
 * Outputs:
 *   scripts/fixtures/hko-lunar-years.json      (year / month / NY anchors)
 *   scripts/fixtures/hko-lunar-daily.jsonl.gz  (one Gregorian day per line, gzip)
 *
 * Does NOT import or read LUNAR_YEAR_PACKED / conversion core.
 * Run: node scripts/normalize-hko-lunar-reference.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeHkoDailyFixture } from "./lib/hko-daily-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TEXT_DIR = path.join(ROOT, "scripts/fixtures/hko-text");
const YEARS_OUT = path.join(ROOT, "scripts/fixtures/hko-lunar-years.json");
const DAILY_GZ = path.join(ROOT, "scripts/fixtures/hko-lunar-daily.jsonl.gz");

const ORDINAL = {
	"1st": 1,
	"2nd": 2,
	"3rd": 3,
	"4th": 4,
	"5th": 5,
	"6th": 6,
	"7th": 7,
	"8th": 8,
	"9th": 9,
	"10th": 10,
	"11th": 11,
	"12th": 12,
};

const WEEKDAYS = new Set([
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
]);

function parseHkoYearText(text) {
	const rows = [];
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trimEnd();
		const m = line.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\S.*)$/);
		if (!m) continue;
		const year = Number(m[1]);
		const month = Number(m[2]);
		const day = Number(m[3]);
		const rest = m[4].trim();
		const parts = rest.split(/\s{2,}|\t+/).map((s) => s.trim()).filter(Boolean);
		let lunarField = parts[0] ?? "";
		if (WEEKDAYS.has(lunarField) || parts.length === 1) {
			const tokens = rest.split(/\s+/);
			const wdIdx = tokens.findIndex((t) => WEEKDAYS.has(t));
			if (wdIdx > 0) lunarField = tokens.slice(0, wdIdx).join(" ");
		}
		rows.push({ year, month, day, lunarField });
	}
	return rows;
}

function parseLunarField(field) {
	const monthStart = field.match(/^(\d{1,2}(?:st|nd|rd|th))\s+Lunar\s+[Mm]onth$/i);
	if (monthStart) {
		const month = ORDINAL[monthStart[1].toLowerCase()];
		if (!month) throw new Error(`unknown ordinal in "${field}"`);
		return { kind: "monthStart", month };
	}
	if (/^\d{1,2}$/.test(field)) {
		return { kind: "day", day: Number(field) };
	}
	return null;
}

function civilKey(y, m, d) {
	return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function utcDayNumber(y, m, d) {
	return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

function fromDayNumber(n) {
	const dt = new Date(n * 86400000);
	return {
		year: dt.getUTCFullYear(),
		month: dt.getUTCMonth() + 1,
		day: dt.getUTCDate(),
	};
}

function main() {
	if (!fs.existsSync(TEXT_DIR)) {
		console.error(`Missing ${TEXT_DIR}. Fetch HKO tables first.`);
		process.exit(1);
	}

	/** @type {{ year: number, month: number, day: number, lunarField: string }[]} */
	const allRows = [];
	/** @type {{ year: number, rowCount: number, missingCivil: string[] }[]} */
	const sourceGaps = [];

	for (let y = 1901; y <= 2100; y += 1) {
		const file = path.join(TEXT_DIR, `T${y}e.txt`);
		if (!fs.existsSync(file)) {
			console.error(`Missing ${file}`);
			process.exit(1);
		}
		const text = fs.readFileSync(file, "latin1");
		const rows = parseHkoYearText(text);
		const expected = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 366 : 365;
		const present = new Set(rows.map((r) => civilKey(r.year, r.month, r.day)));
		const missing = [];
		for (let n = utcDayNumber(y, 1, 1); n <= utcDayNumber(y, 12, 31); n += 1) {
			const c = fromDayNumber(n);
			const k = civilKey(c.year, c.month, c.day);
			if (!present.has(k)) missing.push(k);
		}
		if (missing.length) {
			sourceGaps.push({ year: y, rowCount: rows.length, missingCivil: missing });
			console.warn(
				`HKO source gap T${y}e.txt: rows=${rows.length} expected=${expected} missing=${missing.join(",")}`,
			);
		}
		allRows.push(...rows);
	}

	/**
	 * @type {{
	 *   g: {year:number,month:number,day:number},
	 *   lunarMonth: number,
	 *   lunarYear: number,
	 *   isLeapMonth: boolean,
	 *   partialFromDay?: number,
	 *   syntheticPartial?: boolean
	 * }[]}
	 */
	const monthStarts = [];
	let lunarYear = 1900;
	const seenRegular = new Set();
	let currentMonth = null;
	let currentIsLeap = false;
	let currentDay = null;
	let streamStarted = false;

	/** @type {{ g: string, lunarYear: number, month: number, day: number, isLeapMonth: boolean }[]} */
	const daily = [];

	for (const row of allRows) {
		const parsed = parseLunarField(row.lunarField);
		if (!parsed) {
			console.error(
				`Unparseable lunar field "${row.lunarField}" at ${civilKey(row.year, row.month, row.day)}`,
			);
			process.exit(1);
		}

		if (parsed.kind === "monthStart") {
			const lunarMonth = parsed.month;
			let isLeapMonth = false;

			if (lunarMonth === 1) {
				/*
				 * 正月：
				 * - 本年已見正1、尚未見正2 → 閏正月（極罕見）
				 * - 否則為新農曆年正月（含跨年後再次出現的 1st）
				 */
				if (seenRegular.has(1) && !seenRegular.has(2)) {
					isLeapMonth = true;
				} else {
					lunarYear += 1;
					seenRegular.clear();
					isLeapMonth = false;
					seenRegular.add(1);
				}
			} else if (seenRegular.has(lunarMonth)) {
				isLeapMonth = true;
			} else {
				isLeapMonth = false;
				seenRegular.add(lunarMonth);
			}

			monthStarts.push({
				g: { year: row.year, month: row.month, day: row.day },
				lunarMonth,
				lunarYear,
				isLeapMonth,
			});
			currentMonth = lunarMonth;
			currentIsLeap = isLeapMonth;
			currentDay = 1;
			streamStarted = true;
		} else if (!streamStarted) {
			/* Prefixed days before first labeled month start:
			   1901-01-01 is lunar 1900-11-11. */
			currentMonth = 11;
			currentIsLeap = false;
			currentDay = parsed.day;
			seenRegular.add(11);
			monthStarts.push({
				g: { year: row.year, month: row.month, day: row.day },
				lunarMonth: 11,
				lunarYear: 1900,
				isLeapMonth: false,
				partialFromDay: parsed.day,
				syntheticPartial: true,
			});
			streamStarted = true;
		} else {
			currentDay = parsed.day;
		}

		daily.push({
			g: civilKey(row.year, row.month, row.day),
			lunarYear,
			month: /** @type {number} */ (currentMonth),
			day: /** @type {number} */ (currentDay),
			isLeapMonth: currentIsLeap,
		});
	}

	/*
	 * Fill known HKO source gaps by continuing the lunar day sequence from
	 * adjacent HKO-published rows only.
	 *
	 * Does NOT use LUNAR_YEAR_PACKED or conversion API outputs.
	 * Currently: T2069e.txt omits 2069-12-30 (jumps 12-29 day 16 → 12-31 day 18).
	 */
	const filledFromGaps = [];
	for (const gap of sourceGaps) {
		for (const miss of gap.missingCivil) {
			const [ys, ms, ds] = miss.split("-").map(Number);
			const prevKey = civilKey(...Object.values(fromDayNumber(utcDayNumber(ys, ms, ds) - 1)));
			const prev = daily.find((d) => d.g === prevKey);
			if (!prev) {
				console.error(`Cannot fill gap ${miss}: missing previous day ${prevKey}`);
				process.exit(1);
			}
			const filled = {
				g: miss,
				lunarYear: prev.lunarYear,
				month: prev.month,
				day: prev.day + 1,
				isLeapMonth: prev.isLeapMonth,
				filledFromHkoGap: true,
				fillMethod: "prev-hko-day-plus-one",
				fillEvidence: {
					prevCivil: prevKey,
					prevLunar: {
						year: prev.lunarYear,
						month: prev.month,
						day: prev.day,
						isLeapMonth: prev.isLeapMonth,
					},
				},
			};
			daily.push(filled);
			filledFromGaps.push(filled);
		}
	}
	daily.sort((a, b) => (a.g < b.g ? -1 : a.g > b.g ? 1 : 0));

	/** @type {Record<string, any>} */
	const years = {};

	for (let i = 0; i < monthStarts.length; i += 1) {
		const start = monthStarts[i];
		const next = monthStarts[i + 1];
		const y = start.lunarYear;
		if (!years[y]) {
			years[y] = {
				year: y,
				leapMonth: null,
				months: [],
				newYearCivil: null,
				coverage: "partial",
			};
		}
		const info = years[y];
		if (start.lunarMonth === 1 && !start.isLeapMonth && !start.syntheticPartial) {
			info.newYearCivil = { ...start.g };
		}
		if (start.isLeapMonth) info.leapMonth = start.lunarMonth;

		let days = null;
		let complete = false;
		if (next) {
			const span =
				utcDayNumber(next.g.year, next.g.month, next.g.day) -
				utcDayNumber(start.g.year, start.g.month, start.g.day);
			days = start.syntheticPartial && start.partialFromDay
				? span + (start.partialFromDay - 1)
				: span;
			complete = days === 29 || days === 30;
		}

		info.months.push({
			month: start.lunarMonth,
			isLeapMonth: !!start.isLeapMonth,
			days: complete ? days : null,
			startCivil: { ...start.g },
			complete,
			partialFromDay: start.partialFromDay ?? null,
		});
	}

	for (const info of Object.values(years)) {
		const hasNy = info.newYearCivil !== null;
		const regularCount = info.months.filter((m) => !m.isLeapMonth).length;
		const allComplete = info.months.every((m) => m.complete);
		info.coverage =
			hasNy && regularCount === 12 && allComplete
				? "full"
				: hasNy && regularCount === 12
					? "year-bounded-incomplete-tail"
					: "partial";
	}

	const yearsPayload = {
		provenance: {
			baseline: "Hong Kong Observatory Gregorian-Lunar Calendar Conversion Table",
			indexUrl: "https://www.hko.gov.hk/en/gts/time/conversion1_text.htm",
			filePattern:
				"https://www.hko.gov.hk/en/gts/time/calendar/text/files/T{YYYY}e.txt",
			rawTextCache:
				"scripts/fixtures/hko-text/ (generated; gitignored — fetch via scripts/fetch-hko-lunar-tables.mjs)",
			gregorianFiles: "1901–2100 (200 HKO English text tables)",
			normalizedBy: "scripts/normalize-hko-lunar-reference.mjs",
			dailyArtifact: "scripts/fixtures/hko-lunar-daily.jsonl.gz",
			independence:
				"Built only from HKO text tables; does not read LUNAR_YEAR_PACKED or conversion outputs.",
			evidenceChain: [
				"HKO URL → raw text (fetch-hko-lunar-tables.mjs)",
				"→ normalized reference (normalize-hko-lunar-reference.mjs)",
				"→ packed runtime dataset (lunarDataset.ts)",
				"→ conversion verification (validate-lunar-dataset.mjs, validate-lunar-convert.mjs)",
			],
			note1900: {
				limitation:
					"HKO has no T1900e.txt. Lunar 1900 is boundary sentinel only; public lunar input remains 1901–2099.",
				verified:
					"1901-01-01 → lunar 1900-11-11 verified via HKO T1901e daily rows; months 11–12 lengths derived from month-start spans.",
				residual:
					"Lunar 1900 leap-month index cannot be verified from HKO full-year tables; runtime packed value retained for internal conversion only.",
			},
			note2100:
				"Lunar 2100 NY is in T2100e; final month may be incomplete at Gregorian 2100-12-31.",
			hkoSourceGaps: sourceGaps,
			filledFromGaps: filledFromGaps.map((d) => ({
				civil: d.g,
				method: d.fillMethod,
				evidence: d.fillEvidence,
			})),
			packedCorrections: [
				{ year: 1933, note: "leap-5 29→30; month 6 30→29 (HKO vs classic lunarInfo)" },
				{ year: 2057, note: "months 8/9 lengths swapped (HKO vs classic lunarInfo)" },
				{ year: 2060, note: "months 3/4 lengths swapped (HKO vs classic lunarInfo)" },
			],
		},
		sourceFileCount: 200,
		dailyRowCount: daily.length,
		years,
	};

	fs.writeFileSync(YEARS_OUT, `${JSON.stringify(yearsPayload, null, "\t")}\n`);
	const gzStats = writeHkoDailyFixture(daily);

	const fullYears = Object.values(years).filter((y) => y.coverage === "full").length;
	console.log(`Wrote ${YEARS_OUT}`);
	console.log(
		`Wrote ${DAILY_GZ} (${gzStats.compressedBytes} bytes gzip, ${gzStats.uncompressedBytes} bytes raw)`,
	);
	console.log(`daily rows: ${daily.length}`);
	console.log(`lunar years keyed: ${Object.keys(years).length}`);
	console.log(`full coverage years: ${fullYears}`);
	console.log(`HKO source gaps: ${sourceGaps.length}`);
	console.log(`filled gap days: ${filledFromGaps.length}`);
}

main();
