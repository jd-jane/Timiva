/**
 * Cross-tool Smart Date typing stability smoke（DBD / Age / BDC / DC）.
 * Real per-key events — year sequences + 10/11/12 month + Backspace/Delete/paste.
 *
 * Run after build:
 *   SMART_DATE_QA_BASE=http://127.0.0.1:4351 node scripts/qa-smart-date-adopter-typing-smoke-browser.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.SMART_DATE_QA_BASE ?? process.env.LDC_QA_BASE ?? "http://127.0.0.1:4351";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

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

async function loadPlaywright() {
	return import("playwright");
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

const ADOPTERS = [
	{
		id: "dbd",
		path: "/en/days-between-dates/",
		selector: "[data-dbdv2-desktop-from]",
	},
	{
		id: "age",
		path: "/en/age-calculator/",
		selector: "[data-acv2-birth-input]",
	},
	{
		id: "bdc",
		path: "/en/business-days-calculator/",
		selector: "[data-bdcv2-desktop-from]",
	},
	{
		id: "dc",
		path: "/en/date-calculator/",
		selector: "[data-dcv2-desktop-start]",
	},
];

const YEARS = ["1945", "2020", "1980", "2000"];
const MONTH_CASES = [
	{ digits: "20241015", expectDigits: "20241015", label: "2024/10/15" },
	{ digits: "20241122", expectDigits: "20241122", label: "2024/11/22" },
	{ digits: "20241231", expectDigits: "20241231", label: "2024/12/31" },
];

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
	return { context, page };
}

async function resolveInput(page, selector) {
	const loc = page.locator(selector).first();
	const count = await loc.count();
	if (count === 0) return null;
	return loc;
}

async function readSnap(page, selector) {
	return page.evaluate((sel) => {
		const el = document.querySelector(sel);
		const value = el?.value ?? "";
		return {
			value,
			digits: value.replace(/\D/g, ""),
			caret: el?.selectionStart ?? -1,
			end: el?.selectionEnd ?? -1,
		};
	}, selector);
}

async function clearByBackspace(page, input, selector) {
	await input.focus();
	await input.evaluate((el) => {
		el.setSelectionRange(el.value.length, el.value.length);
	});
	for (let i = 0; i < 48; i += 1) {
		const value = await input.inputValue();
		if (!value) break;
		await input.press("Backspace");
	}
	const snap = await readSnap(page, selector);
	assert(snap.digits === "" || snap.value === "", `${selector} cleared`);
}

async function typeYear(page, input, selector, year) {
	await input.click();
	for (let i = 0; i < year.length; i += 1) {
		await page.keyboard.type(year[i], { delay: 0 });
		const snap = await readSnap(page, selector);
		const expected = year.slice(0, i + 1);
		assert(
			snap.digits === expected && snap.value === expected,
			`${selector} year step ${expected} (got ${snap.value})`,
		);
		assert(snap.caret === expected.length, `${selector} year caret ${expected}`);
		assert(!/220|145\s*\/\s*9/.test(snap.value), `${selector} no reorder at ${expected}`);
	}
}

async function smokeAdopter(browser, adopter) {
	const { context, page } = await setupDesktopPage(browser, adopter.path);
	const input = await resolveInput(page, adopter.selector);
	if (!input) {
		assert(false, `${adopter.id}: desktop Smart Date input not found (${adopter.selector})`);
		await context.close();
		return;
	}
	const selector = adopter.selector.includes(",")
		? await page.evaluate((sel) => {
				for (const part of sel.split(",")) {
					const el = document.querySelector(part.trim());
					if (el) return part.trim();
				}
				return sel.split(",")[0].trim();
			}, adopter.selector)
		: adopter.selector;

	await page.waitForSelector(selector);

	for (const year of YEARS) {
		await clearByBackspace(page, input, selector);
		await typeYear(page, input, selector, year);
	}

	for (const monthCase of MONTH_CASES) {
		await clearByBackspace(page, input, selector);
		await input.click();
		for (const ch of monthCase.digits) {
			await page.keyboard.type(ch, { delay: 0 });
		}
		const snap = await readSnap(page, selector);
		assert(
			snap.digits === monthCase.expectDigits,
			`${adopter.id} ${monthCase.label} digits (got ${snap.digits})`,
		);
		assert(!/\/\s*0\b/.test(snap.value) || snap.digits.length >= 6, `${adopter.id} ${monthCase.label} coherent`);
	}

	/* Backspace then continue */
	await clearByBackspace(page, input, selector);
	await input.click();
	await page.keyboard.type("1945", { delay: 0 });
	await page.keyboard.press("Backspace");
	let snap = await readSnap(page, selector);
	assert(snap.digits === "194", `${adopter.id} backspace mid 194`);
	await page.keyboard.type("5", { delay: 0 });
	snap = await readSnap(page, selector);
	assert(snap.digits === "1945" && snap.value === "1945", `${adopter.id} backspace then 5`);

	/* Delete mid then type — no 220 reorder */
	await clearByBackspace(page, input, selector);
	await input.click();
	await page.keyboard.type("2020", { delay: 0 });
	await input.evaluate((el) => el.setSelectionRange(2, 2));
	await page.keyboard.press("Delete");
	await page.keyboard.type("2", { delay: 0 });
	snap = await readSnap(page, selector);
	assert(!/\b220\b/.test(snap.value), `${adopter.id} delete then type no 220 (${snap.value})`);

	/* Paste equivalence */
	await clearByBackspace(page, input, selector);
	await input.focus();
	await page.evaluate(
		({ sel, text }) => {
			const el = document.querySelector(sel);
			const clip = new DataTransfer();
			clip.setData("text/plain", text);
			el?.dispatchEvent(
				new ClipboardEvent("paste", {
					bubbles: true,
					cancelable: true,
					clipboardData: clip,
				}),
			);
		},
		{ sel: selector, text: "1980" },
	);
	snap = await readSnap(page, selector);
	assert(snap.digits === "1980", `${adopter.id} paste 1980 (got ${snap.digits})`);

	await clearByBackspace(page, input, selector);
	await typeYear(page, input, selector, "1980");

	await context.close();
}

console.log("qa-smart-date-adopter-typing-smoke-browser\n");
console.log(`base: ${BASE}\n`);

await waitForServer(`${BASE}/en/days-between-dates/`);

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true });

for (const adopter of ADOPTERS) {
	console.log(`— ${adopter.id} —`);
	await smokeAdopter(browser, adopter);
}

await browser.close();

console.log(`\npassed=${passed} failed=${failed}`);
console.log(`root=${rootDir}`);
process.exit(failed === 0 ? 0 : 1);
