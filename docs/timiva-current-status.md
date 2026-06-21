# Timiva Current Status

> 用途：這是每次開新討論串、給 Cursor 任務、或請 ChatGPT 判斷專案狀態時的主要事實來源。  
> 更新日期：2026-06-21
> 狀態來源：整合既有 Timiva docs、Home Content & Animation final validation report、Event Countdown V2 / Date Range V2 Owner real-device checks、Legal Pages / Footer language switch handoff、2026-06-13 Date Range V2 migration、2026-06-14 Countdown Timer 規格 / 實作啟動 / Mobile Sheet Shared Style 前置工作、2026-06-21 Countdown Timer Owner 全平台實機驗收 / Final QA / Post-QA 文件同步完成。

---

## 1. Project snapshot

| Item | Current status |
|---|---|
| Project | Timiva |
| Domain | `timiva.app` |
| Registrar | Porkbun |
| Deployment | Cloudflare Pages |
| Framework | Astro |
| Styling | Tailwind CSS |
| Languages | English / 繁體中文 |
| Core direction | Mobile-first, Widget-like, calm, low-maintenance |
| Business model | Search traffic + future Google AdSense |
| Maintenance direction | Pure frontend first, low maintenance |
| Owner phase | Phase A：Owner 主導確認期 |
| Current session status | Countdown Timer 已完成實作、Owner 全平台實機驗收、Final QA PASS WITH NOTES；post-QA 文件同步完成，commit ready；尚未 commit / deploy |

---

## 2. Current completed scope

### 2.1 Core project foundation

```text
Astro project foundation
English / Traditional Chinese route structure
Home / Tool / All Tools / Legal Text page types
Header / Footer / BaseLayout baseline
Preview layout baseline
Design / layout / Tailwind / SEO / QA docs
Four-Agent review model
CEO Workflow
```

### 2.2 Home pages completed and deployed

The English and Traditional Chinese home pages have completed the Home Content & Animation task, passed final check, and have been deployed.

Completed home scope:

```text
/en/
/zh/
Hero title / subtitle updated
Hero CTA buttons removed
Hero chips added as visual-only, non-interactive labels
Featured tool cards updated to 4 tools:
Event Countdown → Date Range Calculator → Countdown Timer → Life Progress Bar
View all tools retained
FAQ & Help added with 7 Q&A per locale
Ad Container implemented but production state is-disabled
Home JSON-LD added:
WebSite
Organization
ItemList
FAQPage
Home entrance animation added with prefers-reduced-motion support
```

Home page verification:

```text
Owner real-device testing passed for both English and Traditional Chinese home pages.
Mobile portrait passed.
Mobile landscape passed.
Desktop passed.
npm run build passed.
Final check passed.
Deployed.
```

Home animation decision:

```text
Lightweight entrance animation remains enabled.
Existing ToolCard hover remains unchanged.
Animated glow overlay was tested and disabled because it made the page feel slow to load.
Do not re-enable Home / All Tools animated glow overlay in V1 unless a new performance-focused task explicitly approves it.
Static glow can be discussed later, but animated glow overlay is currently out of scope.
```

Deferred from home task:

```text
Tool page WebApplication schema for future tools / future refinement
Countdown Timer / Life Progress unavailable-card UX
All Tools page content update
Live ads / AdSense integration
```

### 2.3 Completed / verified tool pages

```text
Event Countdown V2
Date Range Calculator V2
Countdown Timer
```

---

## 3. Event Countdown V2 current status

Event Countdown V2 is completed and should be treated as a stable baseline.

Routes:

```text
/en/event-countdown/
/zh/event-countdown/
```

Current verified state:

```text
EventCountdownV2 i18n, client messages, route meta helper, FAQ / JSON-LD, related tools, share feedback, theme sheet, edit sheet, and quick templates are working.
Chinese quick templates use titles: 2027 新年, 2026 聖誕節, 2027 情人節.
Owner real-device testing passed.
Mobile portrait passed.
Mobile landscape passed.
Desktop passed.
```

2026-06-13 overlay regression note:

```text
During Date Range V2 overlay baseline extraction, Event Countdown V2 overlay briefly regressed because the sheet overlay is teleported to document.body and scoped selectors no longer matched.
The regression was fixed by supporting body-level overlay selectors.
Event Countdown V2 Edit / Theme backdrop, scroll lock, and backdrop click-to-close are confirmed normal again.
Do not modify Event Countdown V2 core logic unless a task explicitly targets it.
```

Ad state:

```text
Event Countdown V2 ToolAdSlot main / sidebar placeholders exist but production state is-disabled.
No visible ad placeholder should render on the live page.
No live AdSense script is connected.
```

---

## 4. Date Range Calculator V2 current status

Date Range Calculator has been migrated to the new V2 tool page layout and verified across desktop, intermediate RWD, mobile portrait, and mobile landscape.

Routes:

```text
/en/date-range-calculator/
/zh/date-range-calculator/
```

Primary implementation status:

```text
DateRangeCalculatorV2 component added.
EN / ZH routes switched to V2.
Drawer / sidebar layout included as part of tool page baseline.
FAQ JSON-LD included.
Related Tools included.
ToolAdSlot main / sidebar included but production state is-disabled.
Old DateRangeCalculator component retained for rollback.
Date Range calculation logic was not rewritten.
```

Main commit:

```text
Date Range V2 main migration commit: 2b496b4
Deploy status: not deployed in this discussion.
```

### 4.1 Date Range V2 desktop verified state

```text
Desktop layout passed Owner check.
Inline calendar is visible on desktop.
Main result number uses 11rem visual scale.
Tool title → main result spacing final value: 8px.
Stage width / scale confirmed visually balanced.
Main ToolAdSlot is-disabled and does not render.
Sidebar ToolAdSlot is-disabled and does not render.
```

### 4.2 Date Range V2 intermediate RWD verified state

```text
Desktop → mobile intermediate breakpoints passed Owner check.
899px–824px range uses mobile-portrait-level capsule button size.
899px–824px range no longer misclassified as mobile landscape compact.
No duplicate Start date — End date controls.
Calendar no longer appears in the wrong position.
```

### 4.3 Date Range V2 mobile portrait verified state

```text
Mobile portrait passed Owner check.
First screen uses grid-style stage: result group + bottom action capsule.
Start date — End date capsule uses 56px-level mobile button size.
Calendar is opened through bottom sheet / panel behavior.
Mobile portrait does not need further adjustment unless a new task explicitly targets it.
```

### 4.4 Date Range V2 mobile landscape verified state

Mobile landscape was refined after multiple real-device checks.

Final first-screen behavior:

```text
Back Timiva remains at top-left.
Tool title + result row are treated as one visual group and vertically centered in the available first-screen area.
Start date — End date capsule is pinned to the first-screen bottom area with safe-area protection.
No scroll is needed to see tool title, results, and action capsule.
```

Final result row behavior:

```text
Total Days / Workdays / Weekends are displayed as three equal columns.
All three numbers use the same size.
Number scale aligns with Event Countdown V2 mobile landscape compact result number level.
Labels are uniform in size, color, and spacing.
```

Final opened panel behavior:

```text
Landscape opened panel uses two date fields side by side:
[ Start date field ] [ End date field ]
Clear dates appears on the second row, left-aligned, as a pure text button.
Start / End fields follow Event Countdown V2 sheet input language:
label inside field, label remains visible, value inside field, glass surface, border, rounded corners, full-field tap target.
Clear dates uses Event Countdown quick-template-like text size and color.
```

### 4.5 Date Range V2 overlay / scroll lock

```text
Date Range mobile portrait bottom sheet uses shared overlay / scroll lock baseline.
Date Range mobile landscape panel uses shared overlay / scroll lock baseline.
Opened state has semi-transparent backdrop overlay.
Background page scroll is locked while panel is open.
Backdrop click closes the panel.
Scroll lock is removed after close.
```

### 4.6 Date Range V2 ad state

```text
Main ToolAdSlot: is-disabled.
Sidebar ToolAdSlot: is-disabled.
is-disabled means ToolAdSlot does not render: no dashed frame, no size label.
48px stage → lower content spacing remains handled by tool-result-v2-baseline.css.
No live AdSense script is connected.
```


---

## 5. Countdown Timer current status

Countdown Timer is Timiva V1's third tool and has completed implementation, Owner real-device verification, and Final QA (PASS WITH NOTES).

Routes:

```text
/en/countdown-timer/
/zh/countdown-timer/
```

Status:

```text
Desktop / Mobile portrait / Mobile landscape
EN / ZH
Implementation complete
Owner real-device confirmed (2026-06-21)
Final QA: PASS WITH NOTES resolved / commit ready (2026-06-21)
Not committed
Not deployed
```

Core features:

```text
Quick Start: Last / 30s / 1m / 5m / 10m / 25m / 1h
Target end timestamp countdown
Desktop inline edit with two-step Enter
Mobile shared Custom time sheet (H / M / S validation)
Start / Pause / Resume / Cancel
Progress ring
Time's up / Done
Sound preference / completion sound
Last duration in localStorage
Refresh does not restore active countdown
```

### 5.1 Mobile portrait final spec

Ring interaction:

```text
60 visible ticks; each tick = 1 minute
Tap and continuous drag supported
Pointer capture on ring hit area
touch-action: none only on ring hit area; drag does not scroll page
1-minute snap
Initial no selection = 0 minutes / 00:00
After interaction, ring selects 1–60 minutes
12 o'clock = 60 minutes when selected
Selected tick uses existing tick line (main-length); no dot; no overlay radial line
When selection exists and is not 60 min, 12 o'clock origin tick demotes to major length
Done returns to 00:00 and restores origin hint
```

Visual:

```text
h:mm:ss long format ≈ 0.8× short mm:ss size
Quick Start fixed two rows
Long Last uses 3 + 4 chip layout (5m may move to row 2)
Future locales: horizontal scroll instead of a third row if two rows overflow
Sheet open: main visual scales to ~90%
Keyboard open: no second scale pass
```

### 5.2 Mobile landscape final spec

```text
Cancel / Time / Primary three-column layout
No ring / Sound UI / Quick Start / Last UI
Tap central time opens shared Custom sheet
Keyboard closed: compact content-driven sheet height
Keyboard open: visualViewport sync; H/M/S and action row remain visible
Sheet open: central time slightly scaled down
Multilingual buttons: content-driven width, white-space: nowrap, no locale-specific fixed width
Sound preference and Last logic still apply without visible UI
```

### 5.3 Desktop final spec

```text
48-tick decorative ring (non-interactive)
Inline edit on central time
Quick Start one row
Sound toggle visible
Two-step Enter: first Enter applies edit and focuses Start; second Enter starts
```

### 5.4 Implementation artifacts

```text
src/components/tools/countdown-timer-v2/CountdownTimerV2.astro
src/styles/tools/countdown-timer-v2.css
public/scripts/countdown-timer.js?v=b3p2c-main-length
src/lib/countdownTimerRouteMeta.ts
src/pages/en/countdown-timer/
src/pages/zh/countdown-timer/
docs/timiva-countdown-timer-spec-v1.md
```

Ad state:

```text
ToolAdSlot main / sidebar: is-disabled
No visible ad placeholder on live page
No live AdSense script connected
```

---

## 6. Shared V2 tool baselines established on 2026-06-13

### 6.1 Tool result baseline

```text
src/styles/tools/tool-result-v2-baseline.css
src/styles/tools/tool-drawer-v2-baseline.css (imported by result baseline)
```

Baseline rules:

```text
Tool stage → lower content minimum spacing: 48px.
Desktop title → main result gap: 8px where applicable.
Mobile landscape title → result rhythm should align across V2 tools.
Result number color / result label language should stay consistent across V2 tools.
Individual tools may adjust number size and layout depending on content density.
Related Tools drawer ToolCard hover: no translateY; shared in tool-drawer-v2-baseline.css for ECV2 / DRV2 / Countdown Timer.
```

### 6.2 Tool overlay baseline

```text
src/styles/tools/tool-overlay-v2-baseline.css
```

Baseline rules:

```text
Shared semi-transparent dark backdrop overlay for tool sheets / panels.
Shared scroll lock class: body.tool-operation-open.
Backdrop click should close the active sheet / panel.
Close should remove overlay and scroll lock.
Portrait and landscape may use different panel height / layout, but overlay visual language should stay consistent.
```

Important note:

```text
Event Countdown V2 overlay is teleported to document.body.
Overlay CSS must support body-level selectors where needed.
Do not scope overlay rules so tightly that teleported overlays lose backdrop / pointer events.
```

### 6.3 Tool ad placeholder baseline

```text
ToolAdSlot supports main / sidebar variants.
Main desktop target: 728x90.
Main mobile portrait target: 320x100.
Main mobile landscape should remain hidden.
Sidebar ad is desktop/sidebar only and must be responsive to drawer width.
Live AdSense is not connected.
Current tool ad slots are is-disabled in production state.
```

---

## 7. Legal pages completed

The following six pages are completed as independent Markdown content files loaded through `LegalTextLayout`:

```text
/zh/privacy/
/zh/terms/
/zh/contact/
/en/privacy/
/en/terms/
/en/contact/
```

Legal page architecture:

```text
Markdown content files
+
Astro route entries
+
LegalTextLayout
```

Legal page decisions:

```text
Chinese label: 使用條款, not 使用規範.
English Footer label: Terms.
English page H1 / meta title: Terms of Use.
Legal / Text pages do not contain ads.
```

---

## 8. Footer language switch completed

Footer language switch keeps the user on the corresponding page route.

Examples:

```text
/zh/privacy/ → /en/privacy/
/en/privacy/ → /zh/privacy/
/zh/terms/ → /en/terms/
/en/terms/ → /zh/terms/
/zh/contact/ → /en/contact/
/en/contact/ → /zh/contact/
/zh/event-countdown/ → /en/event-countdown/
/en/event-countdown/ → /zh/event-countdown/
/zh/date-range-calculator/ → /en/date-range-calculator/
/en/date-range-calculator/ → /zh/date-range-calculator/
/zh/countdown-timer/ → /en/countdown-timer/
/en/countdown-timer/ → /zh/countdown-timer/
```

---

## 9. Current locked / protected areas

Unless a task explicitly says otherwise, do not modify:

```text
Header
Footer visual layout
BaseLayout
Global background
Preview layout baseline
ToolCard baseline
RelatedToolRow baseline
Tool Drawer baseline
LegalTextLayout spacing
EventCountdownV2 core logic
EventCountdownV2 theme / share / quick template logic
Date Range Calculator calculation logic
Date Range start / end date selection core logic
ToolAdSlot visual style
```

If a task seems to require touching these areas, Cursor must stop and ask for Owner approval first.

---

## 10. Current no-go list

Do not do these unless Owner explicitly starts a new task:

```text
Do not redesign Event Countdown V2.
Do not redesign Date Range V2.
Do not rewrite Legal Pages layout.
Do not add visible ads to live pages yet.
Do not add ads to Legal / Text pages ever.
Do not connect live AdSense / adsbygoogle / publisher id yet.
Do not re-enable Home / All Tools animated glow overlay in V1 unless Owner explicitly starts a new performance task.
Do not modify Footer visual layout.
Do not modify BaseLayout or global background.
Do not add member system, backend, database, login, cloud sync, social features, leaderboard, or push backend.
Do not generate large programmatic SEO pages yet.
Do not commit / deploy without Owner confirmation.
```

---

## 11. Current active next step

Owner decision after Countdown Timer Final QA (2026-06-21):

```text
Countdown Timer implementation and Owner real-device verification are complete.
Post-QA documentation sync and commit readiness check are complete.
Awaiting Owner approval before commit.
Not deployed.
```

Suggested next Cursor flow after commit:

```text
Owner-approved commit of Countdown Timer production files + formal docs.
Optional: ECV2 / DRV2 drawer hover spot-check on deployed preview if desired.
Then: All Tools content update, Pre Deploy Final Check, or Life Progress Bar planning.
```

---

## 12. Possible next product tasks

Choose one in the next session:

```text
1. Countdown Timer commit (after Owner approval)
2. All Tools final content check after Countdown Timer
3. Timiva V1 Pre Deploy Final Check
4. Life Progress Bar planning / implementation
5. Cloudflare Pages / formal domain final confirmation
6. Ad placeholder strategy only; ads remain disabled
```

Suggested priority:

```text
Countdown Timer commit first (Owner-approved file set).
Then All Tools update or Pre Deploy Final Check before deploy.
```

---

## 13. How to start a new Cursor task

Use this command:

```text
Read AGENTS.md, docs/timiva-current-status.md, and docs/tasks/[TASK_FILE].md.
Create an implementation plan only. Do not edit files yet.
```

Then review Cursor's plan before allowing edits.

---

## 14. How to start a new ChatGPT discussion

Paste this short context:

```text
這是 Timiva 專案。請以 AGENTS.md 和 docs/timiva-current-status.md 為主要上下文。
目前 Timiva 已完成並部署 EN / ZH 首頁，已完成 Event Countdown V2、Date Range Calculator V2，並完成 Countdown Timer 實作與 Owner 全平台實機驗收。
Countdown Timer Final QA: PASS WITH NOTES；post-QA 文件已同步；commit ready；尚未 commit / deploy。
Date Range V2 與 Event Countdown V2 為 stable baseline；shared drawer hover 規則已 Consolidate 至 tool-drawer-v2-baseline.css。
目前工具頁廣告預留區為 is-disabled，不顯示，也未接入 AdSense。
首頁 animated glow overlay 已因實機 loading 體感變慢而停用；V1 不要重新啟用。
不要重新推翻已驗收設計或主動建議修改 locked components，除非 Owner 明確開新 task。
```
