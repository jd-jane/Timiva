/**
 * Gate A compile harness — imports and builds ResultSummary.astro once.
 * Temporary preview route is created only for this check and removed afterward.
 * Covers numeric + textual fixtures in one page.
 * Run: node scripts/compile-check-result-summary.mjs
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	computeRsDigits,
	formatRsDisplayValue,
	ResultSummaryController,
} from "../src/scripts/result-summary-controller.ts";

const root = new URL("..", import.meta.url).pathname;
const tempPageRel = "src/pages/preview/result-summary-compile-check.astro";
const tempPageAbs = join(root, tempPageRel);
const distPage = join(root, "dist/preview/result-summary-compile-check/index.html");

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

console.log("compile-check-result-summary");

assert(
	computeRsDigits([42, 7, 3]) === "1-2" &&
		formatRsDisplayValue(Number.NaN) === "—" &&
		ResultSummaryController.RS_UPDATE_EVENT === "rs:update",
	"controller TypeScript module imports without runtime error",
);

const tempPageSource = `---
import ResultSummary from "../../components/tools/shared/ResultSummary.astro";

const primary = { value: 42, displayValue: "42", label: "Total days" };
const secondary = [
	{ key: "weekdays", value: 30, label: "Weekdays" },
	{ key: "weekends", value: 12, label: "Weekends" },
] as const;

const textualInitial = {
	text: "?",
};
const textualValid = {
	text: "AUG 10, 2026",
	ariaLabel: "August 10, 2026",
};
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="robots" content="noindex,nofollow" />
		<title>ResultSummary compile check (temporary)</title>
	</head>
	<body>
		<section data-compile-numeric>
			<ResultSummary
				layout="desktop"
				variant="standard"
				primary={primary}
				secondary={[secondary[0], secondary[1]]}
				ariaLabel="Compile check numeric summary"
			/>
			<ResultSummary
				layout="desktop"
				variant="spacious"
				primary={primary}
				secondary={[secondary[0], secondary[1]]}
				ariaLabel="Compile check numeric spacious"
			/>
		</section>

		<section data-compile-textual-initial>
			<ResultSummary
				content="textual"
				layout="desktop"
				variant="standard"
				primary={textualInitial}
				weekday={null}
				support="Enter a start date, then add or subtract a time period."
				ariaLabel="Compile check textual initial"
			/>
		</section>

		<section data-compile-textual-valid>
			<ResultSummary
				content="textual"
				layout="landscape"
				variant="standard"
				primary={textualValid}
				weekday="Monday"
				support="Add 3 weeks to Jul 12, 2026."
				ariaLabel="Compile check textual valid"
			/>
		</section>
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
	assert(true, "astro build succeeded with ResultSummary import");
} catch (error) {
	const output =
		typeof error === "object" && error !== null && "stdout" in error
			? `${error.stdout ?? ""}${error.stderr ?? ""}`
			: String(error);

	console.error(output);
	assert(false, "astro build failed while compiling ResultSummary.astro");
} finally {
	if (existsSync(tempPageAbs)) {
		rmSync(tempPageAbs);
	}
}

assert(!existsSync(tempPageAbs), "temporary compile page removed after build");

if (existsSync(distPage)) {
	const html = readFileSync(distPage, "utf8");
	assert(html.includes("data-result-summary"), "built HTML contains ResultSummary root hook");
	assert(html.includes('data-rs-content="numeric"'), "numeric SSR emits data-rs-content=numeric");
	assert(html.includes('data-rs-content="textual"'), "textual SSR emits data-rs-content=textual");
	assert(html.includes("data-rs-digits"), "numeric SSR contains data-rs-digits");
	assert(html.includes("Total days"), "built HTML contains SSR numeric labels");

	const textualChunks = [...html.matchAll(/data-rs-content="textual"[\s\S]*?<\/section>/g)].map(
		(m) => m[0],
	);
	assert(textualChunks.length >= 2, "at least two textual ResultSummary roots built");

	for (const chunk of textualChunks) {
		assert(!chunk.includes("data-rs-digits"), "textual SSR root has no data-rs-digits");
		assert(!chunk.includes("rs-secondary"), "textual SSR has no rs-secondary");
		assert(chunk.includes("data-rs-weekday"), "textual SSR has weekday hook");
		assert(chunk.includes("data-rs-support"), "textual SSR has support hook");
	}

	const initialChunk =
		textualChunks.find((chunk) => chunk.includes("Enter a start date")) ?? "";
	assert(initialChunk.length > 0, "textual initial fixture present");
	assert(
		/data-rs-weekday[^>]*\bhidden\b/.test(initialChunk) ||
			/<div[^>]*data-rs-weekday[^>]*hidden/.test(initialChunk),
		"textual initial weekday is hidden",
	);

	const validChunk =
		textualChunks.find((chunk) => chunk.includes("AUG 10, 2026")) ?? "";
	assert(validChunk.length > 0, "textual valid fixture present");
	assert(validChunk.includes('data-rs-layout="landscape"'), "textual valid uses landscape layout");
	assert(validChunk.includes("Monday"), "textual valid weekday visible text");
} else {
	assert(false, "compile-check dist output exists");
}

assert(!existsSync(join(root, "src/pages/local-fixtures")), "local-fixtures not under src/pages");
assert(
	!readFileSync(join(root, "astro.config.mjs"), "utf8").includes("local-fixtures"),
	"astro config does not reference local-fixtures",
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exit(1);
}

console.log("PASS");
