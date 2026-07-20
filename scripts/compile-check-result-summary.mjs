/**
 * Gate A compile harness — imports and builds ResultSummary.astro once.
 * Temporary preview route is created only for this check and removed afterward.
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
---

<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="robots" content="noindex,nofollow" />
		<title>ResultSummary compile check (temporary)</title>
	</head>
	<body>
		<ResultSummary
			layout="desktop"
			variant="standard"
			primary={primary}
			secondary={[secondary[0], secondary[1]]}
			ariaLabel="Compile check summary"
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
	assert(true, "astro build succeeded with ResultSummary import");
} catch (error) {
	const output =
		(typeof error === "object" && error !== null && "stdout" in error
			? `${error.stdout ?? ""}${error.stderr ?? ""}`
			: String(error));

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
	assert(html.includes("data-rs-digits"), "built HTML contains SSR bucket attr");
	assert(html.includes("Total days"), "built HTML contains SSR labels");
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
