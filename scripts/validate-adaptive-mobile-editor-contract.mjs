#!/usr/bin/env node
/**
 * Adaptive Mobile Editor — formal contract validator（tracked-repo／clean-clone）.
 * Structure／API／forbiddens — not fragile visual pixels.
 * No local-docs／snapshot preference. Protected non-AME surfaces use tracked fixture.
 * Date Calculator adopter checks live in dedicated DC validators（not this foundation gate）.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function ok(cond, label) {
	if (cond) {
		console.log(`  PASS  ${label}`);
		passed += 1;
	} else {
		console.log(`  FAIL  ${label}`);
		failed += 1;
	}
}

function read(rel) {
	return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
	return fs.existsSync(path.join(root, rel));
}

function sha256Buffer(buf) {
	return crypto.createHash("sha256").update(buf).digest("hex");
}

function sha256HeadBlob(rel) {
	try {
		const buf = execFileSync("git", ["show", `HEAD:${rel}`], {
			cwd: root,
			maxBuffer: 32 * 1024 * 1024,
		});
		return sha256Buffer(buf);
	} catch {
		return null;
	}
}

function loadProtectedBaseline() {
	const rel = "scripts/fixtures/adaptive-mobile-editor-protected-baseline.json";
	if (!exists(rel)) {
		ok(false, "Tracked protected baseline fixture exists");
		return null;
	}
	let parsed;
	try {
		parsed = JSON.parse(read(rel));
	} catch {
		ok(false, "Tracked protected baseline fixture is valid JSON");
		return null;
	}
	if (!parsed || typeof parsed !== "object" || !parsed.files || typeof parsed.files !== "object") {
		ok(false, "Tracked protected baseline fixture has files map");
		return null;
	}
	ok(true, "Tracked protected baseline fixture loaded");
	return parsed;
}

console.log("validate-adaptive-mobile-editor-contract\n");

const component = "src/components/tools/shared/AdaptiveMobileEditor.astro";
const controller = "src/scripts/adaptive-mobile-editor-controller.ts";
const numericLib = "src/lib/ameNumericDraft.ts";
const css = "src/styles/tools/adaptive-mobile-editor.css";
const mixedAdapter = "src/scripts/lab/ame-mixed-lab-adapter.ts";
const labBoot = "src/scripts/lab/adaptive-mobile-editor-lab.ts";
const fieldError = "src/components/tools/shared/AmeFieldError.astro";
const labPage = "src/pages/preview/tool-component-lab/adaptive-mobile-editor/index.astro";

ok(exists(component), "Shared shell exists");
ok(exists(controller), "Controller exists");
ok(exists(numericLib), "Numeric helpers exist");
ok(exists(css), "Shared CSS exists");
ok(exists(mixedAdapter), "Lab Mixed adapter exists");
ok(exists(fieldError), "AmeFieldError shared primitive exists");
ok(exists(labPage), "AME Lab route exists");

const compSrc = read(component);
const ctrlSrc = read(controller);
const numericSrc = read(numericLib);
const cssSrc = read(css);
const mixedSrc = read(mixedAdapter);
const bootSrc = read(labBoot);
const labSrc = read(labPage);

/* Single instance／no portal／registry／VV */
ok(!/createPortal|ensurePortal|Registry|__msbLabPending|visualViewport/.test(ctrlSrc + bootSrc + mixedSrc), "No portal／registry／VV in AME runtime");
ok(
	!/createX\(|warm pool|widget registry/i.test(ctrlSrc) && !/schema-driven form/i.test(ctrlSrc),
	"Controller does not implement multi-instance／field DSL",
);
ok((compSrc.match(/data-ame-root/g) || []).length >= 1, "Shell exposes data-ame-root");
ok((compSrc.match(/data-ame-keypad(?!-)/g) || []).filter((m) => m === "data-ame-keypad" || m.startsWith("data-ame-keypad ")).length >= 0, "Keypad host present");
ok(/\bdata-ame-keypad(?:\s|>)/.test(compSrc), "Single keypad host marker");

/* No native numeric keyboard affordances */
ok(!/type="number"|inputmode\s*=\s*["']?(numeric|decimal)/.test(compSrc), "Shell has no native numeric input／inputmode");
ok(!/contenteditable/.test(compSrc + ctrlSrc), "No contenteditable");
ok(/data-ame-numeric-field[\s\S]*type="button"|type="button"[\s\S]*data-ame-numeric-field/.test(compSrc), "Numeric fields remain buttons");
ok(!/role="spinbutton"/.test(compSrc + ctrlSrc), "No spinbutton default");

/* submit vs close */
ok(/submit\s*\(/.test(ctrlSrc) && /submit:\s*\(\)\s*=>\s*boolean/.test(ctrlSrc), "Public API includes submit(): boolean");
ok(/AmeCloseReason\s*=\s*"cancel"\s*\|\s*"escape"\s*\|\s*"api"/.test(ctrlSrc), "close reasons are dismiss-only（no done）");
ok(!/close\(reason[^\)]*done|reason === "done"/.test(ctrlSrc) || /data-ame-close="done"[\s\S]*submit/.test(ctrlSrc), "No close(\"done\") commit path in controller core");
ok(/adapter\.validate/.test(ctrlSrc) && /adapter\.onCommit/.test(ctrlSrc), "submit path uses validate＋onCommit");
ok(/function dismissChrome|dismissChrome\(/.test(ctrlSrc), "Dismiss chrome helper separates UI teardown");
ok(/data-ame-submit/.test(compSrc), "Done controls use data-ame-submit");
ok(!/data-ame-close="done"/.test(compSrc), "Shell Done no longer uses data-ame-close=done");

/* B8.2 lifecycle */
ok(/AmeLifecycle\s*=\s*"submit"\s*\|\s*"live"/.test(ctrlSrc), "Contract：AmeLifecycle submit｜live only");
ok(/lifecycle\?:/.test(ctrlSrc), "Contract：lifecycle is optional adapter field");
ok(
	/adapter\.lifecycle === "live"\s*\?\s*"live"\s*:\s*"submit"/.test(ctrlSrc) ||
		/lifecycle === "live"\s*\?\s*"live"\s*:\s*"submit"/.test(ctrlSrc),
	"Contract：lifecycle defaults to submit",
);
ok(/applyLiveSyncFromDraft/.test(ctrlSrc), "Contract：live sync helper present");
ok(
	/resolveLifecycle\(\)\s*===\s*"live"[\s\S]{0,200}dismissChrome/.test(ctrlSrc) &&
		/live[\s\S]{0,80}do not rollback|no rollback/i.test(ctrlSrc),
	"Contract：live close does not rollback",
);
ok(
	/resolveLifecycle\(\)\s*===\s*"live"[\s\S]{0,300}dismissChrome\("submit"\)/.test(ctrlSrc) &&
		!/resolveLifecycle\(\)\s*===\s*"live"[\s\S]{0,300}adapter\.onCommit/.test(
			ctrlSrc.match(/submit\(\)\s*\{[\s\S]*?\n\t\t\},/)?.[0] ?? "",
		),
	"Contract：live Done dismisses without onCommit",
);
ok(/data-ame-cancel/.test(compSrc), "Contract：Cancel marked data-ame-cancel for live hide");
ok(
	/\[data-ame-root\]\[data-ame-lifecycle="live"\]\s*\[data-ame-cancel\][\s\S]{0,40}display:\s*none/.test(
		cssSrc,
	),
	"Contract：live CSS hides Cancel without removing submit Cancel markup",
);
ok(
	!/date-calculator|dateCalculator|toolSlug|toolName/.test(
		ctrlSrc.match(/function resolveLifecycle[\s\S]*?\n\t\}/)?.[0] ?? "",
	),
	"Contract：no tool-name lifecycle branching",
);
ok(!/createPortal|Registry|multi-instance|visualViewport/.test(ctrlSrc), "Contract：no Portal／Registry／VV in controller");
ok(!/lifecycle:\s*"live"/.test(mixedSrc), "Contract：Lab Mixed stays submit default");

/* Numeric config */
ok(/AmeNumericFieldConfig/.test(ctrlSrc), "AmeNumericFieldConfig type present");
ok(/maxLength/.test(ctrlSrc) && /allowEmpty/.test(ctrlSrc), "Controller references maxLength／allowEmpty");
ok(/AME_MIXED_NUMERIC_FIELDS[\s\S]*maxLength[\s\S]*allowEmpty/.test(mixedSrc), "Lab Mixed numeric configs include maxLength／allowEmpty");
ok(/appendAmeDigit\([\s\S]*maxLength/.test(numericSrc), "appendAmeDigit accepts maxLength");
ok(/normalizeAmeNumericAfterEdit/.test(numericSrc), "allowEmpty normalization helper exists");

/* Adapter hooks */
ok(/getCommitted/.test(ctrlSrc) && /getResetDraft/.test(ctrlSrc), "Adapter getCommitted／getResetDraft");
ok(/validate:/.test(ctrlSrc) && /onCommit:/.test(ctrlSrc), "Adapter validate／onCommit");
ok(/shouldShowReset/.test(ctrlSrc), "Optional shouldShowReset supported");
ok(/createOpenDraft/.test(ctrlSrc), "Optional createOpenDraft supported");
ok(/validateAmeMixedDraft/.test(mixedSrc) && /bindAmeMixedLabInteractions/.test(mixedSrc), "Mixed validation＋bind live in Lab adapter");
ok(/AME_MIXED_RESET_DEFAULTS|cloneAmeMixedDraft/.test(bootSrc) && /validateAmeMixedDraft/.test(bootSrc), "Lab boot wires Mixed adapter");

/* Slots／markers */
ok(/data-ame-content/.test(compSrc), "Content region marker present");
ok(/data-ame-error-region/.test(compSrc) && /data-ame-error/.test(compSrc), "Error region＋data-ame-error present");
ok(/data-ame-reset/.test(compSrc), "Reset markers present");
ok(/data-ame-mixed-stress|data-ame-mixed-panel/.test(compSrc), "Mixed stress fixture retained in Lab default content");
ok(/data-ame-choice-group="direction"/.test(compSrc) && /data-ame-date/.test(compSrc) && /data-ame-select/.test(compSrc), "Mixed stress covers direction／date／select");

/* Landscape AME surface — no Aurora；Full-screen under A∨B presentation triggers（≠ Page composition） */
ok(/--ame-surface:/.test(cssSrc), "AME surface token defined");
ok(
	/@media \(orientation:\s*landscape\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*max-width:\s*1200px\s*\)\s+and\s*\(\s*hover:\s*none\s*\)/.test(
		cssSrc,
	),
	"Mobile Landscape Full-screen gate includes hover: none + max-width 1200",
);
ok(
	/\(\s*max-width:\s*767px\s*\)\s+and\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s+and\s*\(\s*hover:\s*hover\s*\)/.test(
		cssSrc,
	),
	"Constrained Viewport Full-screen gate: max-width 767 + landscape + max-height 700 + hover: hover",
);
{
	const collapsed = cssSrc.replace(/\s+/g, " ");
	ok(
		/@media \(orientation: landscape\) and \(max-height: 700px\) and \(max-width: 1200px\) and \(hover: none\), \(max-width: 767px\) and \(orientation: landscape\) and \(max-height: 700px\) and \(hover: hover\) \{/.test(
			collapsed,
		),
		"Full-screen A∨B share one @media presentation block（comma-OR；no duplicated shell bodies）",
	);
}
ok(
	!/@media\s*\(\s*orientation:\s*landscape\s*\)\s+and\s*\(\s*max-height:\s*700px\s*\)\s*\{/.test(
		cssSrc.replace(/\/\*[\s\S]*?\*\//g, ""),
	),
	"AME CSS must not use bare landscape+700 without max-width／hover for shell",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-shell[\s\S]*background:\s*var\(--ame-surface\)/.test(cssSrc),
	"Landscape shell uses --ame-surface",
);
ok(!/@media \(orientation:\s*landscape\)[\s\S]{0,800}--timiva-bg-aurora/.test(cssSrc), "Landscape CSS does not use Aurora token");
ok(!/@media \(orientation:\s*landscape\)[\s\S]{0,800}bg-slate-950/.test(cssSrc), "Landscape CSS does not use page slate bg class");
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]*overflow-y:\s*auto/.test(
		cssSrc,
	) &&
		/@media \(orientation:\s*landscape\)[\s\S]*\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]*min-height:\s*0/.test(
			cssSrc,
		),
	"Landscape reduced-height: Keypad pane is independent scroll owner",
);
ok(!/visualViewport/.test(cssSrc) && !/visualViewport/.test(ctrlSrc), "Contract: no visualViewport in AME CSS／controller");

/* Decision C — maxLength: number | null */
ok(/maxLength:\s*number\s*\|\s*null/.test(ctrlSrc), "AmeNumericFieldConfig.maxLength is number | null");
ok(
	/maxLength\s*===\s*null|maxLength === null/.test(numericSrc) &&
		/appendAmeDigit[\s\S]*maxLength[\s\S]*null/.test(numericSrc),
	"appendAmeDigit skips digit truncate when maxLength is null",
);
ok(/acceptNumericCandidate\?:/.test(ctrlSrc), "Contract: optional acceptNumericCandidate hook");
ok(
	!/field schema|widget registry|validator DSL/i.test(ctrlSrc),
	"Candidate hook does not expand into schema／registry DSL",
);
ok(
	/AME_MIXED_NUMERIC_FIELDS[\s\S]*maxLength:\s*4/.test(mixedSrc) &&
		!/AME_MIXED_NUMERIC_FIELDS[\s\S]*maxLength:\s*null/.test(mixedSrc),
	"Lab Mixed numeric fields keep explicit numeric maxLength（not null）",
);

/* Formal tools must not import AME yet（DC adopter is a separate checkpoint） */
ok(
	!read("src/components/tools/age-calculator-v2/AgeCalculatorV2.astro").includes("AdaptiveMobileEditor") &&
		!read("src/components/tools/days-between-dates-v2/DaysBetweenDatesV2.astro").includes(
			"AdaptiveMobileEditor",
		) &&
		!read("src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro").includes(
			"AdaptiveMobileEditor",
		) &&
		!read("src/components/tools/countdown-timer-v2/CountdownTimerV2.astro").includes("AdaptiveMobileEditor"),
	"Age／DBD／BDC／Countdown Timer still do not import AdaptiveMobileEditor",
);
ok(!read("src/data/toolsCatalog.ts").includes("adaptive-mobile-editor"), "AME Lab not in toolsCatalog");
ok(/Tool Component Lab · Active/.test(labSrc), "Contract：AME Lab is Active reference");
ok(!labSrc.includes("MobileBottomSheet"), "Contract：AME Lab does not import Legacy MSB component");

/* Protected non-AME／Legacy MSB surfaces — tracked fixture＋HEAD blobs */
const protectedBaseline = loadProtectedBaseline();
if (protectedBaseline) {
	let hashMismatches = 0;
	const entries = Object.entries(protectedBaseline.files);
	ok(entries.length > 0, "Tracked protected baseline lists at least one file");
	for (const [rel, expected] of entries) {
		if (typeof expected !== "string" || !/^[a-f0-9]{64}$/.test(expected)) {
			hashMismatches += 1;
			console.log(`  FAIL  Protected baseline hash malformed: ${rel}`);
			failed += 1;
			continue;
		}
		const actual = sha256HeadBlob(rel);
		if (actual === null) {
			hashMismatches += 1;
			console.log(`  FAIL  Protected missing from HEAD: ${rel}`);
			failed += 1;
			continue;
		}
		if (actual !== expected) {
			hashMismatches += 1;
			console.log(`  FAIL  Protected HEAD hash changed: ${rel}`);
			failed += 1;
		}
	}
	if (hashMismatches === 0) {
		ok(true, "Protected non-AME／Legacy MSB HEAD blobs match tracked baseline");
	}
}

/* —— B8.1 Shared Visual Contract —— */
ok(exists(fieldError), "AmeFieldError shared primitive exists");
ok(/M8 1\.75 14\.25 14\.25H1\.75L8 1\.75z/.test(read(fieldError)), "Shared field-error uses triangle＋! SVG");
ok(/fieldErrors\?:/.test(ctrlSrc), "AmeValidateResult supports optional fieldErrors");
ok(/syncFieldErrors|applyValidateFailure/.test(ctrlSrc), "Controller syncs fieldErrors／applyValidateFailure");
ok(/data-ame-background-scale-target/.test(cssSrc) && /scale\(0\.92\)\s*translateY\(-1\.25rem\)/.test(cssSrc), "Shared Portrait background scale contract");
ok(/orientation:\s*landscape[\s\S]*data-ame-background-scale-target[\s\S]*transform:\s*none/.test(cssSrc), "Shared Landscape：background scale target transform none");
ok(/data-ame-page-content\]:has\(~ \[data-ame-root\]\[data-ame-open="true"\]/.test(cssSrc), "Scale open ownership via data-ame-open sibling（no tool attr）");
ok(/ame-field-error-slot/.test(cssSrc) && /data-ame-field-error/.test(cssSrc), "Shared field-error CSS present");
ok(/AmeFieldError/.test(compSrc) && /fieldId="date"/.test(compSrc), "Shared shell Mixed fixture consumes AmeFieldError");
ok(/data-ame-background-scale-target/.test(labSrc), "AME Lab marks background scale target");

/* Shared shell focus outline */
ok(
	/\.ame-shell:focus-visible[\s\S]{0,80}outline:\s*none/.test(cssSrc),
	"Contract：AME shell focus has no visible outer outline",
);
ok(
	/\.ame-numeric-field:focus-visible/.test(cssSrc) &&
		/outline:\s*2px solid rgb\(165 180 252\)/.test(cssSrc),
	"Contract：interactive focus-visible retained",
);
ok(!/\*:focus\s*\{/.test(cssSrc), "Contract：no global *:focus outline kill");

/* B8.2 Lab remains submit default（DC live adopter checked elsewhere） */
ok(!/lifecycle:\s*"live"/.test(mixedSrc), "Contract：Lab remains submit（re-check）");

console.log(`\nvalidate-adaptive-mobile-editor-contract: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
