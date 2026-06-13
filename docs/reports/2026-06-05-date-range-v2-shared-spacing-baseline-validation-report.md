# Timiva Validation Report — Date Range V2 Shared Spacing Baseline

Date: 2026-06-05  
Scope: Tool title → result spacing + Main ToolAdSlot top spacing  
Reviewer: Cursor  
Owner QA: Pending

---

## 1. Result

```text
Pass with minor notes
```

`npm run build` passed. Shared baselines established in reusable CSS. Date Range V2 wired. Minimal Event Countdown V2 CSS adjustment for ad spacing deduplication only.

---

## 2. Modified files

```text
新增：
- src/styles/tools/tool-result-v2-baseline.css
- docs/reports/2026-06-05-date-range-v2-shared-spacing-baseline-validation-report.md

修改：
- src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro
- src/styles/tools/date-range-calculator-v2.css
- src/styles/tool-ad-slot.css
- src/pages/en/date-range-calculator/index.astro
- src/pages/zh/date-range-calculator/index.astro
- src/styles/tools/event-countdown-v2.css（最小調整：移除 mobile lower-content margin-top 3rem，避免與共用 ad spacing 重複）
```

```text
未修改：
- public/scripts/date-range.js
- src/components/ToolAdSlot.astro（visual frame 不變；spacing 由 tool-ad-slot.css 共用層處理）
- Event Countdown V2 Astro / title→result spacing
- Header / Footer / BaseLayout / ToolCard / RelatedToolRow
```

---

## 3. Shared baselines established

### A. Tool result stack（`tool-result-v2-baseline.css`）

| Token / class | Purpose |
|---|---|
| `--tool-result-stack-gap-desktop: 24px` | Desktop tool title → main result |
| `.tool-result-stack` | Vertical stack wrapper |
| `.tool-title` | Tool name (margin reset) |
| `.tool-lower-content` | Post-app content anchor |

Desktop (`min-width: 768px`):

```text
.tool-result-stack { gap: 24px; }
Legacy header / result margin-top reset inside stack.
```

Mobile portrait / landscape:

```text
No stack gap — per-tool mt-* preserved (Date Range keeps mt-6 on result block).
```

### B. Main ToolAdSlot spacing（`tool-ad-slot.css`）

```css
.tool-ad-slot-main {
  margin-top: var(--tool-main-ad-top-spacing, 48px);
  margin-bottom: 48px;
  padding-bottom: 0; /* replaces component pb-12 to avoid double spacing */
}
```

```text
--tool-main-ad-top-spacing defined in tool-result-v2-baseline.css
Sidebar .tool-ad-slot-sidebar NOT affected
Mobile landscape: main ad still hidden via existing compact gate
```

---

## 4. Date Range V2 wiring

```text
- Wrapped title + result in .tool-result-stack
- h1 adds .tool-title
- Result block: mt-6 md:mt-0（desktop gap from stack）
- Lower content adds .tool-lower-content
- Removed drv2-specific ad margin overrides
- Removed drv2 lower-content margin-top 3rem（spacing owned by ToolAdSlot）
```

---

## 5. Event Countdown V2 — title spacing report（未修改 ECv2 title layout）

| Item | ECv2 current | Date Range V2 |
|---|---|---|
| Desktop title → result | `mt-6 md:mt-8` on result block ≈ **32px** on desktop | `.tool-result-stack` gap **24px** |
| Mobile portrait | `mt-6` ≈ 24px + title margin 0 | `header mb 1rem` + `mt-6` unchanged |
| Mobile landscape | compact rules unchanged | compact rules unchanged |

```text
是否會影響 ECv2 已驗收畫面（title spacing）：否 — ECv2 未套用 tool-result-stack
是否需要 Owner 確認後再同步 ECv2 title spacing：是 — 另開 Tool result visual baseline alignment task
```

### ECv2 minimal change（ad spacing only）

```text
Removed mobile portrait [data-ecv2-lower-content] { margin-top: 3rem }
Reason: avoid 48px wrapper + 48px ad = 96px double spacing
Effect: ECv2 mobile ad top spacing = shared 48px via .tool-ad-slot-main only
ECv2 desktop: gains consistent 48px ad top spacing（先前無 wrapper margin）
```

---

## 6. Owner validation checklist

| # | Item | Status |
|---|---|---|
| 1 | Date Range V2 desktop tool title → main result = 24px | Pass (code) — `.tool-result-stack { gap: 24px }` |
| 2 | Mobile portrait title → result unchanged | Pass — `mt-6` + mobile header `mb 1rem` preserved |
| 3 | Mobile landscape title → result unchanged | Pass — no stack gap; compact CSS untouched |
| 4 | Shared result spacing baseline established | Pass — `tool-result-v2-baseline.css` |
| 5 | Total Days still first focal point | Pass — result number size unchanged (11rem desktop) |
| 6 | Main ToolAdSlot top ≥ 48px | Pass — `.tool-ad-slot-main { margin-top: 48px }` |
| 7 | Date Range desktop ad no longer feels glued to tool | Pass (code) — Owner confirm pending |
| 8 | ECv2 not overly loose from shared spacing | Pass — removed duplicate 3rem wrapper; net ~48px ad top |
| 9 | Mobile portrait reasonable distance | Pass — single 48px ad top (no double wrapper) |
| 10 | Mobile landscape ad still hidden | Pass — existing gate in tool-ad-slot.css |
| 11 | Sidebar ad unaffected | Pass — `.tool-ad-slot-sidebar` not targeted |
| 12 | ToolAdSlot shared CSS modified | Yes — `tool-ad-slot.css` main spacing only |
| 13 | Other tools impacted | ECv2 ad spacing dedup only; no logic / visual frame change |

---

## 7. Agent gates (brief)

```text
Experience Lead: Pass — mobile touch / ad placement rules preserved
Brand Guardian: Pass — result focal hierarchy unchanged
Tech Architect: Pass — build OK; shared tokens; no JS hook changes
Growth Strategist: Pass — ad / SEO blocks untouched
```

---

## 8. Owner Final Approval

```text
Status: Pending real-device QA
Do not commit / deploy until Owner confirms
```
