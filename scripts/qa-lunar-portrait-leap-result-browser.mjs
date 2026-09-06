/**
 * Lunar Mobile Portrait leap result — 2-line semantic fit QA.
 *
 * State matrix（repeatable）:
 *   EN/ZH × Mobile Portrait × regular / leap lunar result
 *
 * Viewports:
 *   390×844  — iPhone-like
 *   360×740  — narrower
 *
 * Smoke（non-blocking composition assert beyond line count）:
 *   Desktop 1280×800 hover:hover
 *   Mobile Landscape 844×390 hover:none
 *
 * Run:
 *   npm run build && npx astro preview --host 127.0.0.1 --port 4353
 *   LDC_QA_BASE=http://127.0.0.1:4353 node scripts/qa-lunar-portrait-leap-result-browser.mjs
 */
import { chromium, devices } from "playwright";

const BASE = process.env.LDC_QA_BASE ?? "http://127.0.0.1:4353";

/** Owner production-like leap: EN Leap Lunar 6/15 / Yi-si；ZH 閏六月十五日 */
const LEAP_CIVIL = { y: 2025, m: 8, d: 8 };
/** Regular lunar result control */
const REGULAR_CIVIL = { y: 2024, m: 7, d: 18 };

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		passed += 1;
		console.log(`PASS  ${message}`);
		return;
	}
	failed += 1;
	console.error(`FAIL  ${message}`);
}

async function waitForServer(url) {
	for (let i = 0; i < 40; i += 1) {
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

async function setGregorianDate(page, { y, m, d }) {
	const ameOpen = await page.locator('[data-ame-root][data-ame-open="true"]').count();
	const sheet = page.locator("[data-ldcv2-sheet-trigger]");
	const sheetVisible = await sheet.isVisible().catch(() => false);

	if (ameOpen > 0 || sheetVisible) {
		if (ameOpen === 0) {
			await sheet.click();
			await page.waitForSelector('[data-ame-root][data-ame-open="true"]', {
				state: "attached",
			});
		}
		await page.locator("[data-ldcv2-ame-g-year]").selectOption(String(y), { force: true });
		await page.locator("[data-ldcv2-ame-g-month]").selectOption(String(m), { force: true });
		await page.locator("[data-ldcv2-ame-g-day]").selectOption(String(d), { force: true });
		await page.waitForTimeout(120);
		/* Live lifecycle：select 已更新 Result；Done 僅 dismiss */
		const done = page.locator("[data-ame-submit]");
		if ((await done.count()) > 0) {
			await done.click({ force: true }).catch(() => {});
			await page.waitForTimeout(60);
		}
		return;
	}

	const input = page.locator("[data-ldcv2-date-input]");
	await input.click({ force: true });
	await page.keyboard.press("Meta+A").catch(() => {});
	await page.keyboard.press("Control+A").catch(() => {});
	await page.keyboard.press("Backspace");
	await page.keyboard.type(
		`${y}${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`,
		{ delay: 20 },
	);
	await input.blur();
	await page.waitForTimeout(100);
}

async function measurePrimary(page) {
	return page.evaluate(() => {
		const root = document.querySelector("[data-lunar-date-converter-v2]");
		const primary = root?.querySelector('[data-rs-value="primary"]');
		if (!root || !primary) {
			return null;
		}
		const text = primary.textContent ?? "";
		const range = document.createRange();
		range.selectNodeContents(primary);
		const rects = [...range.getClientRects()];
		const lineBottoms = [...new Set(rects.map((r) => Math.round(r.bottom)))];
		return {
			text,
			semanticLines: text.split("\n").map((l) => l.trim()).filter(Boolean),
			visualLineCount: lineBottoms.length,
			whiteSpace: getComputedStyle(primary).whiteSpace,
			fontSize: parseFloat(getComputedStyle(primary).fontSize),
			fit: root.getAttribute("data-ldcv2-rs-portrait-fit"),
			scrollWidth: primary.scrollWidth,
			clientWidth: primary.clientWidth,
			layout: root.querySelector("[data-result-summary]")?.getAttribute("data-rs-layout"),
		};
	});
}

console.log("qa-lunar-portrait-leap-result-browser\n");
console.log(`base: ${BASE}\n`);

await waitForServer(`${BASE}/en/lunar-date-converter/`);

const browser = await chromium.launch({ headless: true });

const portraitCases = [
	{ name: "iPhone-390", width: 390, height: 844 },
	{ name: "narrow-360", width: 360, height: 740 },
];

for (const vp of portraitCases) {
	for (const locale of ["en", "zh"]) {
		const context = await browser.newContext({
			viewport: { width: vp.width, height: vp.height },
			hasTouch: true,
			isMobile: true,
			userAgent: devices["iPhone 12"].userAgent,
		});
		const page = await context.newPage();
		await page.emulateMedia({ media: "screen" });
		await page.addInitScript(() => {
			Object.defineProperty(window, "matchMedia", {
				writable: true,
				value: (query) => {
					const q = String(query);
					const width = window.innerWidth;
					const height = window.innerHeight;
					const hoverNone = true;
					const hoverHover = false;
					const desktop =
						width >= 768 && hoverHover;
					const landscape =
						height < width &&
						height <= 700 &&
						width <= 1200 &&
						hoverNone;
					let matches = false;
					if (q.includes("min-width: 768px") && q.includes("hover: hover")) {
						matches = desktop;
					} else if (
						q.includes("orientation: landscape") &&
						q.includes("max-height: 700px") &&
						q.includes("hover: none")
					) {
						matches = landscape;
					} else if (q.includes("hover: none") || q.includes("hover:none")) {
						matches = hoverNone;
					} else if (q.includes("hover: hover") || q.includes("hover:hover")) {
						matches = hoverHover;
					} else if (q.includes("orientation: landscape")) {
						matches = height < width;
					} else if (q.includes("orientation: portrait")) {
						matches = height >= width;
					}
					return {
						matches,
						media: q,
						onchange: null,
						addListener() {},
						removeListener() {},
						addEventListener() {},
						removeEventListener() {},
						dispatchEvent() {
							return false;
						},
					};
				},
			});
		});

		await page.goto(`${BASE}/${locale}/lunar-date-converter/`, {
			waitUntil: "networkidle",
		});
		await page.waitForSelector("[data-lunar-date-converter-v2]");

		for (const [kind, civil] of [
			["regular", REGULAR_CIVIL],
			["leap", LEAP_CIVIL],
		]) {
			await setGregorianDate(page, civil);
			const sample = await measurePrimary(page);
			const label = `${locale} ${vp.name} ${kind}`;
			assert(sample != null, `${label}: measured`);
			if (!sample) continue;

			assert(sample.layout === "portrait", `${label}: rs-layout portrait (got ${sample.layout})`);
			assert(sample.whiteSpace === "pre", `${label}: white-space pre (got ${sample.whiteSpace})`);
			assert(
				sample.semanticLines.length === 2,
				`${label}: semantic 2 lines → ${JSON.stringify(sample.semanticLines)}`,
			);
			assert(
				sample.visualLineCount === 2,
				`${label}: visual lines === 2 (got ${sample.visualLineCount}) text=${JSON.stringify(sample.text)}`,
			);
			assert(
				sample.scrollWidth <= sample.clientWidth + 1,
				`${label}: no horizontal overflow (${sample.scrollWidth}/${sample.clientWidth})`,
			);

			if (kind === "leap") {
				if (locale === "zh") {
					assert(
						sample.semanticLines[1] === "閏六月十五日",
						`${label}: ZH leap line2 intact`,
					);
					assert(!sample.semanticLines.some((l) => l === "日"), `${label}: 日 not alone`);
				} else {
					assert(
						sample.semanticLines[0] === "Leap Lunar 6/15",
						`${label}: EN leap line1 intact`,
					);
					assert(sample.semanticLines[1] === "Yi-si", `${label}: EN stem line`);
				}
			} else if (locale === "zh") {
				assert(
					sample.semanticLines[1]?.endsWith("日") &&
						!sample.semanticLines[1]?.startsWith("閏"),
					`${label}: ZH regular month/day line`,
				);
			}

			console.log(
				`  evidence ${label}: lines=${sample.visualLineCount} fit=${sample.fit ?? "none"} size=${sample.fontSize.toFixed(1)}px → ${JSON.stringify(sample.semanticLines)}`,
			);
		}

		await context.close();
	}
}

/* Desktop / Landscape smoke — leap stays within expected composition family */
{
	const desktop = await browser.newContext({
		viewport: { width: 1280, height: 800 },
	});
	const page = await desktop.newPage();
	await page.goto(`${BASE}/en/lunar-date-converter/`, { waitUntil: "networkidle" });
	await setGregorianDate(page, LEAP_CIVIL);
	const sample = await measurePrimary(page);
	assert(sample != null, "desktop leap measured");
	assert(
		sample?.layout === "desktop",
		`desktop leap layout (got ${sample?.layout})`,
	);
	assert(
		(sample?.visualLineCount ?? 99) <= 2,
		`desktop leap visual lines <= 2 (got ${sample?.visualLineCount})`,
	);
	await desktop.close();
}

{
	const landscape = await browser.newContext({
		viewport: { width: 844, height: 390 },
		hasTouch: true,
		isMobile: true,
		userAgent: devices["iPhone 12"].userAgent,
	});
	const page = await landscape.newPage();
	await page.addInitScript(() => {
		Object.defineProperty(window, "matchMedia", {
			writable: true,
			value: (query) => {
				const q = String(query);
				const width = window.innerWidth;
				const height = window.innerHeight;
				const hoverNone = true;
				const hoverHover = false;
				const desktop = width >= 768 && hoverHover;
				const landscape =
					height < width && height <= 700 && width <= 1200 && hoverNone;
				let matches = false;
				if (q.includes("min-width: 768px") && q.includes("hover: hover")) {
					matches = desktop;
				} else if (
					q.includes("orientation: landscape") &&
					q.includes("max-height: 700px") &&
					q.includes("hover: none")
				) {
					matches = landscape;
				} else if (q.includes("hover: none") || q.includes("hover:none")) {
					matches = hoverNone;
				} else if (q.includes("hover: hover") || q.includes("hover:hover")) {
					matches = hoverHover;
				} else if (q.includes("orientation: landscape")) {
					matches = height < width;
				} else if (q.includes("orientation: portrait")) {
					matches = height >= width;
				}
				return {
					matches,
					media: q,
					onchange: null,
					addListener() {},
					removeListener() {},
					addEventListener() {},
					removeEventListener() {},
					dispatchEvent() {
						return false;
					},
				};
			},
		});
	});
	await page.goto(`${BASE}/zh/lunar-date-converter/`, { waitUntil: "networkidle" });
	await setGregorianDate(page, LEAP_CIVIL);
	const sample = await measurePrimary(page);
	assert(sample != null, "landscape leap measured");
	assert(
		sample?.layout === "landscape",
		`landscape leap layout (got ${sample?.layout})`,
	);
	await landscape.close();
}

await browser.close();

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
	process.exit(1);
}
console.log("qa-lunar-portrait-leap-result-browser PASS");
