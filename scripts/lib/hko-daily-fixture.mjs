/**
 * Read checked-in HKO daily normalized reference（gzip JSONL）.
 * Node built-in zlib only — no npm dependency.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const HKO_DAILY_GZ = path.join(
	__dirname,
	"../fixtures/hko-lunar-daily.jsonl.gz",
);

/** @returns {object[]} parsed daily rows */
export function loadHkoDailyFixture() {
	if (!fs.existsSync(HKO_DAILY_GZ)) {
		throw new Error(
			`Missing ${HKO_DAILY_GZ}. Run normalize-hko-lunar-reference.mjs after fetching HKO tables.`,
		);
	}
	const buf = fs.readFileSync(HKO_DAILY_GZ);
	const text = zlib.gunzipSync(buf).toString("utf8").trim();
	if (!text) return [];
	return text.split("\n").map((line) => JSON.parse(line));
}

/** Write gzip JSONL（checked-in artifact）. */
export function writeHkoDailyFixture(rows) {
	const body = `${rows.map((d) => JSON.stringify(d)).join("\n")}\n`;
	const gz = zlib.gzipSync(body, { level: 9 });
	fs.writeFileSync(HKO_DAILY_GZ, gz);
	return { uncompressedBytes: Buffer.byteLength(body, "utf8"), compressedBytes: gz.length };
}
