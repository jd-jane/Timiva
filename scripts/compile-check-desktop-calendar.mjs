/**
 * Phase A compile harness — imports DesktopCalendar once via temporary preview page.
 * Temporary route is removed after build. Not a public product preview.
 * Run: node scripts/compile-check-desktop-calendar.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	DesktopCalendarController,
	SDC_VARIANTS,
	compareCalendarDates,
	getNearbyYearWindow,
	getTodayCalendarDate,
} from "../src/scripts/desktop-calendar-controller.ts";

const root = new URL("..", import.meta.url).pathname;
const tempPageRel = "src/pages/preview/desktop-calendar-compile-check.astro";
const tempPageAbs = join(root, tempPageRel);
const distPage = join(root, "dist/preview/desktop-calendar-compile-check/index.html");

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		passed += 1;
		return;
	}

	failed += 1;
	console.error(`FAIL: ${message}`);
}

console.log("compile-check-desktop-calendar");

assert(
	SDC_VARIANTS.length === 2 &&
		SDC_VARIANTS.includes("inline-large") &&
		SDC_VARIANTS.includes("popover-compact"),
	"exactly two official variants",
);

assert(
	typeof DesktopCalendarController.createDesktopCalendar === "function" &&
		typeof DesktopCalendarController.DesktopCalendarRegistry.register === "function",
	"controller exports createDesktopCalendar and registry",
);

const today = getTodayCalendarDate(new Date("2026-07-23T12:00:00"));
assert(today.year === 2026 && today.month === 7 && today.day === 23, "getTodayCalendarDate");

assert(
	compareCalendarDates({ year: 2020, month: 1, day: 1 }, { year: 2020, month: 1, day: 2 }) < 0,
	"compareCalendarDates orders chronologically",
);

const nearby = getNearbyYearWindow(2000, 1900, 2100, 10);
assert(
	nearby[0] === 1990 && nearby[nearby.length - 1] === 2010 && nearby.length === 21,
	"getNearbyYearWindow radius 10",
);

const controllerSource = readFileSync(
	join(root, "src/scripts/desktop-calendar-controller.ts"),
	"utf8",
);
assert(
	!/bdcv2|drv2|acv2|BusinessDays|DateRangeCalculator|AgeCalculator|age-calculator|business-days-calculator|date-range-calculator/i.test(
		controllerSource,
	),
	"controller has no tool-specific selectors or names",
);

const cssSource = readFileSync(join(root, "src/styles/tools/desktop-calendar.css"), "utf8");
const variantBlocks = [
	...cssSource.matchAll(/data-sdc-variant="([^"]+)"/g),
].map((match) => match[1]);
const uniqueVariants = [...new Set(variantBlocks)];
assert(
	uniqueVariants.length === 2 &&
		uniqueVariants.includes("inline-large") &&
		uniqueVariants.includes("popover-compact"),
	"CSS only references the two official variants",
);
assert(!/!important/.test(cssSource), "CSS does not use !important");
assert(
	!/(^|[^a-zA-Z0-9_-])#[a-zA-Z][a-zA-Z0-9_-]*/.test(cssSource),
	"CSS avoids id selectors",
);

const tempPageSource = `---
import DesktopCalendar from "../../components/tools/shared/DesktopCalendar.astro";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const labels = {
	calendar: "Compile check calendar",
	previousMonth: "Previous month",
	nextMonth: "Next month",
	month: "Month",
	year: "Year",
};
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="robots" content="noindex,nofollow" />
		<title>DesktopCalendar compile check (temporary)</title>
	</head>
	<body>
		<DesktopCalendar
			variant="popover-compact"
			idPrefix="sdc-compact"
			weekdays={weekdays}
			labels={labels}
		/>
		<DesktopCalendar
			variant="inline-large"
			idPrefix="sdc-inline"
			weekdays={weekdays}
			labels={labels}
		/>
	</body>
</html>
`;

writeFileSync(tempPageAbs, tempPageSource, "utf8");
assert(existsSync(tempPageAbs), "temporary compile page written");

try {
	execSync("npm run build", {
		cwd: root,
		stdio: "pipe",
		encoding: "utf8",
	});
	assert(true, "astro build succeeded with DesktopCalendar import");
} catch (error) {
	const output =
		typeof error === "object" && error !== null && "stdout" in error
			? `${error.stdout ?? ""}${error.stderr ?? ""}`
			: String(error);

	console.error(output);
	assert(false, "astro build failed while compiling DesktopCalendar.astro");
} finally {
	if (existsSync(tempPageAbs)) {
		rmSync(tempPageAbs);
	}
}

assert(!existsSync(tempPageAbs), "temporary compile page removed after build");

if (existsSync(distPage)) {
	const html = readFileSync(distPage, "utf8");
	assert(html.includes("data-desktop-calendar"), "built HTML contains DesktopCalendar root hook");
	assert(
		(html.match(/data-desktop-calendar/g) || []).length === 2,
		"built HTML contains two DesktopCalendar roots",
	);
	assert(html.includes('data-sdc-variant="popover-compact"'), "popover-compact variant present");
	assert(html.includes('data-sdc-variant="inline-large"'), "inline-large variant present");
	assert(html.includes("data-sdc-grid"), "day grid hook present");
	assert(html.includes("data-sdc-month-grid"), "month panel hook present");
	assert(html.includes("data-sdc-year-list"), "year list hook present");
	assert(!html.includes("data-sdc-variant=\"standard\""), "no third/legacy variant");
	assert(!html.includes("<select"), "no native select in shared calendar");
} else {
	assert(false, "compile-check dist output exists");
}

assert(!existsSync(join(root, "src/pages/local-fixtures")), "local-fixtures not under src/pages");

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exit(1);
}

console.log("PASS");
