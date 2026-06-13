# Timiva Validation Report — Mobile Portrait First-Screen Control

Date: 2026-06-05  
Scope: Date Range V2 portrait logic + shared portrait control sizing  
Reviewer: Cursor  
Owner QA: Pending real-device check

---

## 1. Result

```text
Pass with minor notes
```

`npm run build` passed. Step 1 (first-screen anchored control + sheet-only calendar) and Step 2 (shared 56px portrait control baseline) complete. Desktop / landscape unchanged.

---

## 2. Modified files

```text
修改：
- src/styles/tools/date-range-calculator-v2.css
- src/styles/tools/tool-result-v2-baseline.css
- src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro
- src/pages/en/event-countdown/index.astro
- src/pages/zh/event-countdown/index.astro
- src/pages/preview/event-countdown-v2.astro

新增：
- docs/reports/2026-06-05-mobile-portrait-first-screen-control-validation-report.md
```

```text
未修改：
- public/scripts/date-range.js
- Event Countdown V2 Astro / core logic
- desktop Date Range layout
- mobile landscape compact mode CSS blocks
- Header / Footer / BaseLayout / ToolAdSlot
```

---

## 3. Step 1 — Date Range V2 mobile portrait logic

```text
Removed: position fixed bottom control
Added: preview-tool-stage grid (minmax(0,1fr) auto) @ 100dvh
Result group: flex center in row 1 (first-screen visual center)
Capsule: preview-tool-controls in row 2 (first-screen bottom area, relative)
Scroll: capsule scrolls away with first screen — not viewport sticky/fixed
Calendar: portrait overrides force bottom sheet (fixed translateY) — no inline calendar at 601–767px
Sheet chrome: handle / footer / backdrop restored under [data-date-range-v2] portrait scope
```

---

## 4. Step 2 — Shared mobile portrait control size baseline

Added to `tool-result-v2-baseline.css`:

```text
--tool-mobile-portrait-control-min-height: 3.5rem (56px)
--tool-mobile-portrait-control-padding-x: 1rem
--tool-mobile-portrait-control-padding-y: 0.75rem
--tool-mobile-portrait-control-gap: 0.5rem
--tool-mobile-portrait-control-icon-size: 1.125rem
```

Applied to:

```text
[data-date-range-v2] .preview-tool-control-btn
[data-event-countdown-v2] .preview-tool-control-btn
```

Back Timiva pill reference: min-h-11 (44px) — portrait controls now 56px (≥ back pill).

ECv2 pages import tool-result-v2-baseline.css (visual sizing only).

---

## 5. Owner validation checklist

| # | Item | Status |
|---|---|---|
| 1 | Date Range portrait results visually centered on first screen | Pass (code) |
| 2 | First screen shows Start — End date capsule | Pass (code) |
| 3 | Calendar not inline on first screen | Pass (code) — sheet off-screen until open |
| 4 | Capsule not global sticky/fixed | Pass — position: relative in grid row 2 |
| 5 | Scroll down → capsule leaves with first screen | Pass (code) |
| 6 | Tap capsule opens bottom sheet | Pass — JS hooks unchanged |
| 7 | Sheet not hidden by browser chrome | Pass (code) — safe-bottom padding on sheet |
| 8 | Start / end date selection | Pass — JS unchanged |
| 9 | Clear dates | Pass — JS unchanged |
| 10 | ECv2 portrait controls larger | Pass — 56px min-height baseline |
| 11 | Date Range portrait controls larger | Pass — 56px min-height baseline |
| 12 | Both ≥ Back Timiva pill | Pass — 56px > 44px min-h-11 |
| 13 | Desktop unchanged | Pass |
| 14 | Mobile landscape unchanged | Pass — landscape blocks untouched |
| 15 | date-range.js unchanged | Pass |
| 16 | ECv2 core logic unchanged | Pass — CSS import + sizing only |
| 17 | npm run build | Pass |
| 18 | No #id / inline style / !important in CSS | Pass |

---

## 6. Owner Final Approval

```text
Status: Pending real-device QA
Do not commit / deploy until Owner confirms
```
