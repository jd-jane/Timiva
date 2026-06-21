# Timiva Decision Log

> 用途：記錄已確認的產品、設計、技術、SEO、法務與工作流決策。  
> 原則：只記錄「之後會影響判斷」的決策，不記錄每個小修改細節。

---

## 2026-06-10 — Project workflow becomes file-driven

Decision:

```text
Timiva 後續不再依賴每次複製長 prompt。
改成 AGENTS.md + current-status + task brief + validation report 的文件驅動工作流。
```

Reason:

```text
降低 ChatGPT / Cursor 之間貼來貼去的負擔。
讓 Cursor 每次讀固定規則與任務檔。
讓新討論串可以快速接續狀態。
```

Implementation:

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-decision-log.md
docs/tasks/
docs/reports/
```

---

## 2026-06-10 — Current recommended next task

Decision:

```text
Event Countdown V2 中文版、Legal Pages、Footer 語系切換完成後，下一步優先做 Pre Deploy Final Check。
```

Reason:

```text
目前可視為收尾的範圍已包含：
1. Event Countdown V2 中文正式切換
2. Legal Pages 正式內容與 Markdown 架構
3. Footer 語系切換體驗補強
```

---

## 2026-06-10 — Legal pages architecture

Decision:

```text
Legal / Text Pages 正式採用獨立 Markdown 內容檔 + Astro route entry + LegalTextLayout。
```

Rules:

```text
正式長文放在 src/content/legal/{locale}/*.md。
Route 只負責載入 Markdown、套用 LegalTextLayout、設定 metadata。
不把正式長文直接寫死在 .astro。
不使用 MDX。
不新增新的 LegalLayout。
純文字頁不放廣告。
```

---

## 2026-06-10 — Legal naming

Decision:

```text
中文正式命名使用「使用條款」，不使用「使用規範」。
英文 Footer 使用 Terms；英文頁面正式標題使用 Terms of Use。
```

English naming:

```text
Footer: Terms
Page H1: Terms of Use
Meta title: Terms of Use | Timiva
Route: /en/terms/
File: terms.md
```

---

## 2026-06-10 — Footer language switch behavior

Decision:

```text
Footer language switch should preserve the corresponding route instead of sending users back to language home.
```

Examples:

```text
/zh/privacy/ → /en/privacy/
/en/terms/ → /zh/terms/
/zh/contact/ → /en/contact/
/zh/event-countdown/ → /en/event-countdown/
```

---

## 2026-06-10 — Event Countdown V2 Chinese production route

Decision:

```text
/zh/event-countdown/ uses EventCountdownV2 in production mode.
```

Protected scope:

```text
Do not modify /en/event-countdown/ unless explicitly asked.
Do not modify /preview/event-countdown-v2 unless explicitly asked.
Do not go back to V1 unless a critical rollback is requested.
```


---

## 2026-06-13 — Date Range Calculator V2 production migration completed

Decision:

```text
Date Range Calculator 正式遷移到新版工具頁 V2 layout。
EN / ZH 路由皆切換至 DateRangeCalculatorV2。
```

Confirmed scope:

```text
/en/date-range-calculator/
/zh/date-range-calculator/
Desktop
Desktop → mobile intermediate breakpoints
Mobile portrait
Mobile landscape
Opened date panel
Overlay / scroll lock
FAQ JSON-LD
Tool Drawer
ToolAdSlot
```

Rules:

```text
Date Range V2 is now treated as the production baseline.
Do not return to the old DateRangeCalculator layout unless a rollback is explicitly requested.
Old DateRangeCalculator component can remain as rollback reference.
Do not rewrite Date Range calculation logic unless a future task explicitly targets calculation behavior.
```

---

## 2026-06-13 — Tool page V2 result rhythm baseline

Decision:

```text
新版工具頁需要共用結果區視覺節奏，而不是每個工具單獨微調。
```

Confirmed baseline:

```text
Desktop tool title → main result gap: 8px.
Tool stage → lower content spacing: at least 48px.
Main result number colors should stay consistent across tools.
Result label / meta colors should stay consistent across tools.
Result number size may vary per tool type and breakpoint.
```

Rules:

```text
Tool title style should remain consistent across tools.
Tool title → result spacing should be treated as shared rhythm.
Only position / size may be adjusted per tool when content type requires it.
Do not reduce shared spacing in order to force everything into the first screen.
```

---

## 2026-06-13 — Date Range V2 responsive mode rules

Decision:

```text
Date Range V2 must use mutually exclusive RWD modes.
Desktop, mobile portrait, and mobile landscape compact rules must not appear at the same time.
```

Rules:

```text
Desktop / tablet-wide can use inline control and inline calendar.
Mobile portrait uses first-screen result + Start date — End date capsule + bottom sheet calendar.
Mobile landscape compact uses compact result layout and compact opened panel.
Intermediate widths must not be misclassified as mobile landscape compact.
824–899px uses portrait-level capsule size.
True compact button sizing is only allowed for real mobile landscape / low-height conditions.
```

Avoid:

```text
Duplicate Start date — End date controls.
Inline calendar appearing in the wrong RWD mode.
Mobile landscape rules being triggered by width alone.
Desktop and mobile controls visible at the same time.
```

---

## 2026-06-13 — Date Range V2 mobile landscape layout

Decision:

```text
Date Range V2 mobile landscape uses a dedicated compact layout rather than the mobile portrait result stack.
```

First-screen structure:

```text
Back Timiva button
Tool title + result row as one centered visual group
Start date — End date capsule pinned to the first-screen bottom area
```

Result row:

```text
Total Days / Workdays / Weekends are shown as three equal columns.
All three numbers use the same size in mobile landscape.
All three labels use the same size, color, and spacing.
The number size may align with Event Countdown V2 mobile landscape compact result number.
```

Opened panel:

```text
Start date and End date are shown as two side-by-side fields.
Fields follow Event Countdown V2 sheet input visual language.
Label stays inside the field and does not disappear.
Clear dates is a left-aligned plain text button on the second row.
Clear dates should not be a capsule button.
```

---

## 2026-06-13 — Shared tool overlay / backdrop baseline

Decision:

```text
All new tool-page mobile sheets / panels should share one overlay, backdrop, and scroll-lock baseline.
```

Rules:

```text
Opening a tool operation sheet / panel should show a semi-transparent dark backdrop.
Background page scroll should be locked while the sheet / panel is open.
Clicking the backdrop should close the active sheet / panel.
Closing the sheet / panel should remove backdrop and scroll lock.
Mobile portrait and mobile landscape use the same overlay visual language.
Panel height / position may differ between portrait and landscape.
```

Implementation note:

```text
Shared baseline file: tool-overlay-v2-baseline.css.
Shared scroll lock class: tool-operation-open.
Event Countdown V2 overlay may be teleported to document.body, so body-level selectors may be required.
Do not break Event Countdown V2 overlay behavior while sharing the baseline.
```

---

## 2026-06-13 — Tool ad placeholders stay disabled before live ads

Decision:

```text
ToolAdSlot placeholders exist for future monetization planning, but live tool pages should not show reserved ad boxes in production state yet.
```

Rules:

```text
Event Countdown V2 main and sidebar ToolAdSlot use is-disabled.
Date Range V2 main and sidebar ToolAdSlot use is-disabled.
is-disabled should not render visible dashed boxes or ad-size labels.
The tool stage → lower content spacing should remain stable even when ads are disabled.
Do not add live AdSense, adsbygoogle, publisher IDs, or ad slot IDs until a future ad integration task explicitly approves it.
```

---


## 2026-06-14 — Countdown Timer V1 product specification finalized

Decision:

```text
Countdown Timer is Timiva V1's third tool.
The product / interaction / layout specification is mostly finalized.
This is not a production implementation task yet.
```

Scope:

```text
Countdown Timer is a general countdown timer.
It is not Pomodoro, Stopwatch, Fullscreen Timer, floating timer, or PWA in V1.
```

Core interaction decisions:

```text
Quick Start buttons are one-tap starts, not additive settings.
Last duration appears as the first Quick Start option after a duration has actually been started.
Mobile tapping the central time opens Custom time bottom sheet.
Desktop tapping the central time enters inline edit.
Sound defaults to off and can be toggled during countdown.
Active countdown uses target end time for accurate recalculation after returning from background.
Refreshing does not restore an active countdown; only Last duration and sound preference may persist.
```

Layout decisions:

```text
Mobile portrait keeps all main operations in the first screen.
Mobile landscape hides Quick Start and uses a three-column compact layout: Cancel left, ring/time center, primary control right.
Desktop keeps the same main visual structure, shows Quick Start in one row, and uses standard Timiva capsule controls near the timer instead of bottom-fixed controls.
```

Custom sheet decision:

```text
Custom time bottom sheet uses Hours / Minutes / Seconds inputs with fixed labels and no default focus.
The sheet primary action is Apply and start / 套用並開始.
The sheet Cancel uses a plain text-button style, referencing the Clear button inside the Date Range Calculator sheet.
This sheet Cancel style does not apply to the main timer Cancel control.
```

---

## 2026-06-14 — Mobile Sheet Shared Style should precede Countdown Timer implementation

Decision:

```text
Before implementing Countdown Timer, Timiva should define and preview a shared Mobile Sheet style baseline.
```

Reason:

```text
Countdown Timer will introduce a Custom time bottom sheet.
A shared baseline should be defined first so the new tool does not create another one-off sheet style.
```

Task order:

```text
1. Mobile Sheet Shared Style spec + preview baseline
2. Countdown Timer implementation task
3. Later, optionally align existing sheets if Owner starts a cleanup task
```

Shared style decisions:

```text
Mobile sheet titles are not default.
Use a short title only when the sheet has multiple option groups or the function would otherwise be unclear.
Portrait and landscape fields should use compact inline field language: label on / inside the left side and always visible.
No floating labels and no disappearing labels.
Portrait usually uses one field per row.
Landscape can use 2-column or 3-column rows.
Countdown Timer H / M / S may use three columns even in portrait because time input is a natural group.
```

Button decisions:

```text
Sheet primary actions use the current Timiva capsule button style.
Sheet secondary actions use plain text-button style.
Cancel / Clear-style sheet actions reference the Clear button inside the Date Range Calculator sheet.
```

Protected scope:

```text
Do not modify Event Countdown V2 production behavior in the Mobile Sheet Shared Style task.
Do not modify Date Range Calculator V2 production behavior in the Mobile Sheet Shared Style task.
Do not modify Header, Footer, BaseLayout, or global background.
Do not commit or deploy without Owner approval.
```

---

## 2026-06-14 — Mobile Sheet Shared Style baseline completed

Decision:

```text
Mobile Sheet Shared Style preview baseline is completed and Owner real-device verified.
It is now ready to inform the Countdown Timer Custom time sheet task.
```

Final preview route:

```text
/preview/mobile-sheet-shared-style/
```

Final implementation decisions:

```text
The preview uses the validated /preview/tool shared tool page shell.
The preview adds only an Open sheet test button inside the shared tool page environment.
The task tests only the Mobile Sheet body, overlay, fields, action row, portrait bottom sheet, and landscape compact panel.
It does not create a custom preview-only outer shell.
```

Final landscape decision:

```text
In mobile landscape, only the action row is fixed.
Cancel / Apply and start remain visible.
All inputs live inside one scrollable sheet body:
H / M / S
Name
Start / End
H / M / S do not need to remain fixed in landscape.
Avoid tiny nested scroll areas on iPhone Safari / Chrome.
The first visible input row must not be clipped.
```

Files / architecture:

```text
src/styles/preview/tool-preview-first-screen.css
src/pages/preview/tool.astro
src/pages/preview/mobile-sheet-shared-style/index.astro
src/components/preview/MobileSheetSharedStylePreview.astro
src/styles/tools/tool-mobile-sheet-v2-baseline.css
public/scripts/mobile-sheet-shared-style-preview.js
```

Validation:

```text
Owner real-device testing passed.
Mobile portrait passed.
Mobile landscape passed.
npm run build passed.
Validation report accepted after correcting report date to 2026-06-14.
No production Event Countdown V2 / Date Range Calculator V2 behavior was modified.
No Header / Footer / BaseLayout / global background changes.
```

Minor notes:

```text
Preview msb-scroll-lock is not yet the same as production tool-operation-open.
Portal overlay rules may later be consolidated with tool-overlay-v2-baseline.css.
Landscape height token should be rechecked when integrated into a production tool.
iOS keyboard / interactive-widget behavior still needs tool-level QA during Countdown Timer implementation.
```

---

## 2026-06-14 — Shared component previews must use validated tool page shell

Decision:

```text
Shared tool components should be preview-tested inside the already validated shared tool page shell.
Do not create a separate preview-specific viewport / safe-area / landscape outer shell to test shared components.
```

Reason:

```text
The Mobile Sheet task initially spent unnecessary time re-testing preview outer shell behavior such as viewport-fit, safe-area, Header stacking, and mobile landscape first-screen alignment.
Those behaviors had already been validated in the shared tool page layout.
Future component previews should reuse the common tool page environment so the task tests only the component under review.
```

Rule:

```text
共用工具元件要放在共用工具頁版型中測試。
外層用已驗收的，不重新測；本輪只驗元件本體。
```

---

## 2026-06-14 — New tool implementation order becomes layout-first

Decision:

```text
Timiva 後續新增工具時，正式採用「版型 → 下方內容 → 上方靜態工具畫面 → 互動與動態」的實作順序。
```

Standard order:

```text
1. 建立正確工具頁版型
   先建立 route、V2 tool page shell、Header / Footer、first-screen container、lower content area、drawer / ToolAdSlot disabled 結構。

2. 補下方靜態內容
   先完成 About、How to use、FAQ、FAQ JSON-LD、Related Tools、EN / ZH 文案。

3. 做上方工具靜態畫面
   先不寫互動，確認 mobile portrait、mobile landscape、desktop 的整體視覺、比例、節奏。

4. 最後才加互動與動態
   再做 JS state machine、使用者操作、LocalStorage、bottom sheet、動畫、音效等。
```

Reason:

```text
先建立正確版型與內容，可以避免工具尚未成形時就把時間花在複雜 JS、互動狀態或動態效果上。
這個順序能讓 Owner 先確認頁面是否像 Timiva 工具，再進入高風險互動開發。
也能降低 layout drift、減少回頭重修版型與測試環境的成本。
```

Rules:

```text
B0 scaffold 必須使用既有 V2 工具頁共用版型，不是只有 Header / Footer + 空白內容。
下方 About / How to use / FAQ / Related Tools 可以在上方工具靜態畫面之前先完成。
上方工具靜態畫面完成並經 Owner 視覺確認後，才開始工具互動程式。
不要在同一批次混做版型、內容、靜態 UI、state machine 與動態效果，除非 Owner 明確批准。
```

Application:

```text
Countdown Timer 開始採用此順序：
B0：V2 工具頁版型 scaffold
B1A：下方內容層（About / How to use / FAQ / Related Tools）
B1B：上方工具靜態畫面
B2+：互動程式、state machine、sheet、音效與動態效果
```

---

## Standing decision — Product direction

Decision:

```text
Timiva is a mobile-first, Widget-like time and daily rhythm tool site.
```

Core principle:

```text
少工具，但每個都超舒服。
```

Avoid:

```text
Traditional tool site
Dense SEO portal
Large productivity app
Feature-heavy dashboard
Backend/database-heavy service
```

---

## Standing decision — Owner approval

Decision:

```text
Timiva is currently in Phase A: Owner-led confirmation.
```

Rules:

```text
Agents passing does not mean automatic launch.
Cursor finishing does not mean commit is allowed.
Build passing does not mean deploy is allowed.
Owner must explicitly approve next step, commit, or deploy.
```

---

## 2026-06-05 — Countdown Timer Desktop V1 closure corrections

Decision:

```text
Countdown Timer Desktop V1 is feature-complete (PASS WITH NOTES closure).
This entry records copy / localization / doc alignment only; no timer logic or layout changes.
```

Quick Start visibility:

```text
Countdown / Paused: Quick Start and Last are hidden.
To switch to another preset: Cancel back to Ready, then choose a new Quick Start.
Do not document or implement in-place Quick Start switching during an active countdown.
```

Desktop tick ring:

```text
Desktop tick ring is a pure state visual in Desktop V1.
No drag, snap, pointer interaction, or aria slider on Desktop V1.
Mobile dial interaction remains a later Mobile phase task.
```

Copy / localization:

```text
ZH completion state: 時間到了 (no exclamation).
EN completion state: Time's up (unchanged).
ZH FAQ first Pomodoro mention: 番茄鐘（Pomodoro Timer）; subsequent mentions: 番茄鐘.
Last chip: single space between prefix and duration; no middle dot.
EN Last duration: s / m / h with spaces between units.
ZH Last duration: 秒 / 分 / 小時 with no extra spaces inside duration.
Script cache-bust: /scripts/countdown-timer.js?v=desktop-closure-v1 on both EN and ZH routes.
```

---

## 2026-06-21 — Countdown Timer final accepted product decisions

Status: Accepted · Owner real-device confirmed · Final QA PASS WITH NOTES · Not committed · Not deployed

### Ring and layout mode

Decision:

```text
Desktop tick ring remains a pure state visual. No drag, snap, pointer interaction, or aria slider on desktop.
Mobile portrait uses a 60-tick interactive ring (1 tick = 1 minute).
Mobile landscape hides the ring entirely; no ring interaction in landscape.
Layout mode gating: desktop inline edit at min-width 768px unless mobile-landscape interaction query matches.
```

### Ring 0 / 60 rule

Decision:

```text
Initial ready state with no user ring interaction: 0 minutes / 00:00, 12 o'clock origin hint only.
After user tap or drag: 12 o'clock position maps to 60 minutes.
Selecting 60 minutes makes the 12 o'clock tick the active main-length tick.
When selection exists and is not 60 min, 12 o'clock origin demotes to major tick length.
```

### Ring indicator visual

Decision:

```text
Do not use a dot handle or extra overlay radial line.
Apply selection directly to existing tick elements via main-length geometry.
Pressed and active ticks share main-length; brightness / stroke-width differentiate pressed state.
```

### Mobile Custom sheet

Decision:

```text
Mobile portrait and mobile landscape share one Custom time sheet implementation (shared Mobile Sheet baseline).
Apply and start immediately starts countdown.
Sheet Cancel uses plain text style; Apply and start uses capsule button.
Do not use tool-operation-open for Countdown Timer scroll lock; use msb-scroll-lock / msb-sheet-open only.
Real-device keyboard / visualViewport validation is required before treating sheet work as complete.
```

### Quick Start and controls

Decision:

```text
Quick Start chips are one-tap starts using target end timestamp.
Countdown / Paused: Quick Start and Last hidden.
To switch preset during active countdown: Cancel to Ready first, then choose new Quick Start.
Mobile portrait Quick Start: maximum two rows; long Last may rebalance chips (e.g. 5m to row 2); no third row.
```

### Landscape multilingual buttons

Decision:

```text
Cancel / Start / Pause / Resume / Done use content-driven width with white-space: nowrap.
Do not use locale-specific fixed button widths.
Grid side columns use minmax(0, 1fr) auto minmax(0, 1fr); buttons use width: max-content.
```

### Persistence and refresh

Decision:

```text
Refresh does not restore an active countdown.
Only Last duration and Sound preference are stored in localStorage.
Last updates only after user actually starts a countdown.
Done returns to 00:00; Last chip remains available.
```

### Completion copy

Decision:

```text
EN Time's up: Time's up
ZH Time's up: 時間到了
Done returns to initial 00:00 ready state.
No Restart button.
```

### Verification and release state

Decision:

```text
Countdown Timer passed Owner real-device verification on Desktop, Mobile portrait, Mobile landscape, EN, and ZH.
Final QA: PASS WITH NOTES (no P0/P1/blocking P2).
Post-QA: trailing whitespace cleanup and documentation sync complete; commit ready.
Not committed. Not deployed.
Script cache-bust at Final QA: /scripts/countdown-timer.js?v=b3p2c-main-length on EN and ZH routes.
```

---

## 2026-06-21 — Shared drawer baseline consolidation

Status: Accepted · QA-002 spot-check PASS on preview

Decision:

```text
Related Tools drawer ToolCard hover suppression (no translateY) moves from per-tool CSS to tool-drawer-v2-baseline.css.
tool-result-v2-baseline.css imports tool-drawer-v2-baseline.css so ECV2, DRV2, and Countdown Timer share the same rule.
Selectors: [data-event-countdown-v2] [data-preview-drawer], [data-date-range-v2] [data-drv2-drawer], [data-countdown-timer-v2] [data-ctv2-drawer].
Hover rule: transform none, translate none, subtle border/background change only.
```

Reason:

```text
Avoid duplicating identical drawer hover overrides across V2 tool stylesheets.
Countdown Timer needed the same drawer behavior; consolidation reduces drift.
```

---
