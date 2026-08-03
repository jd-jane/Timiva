#!/usr/bin/env node
/**
 * Legacy regression validator — Shared Mobile Bottom Sheet／D1 Lab（Historical）.
 * Not a new-tool adoption Gate. AME is the scoped canonical Mobile Editor path.
 * Do not delete assertions or rewrite Lab architecture to match AME.
 *
 * Clean-clone safe：protected surfaces use tracked fixture＋git HEAD blobs
 * （scripts/fixtures/adaptive-mobile-editor-protected-baseline.json）.
 * No local-docs／July freeze／Date Calculator snapshot dependency.
 *
 * Run: node scripts/validate-mobile-bottom-sheet-lab.mjs
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		passed += 1;
		console.log(`  PASS  ${message}`);
	} else {
		failed += 1;
		console.error(`  FAIL  ${message}`);
	}
}

function read(rel) {
	return readFileSync(join(ROOT, rel), "utf8");
}

function exists(rel) {
	return existsSync(join(ROOT, rel));
}

function sha256Buffer(buf) {
	return createHash("sha256").update(buf).digest("hex");
}

function sha256HeadBlob(rel) {
	try {
		const buf = execFileSync("git", ["show", `HEAD:${rel}`], {
			cwd: ROOT,
			maxBuffer: 32 * 1024 * 1024,
		});
		return sha256Buffer(buf);
	} catch {
		return null;
	}
}

console.log(
	"validate-mobile-bottom-sheet-lab (legacy regression · Historical · not new-tool adoption Gate)\n",
);

const labPage = "src/pages/preview/tool-component-lab/mobile-bottom-sheet/index.astro";
const labCss = "src/styles/preview/mobile-bottom-sheet-lab.css";
const component = "src/components/tools/shared/MobileBottomSheet.astro";
const controller = "src/scripts/mobile-bottom-sheet-controller.ts";
const labScript = "src/scripts/lab/mobile-bottom-sheet-lab.ts";
const cssPath = "src/styles/tools/tool-mobile-sheet-v2-baseline.css";
const ameLabPage = "src/pages/preview/tool-component-lab/adaptive-mobile-editor/index.astro";
const ameComponent = "src/components/tools/shared/AdaptiveMobileEditor.astro";
const ameController = "src/scripts/adaptive-mobile-editor-controller.ts";
const fixturePath = "scripts/fixtures/adaptive-mobile-editor-protected-baseline.json";

/* Surfaces this Historical gate protects via tracked fixture＋HEAD */
const protectedViaFixture = [
	cssPath,
	"src/components/tools/age-calculator-v2/AgeCalculatorV2.astro",
	"src/components/tools/days-between-dates-v2/DaysBetweenDatesV2.astro",
	"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
	"src/components/tools/countdown-timer-v2/CountdownTimerV2.astro",
	component,
	controller,
	labPage,
	labScript,
	labCss,
];

assert(exists(labPage), "Lab route file exists");
assert(exists(labCss), "Lab CSS exists");
assert(exists(component), "MobileBottomSheet.astro exists");
assert(exists(controller), "mobile-bottom-sheet-controller.ts exists");
assert(exists(labScript), "Lab boot script exists");
assert(exists(cssPath), "Production baseline CSS exists");
assert(exists(fixturePath), "Tracked protected baseline fixture exists");

const labSrc = read(labPage);
const componentSrc = read(component);
const controllerSrc = read(controller);
const labScriptSrc = read(labScript);

function readHeadText(rel) {
	try {
		return execFileSync("git", ["show", `HEAD:${rel}`], {
			cwd: ROOT,
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
		});
	} catch {
		return null;
	}
}

/* Architecture CSS checks use HEAD so dirty parallel edits cannot false-pass／false-fail. */
const cssHead = readHeadText(cssPath);
assert(cssHead !== null, "Production baseline CSS readable from HEAD");

/* --- Lab contract --- */
assert(labSrc.includes('robots="noindex, nofollow"'), "Lab has noindex, nofollow");
assert(
	labSrc.includes('from "../../../../components/tools/shared/MobileBottomSheet.astro"'),
	"Lab imports shared MobileBottomSheet.astro",
);
assert(!labSrc.includes("keyboardPolicy"), "Lab has no keyboardPolicy");
assert(!labSrc.includes('variant="'), "Lab has no geometry variant prop");
assert(!/style\.(top|bottom|height|maxHeight)\s*=/.test(labSrc), "Lab page does not write panel geometry styles");
assert(!labSrc.includes("visualViewport"), "Lab page has no visualViewport listeners");
assert(labSrc.includes("msb-body-actions"), "Lab has body action group for no-footer Close");
/* B9.2A Archive-in-Place labels（descriptive only — does not change D1 contract） */
assert(
	labSrc.includes("msb-lab-archive-banner") && labSrc.includes('data-msb-lab-archive="historical"'),
	"Lab Archive-in-Place banner present",
);
assert(/Legacy|Historical/i.test(labSrc) && /Superseded|superseded/.test(labSrc), "Lab marks Legacy／Historical／Superseded");
assert(
	/Legacy|Historical/i.test(componentSrc) && /Superseded|superseded/.test(componentSrc),
	"Component header marks Legacy／Historical／Superseded",
);
assert(
	/Legacy|Historical/i.test(controllerSrc) && /Superseded|superseded/.test(controllerSrc),
	"Controller header marks Legacy／Historical／Superseded",
);
assert(
	/Legacy|Historical/i.test(labScriptSrc) && /Superseded|superseded/.test(labScriptSrc),
	"Lab boot header marks Legacy／Historical／Superseded",
);
assert(
	labSrc.includes("/preview/tool-component-lab/adaptive-mobile-editor/"),
	"Lab points new adoption toward AME Lab",
);
assert(
	!/http-equiv\s*=\s*["']?refresh/i.test(labSrc) && !/\bAstro\.redirect\b|\bmeta\s+http-equiv/i.test(labSrc),
	"Lab has no redirect machinery",
);
assert(
	labPage === "src/pages/preview/tool-component-lab/mobile-bottom-sheet/index.astro" &&
		exists(labPage),
	"Direct preview Lab route retained",
);

for (const fixtureId of [
	"composition-spike",
	"focus-spike",
	"short",
	"medium",
	"long",
	"keyboard",
	"regions-none",
	"regions-header",
	"regions-footer",
	"regions-both",
]) {
	assert(
		labSrc.includes(`labId="${fixtureId}"`) || labSrc.includes(`data-msb-lab-open="${fixtureId}"`),
		`Fixture present: ${fixtureId}`,
	);
}

assert(labSrc.includes('labId="composition-spike"'), "Composition Spike uses MobileBottomSheet");
assert(labSrc.includes('labId="focus-spike"'), "Focus Spike uses MobileBottomSheet");
assert(labSrc.includes("data-msb-lab-diag"), "Spike diagnostics panel present");
assert(labSrc.includes("Fake Related Tools"), "Lab includes Fake Related Tools");

/* Composition spike: single field, no header/footer props */
const compositionBlock = labSrc.slice(
	labSrc.indexOf('labId="composition-spike"'),
	labSrc.indexOf('labId="focus-spike"'),
);
assert(!compositionBlock.includes("hasHeader"), "Composition Spike has no header");
assert(!compositionBlock.includes("hasFooter"), "Composition Spike has no footer");
assert(!compositionBlock.includes("data-msb-kb-field"), "Composition Spike has no auto-advance fields");

const focusBlock = labSrc.slice(
	labSrc.indexOf('labId="focus-spike"'),
	labSrc.indexOf('labId="short"'),
);
assert(!focusBlock.includes("hasHeader"), "Focus Spike has no header");
assert(!focusBlock.includes("hasFooter"), "Focus Spike has no footer");
assert(!focusBlock.includes("data-msb-kb-field"), "Focus Spike has no auto-advance fields");
assert(
	(focusBlock.match(/data-msb-spike-field/g) || []).length >= 2,
	"Focus Spike has two spike fields",
);

/* --- Component: underlay + VV layer --- */
assert(componentSrc.includes("data-msb-host"), "Component root has data-msb-host");
assert(componentSrc.includes("data-msb-overlay"), "Underlay overlay node present");
assert(componentSrc.includes("data-msb-vv-layer"), "Visual viewport layer node present");
assert(
	componentSrc.indexOf("data-msb-overlay") < componentSrc.indexOf("data-msb-vv-layer"),
	"Underlay precedes VV layer in DOM",
);
assert(
	componentSrc.indexOf("data-msb-vv-layer") < componentSrc.indexOf("data-msb-sheet") ||
		componentSrc.indexOf("data-msb-vv-layer") < componentSrc.indexOf('class="msb-sheet"'),
	"Sheet is nested under VV layer",
);

/* --- Controller --- */
assert(controllerSrc.includes("MobileBottomSheetRegistry"), "Registry is implemented");
assert(controllerSrc.includes("[data-msb-vv-layer]"), "Controller requires VV layer");
assert(
	!/querySelectorAll\([^)]*data-mobile-sheet-baseline/.test(controllerSrc),
	"Controller does not queryAll data-mobile-sheet-baseline for init",
);
assert(
	!/sheet\.style\.(top|bottom|height|maxHeight)\s*=/.test(controllerSrc),
	"Controller does not write sheet.style top/bottom/height/maxHeight",
);
assert(controllerSrc.includes("--msb-vv-height"), "Writes --msb-vv-height");
assert(controllerSrc.includes("--msb-vv-offset-top"), "Writes --msb-vv-offset-top");
assert(
	controllerSrc.includes("Diagnostic") || controllerSrc.includes("diagnostic"),
	"Keyboard inset documented as diagnostic",
);
assert(
	controllerSrc.includes("focusin:internal") || controllerSrc.includes("Internal field transition"),
	"Internal focus transition is a no-op path",
);
const focusInFn = controllerSrc.match(/const onFocusIn =[\s\S]*?\n\t\};/);
assert(Boolean(focusInFn), "focusin handler present");
assert(
	focusInFn ? !/scrollField|stabilizeOwnedScroll|writeGeometry|scrollTo/.test(focusInFn[0]) : false,
	"focusin does not scroll body or rewrite geometry",
);
assert(controllerSrc.includes("scheduleViewportGeometry") || controllerSrc.includes("vvRaf"), "VV geometry coalesced to rAF");
assert(
	!controllerSrc.includes("setTimeout("),
	"Controller has no setTimeout workaround",
);

/* --- Lab boot --- */
assert(labScriptSrc.includes("createMobileBottomSheet"), "Lab boot uses createMobileBottomSheet");
assert(
	!/visualViewport\s*\?\.addEventListener|visualViewport\.addEventListener/.test(labScriptSrc),
	"Lab boot has no visualViewport listeners",
);
assert(labScriptSrc.includes("SPIKE_KEYS"), "Lab knows spike keys");
assert(
	labScriptSrc.includes("!SPIKE_KEYS.has(key)"),
	"Auto-advance gated off spikes",
);

/* --- CSS：committed baseline protected by fixture hash；host architecture via markup／controller ---
 * Phase C `[data-msb-host]` append may exist only as parallel dirty work — this Historical gate
 * does not require uncommitted CSS. When Phase C is present in HEAD, host rules are checked.
 */
const beginMarker = "/* === BEGIN data-msb-host Phase C ===";
const beginIdx = cssHead ? cssHead.indexOf(beginMarker) : -1;
if (beginIdx > 0) {
	const hostBlock = cssHead.slice(beginIdx);
	assert(hostBlock.includes("[data-msb-vv-layer]"), "Host CSS defines VV layer");
	assert(
		!/inset-block-end:\s*var\(--msb-keyboard-inset/.test(hostBlock),
		"Panel keyboard-inset lift removed",
	);
	assert(
		hostBlock.includes("[data-msb-overlay]") || hostBlock.includes("data-msb-overlay"),
		"Underlay overlay rules present",
	);

	const geometryProperty = /(^|[^\w-])(top|bottom|height|max-height)\s*:/i;
	const hostRulesWithoutGate = [];
	for (const block of hostBlock.split("}")) {
		if (!geometryProperty.test(block)) {
			continue;
		}
		if (!block.includes("[data-msb-host]")) {
			hostRulesWithoutGate.push(block.slice(0, 80));
		}
	}
	assert(hostRulesWithoutGate.length === 0, "All host geometry rules include [data-msb-host]");
	assert(!/!important/.test(hostBlock), "Host CSS has no !important");
} else {
	assert(
		cssHead !== null && cssHead.length > 0,
		"Committed production baseline CSS present（Phase C host append not required in HEAD）",
	);
}

/* --- Protected production＋Legacy MSB surfaces（tracked fixture＋HEAD） --- */
let fixture;
try {
	fixture = JSON.parse(read(fixturePath));
} catch {
	fixture = null;
}
assert(Boolean(fixture?.files), "Tracked protected baseline fixture is valid JSON with files map");

let protectedMismatch = 0;
if (fixture?.files) {
	for (const rel of protectedViaFixture) {
		const expected = fixture.files[rel];
		if (typeof expected !== "string" || !/^[a-f0-9]{64}$/.test(expected)) {
			protectedMismatch += 1;
			console.error(`  FAIL  fixture missing／malformed hash: ${rel}`);
			continue;
		}
		const actual = sha256HeadBlob(rel);
		if (actual === null) {
			protectedMismatch += 1;
			console.error(`  FAIL  protected missing from HEAD: ${rel}`);
			continue;
		}
		if (actual !== expected) {
			protectedMismatch += 1;
			console.error(`  FAIL  protected HEAD hash changed: ${rel}`);
		}
	}
}
assert(
	protectedMismatch === 0,
	"Production baseline CSS＋Age／DBD／BDC／CT＋Legacy MSB HEAD blobs match tracked baseline",
);

/* No July freeze／local-docs／Date Calculator formal freeze in protectedViaFixture（above）. */

/* --- AME is active new-tool Mobile Editor foundation --- */
assert(exists(ameComponent), "AME shared shell exists（active foundation）");
assert(exists(ameController), "AME controller exists（active foundation）");
assert(exists(ameLabPage), "AME Lab route exists");
const ameLabSrc = read(ameLabPage);
assert(/Active/i.test(ameLabSrc), "AME Lab is marked Active");
assert(!ameLabSrc.includes("MobileBottomSheet"), "AME Lab does not import Legacy MSB component");
assert(
	!read("src/components/tools/age-calculator-v2/AgeCalculatorV2.astro").includes("AdaptiveMobileEditor") &&
		!read("src/components/tools/days-between-dates-v2/DaysBetweenDatesV2.astro").includes(
			"AdaptiveMobileEditor",
		) &&
		!read(
			"src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro",
		).includes("AdaptiveMobileEditor") &&
		!read("src/components/tools/countdown-timer-v2/CountdownTimerV2.astro").includes(
			"AdaptiveMobileEditor",
		),
	"Age／DBD／BDC／Countdown Timer still do not import AdaptiveMobileEditor",
);

const catalog = read("src/data/toolsCatalog.ts");
assert(!catalog.includes("tool-component-lab"), "Lab not in toolsCatalog");
assert(!read("src/components/Header.astro").includes("tool-component-lab"), "Lab not linked from Header");
assert(!read("src/components/Footer.astro").includes("tool-component-lab"), "Lab not linked from Footer");
assert(read("astro.config.mjs").includes("/preview/"), "Sitemap filter excludes /preview/");

console.log(`\nvalidate-mobile-bottom-sheet-lab: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
