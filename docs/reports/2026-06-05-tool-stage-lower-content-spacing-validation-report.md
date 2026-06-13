# Timiva Validation Report — Tool Stage → Lower Content Spacing Baseline

Date: 2026-06-05  
Scope: Shared 48px spacing between first-screen tool stage and lower content  
Reviewer: Cursor  
Owner QA: Pending real-device check

---

## 1. Result

```text
Pass with minor notes
```

`npm run build` passed. Shared baseline established in `tool-result-v2-baseline.css`. ECv2 + Date Range V2 wired. Mobile landscape compact excluded.

---

## 2. Modified files

```text
修改：
- src/styles/tools/tool-result-v2-baseline.css
- src/components/tools/event-countdown-v2/EventCountdownV2.astro
- src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro

新增：
- docs/reports/2026-06-05-tool-stage-lower-content-spacing-validation-report.md
```

```text
未修改：
- public/scripts/date-range.js
- desktop layout structure / result sizes
- mobile landscape compact mode blocks
- tool-ad-slot.css visual frame (v2 ad margin-top deduped via baseline override)
- Header / Footer / BaseLayout
```

---

## 3. Shared baseline

```css
--tool-stage-to-lower-content-spacing: 48px;

:is([data-date-range-v2], [data-event-countdown-v2]) .tool-lower-content {
  margin-top: var(--tool-stage-to-lower-content-spacing);
}

/* Avoid double spacing before Main ToolAdSlot */
.tool-lower-content > .tool-ad-slot-main:first-child {
  margin-top: 0;
}

/* Mobile landscape compact — excluded */
@media (orientation: landscape) and (max-height: 700px) and (max-width: 1200px) {
  .tool-lower-content { margin-top: 0; }
}
```

Semantic classes:

```text
.tool-stage          — preview-tool-stage alias (both V2 tools)
.tool-lower-content   — lower content wrapper (ECv2 + Date Range V2)
.tool-content-after-stage — alias selector (future tools)
```

---

## 4. Owner validation checklist

| # | Item | Status |
|---|---|---|
| 1 | Shared tool stage → lower content baseline established | Pass |
| 2 | Spacing ≥ 48px | Pass — `--tool-stage-to-lower-content-spacing: 48px` |
| 3 | ECv2 portrait: controls → You may also need ≥ 48px | Pass (code) — wrapper margin; ad disabled so Related Tools follows |
| 4 | Date Range portrait: first screen → lower content ≥ 48px | Pass (code) |
| 5 | Date Range portrait layout not broken | Pass — first-screen grid unchanged; only lower-content margin added |
| 6 | Desktop Main ToolAdSlot top ≥ 48px | Pass — wrapper margin 48px; ad first-child margin-top 0 |
| 7 | Mobile landscape unaffected | Pass — explicit margin-top: 0 in compact gate |
| 8 | Tool core logic unchanged | Pass |
| 9 | No CSS #id / inline style / !important | Pass |
| 10 | npm run build | Pass |

---

## 5. Owner Final Approval

```text
Status: Pending real-device QA
Do not commit / deploy until Owner confirms
```
