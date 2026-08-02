#!/usr/bin/env node
/**
 * Adaptive Mobile Editor Lab — canonical Lab validator（tracked-repo／clean-clone）.
 * Structure／selectors／state／forbiddens — avoid fragile visual pixel asserts.
 * No local-docs／snapshot preference. Protected non-AME surfaces use tracked fixture.
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

/** Protected baseline locks committed HEAD blobs（parallel dirty work must not false-fail）. */
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

console.log("validate-adaptive-mobile-editor-lab\n");

const labPage = "src/pages/preview/tool-component-lab/adaptive-mobile-editor/index.astro";
const component = "src/components/tools/shared/AdaptiveMobileEditor.astro";
const controller = "src/scripts/adaptive-mobile-editor-controller.ts";
const labBoot = "src/scripts/lab/adaptive-mobile-editor-lab.ts";
const css = "src/styles/tools/adaptive-mobile-editor.css";
const labCss = "src/styles/preview/adaptive-mobile-editor-lab.css";
const numericLib = "src/lib/ameNumericDraft.ts";
const mixedAdapter = "src/scripts/lab/ame-mixed-lab-adapter.ts";
const fieldError = "src/components/tools/shared/AmeFieldError.astro";

ok(exists(labPage), "Lab route file exists");
ok(exists(component), "AdaptiveMobileEditor.astro exists");
ok(exists(controller), "adaptive-mobile-editor-controller.ts exists");
ok(exists(labBoot), "Lab boot script exists");
ok(exists(css), "adaptive-mobile-editor.css exists");
ok(exists(labCss), "Lab CSS exists");
ok(exists(numericLib), "ameNumericDraft helper exists");
ok(exists(mixedAdapter), "Lab Mixed adapter module exists");
ok(exists(fieldError), "AmeFieldError shared primitive exists");

const labSrc = read(labPage);
const compSrc = read(component);
const ctrlSrc = read(controller);
const bootSrc = read(labBoot);
const cssSrc = read(css);
const labCssSrc = read(labCss);
const numericSrc = read(numericLib);
const mixedSrc = read(mixedAdapter);

ok(/robots="noindex,\s*nofollow"/.test(labSrc), "Lab has noindex, nofollow");
ok(labSrc.includes("AdaptiveMobileEditor"), "Lab imports AdaptiveMobileEditor");
ok(!labSrc.includes("MobileBottomSheet"), "Lab does not import MobileBottomSheet");
ok(!labSrc.includes("mobile-bottom-sheet"), "Lab does not reference msb paths");
ok(/Tool Component Lab · Active/.test(labSrc), "Lab marks Active Mobile Editor reference");
ok(
	/Historical／Superseded|Historical\/Superseded|Historical/.test(labSrc) &&
		/Legacy D1 Shared MSB Lab|Legacy D1/.test(labSrc),
	"Lab notes Legacy MSB Lab is Historical／Superseded（not new-tool foundation）",
);
ok(/Scoped canonical Mobile Editor reference/.test(labSrc), "Lab states scoped canonical Mobile Editor role");
ok(labSrc.includes("data-ame-page-content"), "Lab has [data-ame-page-content]");
ok(labSrc.includes("data-ame-root") || compSrc.includes("data-ame-root"), "Lab tree has [data-ame-root]");
ok(labSrc.includes("disabled"), "Trigger starts disabled");
ok(labSrc.includes('data-ame-trigger-ready="false"'), "Trigger ready flag starts false");
ok(labSrc.includes('import "../../../../scripts/lab/adaptive-mobile-editor-lab"'), "Lab uses eager script import");
ok((labSrc.match(/<AdaptiveMobileEditor[\s>]/g) || []).length === 1, "Single Editor instance on Lab page");

/* Fixtures: Mixed＋Numeric＋Short／Medium／Long */
ok(labSrc.includes('value="mixed"') && labSrc.includes('data-ame-diag-density="mixed"'), "Mixed density option present");
ok(labSrc.includes('value="short"') && labSrc.includes('data-ame-diag-density="short"'), "Short density option present");
ok(labSrc.includes('value="medium"') && labSrc.includes('data-ame-diag-density="medium"'), "Medium density option present");
ok(labSrc.includes('value="long"') && labSrc.includes('data-ame-diag-density="long"'), "Long density option present");
ok(labSrc.includes('value="numeric"') && labSrc.includes('data-ame-diag-density="numeric"'), "Numeric fixture option present");
ok((labSrc.match(/name="ame-diag-density"/g) || []).length === 5, "Exactly five mutually exclusive fixture radios");
ok(
	/data-ame-diag-density="mixed"[\s\S]*checked/.test(labSrc),
	"Mixed fixture is default for B4 Owner Gate",
);
ok(labSrc.includes('data-ame-fixture="short"'), "Short fixture markup present");
ok(labSrc.includes('data-ame-fixture="medium"'), "Medium fixture markup present");
ok(labSrc.includes('data-ame-fixture="long"'), "Long fixture markup present");
ok(labSrc.includes("data-ame-lab-committed-days"), "Lab shows committed days on page");
ok(labSrc.includes("data-ame-lab-committed-summary"), "Lab shows committed Mixed summary");
ok(!/type="(number|tel)"/.test(labSrc), "Lab page has no native number／tel inputs");
ok(!/role="listbox"|aria-controls=.*listbox|contenteditable|role="spinbutton"/.test(labSrc), "Lab has no custom listbox／spinbutton");
ok(!/visualViewport|createPortal|B5 hardening/i.test(labSrc), "Lab page has no VV／portal／B5");

/* B1.1 diag modes retained */
ok(labSrc.includes('value="display"') && labSrc.includes('data-ame-diag-mode="display"'), "Diag mode Display only present");
ok(labSrc.includes('value="lock"') && labSrc.includes('data-ame-diag-mode="lock"'), "Diag mode Scroll lock present");
ok(labSrc.includes('value="inert"') && labSrc.includes('data-ame-diag-mode="inert"'), "Diag mode Inert present");
ok(labSrc.includes('value="full"') && labSrc.includes('data-ame-diag-mode="full"'), "Diag mode Full B1 present");
ok((labSrc.match(/name="ame-diag-mode"/g) || []).length === 4, "Exactly four mutually exclusive mode radios");
ok(labSrc.includes('value="flat"') && labSrc.includes('data-ame-diag-visual="flat"'), "Flat visual option present");
ok(labSrc.includes('value="current"') && labSrc.includes('data-ame-diag-visual="current"'), "Current visual option present");
ok(
	/data-ame-diag-visual="flat"[\s\S]*checked/.test(labSrc),
	"Optimized Flat-equivalent visual is default",
);
ok(labSrc.includes("data-ame-lab-diag-pre"), "On-page timing diagnostics present");

/* Component regions */
ok(compSrc.includes("data-ame-underlay"), "Underlay node present");
ok(compSrc.includes("data-ame-shell"), "Shell node present");
ok(compSrc.includes('role="dialog"'), "Shell is dialog");
ok(compSrc.includes("data-ame-portrait-header"), "Portrait header region present");
ok(compSrc.includes("data-ame-topbar"), "Landscape topbar region present");
ok(compSrc.includes("data-ame-body"), "Body region present");
ok(compSrc.includes("data-ame-workspace") || compSrc.includes("data-ame-layout-stage"), "Workspace／layout stage present");
ok(compSrc.includes("data-ame-layout-main"), "Layout main region present");
ok(compSrc.includes("data-ame-action-row"), "Action row region present");
ok(compSrc.includes('data-ame-close="cancel"'), "Cancel close present");
ok(compSrc.includes('data-ame-close="done"') || compSrc.includes("data-ame-submit"), "Done control present");
ok(
	/data-ame-action-row[\s\S]*data-ame-reset[\s\S]*data-ame-submit/.test(compSrc) &&
		!/data-ame-action-row[\s\S]*data-ame-close="cancel"/.test(compSrc),
	"Portrait action row has Reset left＋Done（submit）right（no Cancel／X）",
);
ok(
	/data-ame-underlay[\s\S]*data-ame-close="cancel"/.test(compSrc),
	"Portrait Cancel is underlay dismiss",
);
ok(
	/data-ame-topbar[\s\S]*data-ame-close="cancel"[\s\S]*data-ame-reset[\s\S]*data-ame-submit/.test(
		compSrc,
	),
	"Landscape topbar has Cancel＋Reset＋Done（submit）",
);
ok(compSrc.includes("data-ame-topbar-leading"), "Landscape topbar leading cluster present");
ok(compSrc.includes('data-ame-keypad-visible="false"'), "Root tracks contextual keypad visibility");
ok(!compSrc.includes("data-msb"), "Component has no data-msb attrs");
ok(!compSrc.includes("msb-"), "Component has no msb- classes");
ok(!/contenteditable|role="spinbutton"|role="listbox"/.test(compSrc), "Component has no contenteditable／spinbutton／custom listbox");
ok(!/type="number"|type="tel"|inputmode=/.test(compSrc), "Component has no native numeric keyboard fields");

/* B3 Numeric Field＋Keypad retained */
ok(
	/data-ame-numeric-panel[\s\S]*<button[^>]*data-ame-numeric-field="days"/.test(compSrc),
	"Numeric fixture panel keeps Days button field",
);
ok((compSrc.match(/(?:^|[^-])data-ame-keypad(?:\s|>)/g) || []).length === 1, "Single Keypad DOM");
ok(compSrc.includes("data-ame-numeric-live") && compSrc.includes('aria-live="polite"'), "Numeric live status present");
ok(
	/data-ame-numeric-live[\s\S]*class="[^"]*ame-sr-only/.test(compSrc) ||
		/class="[^"]*ame-sr-only"[\s\S]*data-ame-numeric-live/.test(compSrc),
	"Numeric live status is visually hidden",
);
for (const d of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
	ok(compSrc.includes(`data-ame-key="${d}"`), `Keypad digit ${d} present`);
}
ok(compSrc.includes('data-ame-key="delete"') && /aria-label="Delete digit"/.test(compSrc), "Delete key present with Delete digit label");
ok(compSrc.includes('data-ame-key="clear"') && /aria-label="Clear"/.test(compSrc), "Clear key present");
ok(
	/data-ame-key="delete"[\s\S]*<svg[\s\S]*aria-hidden="true"/.test(compSrc),
	"Delete key uses an aria-hidden Backspace icon",
);
ok(compSrc.includes("data-ame-key-cluster"), "Delete／Hide utility cluster present");
ok(
	compSrc.includes('data-ame-key="hide"') && /aria-label="Hide numeric keypad"/.test(compSrc),
	"Hide keypad key present with Hide numeric keypad label",
);
ok(!/data-ame-key="hide"[\s\S]{0,300}>\s*[×xX]\s*</.test(compSrc), "Hide key does not use X glyph as label");
ok(/data-ame-key="hide"[\s\S]{0,400}<svg[\s\S]{0,120}width="(?:18|19|20)"/.test(compSrc), "Hide icon is ~18–20px SVG");
ok(
	/data-ame-key="hide"[\s\S]{0,500}d="m7 10 5 5 5-5"/.test(compSrc),
	"Hide icon is a simple downward chevron",
);
ok(
	!/data-ame-key="hide"[\s\S]{0,600}M4 7\.5h16|data-ame-key="hide"[\s\S]{0,600}M4 12h16/.test(compSrc),
	"Hide icon has no keyboard frame／horizontal key lines",
);
ok(numericSrc.includes("AME_NUMERIC_MAX_LEN = 4"), "Numeric max length is 4");
ok(numericSrc.includes("appendAmeDigit") && numericSrc.includes("deleteAmeDigit"), "Digit append／delete helpers exist");
ok(numericSrc.includes("ameAnyNumericFilled"), "ameAnyNumericFilled helper exists");
ok(
	numericSrc.includes('"years"') &&
		numericSrc.includes('"months"') &&
		numericSrc.includes('"weeks"') &&
		numericSrc.includes('"days"'),
	"Numeric field ids include years／months／weeks／days",
);

/* B4 Mixed Controls Stress＋UI Correction */
ok(compSrc.includes("data-ame-mixed-panel") && compSrc.includes("data-ame-mixed-stress"), "Mixed stress panel present");
ok(compSrc.includes('data-ame-choice-group="direction"'), "Direction Setting Group present");
ok(
	compSrc.includes('data-ame-direction="plus"') &&
		compSrc.includes('data-ame-direction="minus"') &&
		compSrc.includes("Add") &&
		compSrc.includes("Subtract"),
	"Direction uses Add／Subtract with ＋／－",
);
ok(/type="radio"[^>]*data-ame-direction|data-ame-direction[^>]*type="radio"/.test(compSrc), "Direction keeps native radio semantics");
ok(compSrc.includes("data-ame-choice-grid") && compSrc.includes("ame-choice-lead"), "Choice options use lead＋grid layout");
ok(compSrc.includes("ame-choice-symbol"), "Direction symbol sits with label text");
ok(/<input[^>]*type="date"[^>]*data-ame-date/.test(compSrc), "Native date input present");
ok(/<select[^>]*data-ame-select/.test(compSrc), "Native select present");
ok(!/role="listbox"/.test(compSrc), "No custom listbox role");
ok(compSrc.includes("data-ame-setting-stack") && compSrc.includes("ame-setting-row"), "Unified Setting Row stack present");
ok(compSrc.includes("data-ame-numeric-group"), "Numeric group for Mixed Y／M／W／D present");
for (const id of ["years", "months", "weeks", "days"]) {
	ok(
		new RegExp(`data-ame-mixed-panel[\\s\\S]*data-ame-numeric-field="${id}"`).test(compSrc) ||
			new RegExp(`data-ame-numeric-group[\\s\\S]*data-ame-numeric-field="${id}"`).test(compSrc),
		`Mixed Numeric Field ${id} present`,
	);
}
ok((compSrc.match(/data-ame-numeric-field=/g) || []).length === 5, "Five Numeric Field buttons（1 Numeric＋4 Mixed）");
ok(compSrc.includes('data-ame-choice-group="priority"'), "Priority Setting Group present");
ok(compSrc.includes('data-ame-choice-group="flags"'), "Flags Setting Group present");
ok(/type="radio"[\s\S]*data-ame-radio/.test(compSrc), "Radio group present");
ok((compSrc.match(/type="checkbox"/g) || []).length >= 3, "At least 3 checkboxes present");
ok(compSrc.includes('data-ame-check="alpha"') && compSrc.includes('data-ame-check="beta"') && compSrc.includes('data-ame-check="gamma"'), "Alpha／Beta／Gamma checkboxes present");
ok(compSrc.includes("data-ame-toggle") && /role="switch"/.test(compSrc), "Toggle switch present");
ok((compSrc.match(/data-ame-reset/g) || []).length >= 2, "Reset present in Portrait action row and Landscape topbar");
ok(
	/data-ame-action-row[\s\S]*data-ame-reset/.test(compSrc) &&
		/data-ame-topbar[\s\S]*data-ame-reset/.test(compSrc) &&
		!/data-ame-choice-group="flags"[\s\S]*data-ame-reset[\s\S]*data-ame-layout-keypad/.test(compSrc),
	"Reset lives in action／topbar（not after Flags inside the form）",
);
ok(
	compSrc.includes("data-ame-error") &&
		/aria-live="polite"/.test(compSrc) &&
		/role="alert"/.test(compSrc),
	"Inline error with aria-live／alert present",
);
ok(!/createPortal|appendChild\(document\.body|visualViewport/.test(compSrc), "Component source has no portal／VV");
ok(
	/data-ame-workspace[\s\S]*data-ame-body[\s\S]*data-ame-layout-keypad/.test(compSrc) ||
		/data-ame-body[\s\S]*data-ame-layout-keypad/.test(compSrc),
	"Keypad docks beside／below Body（not inside Mixed form tail）",
);

ok(ctrlSrc.includes("createAdaptiveMobileEditor"), "Controller exports createAdaptiveMobileEditor");
ok(ctrlSrc.includes("ameNumericDraft") || ctrlSrc.includes("appendAmeDigit"), "Controller uses numeric draft helpers");
ok(ctrlSrc.includes("getCommitted") && ctrlSrc.includes("getDraft"), "Controller exposes getCommitted／getDraft");
ok(ctrlSrc.includes("resetDraft"), "Controller exposes resetDraft");
ok(ctrlSrc.includes("submit") && /adapter\.validate/.test(ctrlSrc), "Controller submit uses adapter.validate");
ok(
	/resolveLifecycle\(\)\s*===\s*"live"|lifecycle === "live"/.test(ctrlSrc) &&
		/adapter\.onCommit/.test(ctrlSrc) &&
		/AmeDismissAfterSubmit|"submit"/.test(ctrlSrc),
	"Done：submit mode commits via validate＋onCommit；live mode dismisses without re-commit",
);
ok(
	/submit\(\)[\s\S]*return false/.test(ctrlSrc) &&
		(/showError\(/.test(ctrlSrc) || /applyValidateFailure\(/.test(ctrlSrc)),
	"Invalid Mixed Done keeps Editor open（submit returns false）",
);
ok(
	/cloneBag\(committed\)|createOpenDraft/.test(ctrlSrc),
	"Cancel／Escape／underlay／open copy via clone／createOpenDraft",
);
ok(/AmeLifecycle\s*=\s*"submit"\s*\|\s*"live"/.test(ctrlSrc), "AmeLifecycle is submit｜live only");
ok(
	/lifecycle\?:/.test(ctrlSrc) && /adapter\.lifecycle === "live"/.test(ctrlSrc),
	"lifecycle is optional adapter opt-in；default submit",
);
ok(
	/applyLiveSyncFromDraft/.test(ctrlSrc) &&
		/resolveLifecycle\(\)\s*!==\s*"live"/.test(ctrlSrc),
	"Live sync helper is gated；submit mode does not live-apply",
);
ok(
	/data-ame-cancel/.test(compSrc) &&
		/\[data-ame-root\]\[data-ame-lifecycle="live"\]\s*\[data-ame-cancel\]/.test(cssSrc),
	"Live adopter can hide Cancel via data-ame-lifecycle；markup Cancel retained for submit",
);
ok(
	!/toolSlug|toolName|date-calculator|dateCalculator/.test(
		ctrlSrc.match(/function resolveLifecycle[\s\S]*?\n\t\}/)?.[0] ??
			ctrlSrc.match(/resolveLifecycle[\s\S]{0,200}/)?.[0] ??
			"",
	),
	"Lifecycle resolve has no tool-name branching",
);
ok(ctrlSrc.includes("[data-ame-reset]") || ctrlSrc.includes("data-ame-reset"), "Controller handles Reset");
ok(
	/resetDraftInternal[\s\S]*isOpen/.test(ctrlSrc) ||
		/data-ame-reset[\s\S]*resetDraftInternal/.test(ctrlSrc),
	"Reset only resets draft while open",
);
ok(ctrlSrc.includes("syncKeypadVisibility") || ctrlSrc.includes("data-ame-keypad-visible"), "Controller syncs contextual keypad visibility");
ok(ctrlSrc.includes("clearActiveField") || /activeField = null/.test(ctrlSrc), "Controller can clear active numeric field");
ok(ctrlSrc.includes("hideKeypadOnly") || /data-ame-key="hide"/.test(ctrlSrc), "Controller supports Hide keypad without clearing draft");
ok(
	/validateAmeMixedDraft|AME_MIXED_NUMERIC_FIELDS/.test(mixedSrc) &&
		/bindAmeMixedLabInteractions/.test(bootSrc),
	"Lab Mixed adapter retained and wired",
);
ok(/data-ame-content/.test(compSrc) && /data-ame-error-region/.test(compSrc), "Shell exposes content＋error regions");
ok(/AmeNumericFieldConfig|maxLength[\s\S]*allowEmpty/.test(ctrlSrc), "Numeric field minimal config in controller");
ok(/maxLength:\s*number\s*\|\s*null/.test(ctrlSrc), "Lab: maxLength type is number | null（Decision C）");
ok(/acceptNumericCandidate\?:/.test(ctrlSrc), "Optional acceptNumericCandidate hook present（minimal）");
ok(
	/acceptNumericCandidate[\s\S]{0,200}return/.test(ctrlSrc) &&
		/appendAmeDigit[\s\S]{0,400}acceptNumericCandidate|acceptNumericCandidate[\s\S]{0,400}appendAmeDigit/.test(
			ctrlSrc,
		),
	"Digit write path consults acceptNumericCandidate before mutate",
);
ok(
	/AME_MIXED_NUMERIC_FIELDS[\s\S]*maxLength:\s*4/.test(mixedSrc) &&
		!/AME_MIXED_NUMERIC_FIELDS[\s\S]*maxLength:\s*null/.test(mixedSrc),
	"Lab Mixed keeps explicit numeric maxLength（not null）",
);
ok(
	/maxLength\s*===\s*null/.test(numericSrc) &&
		/appendAmeDigit[\s\S]{0,400}null/.test(numericSrc),
	"appendAmeDigit supports null＝no digit truncate",
);
ok(/AmeCloseReason\s*=\s*"cancel"\s*\|\s*"escape"\s*\|\s*"api"/.test(ctrlSrc), "close() is dismiss-only");
ok(
	ctrlSrc.includes("keypadDismissed") &&
		/keypadDismissed = true/.test(ctrlSrc) &&
		/keypadDismissed = false/.test(ctrlSrc),
	"Hide dismisses keypad while setActiveField reopens it",
);
{
	const hideFn = (ctrlSrc.match(/function hideKeypadOnly\(\) \{[\s\S]*?\n\t\}/) || [""])[0];
	ok(
		hideFn.includes("keypadDismissed = true") &&
			hideFn.includes("syncKeypadVisibility") &&
			!hideFn.includes("activeField = null") &&
			!hideFn.includes("draft ="),
		"Hide only collapses keypad — does not clear activeField／draft",
	);
}
ok(
	ctrlSrc.includes("ACTIVE_FIELD_SAFE_GAP_PX") ||
		(/getBoundingClientRect/.test(ctrlSrc) && /16/.test(ctrlSrc)),
	"Portrait active-field safe gap uses keypad top geometry（not scrollIntoView nearest alone）",
);
ok(!/scrollIntoView\(\{\s*block:\s*"nearest"/.test(ctrlSrc), "Does not rely only on scrollIntoView(nearest)");
ok(
	/density\(\) === "numeric"[\s\S]*setActiveField\("days"/.test(ctrlSrc) ||
		/density\(\) === "numeric"[\s\S]*setActiveField\('days'/.test(ctrlSrc),
	"Numeric fixture still activates Days on open；Mixed does not force keypad",
);
ok(ctrlSrc.includes('data-ame-key') || ctrlSrc.includes("[data-ame-key]"), "Controller handles keypad keys");
ok(
	mixedSrc.includes("direction") && mixedSrc.includes("unitPreset") && mixedSrc.includes("toggleOn"),
	"Lab Mixed adapter tracks Mixed draft fields",
);
ok(!ctrlSrc.includes("visualViewport"), "Controller has no visualViewport");
ok(!ctrlSrc.includes("appendChild"), "Controller does not portal via appendChild");
ok(!ctrlSrc.includes("document.body.children"), "Controller does not scan body children");
ok(ctrlSrc.includes("data-ame-page-content"), "Controller requires page-content inert target");
ok(ctrlSrc.includes("pageContent.inert"), "Controller toggles pageContent.inert");
ok(ctrlSrc.includes("ame-scroll-lock"), "Controller uses ame-scroll-lock");
ok(ctrlSrc.includes("Escape"), "Escape closes");
ok(ctrlSrc.includes("preventScroll"), "Focus uses preventScroll");
ok(!ctrlSrc.includes("pointerup"), "Controller has no pointerup");
ok(!ctrlSrc.includes("touchend"), "Controller has no touchend");
ok(!ctrlSrc.includes("Registry"), "Controller has no Registry");
ok(!ctrlSrc.includes("__msbLabPending") && !ctrlSrc.includes("LabPending"), "Controller has no pending queue");
ok(!ctrlSrc.includes("setTimeout("), "Controller has no setTimeout workaround");
ok(!/matchMedia|orientationchange/.test(ctrlSrc), "Controller has no orientation lifecycle owner");
ok(!/contenteditable|spinbutton|createElement\("input"\)|inputmode|role="listbox"/.test(ctrlSrc), "Controller creates no native keyboard／listbox fields");

/* Mode responsibility ladder */
ok(ctrlSrc.includes('mode === "display"') || ctrlSrc.includes("AmeDiagMode"), "Controller knows diag modes");
ok(
	ctrlSrc.includes('mode === "lock"') &&
		ctrlSrc.includes('mode === "inert"') &&
		ctrlSrc.includes('mode === "full"'),
	"Controller branches lock／inert／full",
);
ok(
	/if \(mode === "lock" \|\| mode === "inert" \|\| mode === "full"\)[\s\S]*applyScrollLock/.test(ctrlSrc),
	"Scroll lock only for lock／inert／full",
);
ok(
	/if \(mode === "inert" \|\| mode === "full"\)[\s\S]*pageContent\.inert = true/.test(ctrlSrc),
	"Inert only for inert／full",
);
ok(/if \(mode === "full"\)[\s\S]*setActiveField\("days"/.test(ctrlSrc) || /if \(mode === "full"\)[\s\S]*shell\.focus/.test(ctrlSrc), "Focus only for full mode");
ok(
	ctrlSrc.includes("scrollLockAppliedMs") && ctrlSrc.includes("inertAppliedMs") && ctrlSrc.includes("focusCalledMs"),
	"Timing marks for lock／inert／focus present",
);

ok(bootSrc.includes("createAdaptiveMobileEditor"), "Lab boot uses createAdaptiveMobileEditor");
ok(bootSrc.includes('addEventListener("click"'), "Lab boot binds click open");
ok(!bootSrc.includes("pointerup"), "Lab boot has no pointerup open");
ok(!bootSrc.includes("touchend"), "Lab boot has no touchend open");
ok(!bootSrc.includes("visualViewport"), "Lab boot has no visualViewport");
ok(bootSrc.includes("trigger.disabled = false"), "Lab enables trigger after ready");
ok(bootSrc.includes("data-ame-trigger-ready"), "Lab sets trigger ready attr");
ok(bootSrc.includes("readMode") && bootSrc.includes("readVisual"), "Lab reads mode／visual");
ok(bootSrc.includes("readDensity") && bootSrc.includes("applyDensity"), "Lab reads／applies density");
ok(bootSrc.includes('"mixed"') || bootSrc.includes("'mixed'"), "Lab supports Mixed fixture");
ok(bootSrc.includes('"numeric"') || bootSrc.includes("'numeric'"), "Lab supports Numeric fixture");
ok(bootSrc.includes("syncCommittedPage") || bootSrc.includes("data-ame-lab-committed-days"), "Lab syncs committed page value");
ok(bootSrc.includes("syncOrientationAttr"), "Lab syncs orientation attr for diagnostics");
ok(
	bootSrc.includes('setAttribute("data-ame-orientation"') &&
		/const onOrientChange = \(\) => \{[^}]*syncOrientationAttr\(\);[^}]*\}/.test(bootSrc) &&
		!/onOrientChange = \(\) => \{[^}]*(?:\.open\(|\.close\(|\.destroy\()/.test(bootSrc),
	"Orientation change does not open／close／destroy",
);
ok(bootSrc.includes("requestAnimationFrame"), "Lab records rAF timing");
ok(bootSrc.includes("clickReceivedMs") || bootSrc.includes("click received"), "Lab records click timing");
ok(!bootSrc.includes("setTimeout("), "Lab has no setTimeout open delay");
ok(!bootSrc.includes("import("), "Lab has no lazy import");
ok(!/Registry|portal|createPortal|pending/i.test(bootSrc), "Lab has no portal／registry／pending");
ok(!/spinbutton|contenteditable|listbox/i.test(bootSrc), "Lab boot has no spinbutton／listbox path");

/* Shared CSS layout contract */
ok(cssSrc.includes("[data-ame-root]"), "CSS scoped to data-ame-root");
ok(cssSrc.includes("--ame-"), "CSS uses --ame- vars");
ok(!cssSrc.includes("[data-msb"), "CSS has no data-msb selectors");
ok(!cssSrc.includes(".msb-"), "CSS has no .msb- classes");
ok(!cssSrc.includes("--msb-"), "CSS has no --msb- vars");
ok(!cssSrc.includes("!important"), "CSS has no !important");
ok(/\[data-ame-root\][\s\S]*background:\s*transparent/.test(cssSrc), "AME root is transparent");
ok(
	/--ame-underlay-color:\s*rgb\([^)]*\/\s*0\.[0-9]+\)/.test(cssSrc) &&
		/\.ame-underlay[\s\S]*background:\s*var\(--ame-underlay-color\)/.test(cssSrc),
	"Portrait underlay is one semi-transparent solid",
);
ok(
	/--ame-surface:\s*rgb\(/.test(cssSrc) &&
		/\.ame-shell[\s\S]*background:\s*var\(--ame-surface\)/.test(cssSrc),
	"Portrait shell uses opaque AME surface",
);
ok(
	/\.ame-shell[\s\S]*max-height:\s*calc\(100dvh\s*-\s*var\(--ame-top-clearance\)\)/.test(cssSrc),
	"Portrait max-height retains top clearance",
);
ok(!/\.ame-shell[^{]*\{[^}]*min-height\s*:/.test(cssSrc), "Portrait shell has no min-height floor");
ok(
	/\.ame-portrait-header[\s\S]*flex-shrink:\s*0/.test(cssSrc),
	"Portrait header is flex-shrink 0",
);
ok(
	/\.ame-body[\s\S]*flex:\s*1\s+1\s+auto[\s\S]*min-height:\s*0[\s\S]*overflow-y:\s*auto/.test(cssSrc),
	"Body is flex 1 1 auto with min-height 0 and overflow-y auto",
);
ok(
	/\.ame-action-row[\s\S]*flex-shrink:\s*0/.test(cssSrc),
	"Action row is flex-shrink 0",
);
ok(!/\.ame-action-row[^{]*\{[^}]*min-height\s*:/.test(cssSrc), "Action row has no min-height");
ok(
	/\.ame-action-done[\s\S]*width:\s*auto/.test(cssSrc) ||
		/\.ame-action-done[\s\S]*display:\s*inline-flex/.test(cssSrc),
	"Portrait Done is content-width capsule",
);
ok(
	!/\.ame-portrait-header\s*\{[^}]*overflow-y\s*:\s*auto/.test(cssSrc) &&
		!/\.ame-action-row\s*\{[^}]*overflow-y\s*:\s*auto/.test(cssSrc) &&
		!/\.ame-topbar\s*\{[^}]*overflow-y\s*:\s*auto/.test(cssSrc),
	"Header／Action／Topbar are not scroll owners",
);
{
	const landscapeIdx = cssSrc.search(/@media \(orientation:\s*landscape\)/);
	const portraitCss = landscapeIdx >= 0 ? cssSrc.slice(0, landscapeIdx) : cssSrc;
	const landscapeCss = landscapeIdx >= 0 ? cssSrc.slice(landscapeIdx) : "";
	ok(
		(portraitCss.match(/overflow-y:\s*auto/g) || []).length === 1 &&
			/\.ame-body[\s\S]*overflow-y:\s*auto/.test(portraitCss),
		"Portrait: Body is the only overflow-y:auto owner",
	);
	ok(
		/\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]*min-height:\s*0/.test(landscapeCss) &&
			/\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]*overflow-y:\s*auto/.test(landscapeCss) &&
			/\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]*overscroll-behavior:\s*contain/.test(
				landscapeCss,
			) &&
			/\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]*-webkit-overflow-scrolling:\s*touch/.test(
				landscapeCss,
			),
		"Landscape Keypad pane is independent scroll owner（min-height 0／overflow-y auto／overscroll contain／touch）",
	);
	ok(
		!/\[data-ame-keypad-visible="true"\]\s*\.ame-layout-keypad[\s\S]{0,500}overflow:\s*hidden/.test(landscapeCss),
		"Landscape Keypad pane does not clip with overflow:hidden",
	);
	ok(
		/\[data-ame-keypad-visible="true"\]\s*\.ame-keypad[\s\S]*flex:\s*0\s+0\s+auto/.test(landscapeCss) &&
			/\[data-ame-keypad-visible="true"\]\s*\.ame-keypad[\s\S]*height:\s*auto/.test(landscapeCss),
		"Landscape Keypad grid uses natural content height（not forced fill）",
	);
	ok(
		/\.ame-shell[\s\S]*height:\s*100dvh/.test(landscapeCss) &&
			/\.ame-shell[\s\S]*max-height:\s*100dvh/.test(landscapeCss) &&
			/\.ame-shell[\s\S]*overflow:\s*hidden/.test(landscapeCss) &&
			/\.ame-topbar[\s\S]*flex-shrink:\s*0/.test(landscapeCss) &&
			/\.ame-workspace[\s\S]*min-height:\s*0/.test(landscapeCss),
		"Landscape shell is viewport-height constrained；topbar fixed；main min-height 0",
	);
	ok(
		/padding-bottom:\s*max\(1rem,\s*env\(safe-area-inset-bottom/.test(landscapeCss),
		"Landscape Keypad pane keeps safe-area bottom padding",
	);
	ok(!/visualViewport/.test(cssSrc) && !/visualViewport/.test(ctrlSrc), "No visualViewport usage in AME CSS／controller");
}
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-underlay[\s\S]*display:\s*none/.test(cssSrc),
	"Landscape hides underlay",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-shell[\s\S]*inset:\s*0/.test(cssSrc),
	"Landscape shell is full-bleed inset 0",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-shell[\s\S]*background:\s*var\(--ame-surface\)/.test(cssSrc),
	"Portrait and Landscape use the same AME surface token",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-handle[\s\S]*display:\s*none/.test(cssSrc),
	"Landscape hides handle",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-portrait-header[\s\S]*display:\s*none/.test(cssSrc),
	"Landscape hides portrait header",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-action-row[\s\S]*display:\s*none/.test(cssSrc),
	"Landscape hides portrait action row",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-topbar[\s\S]*display:\s*(flex|grid)/.test(cssSrc),
	"Landscape shows Cancel／Title／Done topbar",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*border-radius:\s*0/.test(cssSrc),
	"Landscape has no top radius",
);
ok(/--ame-landscape-inline\s*:/.test(cssSrc), "Shared --ame-landscape-inline token present");
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*grid-template-columns:\s*1fr\s+auto\s+1fr/.test(cssSrc),
	"Landscape title uses absolute-center grid columns",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-topbar-title[\s\S]*justify-self:\s*center/.test(cssSrc),
	"Landscape title is horizontally centered",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*ame-topbar-leading[\s\S]*padding-left:\s*var\(--ame-landscape-inline\)/.test(
		cssSrc,
	) ||
		/@media \(orientation:\s*landscape\)[\s\S]*padding-left:\s*var\(--ame-landscape-inline\)/.test(cssSrc),
	"Landscape Cancel text starts at landscape inline token",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-layout-main[\s\S]*padding-left:\s*var\(--ame-landscape-inline\)/.test(
		cssSrc,
	),
	"Landscape Body inner wrapper uses same inline token",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-body[\s\S]*padding:\s*0/.test(cssSrc),
	"Landscape Body scroll container is full-width（scrollbar at edge）",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-topbar-btn--done[\s\S]*background:\s*var\(--ame-action-primary-bg\)/.test(
		cssSrc,
	),
	"Landscape Done uses Portrait solid capsule language",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*rgb\(255\s+255\s+255\s*\/\s*0\.6[5-9]\)|rgb\(255\s+255\s+255\s*\/\s*0\.7[0-2]\)/.test(
		cssSrc,
	),
	"Landscape Cancel is muted translucent text",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\[data-ame-keypad-visible="true"\][\s\S]*\.ame-layout-keypad[\s\S]*flex:\s*0\s+0/.test(
		cssSrc,
	),
	"Landscape Keypad is a right column when visible（not bottom footer）",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\[data-ame-keypad-visible="true"\][\s\S]*\.ame-workspace[\s\S]*flex-direction:\s*row/.test(
		cssSrc,
	) ||
		/@media \(orientation:\s*landscape\)[\s\S]*\.ame-workspace[\s\S]*flex-direction:\s*row/.test(cssSrc),
	"Landscape uses row layout for form pane＋Keypad when keypad visible",
);
ok(
	/--ame-numeric-label-width:\s*auto/.test(cssSrc) &&
		/--ame-setting-gap:\s*0\.(75|875|1)rem|--ame-numeric-field-gap:\s*0\.(75|875|1)rem/.test(cssSrc) &&
		/\.ame-setting-stack[\s\S]*grid-template-columns:\s*max-content/.test(cssSrc) &&
		/\.ame-setting-row[\s\S]*subgrid/.test(cssSrc),
	"Setting Rows align Label／Value via CSS grid／subgrid／max-content＋fixed gap",
);
ok(
	/--ame-form-stack-gap:\s*0\.5rem/.test(cssSrc) &&
		/\.ame-mixed-grid[\s\S]*gap:\s*var\(--ame-form-stack-gap\)/.test(cssSrc) &&
		/\.ame-setting-stack[\s\S]*row-gap:\s*var\(--ame-form-stack-gap\)/.test(cssSrc),
	"Form stack gap token unifies Mixed grid＋Setting stack（Date→Unit baseline）",
);
ok(
	!/\[data-ame-choice-group="direction"\][\s\S]{0,200}margin-block-end:\s*[^0]/.test(cssSrc) &&
		!/\.ame-setting-group[\s\S]{0,120}margin-block-end:\s*(?!0\b)[^;]+;/.test(cssSrc),
	"No Direction／Choice Group outer margin-block-end specials",
);
ok(
	/\.ame-setting-group-label[\s\S]*position:\s*absolute/.test(cssSrc) &&
		/\.ame-setting-group-label[\s\S]*margin:\s*0/.test(cssSrc),
	"Floating group label／notch does not contribute external Group spacing",
);
ok(
	/\.ame-setting-control[\s\S]*justify-content:\s*flex-start/.test(cssSrc) &&
		/\.ame-numeric-value[\s\S]*text-align:\s*left/.test(cssSrc) &&
		/\.ame-native-control[\s\S]*text-align:\s*left/.test(cssSrc),
	"Setting Row values share a left Value origin（not right／center mix）",
);
ok(
	/\.ame-setting-row--toggle[\s\S]*\.ame-setting-control[\s\S]*justify-content:\s*flex-end/.test(cssSrc),
	"Toggle body stays on the right while sharing Setting Row chrome",
);
ok(
	/\.ame-setting-control[\s\S]*min-width:\s*0/.test(cssSrc) &&
		/\.ame-native-control[\s\S]*min-width:\s*0/.test(cssSrc),
	"Date／Select control area uses min-width 0（no overflow）",
);
ok(
	/\.ame-choice-grid[\s\S]*grid-template-columns:\s*repeat\(2/.test(cssSrc),
	"Choice Groups use multi-column option grids",
);
ok(
	/data-ame-choice-mode="single"[\s\S]*opacity:\s*0/.test(cssSrc) &&
		/content:\s*"✓"/.test(cssSrc),
	"Single-select shows check when selected；hides hollow-circle affordance when idle",
);
ok(cssSrc.includes("ame-key-cluster") && /\.ame-key--cluster[\s\S]*min-height:\s*2\.75rem/.test(cssSrc), "Delete／Hide cluster meets ~44px touch targets");
ok(
	/\.ame-action-reset[\s\S]*background:\s*transparent/.test(cssSrc) &&
		/\.ame-action-reset[\s\S]*border:\s*0/.test(cssSrc),
	"Portrait Reset is muted plain text（no chrome）",
);
ok(
	/\.ame-key--action\s*\{[^}]*(?:border-color:\s*transparent)[^}]*background:\s*transparent/.test(cssSrc),
	"Clear／Delete are borderless transparent secondary actions",
);
ok(
	/@media \(orientation:\s*landscape\)[\s\S]*\.ame-layout-keypad[\s\S]*justify-content:\s*flex-start/.test(
		cssSrc,
	) &&
		/@media \(orientation:\s*landscape\)[\s\S]*\.ame-keypad[\s\S]*align-content:\s*start/.test(cssSrc),
	"Landscape Field and Keypad align at the top",
);
ok(
	(cssSrc.match(/\.ame-key\s*\{[^}]*min-height:\s*2\.75rem/g) || []).length === 1,
	"Portrait／Landscape share one keypad key height",
);
ok(
	/\.ame-layout-keypad[\s\S]*flex-shrink:\s*0/.test(cssSrc),
	"Portrait Keypad dock is flex-shrink 0（does not scroll with Body）",
);
ok(/\.ame-key[\s\S]*min-height:\s*2\.75rem/.test(cssSrc), "Keypad keys meet 44px touch height");
ok(
	/\[data-ame-keypad-visible="true"\][\s\S]*data-ame-layout-keypad|\[data-ame-keypad-visible="true"\][\s\S]*\.ame-layout-keypad/.test(
		cssSrc,
	),
	"Keypad visibility is gated by data-ame-keypad-visible",
);
ok(cssSrc.includes(".ame-mixed-panel") && cssSrc.includes(".ame-error"), "Mixed panel／error styles present");
ok(
	cssSrc.includes(".ame-choice-row") &&
		cssSrc.includes(".ame-toggle") &&
		cssSrc.includes(".ame-action-reset"),
	"Setting Group／choice／toggle／reset styles present",
);
ok(
	/\[data-ame-choice-group="priority"\][\s\S]*align-self:\s*start/.test(cssSrc) &&
		/\[data-ame-choice-group="priority"\][\s\S]*min-block-size:\s*2\.75rem/.test(cssSrc) &&
		/@media \(orientation:\s*landscape\)[\s\S]*\[data-ame-choice-group="priority"\][\s\S]*\.ame-choice-row:has\(input:checked\)[\s\S]*min-block-size:\s*2\.75rem/.test(
			cssSrc,
		),
	"Priority options lock identical block-size for selected／unselected（P→L height contract）",
);
{
	const cssForCompositing = cssSrc
		.replace(/box-shadow:\s*none;?/gi, "")
		.replace(/transition:\s*transform\s+[\d.]+ms\s+ease;?/gi, "");
	ok(
		!/(?:linear-gradient|radial-gradient|backdrop-filter|\bfilter\s*:|\bblur\(|box-shadow|transition\s*:|animation\s*:|timiva-bg-aurora|Aurora)/i.test(
			cssForCompositing,
		),
		"Shared AME CSS has no expensive compositing treatments",
	);
}
ok(!/visualViewport|keyboard|vv-/.test(cssSrc), "Shared CSS has no VV／keyboard inset");
ok(!/offsetWidth|clientWidth|ResizeObserver/.test(cssSrc + bootSrc), "No JS width measurement for label alignment");
ok(
	ctrlSrc.includes("getBoundingClientRect") && !/offsetWidth|clientWidth|ResizeObserver/.test(ctrlSrc),
	"getBoundingClientRect allowed only for active-field／keypad safe-gap scroll",
);

ok(
	/\[data-ame-page-content\]\[inert\][\s\S]*opacity:\s*1[\s\S]*visibility:\s*visible/.test(labCssSrc),
	"Inert page content remains visible",
);
ok(
	!/data-ame-page-content\]\[inert\][^{]*\{[^}]*(?:opacity:\s*0|visibility:\s*hidden|display:\s*none|filter\s*:)/.test(
		labCssSrc,
	),
	"Inert page content is not hidden or filtered",
);
ok(
	labCssSrc.includes('[data-ame-visual="current"]') && !cssSrc.includes('[data-ame-visual="current"]'),
	"Current expensive visual is Lab-only",
);

/* Tracked standards note Active AME path（no local-docs Gate evidence） */
ok(
	exists("docs/standards/mobile-sheet.md") &&
		/Adaptive Mobile Editor|AME/.test(read("docs/standards/mobile-sheet.md")),
	"Tracked mobile-sheet standards reference AME",
);
ok(
	exists("docs/workflow/shared-component-reuse-gate.md") &&
		/Adaptive Mobile Editor|AME/.test(read("docs/workflow/shared-component-reuse-gate.md")),
	"Tracked Reuse Gate references AME",
);

/* —— B5 canonical contract hardening（structure／forbiddens） —— */

ok(labPage.includes("preview/tool-component-lab"), "Lab lives under preview tool-component-lab path");
ok(!/src\/pages\/(en|zh)\//.test(labPage), "Lab is not a formal en／zh route file");
ok(
	!read("src/pages/en/tools/index.astro").includes("adaptive-mobile-editor") &&
		!read("src/pages/zh/tools/index.astro").includes("adaptive-mobile-editor"),
	"Formal tools index pages do not link AME Lab",
);
ok(
	!read("src/components/tools/age-calculator-v2/AgeCalculatorV2.astro").includes("AdaptiveMobileEditor") &&
		!read("src/components/tools/days-between-dates-v2/DaysBetweenDatesV2.astro").includes(
			"AdaptiveMobileEditor",
		) &&
		!read("src/components/tools/business-days-calculator-v2/BusinessDaysCalculatorV2.astro").includes(
			"AdaptiveMobileEditor",
		) &&
		!read("src/components/tools/countdown-timer-v2/CountdownTimerV2.astro").includes("AdaptiveMobileEditor"),
	"Age／DBD／BDC／Countdown Timer do not import AdaptiveMobileEditor",
);
ok((labSrc.match(/<AdaptiveMobileEditor[\s>]/g) || []).length === 1, "Lab hosts exactly one Editor instance");
ok(
	(compSrc.match(/\bdata-ame-keypad(?:\s|=|>)/g) || []).length === 1,
	"Single Keypad host marker（data-ame-keypad）in component",
);
ok(
	!/type="number"|inputmode\s*=\s*["']?(numeric|decimal)/.test(compSrc + labSrc) &&
		!/contenteditable/.test(compSrc + labSrc),
	"No native numeric input／inputmode／contenteditable in Lab＋component",
);
ok(
	!/visualViewport|createPortal|Registry|__msbLabPending/.test(compSrc + ctrlSrc + bootSrc),
	"No VV／portal／registry across AME Lab stack",
);
{
	const orientFn = (bootSrc.match(/const onOrientChange = \(\) => \{[\s\S]*?\n\t\};/) || [""])[0];
	ok(
		bootSrc.includes("syncOrientationAttr") &&
			orientFn.includes("syncOrientationAttr") &&
			!/\.open\(|\.close\(|\.destroy\(/.test(orientFn),
		"Orientation handler is diagnostic-only（no remount／open／close）",
	);
}
ok(
	cssSrc.includes('[data-ame-root][data-ame-density="mixed"]:not([data-ame-keypad-visible="true"]) .ame-mixed-grid'),
	"Landscape full-width Mixed grid when keypad hidden is CSS-owned",
);
ok(
	cssSrc.includes(
		'[data-ame-root][data-ame-keypad-visible="true"] .ame-workspace',
	) && /\[data-ame-keypad-visible="true"\] \.ame-workspace \{[\s\S]*?flex-direction:\s*row/.test(cssSrc),
	"Landscape split pane（form＋keypad）when keypad visible is CSS-owned",
);
ok(
	compSrc.includes('data-ame-choice-group="direction"') &&
		compSrc.includes('data-ame-choice-group="priority"') &&
		compSrc.includes('data-ame-choice-group="flags"') &&
		compSrc.includes("data-ame-setting-stack"),
	"Direction／Priority／Flags＋Setting Row stack markers present",
);
ok(
	ctrlSrc.includes("ACTIVE_FIELD_SAFE_GAP_PX") && ctrlSrc.includes("isKeypadBesideForm"),
	"Portrait safe-gap scroll distinguishes docked vs beside keypad",
);
ok(
	/ameAnyNumericFilled/.test(ctrlSrc + mixedSrc) &&
		/data-ame-error/.test(compSrc) &&
		/data-ame-reset/.test(compSrc),
	"Validation／error／Reset contracts remain wired",
);
ok(
	/\[data-ame-choice-group="priority"\][\s\S]*\.ame-choice-row:has\(input:checked\)[\s\S]*min-block-size:\s*2\.75rem/.test(
		cssSrc,
	),
	"Priority selected state keeps locked option sizing（P→L contract）",
);
ok(
	!/createPortal|__msbLabPending|multi-instance|adopter adapter/.test(ctrlSrc + bootSrc) &&
		!/B6 Hardening/.test(ctrlSrc + bootSrc),
	"No B6 hardening／portal／registry／adopter paths in runtime sources",
);

const catalog = read("src/data/toolsCatalog.ts");
ok(!catalog.includes("adaptive-mobile-editor"), "Lab not in toolsCatalog");

const header = read("src/components/Header.astro");
const footer = exists("src/components/Footer.astro") ? read("src/components/Footer.astro") : "";
ok(!header.includes("adaptive-mobile-editor"), "Lab not linked from Header");
ok(!footer.includes("adaptive-mobile-editor"), "Lab not linked from Footer");

const astroConfig = read("astro.config.mjs");
ok(astroConfig.includes("/preview/"), "Sitemap filter excludes /preview/");

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

ok(/createOpenDraft|cloneBag\(committed\)/.test(ctrlSrc), "Open copies committed → draft via adapter／cloneBag");
ok(ctrlSrc.includes("returnTarget.focus"), "Close returns focus to trigger");
ok(/submit\s*\(|AmeLifecycle|lifecycle\?:/.test(ctrlSrc), "Controller exposes submit／lifecycle contract surface");
ok(/maxLength:\s*number\s*\|\s*null/.test(ctrlSrc), "Controller documents maxLength: number | null");
ok(/acceptNumericCandidate/.test(ctrlSrc), "Controller retains optional numeric candidate hook");

/* —— B8.1 Shared Visual Contract（Lab） —— */
ok(exists(fieldError), "Lab stack：AmeFieldError primitive exists");
ok(
	/AmeFieldError/.test(compSrc) && /fieldId="date"/.test(compSrc),
	"Lab Mixed Date uses shared field-error",
);
ok(
	/fieldId="years"/.test(compSrc) && /fieldId="days"/.test(compSrc),
	"Lab Mixed Numeric Fields use shared field-error",
);
ok(/fieldErrors/.test(mixedSrc), "Lab Mixed validate can return fieldErrors");
ok(/Enter at least one of Years/.test(mixedSrc), "Lab Mixed keeps form-level error message path");
ok(/data-ame-background-scale-target/.test(labSrc), "Lab page marks background scale target");
ok(/scale\(0\.92\)\s*translateY\(-1\.25rem\)/.test(cssSrc), "Shared scale values locked at 0.92／-1.25rem");

/* —— Shared shell focus outline（no sheet-wide ring） —— */
ok(
	/\.ame-shell:focus-visible[\s\S]{0,80}outline:\s*none/.test(cssSrc) &&
		/\.ame-underlay:focus-visible[\s\S]{0,80}outline:\s*none/.test(cssSrc),
	"AME shell／underlay focus：no visible outer outline",
);
ok(
	/\.ame-numeric-field:focus-visible/.test(cssSrc) &&
		/\.ame-native-control:focus-visible/.test(cssSrc) &&
		/\.ame-key:focus-visible/.test(cssSrc) &&
		/outline:\s*2px solid rgb\(165 180 252\)/.test(cssSrc),
	"Interactive controls retain focus-visible outline",
);
ok(!/(^|[^\/])\*:focus\s*\{/.test(cssSrc) && !/\*:focus\s*\{[\s\S]*outline:\s*none/.test(cssSrc), "No global focus outline suppression");
ok(
	/shell\.focus\(\s*\{\s*preventScroll:\s*true/.test(ctrlSrc) &&
		!/activateFirstNumericOnOpen[\s\S]{0,200}data-ame-date|querySelector\([^\)]*date[^\)]*\)\.focus/.test(
			ctrlSrc,
		),
	"Open may focus shell；does not auto-focus native date input",
);

/* —— B8.2 lifecycle mode —— */
ok(!/lifecycle:\s*"live"/.test(mixedSrc), "Lab Mixed does not opt into live（stays submit default）");
ok(
	!/createPortal|ensurePortal|__msbLabPending|visualViewport/.test(ctrlSrc) &&
		!/\bRegistry\b/.test(ctrlSrc),
	"Controller runtime has no Portal／Registry／VV",
);

console.log(`\nvalidate-adaptive-mobile-editor-lab: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
