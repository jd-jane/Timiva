/**
 * Date Calculator B2.5 Direction＋Duration + Near-fullscreen Sheet duration wiring.
 * Exercises the shared controller and checks production wiring.
 * Run: node scripts/validate-date-calculator-duration.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	createDurationController,
	DEFAULT_DIRECTION,
	DURATION_UNITS,
	isDirection,
	isValidDurationInput,
	normalizeDurationDigits,
} from "../src/lib/dateCalculatorDuration.ts";
import {
	calculateDate,
	DATE_CALCULATOR_MAX,
	DATE_CALCULATOR_MIN,
	isValidSupportedStartDate,
} from "../src/lib/dateCalculatorMath.ts";
import { parseCivilIso } from "../src/lib/dateCalculatorFormat.ts";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(rootDir, path), "utf8");

const astro = read(
	"src/components/tools/date-calculator-v2/DateCalculatorV2.astro",
);
const script = read("src/scripts/date-calculator.ts");
const lib = read("src/lib/dateCalculatorDuration.ts");
const css = read("src/styles/tools/date-calculator-v2.css");
const packageJson = read("package.json");

const stripComments = (source) =>
	source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const executableScript = stripComments(script);
const executableLib = stripComments(lib);

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

console.log("validate-date-calculator-duration");

// Defaults
assert(DEFAULT_DIRECTION === "add", "default direction is add");
{
	const controller = createDurationController();
	const snapshot = controller.getSnapshot();
	assert(snapshot.direction === "add", "initial snapshot direction is add");
	assert(
		DURATION_UNITS.every((unit) => snapshot.units[unit].status === "empty"),
		"all units start empty",
	);
	assert(
		DURATION_UNITS.every((unit) => snapshot.units[unit].raw === ""),
		"empty units render blank (0 placeholder only)",
	);
	assert(
		snapshot.duration.years === 0 &&
			snapshot.duration.months === 0 &&
			snapshot.duration.weeks === 0 &&
			snapshot.duration.days === 0,
		"empty is treated as 0",
	);
	assert(snapshot.hasInvalidUnit === false, "no invalid unit initially");
	controller.destroy();
}

// Direction switching + single shared state
{
	const controller = createDurationController();
	const seen = [];
	const unsubscribe = controller.subscribe((snapshot) =>
		seen.push(snapshot.direction),
	);
	controller.setDirection("subtract");
	assert(
		controller.getSnapshot().direction === "subtract",
		"setDirection updates shared state",
	);
	assert(seen.at(-1) === "subtract", "subscribers receive direction change");
	controller.setDirection("subtract");
	assert(seen.length === 1, "repeat direction does not re-emit");
	controller.setDirection("add");
	assert(controller.getSnapshot().direction === "add", "direction toggles back");
	unsubscribe();
	controller.setDirection("subtract");
	assert(seen.length === 2, "unsubscribe stops notifications");
	controller.destroy();
}

// Independent units
{
	const controller = createDurationController();
	controller.setDurationUnit("years", "1");
	controller.setDurationUnit("months", "18");
	controller.setDurationUnit("weeks", "0");
	controller.setDurationUnit("days", "365");
	const snapshot = controller.getSnapshot();
	assert(
		snapshot.duration.years === 1 &&
			snapshot.duration.months === 18 &&
			snapshot.duration.weeks === 0 &&
			snapshot.duration.days === 365,
		"four units update independently",
	);
	assert(snapshot.units.weeks.status === "valid", "0 is a valid value");
	assert(
		snapshot.units.months.value === 18,
		"values above natural rollover are kept as typed",
	);

	controller.clearDurationUnit("months");
	const cleared = controller.getSnapshot();
	assert(
		cleared.units.months.status === "empty" && cleared.duration.months === 0,
		"clearDurationUnit resets only that unit to 0",
	);
	assert(
		cleared.duration.years === 1 &&
			cleared.duration.weeks === 0 &&
			cleared.duration.days === 365,
		"clearing one unit does not affect others",
	);
	controller.destroy();
}

// Validation rules
const invalidInputs = [
	"-1",
	"+1",
	"1.5",
	".5",
	"1e3",
	"Infinity",
	"NaN",
	"abc",
	"1 2",
	" 1",
	"1 ",
	"1,000",
	"٣",
	"9007199254740993",
];
for (const raw of invalidInputs) {
	assert(!isValidDurationInput(raw), `rejects invalid input ${JSON.stringify(raw)}`);
}
for (const raw of ["0", "1", "07", "00012", "365", "9007199254740991"]) {
	assert(isValidDurationInput(raw), `accepts ${JSON.stringify(raw)}`);
}
assert(
	!isValidDurationInput(String(Number.MAX_SAFE_INTEGER + 2)),
	"rejects unsafe integer magnitude",
);

// Leading zero normalization
assert(normalizeDurationDigits("00012") === "12", "00012 → 12");
assert(normalizeDurationDigits("000") === "0", "000 → 0");
assert(normalizeDurationDigits("0") === "0", "0 stays 0");
assert(normalizeDurationDigits("120") === "120", "trailing zeros preserved");

{
	const controller = createDurationController();
	controller.setDurationUnit("days", "00012");
	assert(
		controller.getSnapshot().units.days.display === "12" &&
			controller.getSnapshot().units.days.value === 12,
		"leading zeros normalize in snapshot display／value",
	);
	const normalized = controller.normalizeDurationUnit("days");
	assert(
		normalized.units.days.raw === "12",
		"normalizeDurationUnit rewrites raw on blur／Enter",
	);
	controller.destroy();
}

// Invalid handling does not keep stale valid value
{
	const controller = createDurationController();
	controller.setDurationUnit("years", "5");
	controller.setDurationUnit("months", "3");
	controller.setDurationUnit("years", "-2");
	const snapshot = controller.getSnapshot();
	assert(snapshot.units.years.status === "invalid", "invalid input marks unit invalid");
	assert(
		snapshot.units.years.value === 0,
		"invalid unit does not keep previous valid number",
	);
	assert(snapshot.hasInvalidUnit === true, "snapshot flags invalid unit");
	assert(
		snapshot.units.months.status === "valid" && snapshot.duration.months === 3,
		"invalid unit leaves other units untouched",
	);
	controller.setDurationUnit("years", "");
	assert(
		controller.getSnapshot().units.years.status === "empty",
		"clearing an invalid unit returns to empty",
	);
	controller.destroy();
}

// isDirection guard
assert(isDirection("add") && isDirection("subtract"), "direction guard accepts valid values");
assert(
	!isDirection("Add") && !isDirection("") && !isDirection(null) && !isDirection(0),
	"direction guard rejects invalid values",
);

// reset／destroy lifecycle
{
	const controller = createDurationController();
	controller.setDirection("subtract");
	controller.setDurationUnit("weeks", "9");
	const reset = controller.reset();
	assert(
		reset.direction === "add" &&
			DURATION_UNITS.every((unit) => reset.units[unit].status === "empty"),
		"reset restores default direction and empty units",
	);

	let afterDestroy = 0;
	controller.subscribe(() => {
		afterDestroy += 1;
	});
	controller.destroy();
	controller.setDirection("subtract");
	controller.setDurationUnit("days", "4");
	assert(afterDestroy === 0, "destroy stops notifications");
	assert(
		controller.getSnapshot().direction === "add" &&
			controller.getSnapshot().units.days.status === "empty",
		"destroyed controller ignores mutations",
	);
}

// Production wiring — Desktop duration／direction＋AME mobile（B8）
assert(
	/data-dcv2-direction="add"/.test(astro) &&
		/data-dcv2-direction="subtract"/.test(astro),
	"desktop direction hooks exist",
);
assert(
	/data-dcv2-ame-direction="add"/.test(astro) &&
		/data-dcv2-ame-direction="subtract"/.test(astro),
	"AME direction radios exist",
);
assert(
	/dcv2-ame-direction-track/.test(astro) || /dcv2-ame-direction/.test(astro),
	"AME compact direction track present",
);
assert(
	/data-dcv2-duration-input=\{field\.key\}/.test(astro) &&
		(/data-ame-numeric-field=\{field\.key\}/.test(astro) ||
			/data-ame-numeric-field=/.test(astro)),
	"desktop duration inputs＋AME numeric fields expose unit hooks",
);
assert(
	/createDurationController\(\)/.test(script) &&
		(script.match(/createDurationController\(/g) ?? []).length === 1,
	"script creates exactly one duration controller",
);
assert(
	/\[data-dcv2-direction\]/.test(script) && !/data-dcv2-sheet-direction/.test(script),
	"desktop direction buttons bind the shared controller（no legacy sheet hooks）",
);
assert(
	/\[data-dcv2-duration-input\]/.test(script) && !/data-dcv2-sheet-duration-input/.test(script),
	"desktop duration inputs bind the shared controller（no legacy sheet hooks）",
);
assert(
	/controller\.setDirection\(value\)/.test(script) &&
		/acceptDcAmeNumericCandidate\(draft, unit, candidate\)/.test(script) &&
		/controller\.setDurationUnit\(unit, candidate\)/.test(script),
	"Desktop duration input uses AME candidate guard before setDurationUnit",
);
assert(
	/candidate\.length === 0[\s\S]{0,120}setDurationUnit\(unit, ""\)/.test(script) ||
		/candidate\.length === 0[\s\S]{0,160}setDurationUnit\(unit, ""\)/.test(script),
	"Empty candidate（Delete／Clear）always writes through",
);
assert(
	/input\.value = priorRaw/.test(script),
	"Rejected candidate restores prior raw（no clamp）",
);
assert(
	/data-dcv2-duration-invalid=\{field\.key\}/.test(astro) ||
		/data-dcv2-duration-invalid=/.test(astro),
	"Desktop duration fields expose invalid／overflow ! icon hooks",
);
assert(
	/syncDesktopDurationOverflow/.test(script) &&
		/data-dcv2-duration-invalid/.test(script) &&
		/data-dcv2-duration-overflow/.test(script),
	"Overflow／invalid path syncs ! icon＋aria-invalid",
);
assert(
	/controller\.subscribe\(syncDom\)/.test(script),
	"all layouts re-render from one subscription",
);
assert(
	/document\.activeElement !== input/.test(script),
	"focused field is not overwritten (caret／IME safe)",
);
assert(
	/classList\.toggle\("is-active"/.test(script) &&
		/setAttribute\(\s*"aria-pressed"/.test(script),
	"selected state updates class and ARIA",
);
assert(
	/"aria-invalid"/.test(script) && /data-dcv2-duration-status/.test(script),
	"invalid unit uses existing invalid／ARIA hooks",
);
assert(
	/durationControllers\.has\(root\)/.test(script) &&
		/initializedRoots\.has\(root\)/.test(script),
	"repeated initialization guard",
);
assert(
	/controller\.destroy\(\)/.test(script) && /abort\.abort\(\)/.test(script),
	"destroy lifecycle wired",
);

// Static-only attributes must be gone for wired controls
const desktopDurationBlock = astro.slice(
	astro.indexOf("data-dcv2-duration-input"),
	astro.indexOf("data-dcv2-duration-input") + 400,
);
assert(
	!/\breadonly\b/.test(desktopDurationBlock) &&
		!/tabindex="-1"/.test(desktopDurationBlock),
	"desktop duration inputs are interactive",
);
assert(
	/data-ame-numeric-field=\{field\.key\}/.test(astro) || /type="button"[\s\S]*data-ame-numeric-field/.test(astro),
	"AME duration fields are button Numeric Fields",
);
assert(
	!/data-dcv2-direction="add"[\s\S]{0,120}tabindex="-1"/.test(astro),
	"direction buttons are focusable",
);
assert(
	/data-dcv2-reset/.test(astro) && /initDesktopReset|data-dcv2-reset[\s\S]{0,200}addEventListener/.test(script),
	"Desktop Reset is wired（B8）",
);

// Near-fullscreen／AME：無 K1 keyboard／VV runtime
assert(
	!/syncSheetForKeyboard|scheduleKeyboardSync|syncSheetDurationMode|endKeyboardSession|visualViewport|scrollIntoView/.test(
		executableScript,
	),
	"near-fullscreen: no K1 keyboard／disabled／VV／scrollIntoView runtime",
);
assert(
	!/restoreSheetOpenWithoutKeyboard|focusSheetInputWithoutScroll|lockedKeyboardInset|keyboardCloseTimer|keyboardSyncTimer/.test(
		executableScript,
	),
	"does not restore K13～K19 failed patch symbols",
);
assert(
	/initDirectionAndDuration/.test(script) &&
		/\[data-dcv2-duration-input\]/.test(script) &&
		/input\.value = unitSnapshot\.raw/.test(script),
	"duration controller still syncs Desktop display values",
);
assert(
	!/input\.disabled\s*=/.test(executableScript) &&
		!/setAttribute\(\s*"aria-disabled"/.test(executableScript),
	"Desktop duration stay interactive（no disabled runtime）",
);
assert(
	/document\.activeElement !== input/.test(script),
	"syncDom does not overwrite the active duration input",
);

// Scope guards — duration lib stays pure；script may wire B8 calculateDate／ResultSummary
assert(/calculateDate/.test(executableScript), "script wires calculateDate（B8 live／AME Done）");
assert(!/calculateDate/.test(executableLib), "duration lib does not call calculateDate");
assert(
	/rs:update|content:\s*"textual"/.test(executableScript),
	"script updates ResultSummary via textual rs:update",
);
assert(
	!/document|window|HTMLElement/.test(executableLib),
	"duration lib stays DOM-free",
);
assert(
	/data-dcv2-reset[\s\S]{0,200}addEventListener/.test(executableScript) ||
		/initDesktopReset/.test(executableScript),
	"Desktop Reset runtime is wired（B8）",
);
assert(
	!/\.sdc(?:-|[\s\[{.:#])/.test(stripComments(css)),
	"tool CSS has no shared calendar overrides",
);
assert(
	/dcv2-direction-option/.test(css) && /dcv2-duration-input/.test(css),
	"approved B1B visual classes still present",
);

const packageData = JSON.parse(packageJson);
const dependencies = {
	...(packageData.dependencies ?? {}),
	...(packageData.devDependencies ?? {}),
};
assert(
	!["jsdom", "date-fns", "luxon", "dayjs"].some((name) => name in dependencies),
	"does not add dependency",
);

for (const path of [
	"src/scripts/age-calculator.ts",
	"src/scripts/business-days-calculator.ts",
	"src/scripts/days-between-dates.ts",
	"src/scripts/desktop-calendar-controller.ts",
]) {
	const source = read(path);
	assert(
		!source.includes("dateCalculatorDuration") &&
			!source.includes("data-dcv2-duration"),
		`${path} untouched by B2.5`,
	);
}

/* --- Desktop duration range guard（mirror AME acceptDcAmeNumericCandidate） --- */
/** Same math／range gate as acceptDcAmeNumericCandidate；avoids importing adapter（no .ts ext）. */
function probeCandidate(draft, fieldId, candidateValue) {
	if (candidateValue.length === 0) return true;
	if (!/^\d+$/.test(candidateValue)) return false;
	const numeric = Number(candidateValue);
	if (!Number.isSafeInteger(numeric) || numeric < 0) return false;
	const duration = {
		years: Number(fieldId === "years" ? candidateValue : draft.years || "0"),
		months: Number(fieldId === "months" ? candidateValue : draft.months || "0"),
		weeks: Number(fieldId === "weeks" ? candidateValue : draft.weeks || "0"),
		days: Number(fieldId === "days" ? candidateValue : draft.days || "0"),
	};
	const parsedStart = parseCivilIso(draft.startDate);
	const start =
		parsedStart && isValidSupportedStartDate(parsedStart)
			? parsedStart
			: draft.direction === "add"
				? DATE_CALCULATOR_MIN
				: DATE_CALCULATOR_MAX;
	return calculateDate(start, draft.direction, duration).ok;
}

function desktopDraft(partial = {}) {
	return {
		startDate: "2020-01-01",
		direction: "add",
		years: "0",
		months: "0",
		weeks: "0",
		days: "0",
		...partial,
	};
}

assert(
	probeCandidate(desktopDraft(), "years", "180") === true,
	"Desktop guard：years=180 from 2020 add accepted",
);
assert(
	probeCandidate(desktopDraft(), "years", "181") === false,
	"Desktop guard：years=181 from 2020 add rejected（超界）",
);
assert(
	probeCandidate(desktopDraft(), "months", "99999") === false,
	"Desktop guard：huge months rejected",
);
assert(
	probeCandidate(desktopDraft(), "weeks", "999999") === false,
	"Desktop guard：huge weeks rejected",
);
assert(
	probeCandidate(desktopDraft(), "days", "99999999") === false,
	"Desktop guard：huge days rejected",
);
assert(
	probeCandidate(desktopDraft(), "years", "") === true,
	"Desktop guard：empty years（Clear）accepted",
);
assert(
	probeCandidate(desktopDraft({ direction: "subtract" }), "years", "121") === false,
	"Desktop guard：subtract years=121 from 2020 rejected",
);
assert(
	probeCandidate(desktopDraft({ direction: "subtract" }), "years", "120") === true,
	"Desktop guard：subtract years=120 from 2020 accepted（2020−120≥1900）",
);
assert(
	probeCandidate(desktopDraft({ startDate: "" }), "years", "301") === false,
	"Desktop guard：no start — probe MIN／add rejects years=301",
);
assert(
	probeCandidate(desktopDraft({ startDate: "" }), "years", "300") === true,
	"Desktop guard：no start — probe MIN／add accepts years=300",
);
assert(
	probeCandidate(desktopDraft({ years: "10" }), "years", "999999999999999999") === false,
	"Desktop guard：paste beyond safe integer rejected（prior years kept by caller）",
);
assert(
	probeCandidate(desktopDraft(), "days", "12a") === false,
	"Desktop guard：non-digit paste／type rejected",
);

/* Simulate reject-keeps-prior：controller never sees rejected candidate */
{
	const controller = createDurationController();
	controller.setDurationUnit("years", "5");
	const prior = controller.getSnapshot().units.years.raw;
	const draft = desktopDraft({ years: prior });
	const rejected = !probeCandidate(draft, "years", "9999");
	assert(rejected === true, "Simulate：9999 years rejected by guard");
	assert(
		controller.getSnapshot().units.years.raw === "5",
		"Simulate：controller retains prior years=5 when candidate not written",
	);
	controller.setDurationUnit("years", "");
	assert(
		controller.getSnapshot().units.years.status === "empty",
		"Simulate：Clear restores empty",
	);
	controller.destroy();
}

/* Fallback path：non-typing overflow → calculateDate out-of-range＋! icon wiring */
{
	const overflow = calculateDate(
		{ year: 2020, month: 1, day: 1 },
		"add",
		{ years: 181, months: 0, weeks: 0, days: 0 },
	);
	assert(overflow.ok === false && overflow.reason === "out-of-range", "Fallback：out-of-range result");
	assert(overflow.unit === "years", "Fallback：failing unit is years");
	assert(
		/result\.reason === "out-of-range"[\s\S]{0,200}syncDesktopDurationOverflow/.test(script) &&
			/dispatchResultUpdate\(root, "\?"/.test(script) &&
			/data-dcv2-duration-invalid/.test(astro),
		"Fallback：?＋duration ! icon wired for non-typing overflow",
	);
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exitCode = 1;
	console.log("FAIL");
} else {
	console.log("PASS");
}
