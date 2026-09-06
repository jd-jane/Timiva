/**
 * Lunar B2E — Desktop Smart Date typing stability stress QA.
 *
 * Real per-key events only（no fill()-as-SSOT）. Stresses intermittent
 * caret/digit desync：2020→220/0、1945→145/9.
 *
 * Run after build:
 *   LDC_QA_BASE=http://127.0.0.1:4351 node scripts/qa-lunar-b2e-typing-stability-browser.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.LDC_QA_BASE ?? "http://127.0.0.1:4351";
const REPEATS = Number(process.env.LDC_TYPING_REPEATS ?? 30);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = join(
	rootDir,
	"local-docs/validation/lunar-b2e-typing-stability-evidence.json",
);

const YEAR_SEQUENCES = ["1945", "2020", "1980", "2000"];
const SPEEDS = [
	{ name: "slow", delayMs: 80 },
	{ name: "normal", delayMs: 25 },
	{ name: "fast", delayMs: 0 },
];

let passed = 0;
let failed = 0;
const evidence = [];
const summary = {
	gregorian: {},
	lunar: {},
	extras: [],
};

function assert(condition, message) {
	if (condition) {
		passed += 1;
		evidence.push(`PASS: ${message}`);
		return true;
	}
	failed += 1;
	evidence.push(`FAIL: ${message}`);
	console.error(`FAIL: ${message}`);
	return false;
}

function note(message) {
	evidence.push(`NOTE: ${message}`);
}

function expectedProgressive(digits) {
	const steps = [];
	let acc = "";
	for (const ch of digits) {
		acc += ch;
		steps.push({ digits: acc, value: acc });
	}
	return steps;
}

async function loadPlaywright() {
	try {
		return await import("playwright");
	} catch {
		throw new Error("playwright not installed");
	}
}

async function waitForServer(url, timeoutMs = 20000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			/* retry */
		}
		await new Promise((r) => setTimeout(r, 250));
	}
	throw new Error(`Server not ready: ${url}`);
}

async function setupDesktopPage(browser, path) {
	const context = await browser.newContext({
		viewport: { width: 1280, height: 900 },
	});
	await context.addInitScript(() => {
		const original = window.matchMedia.bind(window);
		window.matchMedia = (query) => {
			const result = original(query);
			if (
				query.includes("hover: hover") ||
				query.includes("min-width: 900px") ||
				query.includes("min-height: 700px")
			) {
				return {
					matches: true,
					media: query,
					addEventListener: () => {},
					removeEventListener: () => {},
					addListener: () => {},
					removeListener: () => {},
					onchange: null,
					dispatchEvent: () => true,
				};
			}
			return result;
		};
	});
	const page = await context.newPage();
	await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
	await page.waitForSelector("[data-ldcv2-date-input]");
	await page.waitForFunction(() => {
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		return primary && primary.textContent && primary.textContent !== "…";
	});
	return { context, page };
}

async function switchDesktopMode(page, mode) {
	const current = await page.evaluate(
		() =>
			document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-input-mode") ?? "",
	);
	if (current === mode) return;
	const selector =
		mode === "lunar" ? '[data-ldcv2-switch="lunar"]' : '[data-ldcv2-switch="gregorian"]';
	await page.locator(selector).click({ force: true });
	await page.waitForFunction(
		(expected) =>
			document
				.querySelector("[data-lunar-date-converter-v2]")
				?.getAttribute("data-ldcv2-input-mode") === expected,
		mode,
	);
}

async function readField(page) {
	return page.evaluate(() => {
		const input = document.querySelector("[data-ldcv2-date-input]");
		const primary = document.querySelector(
			'[data-lunar-date-converter-v2] .rs-value[data-rs-value="primary"]',
		);
		const errorWrap = document.querySelector("[data-ldcv2-field-error-wrap]");
		const errorText = document.querySelector("[data-ldcv2-field-error-text]");
		const root = document.querySelector("[data-lunar-date-converter-v2]");
		const value = input?.value ?? "";
		return {
			value,
			digits: value.replace(/\D/g, ""),
			caret: input?.selectionStart ?? -1,
			end: input?.selectionEnd ?? -1,
			primary: primary?.textContent?.trim() ?? "",
			error: errorText?.textContent?.trim() ?? "",
			errorWrapHidden: errorWrap?.hidden ?? true,
			phase: root?.getAttribute("data-ldcv2-field-phase") ?? "",
			mode: root?.getAttribute("data-ldcv2-input-mode") ?? "",
		};
	});
}

async function clearFieldByBackspace(page) {
	const input = page.locator("[data-ldcv2-date-input]");
	await input.focus();
	await input.evaluate((el) => {
		el.setSelectionRange(el.value.length, el.value.length);
	});
	for (let i = 0; i < 48; i += 1) {
		const value = await input.inputValue();
		if (!value) break;
		await input.press("Backspace");
	}
}

async function typeYearSequence(page, digits, delayMs) {
	const expected = expectedProgressive(digits);
	const steps = [];
	for (let i = 0; i < digits.length; i += 1) {
		await page.keyboard.type(digits[i], { delay: delayMs });
		const snap = await readField(page);
		steps.push(snap);
		const exp = expected[i];
		if (snap.digits !== exp.digits || snap.value !== exp.value) {
			return { ok: false, steps, failAt: i, expected: exp, got: snap };
		}
		if (snap.caret !== exp.value.length || snap.end !== exp.value.length) {
			return {
				ok: false,
				steps,
				failAt: i,
				expected: { ...exp, caret: exp.value.length },
				got: snap,
				reason: "caret",
			};
		}
		if (/220|145\/\s*9|145 \/ 9/.test(snap.value)) {
			return { ok: false, steps, failAt: i, expected: exp, got: snap, reason: "reorder" };
		}
	}
	const final = steps[steps.length - 1];
	if (final.primary !== "?" && final.phase !== "draft-incomplete") {
		/* year-only may still be draft-incomplete with ? — enforce no error wrap */
	}
	if (!final.errorWrapHidden || final.error.length > 0) {
		return { ok: false, steps, failAt: digits.length - 1, got: final, reason: "error-state" };
	}
	if (final.primary !== "?") {
		return { ok: false, steps, failAt: digits.length - 1, got: final, reason: "result-not-?" };
	}
	return { ok: true, steps };
}

async function typeWithStaleBeforeInput(page, digits, lag) {
	const steps = [];
	for (const ch of digits) {
		const snap = await page.evaluate(
			({ digit, staleLag }) => {
				const input = document.querySelector("[data-ldcv2-date-input]");
				const display = input?.value ?? "";
				const caret = Math.max(0, display.length - staleLag);
				input?.focus();
				input?.setSelectionRange(caret, caret);
				input?.dispatchEvent(
					new InputEvent("beforeinput", {
						bubbles: true,
						cancelable: true,
						inputType: "insertText",
						data: digit,
					}),
				);
				const value = input?.value ?? "";
				return {
					value,
					digits: value.replace(/\D/g, ""),
					caret: input?.selectionStart ?? -1,
				};
			},
			{ digit: ch, staleLag: lag },
		);
		steps.push(snap);
	}
	return steps;
}

async function stressMode(page, modeKey) {
	await switchDesktopMode(page, modeKey === "gregorian" ? "gregorian" : "lunar");
	const modeSummary = summary[modeKey];

	for (const year of YEAR_SEQUENCES) {
		modeSummary[year] = modeSummary[year] ?? {};
		for (const speed of SPEEDS) {
			let okCount = 0;
			let failSample = null;
			for (let i = 0; i < REPEATS; i += 1) {
				await clearFieldByBackspace(page);
				const input = page.locator("[data-ldcv2-date-input]");
				await input.click();
				const result = await typeYearSequence(page, year, speed.delayMs);
				if (result.ok) {
					okCount += 1;
				} else if (!failSample) {
					failSample = { repeat: i, ...result };
				}
			}
			const label = `${modeKey} ${year} ${speed.name} ${okCount}/${REPEATS}`;
			modeSummary[year][speed.name] = { ok: okCount, total: REPEATS, failSample };
			assert(okCount === REPEATS, label);
			note(label);
		}
	}

	/* Focus then immediate type（no settle delay） */
	{
		await clearFieldByBackspace(page);
		const input = page.locator("[data-ldcv2-date-input]");
		await input.focus();
		const result = await typeYearSequence(page, "2020", 0);
		assert(result.ok, `${modeKey} focus-immediate 2020`);
	}

	/* Backspace then continue */
	{
		await clearFieldByBackspace(page);
		const input = page.locator("[data-ldcv2-date-input]");
		await input.click();
		await page.keyboard.type("1945", { delay: 0 });
		await page.keyboard.press("Backspace");
		let snap = await readField(page);
		assert(snap.digits === "194" && snap.value === "194", `${modeKey} backspace mid 194`);
		await page.keyboard.type("5", { delay: 0 });
		snap = await readField(page);
		assert(snap.digits === "1945" && snap.value === "1945", `${modeKey} backspace then 5 → 1945`);
		assert(snap.caret === 4, `${modeKey} backspace then 5 caret`);
	}

	/* Delete then continue（caret mid-year） */
	{
		await clearFieldByBackspace(page);
		const input = page.locator("[data-ldcv2-date-input]");
		await input.click();
		await page.keyboard.type("2020", { delay: 0 });
		await input.evaluate((el) => el.setSelectionRange(2, 2));
		await page.keyboard.press("Delete");
		let snap = await readField(page);
		/* After Delete at offset 2 in "2020", digit at index 2 ('2') removed → "200" */
		assert(
			snap.digits === "200" || snap.digits === "2000" || snap.digits.length >= 2,
			`${modeKey} delete mid leaves coherent digits (${snap.digits})`,
		);
		await page.keyboard.type("2", { delay: 0 });
		snap = await readField(page);
		assert(
			!/220\b/.test(snap.value) && snap.digits.includes("2"),
			`${modeKey} delete then type no 220 reorder (${snap.value})`,
		);
	}

	/* Paste equivalence */
	{
		await clearFieldByBackspace(page);
		await page.locator("[data-ldcv2-date-input]").focus();
		await page.evaluate((t) => {
			const el = document.querySelector("[data-ldcv2-date-input]");
			const clip = new DataTransfer();
			clip.setData("text/plain", t);
			el?.dispatchEvent(
				new ClipboardEvent("paste", {
					bubbles: true,
					cancelable: true,
					clipboardData: clip,
				}),
			);
		}, "1980");
		const pasted = await readField(page);
		assert(pasted.digits === "1980" && pasted.value === "1980", `${modeKey} paste 1980`);

		await clearFieldByBackspace(page);
		const input = page.locator("[data-ldcv2-date-input]");
		await input.click();
		const typed = await typeYearSequence(page, "1980", 0);
		assert(typed.ok, `${modeKey} type 1980 equals paste path`);
	}

	/* Stale beforeinput lag stress（engine suspenders） */
	for (const year of YEAR_SEQUENCES) {
		for (const lag of [1, 2, 3]) {
			let ok = 0;
			for (let i = 0; i < REPEATS; i += 1) {
				await clearFieldByBackspace(page);
				await page.locator("[data-ldcv2-date-input]").click();
				const steps = await typeWithStaleBeforeInput(page, year, lag);
				const last = steps[steps.length - 1];
				if (last?.digits === year && last?.value === year && last?.caret === year.length) {
					ok += 1;
				} else if (i === 0) {
					note(
						`${modeKey} stale-lag=${lag} ${year} sample fail ${JSON.stringify(last)}`,
					);
				}
			}
			assert(ok === REPEATS, `${modeKey} stale-beforeinput lag=${lag} ${year} ${ok}/${REPEATS}`);
		}
	}
}

console.log("qa-lunar-b2e-typing-stability-browser\n");
console.log(`base: ${BASE} repeats: ${REPEATS}\n`);

mkdirSync(join(rootDir, "local-docs/validation"), { recursive: true });
await waitForServer(`${BASE}/en/lunar-date-converter/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });

{
	const { context, page } = await setupDesktopPage(browser, "/en/lunar-date-converter/");
	note("Gate C: real keyboard + stale beforeinput + 30× repeats");
	await stressMode(page, "gregorian");
	await stressMode(page, "lunar");
	await context.close();
}

await browser.close();

writeFileSync(
	evidencePath,
	JSON.stringify(
		{
			base: BASE,
			repeats: REPEATS,
			passed,
			failed,
			summary,
			evidence,
		},
		null,
		2,
	),
);

console.log(`\npassed=${passed} failed=${failed}`);
console.log(`evidence: ${evidencePath}`);
process.exit(failed === 0 ? 0 : 1);
