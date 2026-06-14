# Mobile Sheet Shared Style — Validation Report

**Route:** `/preview/mobile-sheet-shared-style/`  
**Status:** Owner validation confirmed OK — commit authorized  
**Report date:** 2026-06-14  

---

## 1. Final implementation summary

### A. Test environment — validated tool page shell

- Stopped custom `[data-msb-preview-root]` preview sandbox outer shell
- Reused `/preview/tool` layout: `data-preview-tool-page` + `preview-tool-main-section` / `preview-tool-first-screen` / `preview-tool-stage` / `preview-tool-controls`
- First screen: title + note + `data-msb-open` button (`preview-tool-control-btn`)
- Footer visible below fold (matches production tool page behavior)

### B. Shared CSS extraction (Plan A — pure extraction)

- Added `src/styles/preview/tool-preview-first-screen.css`
- Shared by `/preview/tool` and the sheet test page
- `/preview/tool.astro` only moved inline CSS to import — no visual changes

### C. Mobile Sheet baseline (sheet body only)

- Portal: `[data-msb-portal][data-mobile-sheet-baseline]` teleported to `document.body`
- Scroll lock: preview-only `msb-scroll-lock` (not production `tool-operation-open`)
- Final sheet structure:
  - **handle**
  - **`.msb-sheet-body` (single scroll region)** — H/M/S, Name, Start/End
  - **`.msb-action-row` (fixed)** — Cancel / Apply and start
- Portrait: bottom sheet density unchanged; `landscape-duo` hidden
- Landscape compact panel (final height strategy):
  - Removed `min(40dvh, 9.75rem)` cap (too small on real devices)
  - Panel: `height / max-height: min(52dvh, 14rem)` + `min-height` floor for handle + full input row + action row + padding
  - Body: `flex: 1 1 0%`, `min-height: 2.125rem`, `overflow-y: auto`, `touch-action: pan-y`
  - Reduced gap / padding so inputs are not clipped on open

### D. Explicitly out of scope

- No changes to viewport-fit, safe-area outer shell, Header, BaseLayout, global background, landscape first-screen outer layout
- No changes to production ECv2 / Date Range V2, `tool-overlay-v2-baseline.css`, `tool-result-v2-baseline.css`

---

## 2. Modified files (this task)

| File | Change |
|---|---|
| **New** `src/styles/preview/tool-preview-first-screen.css` | Extracted from `tool.astro` |
| `src/pages/preview/tool.astro` | Inline styles → shared CSS import |
| `src/pages/preview/mobile-sheet-shared-style/index.astro` | Preview route + CSS imports |
| `src/components/preview/MobileSheetSharedStylePreview.astro` | Tool page shell + portal sheet markup |
| `src/styles/tools/tool-mobile-sheet-v2-baseline.css` | Sheet baseline only; landscape height fix |
| `public/scripts/mobile-sheet-shared-style-preview.js` | Open/close, scroll lock, keyboard sync |
| **New** `docs/reports/2026-06-14-mobile-sheet-shared-style-validation-report.md` | This report |

No `data-msb-preview-root` / `msb-preview-*` references remain in the repo.

---

## 3. Reused `/preview/tool` shared shell?

**Yes.** Sheet test page uses `data-preview-tool-page` + `preview-tool-*` and imports `tool-preview-first-screen.css`.

---

## 4. Removed custom preview shell?

**Yes.** All preview-only outer shell rules and markup removed from the mobile sheet baseline and preview component.

---

## 5. Mobile portrait test results

| Check | Result | Basis |
|---|---|---|
| Outer tool page shell | Pass | Owner real device + `/preview/tool` alignment |
| Open sheet | Pass | Overlay, scroll lock, bottom sheet |
| H/M/S + Name | Pass | Fields visible and operable |
| Start / End | Pass (hidden as expected) | Portrait media hides `landscape-duo` |
| Cancel / Apply | Pass | Action row works |
| Footer | Pass | Visible below fold |

---

## 6. Mobile landscape test results

| Check | Result | Basis |
|---|---|---|
| Outer first-screen | Pass | Owner real device |
| H/M/S fully visible on open | Pass | Owner confirmed (was clipped before height fix) |
| Cancel / Apply fixed | Pass | Owner confirmed |
| Body scroll — Name / Start / End | Pass | Owner confirmed |
| Single scroll region | Pass | Only `.msb-sheet-body` scrolls |

---

## 7. Production Event Countdown / Date Range unaffected?

**Yes.**

- `EventCountdownV2.astro`, `DateRangeCalculatorV2.astro` — not modified
- `event-countdown-v2.css`, `date-range-calculator-v2.css` — not modified
- Header, Footer, BaseLayout, global background — not modified
- `tool-overlay-v2-baseline.css`, `tool-result-v2-baseline.css` — not modified (import only on preview route)

---

## 8. `npm run build`

**Pass**

```text
21 page(s) built — Complete!
```

Verified: 2026-06-14 (pre-commit).

---

## 9. Agent reviews

### Experience Lead

```text
Agent: Experience Lead
Result: Pass

Findings:
- Sheet test runs inside validated tool page shell; no custom outer viewport / landscape shell
- Portrait / landscape flows complete: Open → fields → Cancel / Apply close
- Landscape: H/M/S visible on first open; secondary fields reachable via body scroll
- Cancel / Apply fixed; do not scroll with body
- Footer restored — closer to production rhythm

Required fixes:
- None

Minor notes:
- Preview uses msb-scroll-lock, not production tool-operation-open; align before production tool integration

Owner attention:
- Re-run tool-page integration QA when baseline is wired into Countdown Timer
```

### Brand Guardian

```text
Agent: Brand Guardian
Result: Pass

Findings:
- Sheet tokens, handle, inline fields, H/M/S grid, secondary / primary buttons match Timiva V2 baseline
- Preview outer layer shares /preview/tool first-screen CSS — no preview-only drift
- Landscape height fix restores full input visibility (no clipped fields)

Required fixes:
- None

Minor notes:
- Preview first screen has no fake result number (128) — sparser than /preview/tool; acceptable for sandbox

Owner attention:
- None
```

### Tech Architect

```text
Agent: Tech Architect
Result: Pass with minor notes

Findings:
- tool-preview-first-screen.css is pure extraction; /preview/tool baseline preserved
- Sheet styles scoped under [data-mobile-sheet-baseline]; preview shell rules removed
- Portal + preview JS stable; build Pass
- Production / locked components untouched

Required fixes:
- None

Minor notes:
- Portal overlay rules live in tool-mobile-sheet-v2-baseline.css (overlap with overlay baseline conceptually)
- Landscape height tokens (52dvh / 14rem) are preview baseline decisions — confirm before production reuse

Owner attention:
- Commit authorized by Owner after this report
```

---

## 10. Growth Strategist — N/A

```text
Agent: Growth Strategist
Result: N/A

Reason:
- Preview-only sandbox (robots: noindex, nofollow)
- No meta, FAQ, schema, related tools, internal links, or production SEO changes
- Not a growth / SEO deliverable
```

---

## 11. Minor notes (non-blocking)

| # | Item | Severity |
|---|---|---|
| M1 | Preview `msb-scroll-lock` ≠ production `tool-operation-open` | Low |
| M2 | Portal overlay vs overlay baseline rules partially duplicated | Low |
| M3 | Preview first screen sparser than `/preview/tool` (no fake result block) | Low |
| M4 | Landscape height tokens need re-validation before production tool wiring | Low |
| M5 | iOS keyboard / interactive-widget not fully QA’d at production level | Low |

---

## 12. Owner Final Approval

**Confirmed OK** (2026-06-14)

Owner approved this validation report and authorized commit with message:

`feat(preview): add mobile sheet shared style baseline`

**Deploy:** not authorized in this step.

---

## Owner Final Approval Summary

| Item | Status |
|---|---|
| Reuse `/preview/tool` shell | Done |
| Remove custom preview shell | Done |
| Sheet baseline (portrait + landscape) | Owner real device — Pass |
| Production regression | Unchanged |
| `npm run build` | Pass |
| Experience Lead | Pass |
| Brand Guardian | Pass |
| Tech Architect | Pass with minor notes |
| Growth Strategist | N/A |
| Commit | Authorized |
| Deploy | Not in scope |
