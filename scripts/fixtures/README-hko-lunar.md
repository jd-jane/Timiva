# HKO lunar reference — provenance

## Evidence chain

```text
HKO official URL
  → raw text (scripts/fetch-hko-lunar-tables.mjs → scripts/fixtures/hko-text/, gitignored)
  → normalized reference (scripts/normalize-hko-lunar-reference.mjs)
      • hko-lunar-years.json
      • hko-lunar-daily.jsonl.gz
  → packed runtime dataset (src/lib/lunar/lunarDataset.ts)
  → conversion verification (validate-lunar-dataset.mjs, validate-lunar-convert.mjs)
```

Normalization and validation **must not** read `LUNAR_YEAR_PACKED` or call conversion APIs to build expected values.

## Checked-in artifacts

| Path | Role |
|------|------|
| `hko-lunar-years.json` | Normalized lunar year / leap / month lengths / NY anchors |
| `hko-lunar-daily.jsonl.gz` | Exhaustive daily Gregorian→Lunar rows（gzip） |
| `lunar-hko-samples.json` | Small hand fixtures for conversion unit tests |

**Not checked in:** `hko-text/T{YYYY}e.txt`（200 raw HKO files, ~5.7MB）— reproducible via fetch script.

## Offline verification

```bash
# 1. Fetch raw HKO tables（network; output is gitignored）
node scripts/fetch-hko-lunar-tables.mjs

# 2. Rebuild normalized reference from raw text only
node scripts/normalize-hko-lunar-reference.mjs

# 3. Full dataset gate（uses checked-in .json + .jsonl.gz if step 2 skipped）
node scripts/validate-lunar-dataset.mjs

# 4. Conversion / round-trip suite
node scripts/validate-lunar-convert.mjs
```

Step 2 requires fetched raw text. Step 3 alone is sufficient for day-to-day QA using checked-in normalized fixtures.

## Packed-table corrections（1933 / 2057 / 2060）

Classic public `lunarInfo` packed integers disagreed with HKO for three full years. Runtime table was corrected to match HKO normalized reference:

| Lunar year | Change |
|------------|--------|
| 1933 | leap-5 length 29→30; month 6 length 30→29 |
| 2057 | months 8/9 lengths swapped |
| 2060 | months 3/4 lengths swapped |

## HKO `T2069e.txt` exception — `2069-12-30`

HKO published file omits Gregorian `2069-12-30`（jumps from 12-29 lunar day 16 to 12-31 lunar day 18）.

**Independent rebuild method**（in `normalize-hko-lunar-reference.mjs`）:

1. Detect missing civil date while parsing raw HKO rows.
2. Read adjacent HKO-published row `2069-12-29`（lunar day 16 of month 11, lunar year 2069）.
3. Set `2069-12-30` to **same lunar year / month / isLeapMonth, day = prev.day + 1** → lunar day 17.
4. Record under `provenance.filledFromGaps` with `method: "prev-hko-day-plus-one"` and prev-day evidence.

**Does not use:**

- `LUNAR_YEAR_PACKED`
- `gregorianToLunar` / any conversion output

This is arithmetic continuation from two adjacent official HKO rows only; not a guess from packed table or runtime conversion.

## Lunar 1900 residual limitation

- HKO has **no** `T1900e.txt`.
- Lunar **1900** exists only as **internal boundary sentinel**（dataset coverage 1900–2100）.
- **Public** lunar input remains **1901–2099**.
- **Verified via HKO:** `1901-01-01 → lunar 1900-11-11` from `T1901e.txt` daily rows; months 11–12 lengths from month-start spans in that stream.
- **Not HKO-verifiable:** lunar 1900 leap-month index（runtime packed value retained for internal G↔L at boundary only）.

## Lunar 2100 sentinel

- Lunar 2100 New Year is in `T2100e.txt`.
- Month 12 length may be incomplete at `2100-12-31`（year-bounded tail）.
