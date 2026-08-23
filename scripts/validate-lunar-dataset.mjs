/**
 * B2A Full Dataset Verification Gate
 *
 * Independent evidence chain:
 *   HKO official text tables
 *   → scripts/fixtures/hko-lunar-years.json (+ hko-lunar-daily.jsonl.gz)
 *   → runtime packed dataset / conversion core
 *
 * Does NOT rebuild expected values from LUNAR_YEAR_PACKED or gregorianToLunar.
 *
 * Run:
 *   node scripts/normalize-hko-lunar-reference.mjs   # if reference stale
 *   node scripts/validate-lunar-dataset.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HKO_DAILY_GZ, loadHkoDailyFixture } from "./lib/hko-daily-fixture.mjs";
import {
	getLunarYearInfo,
	gregorianToLunar,
	lunarToGregorian,
	LUNAR_PUBLIC_YEAR_MAX,
	LUNAR_PUBLIC_YEAR_MIN,
	LUNAR_DATASET_YEAR_MIN,
	LUNAR_DATASET_YEAR_MAX,
	LUNAR_DATASET_PROVENANCE,
} from "../src/lib/lunar/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const YEARS_PATH = path.join(ROOT, "scripts/fixtures/hko-lunar-years.json");
const DAILY_PATH = HKO_DAILY_GZ;

let passed = 0;
let failed = 0;
/** @type {string[]} */
const mismatches = [];

function assert(cond, msg) {
	if (cond) {
		passed += 1;
		return;
	}
	failed += 1;
	mismatches.push(msg);
	if (mismatches.length <= 40) console.error(`FAIL: ${msg}`);
}

function eq(a, b) {
	return JSON.stringify(a) === JSON.stringify(b);
}

function main() {
	console.log("validate-lunar-dataset — Full Dataset Verification Gate");
	console.log(`runtime provenance: ${LUNAR_DATASET_PROVENANCE.baseline}`);

	if (!fs.existsSync(YEARS_PATH) || !fs.existsSync(DAILY_PATH)) {
		console.error("Missing normalized HKO reference. Run normalize-hko-lunar-reference.mjs first.");
		process.exit(1);
	}

	const ref = JSON.parse(fs.readFileSync(YEARS_PATH, "utf8"));
	const daily = loadHkoDailyFixture();

	assert(ref.sourceFileCount === 200, "reference built from 200 HKO Gregorian year files");
	assert(
		ref.provenance.independence.includes("does not read LUNAR_YEAR_PACKED"),
		"reference declares independence from packed table",
	);

	const years = ref.years;
	const yearKeys = Object.keys(years)
		.map(Number)
		.sort((a, b) => a - b);
	assert(yearKeys[0] === 1900 && yearKeys.at(-1) === 2100, "reference spans lunar 1900–2100");
	assert(yearKeys.length === 201, "201 lunar years in reference");

	let verifiedYears = 0;
	let leapComparisons = 0;
	let monthLengthComparisons = 0;
	let newYearComparisons = 0;

	for (const y of yearKeys) {
		const expected = years[String(y)];
		const actual = getLunarYearInfo(y);
		assert(actual !== null, `runtime has year info for ${y}`);
		if (!actual) continue;

		verifiedYears += 1;

		/* Leap month — skip when HKO coverage is partial and no leap was observed */
		const canCompareLeap =
			expected.coverage === "full" ||
			expected.coverage === "year-bounded-incomplete-tail" ||
			expected.leapMonth !== null;
		if (canCompareLeap) {
			leapComparisons += 1;
			assert(
				actual.leapMonth === expected.leapMonth,
				`leap ${y}: expected ${expected.leapMonth}, got ${actual.leapMonth}`,
			);
		}

		/* New Year anchor（full / year-bounded years） */
		if (expected.newYearCivil) {
			newYearComparisons += 1;
			assert(
				eq(actual.newYearCivil, expected.newYearCivil),
				`NY ${y}: expected ${JSON.stringify(expected.newYearCivil)}, got ${JSON.stringify(actual.newYearCivil)}`,
			);
		}

		/* Month lengths — only complete HKO-derived months */
		for (const em of expected.months) {
			if (!em.complete || em.days === null) continue;
			monthLengthComparisons += 1;
			const am = actual.months.find(
				(m) => m.month === em.month && m.isLeapMonth === em.isLeapMonth,
			);
			assert(!!am, `month present ${y}-${em.month}${em.isLeapMonth ? "L" : ""}`);
			if (am) {
				assert(
					am.days === em.days,
					`days ${y}-${em.month}${em.isLeapMonth ? "L" : ""}: expected ${em.days}, got ${am.days}`,
				);
			}
		}

		/* Full years: month inventory must match（12 regular ± leap） */
		if (expected.coverage === "full") {
			assert(
				actual.months.length === expected.months.length,
				`month count ${y}: expected ${expected.months.length}, got ${actual.months.length}`,
			);
			for (let i = 0; i < expected.months.length; i += 1) {
				const em = expected.months[i];
				const am = actual.months[i];
				assert(
					am && am.month === em.month && am.isLeapMonth === em.isLeapMonth,
					`month order ${y}[${i}]: expected ${em.month}${em.isLeapMonth ? "L" : ""}, got ${
						am ? `${am.month}${am.isLeapMonth ? "L" : ""}` : "missing"
					}`,
				);
			}
		}
	}

	/* —— Sentinel boundaries —— */
	const d19010101 = daily.find((d) => d.g === "1901-01-01");
	assert(!!d19010101, "daily has 1901-01-01");
	assert(
		eq(d19010101, {
			g: "1901-01-01",
			lunarYear: 1900,
			month: 11,
			day: 11,
			isLeapMonth: false,
		}) ||
			(d19010101.lunarYear === 1900 &&
				d19010101.month === 11 &&
				d19010101.day === 11 &&
				d19010101.isLeapMonth === false),
		"HKO ref: 1901-01-01 → lunar 1900-11-11",
	);
	const g2lEdge = gregorianToLunar({ year: 1901, month: 1, day: 1 });
	assert(g2lEdge.ok, "public G→L accepts 1901-01-01");
	if (g2lEdge.ok) {
		assert(
			eq(g2lEdge.value, { year: 1900, month: 11, day: 11, isLeapMonth: false }),
			"runtime G→L 1901-01-01 → 1900-11-11",
		);
	}

	const d21000110 = daily.find((d) => d.g === "2100-01-10");
	assert(
		!!d21000110 &&
			d21000110.lunarYear === 2099 &&
			d21000110.month === 12 &&
			d21000110.day === 1 &&
			!d21000110.isLeapMonth,
		"HKO ref: 2100-01-10 → lunar 2099-12-01",
	);
	const l2gSpill = lunarToGregorian({
		year: 2099,
		month: 12,
		day: 1,
		isLeapMonth: false,
	});
	assert(l2gSpill.ok, "public L→G accepts lunar 2099-12-01");
	if (l2gSpill.ok) {
		assert(
			eq(l2gSpill.value, { year: 2100, month: 1, day: 10 }),
			"runtime L→G 2099-12-01 → 2100-01-10",
		);
	}

	/* Public range must reject G 1900 / 2100 as input years */
	assert(!gregorianToLunar({ year: 1900, month: 1, day: 31 }).ok, "public rejects G 1900");
	assert(!gregorianToLunar({ year: 2100, month: 2, day: 9 }).ok, "public rejects G 2100");
	assert(
		!lunarToGregorian({ year: 1900, month: 11, day: 11, isLeapMonth: false }).ok,
		"public rejects L 1900",
	);
	assert(
		!lunarToGregorian({ year: 2100, month: 1, day: 1, isLeapMonth: false }).ok,
		"public rejects L 2100",
	);
	assert(
		LUNAR_PUBLIC_YEAR_MIN === 1901 && LUNAR_PUBLIC_YEAR_MAX === 2099,
		"public contract 1901–2099",
	);
	assert(
		LUNAR_DATASET_YEAR_MIN === 1900 && LUNAR_DATASET_YEAR_MAX === 2100,
		"dataset sentinel 1900–2100",
	);

	/* —— Exhaustive daily G→L for public Gregorian years 1901–2099 —— */
	let dailyCompared = 0;
	let dailyMismatch = 0;
	for (const row of daily) {
		const gy = Number(row.g.slice(0, 4));
		if (gy < LUNAR_PUBLIC_YEAR_MIN || gy > LUNAR_PUBLIC_YEAR_MAX) continue;
		const [y, m, d] = row.g.split("-").map(Number);
		const r = gregorianToLunar({ year: y, month: m, day: d });
		dailyCompared += 1;
		if (
			!r.ok ||
			r.value.year !== row.lunarYear ||
			r.value.month !== row.month ||
			r.value.day !== row.day ||
			r.value.isLeapMonth !== row.isLeapMonth
		) {
			dailyMismatch += 1;
			if (dailyMismatch <= 20) {
				assert(
					false,
					`daily G→L ${row.g}: expected ${row.lunarYear}-${row.month}-${row.day}${
						row.isLeapMonth ? "L" : ""
					}, got ${r.ok ? JSON.stringify(r.value) : r.code}`,
				);
			}
		} else {
			passed += 1;
		}
	}
	assert(dailyMismatch === 0, `exhaustive daily mismatches: ${dailyMismatch}`);

	/* 2100 Gregorian spill days：public G API 不接受；以 L→G 反查 lunar 2099 段 */
	let spillChecked = 0;
	for (const row of daily) {
		if (!row.g.startsWith("2100-")) continue;
		if (row.lunarYear !== 2099) continue;
		const back = lunarToGregorian({
			year: row.lunarYear,
			month: row.month,
			day: row.day,
			isLeapMonth: row.isLeapMonth,
		});
		spillChecked += 1;
		const [y, m, d] = row.g.split("-").map(Number);
		assert(
			back.ok && eq(back.value, { year: y, month: m, day: d }),
			`2100 spill L→G ${row.lunarYear}-${row.month}-${row.day} → ${row.g}`,
		);
	}

	console.log("\n—— Summary ——");
	console.log(`verified lunar years: ${verifiedYears}`);
	console.log(`leap-month comparisons: ${leapComparisons}`);
	console.log(`month-length comparisons: ${monthLengthComparisons}`);
	console.log(`Lunar New Year anchor comparisons: ${newYearComparisons}`);
	console.log(`exhaustive public G→L days: ${dailyCompared}`);
	console.log(`2100 spill L→G checks: ${spillChecked}`);
	const gapFill =
		(ref.provenance.filledFromGaps || [])
			.map((g) => (typeof g === "string" ? g : g.civil))
			.join(",") || "none";
	console.log(`HKO source gaps filled in reference: ${gapFill}`);
	console.log(`mismatch messages: ${mismatches.length}`);
	console.log(`assert passed: ${passed}, failed: ${failed}`);

	if (failed > 0) {
		console.error("\nB2A Dataset Correctness Gate: MISMATCH");
		process.exit(1);
	}
	console.log("\nB2A Dataset Correctness Gate: PASS");
}

main();
