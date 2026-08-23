/**
 * ToolPageFrame adopter — Primary Entry Capsule shell contract.
 * Run: node scripts/validate-tool-page-frame-adopters.mjs
 *
 * Ensures mobilePrimaryControl adopters opt into shared visual shell;
 * geometry remains validate-tool-page-frame.mjs.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(new URL("..", import.meta.url).pathname);

function read(relPath) {
	return readFileSync(join(root, relPath), "utf8");
}

function walkFiles(dir, matcher, files = []) {
	if (!existsSync(dir)) {
		return files;
	}

	for (const entry of readdirSync(dir)) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			walkFiles(fullPath, matcher, files);
			continue;
		}

		if (matcher(fullPath)) {
			files.push(fullPath);
		}
	}

	return files;
}

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

console.log("validate-tool-page-frame-adopters");

const astroFiles = walkFiles(
	join(root, "src"),
	(fullPath) => fullPath.endsWith(".astro") && !fullPath.endsWith("ToolPageFrame.astro"),
);

const adopters = [];

for (const fullPath of astroFiles) {
	const rel = relative(root, fullPath);
	const source = readFileSync(fullPath, "utf8");
	const usesFrame =
		source.includes("ToolPageFrame") ||
		source.includes("data-tool-page-frame") ||
		source.includes("tool-page-frame.css");

	if (!usesFrame) {
		continue;
	}

	adopters.push(rel);

	const controlTagMatch = source.match(
		/<([a-zA-Z][\w-]*)[^>]*\bslot=["']mobilePrimaryControl["'][^>]*>/,
	);

	assert(controlTagMatch, `${rel} must provide mobilePrimaryControl slot markup`);

	if (!controlTagMatch) {
		continue;
	}

	const tag = controlTagMatch[0];
	const elementName = controlTagMatch[1];

	assert(
		elementName === "button" ||
			elementName === "a" ||
			elementName === "summary" ||
			tag.includes("role="),
		`${rel} mobilePrimaryControl must be an interactive element (button/a/summary or explicit role)`,
	);

	assert(
		/\btool-primary-entry-capsule\b/.test(tag) ||
			/\bclass=["'][^"']*tool-primary-entry-capsule/.test(
				source.slice(controlTagMatch.index, controlTagMatch.index + 800),
			),
		`${rel} mobilePrimaryControl must include tool-primary-entry-capsule`,
	);

	assert(
		!/\btool-utility-control\b/.test(tag),
		`${rel} mobilePrimaryControl must not use tool-utility-control`,
	);

	const controlRegion = source.slice(controlTagMatch.index, controlTagMatch.index + 1200);
	assert(
		!/\btool-utility-control\b/.test(controlRegion.split(">")[0]),
		`${rel} mobilePrimaryControl opening tag must not include tool-utility-control`,
	);
}

if (adopters.length === 0) {
	assert(true, "No ToolPageFrame adopter found (unexpected after Lunar B0)");
} else {
	assert(true, `ToolPageFrame adopters checked: ${adopters.join(", ")}`);
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);

if (failed > 0) {
	process.exitCode = 1;
} else {
	console.log("PASS");
}
