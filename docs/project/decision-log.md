# Timiva Decision Log

> 用途：記錄已確認的產品、設計、技術、SEO、法務與工作流決策。
> 原則：只記錄「之後會影響判斷」的決策，不記錄每個小修改細節。

---

## 2026-06-28 — GA4 採 privacy-first Basic Consent

### 背景

```text
Timiva 需要了解網站與工具使用情況以改善產品，但必須在使用者明確同意前避免載入 Google tag 或傳送 Analytics 資料。
廣告（AdSense）仍屬未來範圍，不可與 Analytics consent 混為一談。
```

### 決策

```text
使用 Google Analytics 4 direct Google tag（gtag.js）
不使用 Google Tag Manager
未取得明確同意前不載入 Google tag
unknown / rejected 不傳送 Analytics
accepted 才允許 analytics_storage = granted
ad_storage、ad_user_data、ad_personalization 永遠 denied
Consent 儲存於 LocalStorage（timiva.analytics.consent，v:1）
使用者可從 Footer Analytics settings / 分析設定變更選擇
consentSaved 與 tagLoaded 必須分離（Save 成功不等於 tag 已載入）
localhost 可保存 consent，但不得載入 tag（零 googletagmanager request）
Google Signals 與 user-provided data collection 關閉
不使用 Google Ads 或廣告個人化（透過此 analytics 設定）
Measurement ID 只能由 PUBLIC_GA_MEASUREMENT_ID 提供
無 env 時 Consent UI、Footer 分析設定、script 引用必須完全停用
Privacy / Terms（EN / ZH）必須與實作同步
scripts/validate-analytics-consent.mjs 為正式防回歸 validator
```

### 邊界

```text
廣告仍屬未來可能範圍；Legal 已分開描述，未啟用 AdSense 或廣告追蹤。
不在 repo 內硬編碼 Measurement ID。
不在 localhost / 無 env build 輸出 Consent 或載入 tag。
```

### 驗證

```text
Batch A–D 完成
Owner 實機 QA：通過
validate-analytics-consent.mjs：disabled 179/0 · placeholder enabled 172/0
runtime harness：50/0
validate-tool-link-integration.mjs：176/0
```

---

## 2026-06-28 — Countdown Timer 完成提示音改用本地音檔

### 背景

```text
原本使用 Web Audio API 三音 chime。
桌機低系統音量下過小聲。
iPhone 靜音模式會使 Web Audio 無聲。
Owner 平常長期使用靜音模式與低媒體音量。
```

### 決策

```text
使用原創本地 WAV（public/audio/countdown-complete.wav）
搭配 HTMLAudioElement 作為主要完成提示音。
既有 Web Audio chime 保留為 fallback。
```

### 原因

```text
提高低音量下的可辨識度
改善 iPhone 靜音模式的真實使用情境
不新增外部套件
不依賴遠端音訊資源
維持既有 UI、狀態機與 Sound preference（timiva-countdown-timer-sound-enabled）
```

### 邊界

```text
只保證頁面位於前景時的提示音。
不承諾背景、鎖屏或原生鬧鐘能力。
```

### 驗證

```text
Owner 已完成桌機與 iPhone 實機驗收。
iPhone 靜音模式開啟與關閉皆可播放。
低媒體音量下可辨識。
npm run build 通過。
已 push 至 origin/main（5ee7613）。
Cloudflare Pages 線上驗收通過。
```

規格：`docs/tools/countdown-timer/product-spec.md` §7.4、不可回歸條件

---

## 2026-06-27 — Global Interactive Cursor Baseline

Decision:

```text
Promote cursor behavior to a global semantic base rule in src/styles/global.css.
Remove cursor ownership from Utility Capsule baseline.
```

Context:

```text
Initial Owner finding appeared limited to Year Progress and Event Countdown.
A temporary cursor:pointer was added to .tool-utility-control.
Broader review showed Tailwind v4 button cursor behavior affected the whole site.
```

Result:

```text
Global baseline: cursor for enabled semantic interactive elements
Utility Capsule baseline: transition, hover lift, shadow, active reset only
```

Validator：`node scripts/validate-global-interactive-cursor-baseline.mjs`

Follow-up (same day):

```text
Redundant local cursor:pointer and cursor-pointer removed from ordinary semantic controls.
Global base layer is the sole ordinary pointer source.
Later-loaded local pointer rules must not override disabled / aria-disabled default.
```

---

## 2026-06-27 — Global Interactive Cursor + Utility Capsule Owner approval

Decision:

```text
Global Interactive Cursor Baseline and Shared Utility Capsule Control Baseline
passed automated validation and Owner real-device verification (2026-06-27).

Global base layer is the sole ordinary semantic pointer source.
Utility Capsule baseline owns motion only.
Year Progress B3 final standalone approval passed.

Next gate: standalone commit.
```

Owner verification covered:

```text
Desktop fine pointer, mobile portrait, mobile landscape, EN, ZH
Enabled / disabled / text-input cursor states
EC and YP Utility Capsule hover
Date Range and Countdown Timer regression checks
```

---

## 2026-06-27 — Shared Utility Capsule Control interaction baseline

Decision:

```text
Centralize V2 Utility Capsule Control interaction in tool-utility-control-v2-baseline.css.
Semantic opt-in class: .tool-utility-control
```

Triggered during:

```text
Year Progress B3 Owner final review — Theme / Share hover inconsistency vs Event Countdown
```

Actions:

```text
Event Countdown interaction promoted from local reference to shared baseline
Year Progress local duplicate hover / transition removed
Shared semantic role chosen instead of styling all .preview-tool-control-btn controls
Date Range and Countdown Timer explicitly excluded
```

Included controls:

```text
Event Countdown: Edit, Theme, Share
Year Progress: Theme, Share
```

Excluded examples:

```text
Date Range date trigger (primary task entry)
Countdown Timer Sound (functionally secondary, not a Utility Capsule Control)
Countdown Timer primary row, Quick Start, sheet actions, drawer toggles
```

Canonical rule:

```text
docs/standards/interactive-controls.md
```

當時完成共用互動基準規劃與驗證；現行長期規則已整理至互動控制規範。

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
docs/project/current-status.md
docs/project/decision-log.md
local-docs/tasks/
local-docs/reports/
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

## 2026-06-21 — Countdown Timer final accepted product decisions

Status: Accepted · Owner real-device confirmed · Final QA passed · Committed `77c6aa8` · Not pushed · Not deployed

Decision:

```text
Countdown Timer V2 is complete on Desktop, Mobile portrait, Mobile landscape, EN, and ZH.
The accepted implementation is now frozen except for explicit regression tasks.
```

Final rules:

```text
Desktop tick ring is decorative and non-interactive.
Mobile portrait uses a 60-tick interactive ring with 1-minute snap.
Initial untouched ring state is 0; after interaction, 12 o'clock represents 60 minutes.
Selection modifies existing tick elements; no dot or overlay radial line.
Mobile portrait and landscape share one Custom time sheet implementation.
Mobile landscape hides ring, Sound UI, Quick Start, and Last UI.
Refresh does not restore active countdown.
Only Last duration and Sound preference persist.
```

Commit:

```text
77c6aa8 — feat: add Countdown Timer V2
23 files changed
Build passed
Working tree clean after commit
```

Release state:

```text
Tool implementation committed.
Post-tool Link Integration later completed by Owner confirmation.
The integration commit hash was not provided in this discussion.
Push / deploy status after integration was not provided.
```

---

## 2026-06-21 — Shared drawer baseline consolidation

Status: Accepted · Regression spot-check PASS

Decision:

```text
Related Tools drawer hover suppression is centralized in tool-drawer-v2-baseline.css.
Event Countdown V2, Date Range Calculator V2, and Countdown Timer V2 share the same no-translate drawer card behavior.
```

---

## 2026-06-21 — Post-tool Link Integration Gate adopted

Status: Accepted workflow decision

Decision:

```text
A tool is not considered fully integrated when its standalone implementation is complete.
After Owner real-device verification and the tool implementation commit, every new tool must pass a separate Post-tool Link Integration Gate.
```

Standard flow:

```text
Tool implementation complete
→ Owner real-device confirmation
→ Tool implementation commit
→ Post-tool Link Integration
→ Link Integration QA
→ Link Integration commit
→ Push / Deploy Readiness
```

Required integration scope:

```text
Canonical tool catalog / data source
All Tools inclusion for every published tool
Inbound Related Tools links from relevant existing tools
Home integration only when a card already exists or Owner selects the tool as featured
EN / ZH locale-preserving routes
Alternate paths, canonical, hreflang, sitemap, and ItemList checks where applicable
Build, broken-link, and regression QA
```

Rules:

```text
Do not redesign ToolCard or Related Tools during link integration.
Do not modify the completed tool's core functionality.
Do not hard-code duplicate tool data across Home, All Tools, and Related Tools.
Link Integration should use a separate QA checkpoint and normally a separate commit.
```

Documents:

```text
docs/workflow/tool-link-integration.md
local-docs/tasks/_tool-link-integration-task-template.md
```

First application:

```text
Countdown Timer is the first formal application of this Gate.
Its tool implementation is committed as 77c6aa8.
Completed by Owner confirmation:
- connected the existing Home card
- added Countdown Timer to All Tools
- added Countdown Timer inbound cards to Event Countdown and Date Range Calculator
```

Release state:

```text
Countdown Timer implementation committed.
Link Integration completed by Owner confirmation.
Link Integration commit hash not provided in this discussion.
Push / deploy status after integration not provided.
```

---

## 2026-06-21 — Countdown Timer Post-tool Link Integration completed

Status: Owner confirmed complete

Decision:

```text
Countdown Timer is fully implemented and integrated into site discovery.
The previous “Link Integration pending” status is closed.
```

Completed scope:

```text
Home formal EN / ZH links
All Tools availability
Event Countdown inbound Related Tools link
Date Range Calculator inbound Related Tools link
Locale-aware route behavior
```

Record boundary:

```text
Countdown Timer tool implementation commit remains 77c6aa8.
The Link Integration commit hash was not provided in this discussion.
Do not invent or infer the missing commit identifier.
```

---

## 2026-06-21 — V1 fourth tool changed to Year Progress

Status: Product decision confirmed

Decision:

```text
Timiva V1’s fourth tool is Year Progress / 今年進度.
It replaces the earlier V1 plan for a multi-mode Life Progress Bar.
```

Routes:

```text
/en/year-progress/
/zh/year-progress/
```

Category:

```text
Life Progress / 人生進度
```

Reason:

```text
Year Progress is clearer, zero-input, lower-maintenance, easier to understand in seconds, and better aligned with Timiva’s “few tools, each very comfortable” principle.
```

Future rule:

```text
Do not place Year / Month / Milestone / Life / Goal modes inside one Life Progress Bar tool.
Create focused standalone tools when those concepts are developed.
```

Potential future tools:

```text
Month Progress
Milestone Progress（working name）
Life Timeline
Goal Countdown
```

---

## 2026-06-21 — Year Progress MVP and visual hierarchy confirmed

Status: Product specification confirmed

MVP:

```text
Current-year integer percentage
Days passed / days remaining
One monthly note
12 monthly pill segments
Theme
Share
EN / ZH
About / How to / FAQ / JSON-LD / Related Tools
```

Main visual:

```text
Full-bleed and immersive
No literal card shell
Large percentage is primary
Monthly note is the emotional layer
12 segments provide quiet annual rhythm
```

Responsive:

```text
Mobile portrait and desktop show the full hierarchy.
Mobile landscape hides the monthly note and 12-segment progress.
Mobile landscape keeps the main result and controls compact.
```

Not included:

```text
Life mode
Custom timeline
Milestones
Birth date
Goal date
Habit tracking
Multi-mode switching
Image export
Backend / CMS / database
```

---

## 2026-06-21 — Year Progress calculation and content rules confirmed

Status: Product behavior confirmed; exact code formula must be proposed in Plan-first

Decision:

```text
Use the user device’s local date and local time.
Normal year uses 365 days.
Leap year uses 366 days.
The active year must not display 100% early on Dec 31.
At rollover, the page switches to the new year.
```

12-segment rule:

```text
Always 12 segments.
Past months fully filled.
Current month partially filled using actual month length.
Future months low contrast.
Leap-year February uses 29 days and does not create a 13th segment.
```

Days rule:

```text
Days passed means fully elapsed calendar days before today.
Days remaining includes the current day.
```

Monthly notes:

```text
Use one independent EN / ZH content data file.
One confirmed note per calendar month.
No CMS, backend, daily randomization, AI generation, or user-uploaded notes.
```

---

## 2026-06-21 — Year Progress theme and shared Tool Theme Layer confirmed

Status: Product and architecture boundary confirmed

Decision:

```text
Year Progress extends Event Countdown’s visual language.
Add Mist / 霧光 and Forest / 森光.
Mist is the default Year Progress feeling.
Forest is a low-saturation natural forest theme.
```

Forest boundaries:

```text
Deep green / gray green
Soft forest-like glow
No literal forest image
No leaf pattern
No bright or neon green
```

Shared architecture decision:

```text
Create a reusable Tool Theme Layer for tool-specific first-screen gradients, glows, progress active colors, and control accents.
```

Protected boundary:

```text
The Tool Theme Layer is not the global background.
Do not modify BaseLayout, global background, Header, or Footer.
Year Progress uses the shared layer first.
Do not refactor Event Countdown themes in the same task.
A later Event Countdown migration requires a separate Owner-approved task.
```

---

## 2026-06-21 — Year Progress is ready for Plan-first

Status: Ready

Decision:

```text
Year Progress product discussion is complete enough to begin a repository-aware Plan-first task.
```

Plan-first must determine:

```text
Actual reusable V2 tool shell and component patterns
Actual theme file / token architecture
Actual Event Countdown share reuse
Actual theme persistence alignment
Exact desktop dimensions
Implementation batches and QA gates
```

Plan-first remains no-edit:

```text
Cursor inspects the repository and outputs a plan.
Owner reviews the plan.
No implementation begins before Owner approval.
```

---

## 2026-06-27 — Year Progress Link Integration completed

Status: Committed (commit hash reported at finalize gate; not embedded in this log entry)

Decisions:

```text
- Year Progress replaces the Life Progress placeholder as the fourth V1 Home tool.
- Year Progress uses approved messages.tools.yearProgress copy on Home.
- Explicit fourth-tool Life Progress references on Home were updated to Year Progress.
- toolsCatalog.ts remains the source of truth for Related Tools.
- Countdown Timer now consumes getRelatedTools("countdown-timer").
- Each of the four available tools recommends the other three.
- Legacy ToolRelatedTools.astro remained unchanged because it is not used by production V2 routes.
- Footer tagline wording was shortened without CSS or layout changes.
```

Outcome:

```text
year-progress available:true
Home fourth card: Year Progress
All Tools: Year Progress under Momentum
Related Tools: full four-tool internal-link graph
Link integration validator added
Owner real-device QA passed
Footer tagline EN/ZH refinement passed
Push not performed
Deploy not performed
HTTPS Share verification pending after HTTPS preview/deploy
```
