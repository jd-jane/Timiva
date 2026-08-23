/**
 * Fetch official HKO Gregorian–Lunar English text tables（1901–2100）.
 *
 * Output: scripts/fixtures/hko-text/T{YYYY}e.txt（gitignored generated cache）
 * Then run: node scripts/normalize-hko-lunar-reference.mjs
 *
 * No npm dependencies. Official source only — do not substitute third-party mirrors.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "fixtures/hko-text");
const BASE = "https://www.hko.gov.hk/en/gts/time/calendar/text/files";

async function fetchYear(y) {
	const url = `${BASE}/T${y}e.txt`;
	const res = await fetch(url, {
		headers: { "User-Agent": "Timiva-B2A-verification/1.0" },
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	return Buffer.from(await res.arrayBuffer());
}

async function main() {
	fs.mkdirSync(OUT_DIR, { recursive: true });
	let ok = 0;
	for (let y = 1901; y <= 2100; y += 1) {
		const dest = path.join(OUT_DIR, `T${y}e.txt`);
		if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
			ok += 1;
			continue;
		}
		const buf = await fetchYear(y);
		fs.writeFileSync(dest, buf);
		ok += 1;
		if (y % 25 === 0) console.log(`fetched through ${y}`);
	}
	console.log(`done ${ok}/200 → ${OUT_DIR}`);
	console.log("Next: node scripts/normalize-hko-lunar-reference.mjs");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
