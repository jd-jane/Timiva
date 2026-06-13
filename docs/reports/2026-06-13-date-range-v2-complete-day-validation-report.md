# Timiva Validation Report — Date Range V2 Complete Day Summary

Date: 2026-06-13  
Task file: `docs/tasks/2026-06-13-date-range-calculator-v2-layout-migration-task-brief.md`  
Git commit: `2b496b4` — *Migrate Date Range Calculator to V2 layout with mobile landscape first-screen polish.*  
Reviewer: Cursor  
Owner QA: **Owner 已回報「測試都正常了」並批准 commit**

---

## 1. Result

```text
Pass
```

2026-06-13 當日 Date Range Calculator 全線調整已完成：V2 layout migration、桌機版、RWD 斷點、手機直式、手機橫式、共用遮罩／scroll lock baseline、spacing baseline、視覺層級、ToolAdSlot 接線。Owner 實機驗收通過；`npm run build` Pass；已 commit（`2b496b4`）。**本報告為整合摘要，未額外 deploy。**

---

## 2. Modified files

```text
新增：
- src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro
- src/styles/tools/date-range-calculator-v2.css
- src/styles/tools/tool-overlay-v2-baseline.css
- src/styles/tools/tool-result-v2-baseline.css
- docs/tasks/2026-06-13-date-range-calculator-v2-layout-migration-task-brief.md
- docs/reports/2026-06-05-date-range-v2-mobile-portrait-bottom-control-validation-report.md
- docs/reports/2026-06-05-date-range-v2-shared-spacing-baseline-validation-report.md
- docs/reports/2026-06-05-date-range-v2-visual-focus-validation-report.md
- docs/reports/2026-06-05-mobile-portrait-first-screen-control-validation-report.md
- docs/reports/2026-06-05-tool-stage-lower-content-spacing-validation-report.md
- docs/reports/2026-06-13-date-range-calculator-v2-layout-migration-validation-report.md
- docs/reports/2026-06-13-date-range-v2-mobile-landscape-first-screen-validation-report.md
- docs/reports/2026-06-13-date-range-v2-complete-day-validation-report.md（本報告）

修改：
- src/pages/en/date-range-calculator/index.astro
- src/pages/zh/date-range-calculator/index.astro
- src/i18n/en.ts
- src/i18n/zh.ts
- src/styles/tool-ad-slot.css
- public/scripts/date-range.js
- public/scripts/countdown-v2.js
- src/components/tools/event-countdown-v2/EventCountdownV2.astro
- src/styles/tools/event-countdown-v2.css
- src/pages/en/event-countdown/index.astro
- src/pages/zh/event-countdown/index.astro
- src/pages/preview/event-countdown-v2.astro
- docs/timiva-current-status.md

保留未刪（rollback 對照）：
- src/components/tools/DateRangeCalculator.astro
- src/styles/tools/date-range.css
- src/styles/tools/tool-design-system.css
```

---

## 3. Summary of changes

本節整合 2026-06-13 當日所有 Date Range 相關調整，依功能區塊與 viewport 分類。

### 3.1 V2 Layout Migration（主架構）

```text
- 新建 DateRangeCalculatorV2.astro：以 Event Countdown V2 為 layout reference，保留 Date Range 主工作區 DOM hooks
- EN / ZH routes 切換至 DateRangeCalculatorV2 + V2 CSS stack
- CSS stack：timiva-tokens → tool-result-v2-baseline → tool-overlay-v2-baseline → date-range.css → date-range-calculator-v2.css
- Lower content：RelatedToolRow + About / HowTo / Common uses / FAQ（<details>）
- FAQ JSON-LD（5 題，與 visible FAQ 一致）
- Desktop drawer（data-drv2-drawer*）+ Sidebar ToolAdSlot + Main ToolAdSlot（state: is-reserved）
- i18n：drawer aria labels、controlsAriaLabel
- 移除 tool-faq-accordion.js 依賴
- 舊 DateRangeCalculator.astro / date-range.css 保留作 rollback
```

### 3.2 桌機版（Desktop）

**Gate：** `(min-width: 900px) and (min-height: 700px) and (hover: hover)`

```text
首屏：
- preview-tool-controls 隱藏（desktop 使用 inline date card + calendar panel）
- tool-desktop-cluster 顯示：date input card + calendar panel
- 主數字 11rem；secondary 36px（desktop gate）
- tool title → main result：8px（--tool-result-stack-gap-desktop via .tool-result-stack）
- tool-desktop-main padding-top / bottom 對齊 V2 rhythm
- stage max-width：480px（--date-range-tool-max）

日曆區（supporting，不搶主結果）：
- calendar-panel 視覺減輕（padding / background / border）
- date cell / nav / clear 維持 min-height 44px
- desktop input card 縮小視覺、min-height 44px

Lower content：
- Main ToolAdSlot is-reserved（728×90 desktop label）
- stage → lower content：48px（--tool-stage-to-lower-content-spacing）
- Sidebar drawer xl+：ToolAdSlot is-reserved + Related Tools
```

### 3.3 RWD 斷點與模式定義

Date Range V2 RWD 與 `public/scripts/date-range.js` 的 `LANDSCAPE_DATE_MEDIA` 對齊：

| 模式 | Media gate | 行為摘要 |
|---|---|---|
| **Desktop** | `min-width: 900px` + `min-height: 700px` + `hover: hover` | Inline calendar + desktop cluster；無 mobile capsule |
| **Non-desktop** | `max-width: 899px` OR `max-height: 699px` OR `hover: none` | Bottom sheet；desktop cluster 隱藏 |
| **Portrait** | `orientation: portrait` + non-desktop | Grid 首屏（1fr + auto）；capsule 在 stage row 2 |
| **Landscape compact** | `orientation: landscape` + `max-height: 700px` + `max-width: 1200px` + non-desktop | 三欄結果 + bottom capsule + landscape date panel |
| **Intermediate width** | `824px–899px` landscape | **Portrait 尺寸** capsule（非 compact 小按鈕） |
| **Narrow landscape** | `max-width: 823px` landscape | Compact 按鈕尺寸（min-height 1.75rem） |

**關鍵斷點決策（Owner 已確認）：**

```text
824–899px：landscape 仍用 portrait 膠囊 touch target（非 compact）
≤823px landscape：compact 按鈕尺寸
601px tool-design-system inline calendar：V2 non-desktop 以 [data-date-range-v2] 覆寫，強制 bottom sheet
date-range.css landscape shrink-to-content：V2 以 flex:1 高度鏈覆寫
```

### 3.4 手機直式（Mobile Portrait）

**Gate：** `(orientation: portrait)` + non-desktop

```text
首屏結構：
- preview-tool-stage：grid rows minmax(0,1fr) auto @ min-height 100dvh
- Row 1：preview-tool-result-group 垂直置中（title + multi-result）
- Row 2：preview-tool-controls 日期膠囊（非 fixed bottom bar）
- 膠囊隨首屏滾動離開，不 sticky viewport

控制項：
- 移除 legacy mobile-bottom-control fixed bar
- preview-tool-control-btn：共用 56px portrait baseline（≥ Back Timiva 44px）
- calendar icon 1.125rem；aria-controls=range-sheet

Bottom sheet：
- range-sheet fixed bottom；handle / footer / backdrop 恢復
- sheet open：hide preview-tool-controls；result group shrink animation
- max-height：min(58dvh, 400px)

Spacing：
- stage → lower content：48px（main-section padding-bottom on portrait）
- Main ToolAdSlot top：48px（tool-ad-slot.css）
```

### 3.5 手機橫式（Mobile Landscape）

**Gate：** landscape compact + non-desktop（見 §3.3）

#### 第一屏（未展開）— Owner 本日重點驗收

```text
結構（有別 ECv2）：
- Back Timiva：header 區
- 標題 + 三欄結果：整組在 row 1 可用空間垂直置中
- 日期膠囊：grid row 2 貼底（不與結果同組置中）

高度鏈：
- main-section：100dvh + negative margin-top（對齊 ECv2）
- 覆寫 date-range.css tool-desktop-main flex:0 0 auto
- grid-template-rows: minmax(0,1fr) auto

三欄數字：
- 字級 5rem（對齊 ECv2 主數字 202）
- grid-template-columns: repeat(3, auto)
- column-gap: 2rem（個位/十位/百位欄距固定）
- tabular-nums + nowrap

膠囊可觸：
- controls bottom inset 1rem + safe-area
- 修正首屏需微滑才能點到的問題

節奏 token：
- title→result gap: 0.125rem
- label: 0.6875rem
- stage→controls gap: 0.375rem
```

#### 展開面板（Owner 已確認 frozen）

```text
- ECv2 風格 landscape sheet：handle、backdrop、scroll lock
- 水平 input shell（prefix label + value inline）
- 文字 Clear dates（drv2-landscape-clear-text）
- max-height: min(40dvh, 9.75rem)（對齊 ECv2）
- open 時 result group: scale(0.9) translateY(-1.25rem)
- landscape field tap-to-open picker（date-range.js）
```

### 3.6 遮罩／Scroll Lock 統一（tool-overlay-v2-baseline.css）

```text
新建共用 baseline，Date Range V2 + Event Countdown V2 共用：

Backdrop 統一 class 族：
- .tool-operation-overlay
- .tool-sheet-overlay / .range-sheet-backdrop / .range-compact-overlay
- [data-tool-operation-overlay]

Opened 狀態：
- .is-visible / .is-open → opacity 1 + pointer-events auto
- --tool-operation-overlay-bg: rgb(8 12 28 / 0.42)
- --tool-operation-overlay-z: 50

Scroll lock 統一 body class：
- tool-operation-open（新增，Date Range + ECv2 共用）
- tool-sheet-open / range-sheet-open / ecv2-sheet-open（保留相容）

Date Range JS 更新：
- lockBodyScroll / forceUnlockBodyScroll 同步 tool-operation-open
- landscape compact open：overlay is-visible + lockBodyScroll
- closeCompactDatePanel：移除 is-visible + conditional unlock

ECv2 特殊處理：
- overlay teleported 至 document.body
- body:has([data-event-countdown-v2]) > [data-ecv2-sheet-overlay] 選擇器
- countdown-v2.js：lock/unlock 同步 tool-operation-open
- event-countdown-v2.css：移除重複 overlay/scroll lock（改引用 baseline）
```

### 3.7 共用 Spacing Baseline（tool-result-v2-baseline.css）

```text
--tool-result-stack-gap-desktop: 8px（後續 Owner 確認 8px，非最初 24px draft）
--tool-stage-to-lower-content-spacing: 48px
--tool-main-ad-top-spacing: 48px
--tool-mobile-portrait-control-* tokens（56px touch target 等）

.tool-result-stack / .tool-title / .tool-lower-content / .tool-stage 語意 class
Portrait：stack gap 不套用，保留 per-tool mt-*
Landscape compact：lower content margin-top: 0
ECv2 + Date Range V2 皆引入 baseline
```

### 3.8 視覺層級（Visual Focus）

```text
- 主數字：preview-tool-result-number 實色 rgb(248 250 252)，移除 V1 gradient
- Mobile portrait 主數字 clamp 放大；desktop 11rem
- Secondary stats 縮小、opacity 72%，與 Total Days 拉開層級
- Calendar / input card 視覺減輕，touch target 44px 保留
- Sheet max-height 400px
```

### 3.9 JS 變更範圍（date-range.js）

```text
未改：日期計算、LocalStorage、URL sharing、calendar render、stats update

已改（互動 only）：
- tool-operation-open scroll lock 同步
- landscape compact overlay is-visible
- closeCompactDatePanel scroll unlock when sheet not open
- drv2-landscape-date-field tap → showPicker
```

---

## 4. Confirmed unchanged

```text
Header: unchanged
Footer: unchanged
BaseLayout: unchanged
Global background: unchanged
Home pages: unchanged
Legal pages: unchanged
ToolCard baseline: unchanged
RelatedToolRow baseline: unchanged
ToolAdSlot component: unchanged（spacing 由 tool-ad-slot.css 共用層處理）
Date Range calculation logic: unchanged
Meta / canonical / alternate on Date Range routes: unchanged
Live AdSense: not added
Event Countdown V2 core logic / sheet behavior: unchanged（overlay CSS 抽離至 baseline + regression fix only）
```

---

## 5. Docs compliance

| Check | Result | Notes |
|---|---|---|
| Followed task scope | Pass | Layout migration + 當日 RWD / landscape / baseline  refinement |
| CEO Workflow | Pass | Plan → implement → Owner QA → commit |
| Agent Review Workflow | Pass | 四 Agent 審查見 §8 |
| Tailwind CSS rules | Pass | V2 shell utilities + scoped CSS variables |
| Semantic HTML | Pass | h1, sections, details FAQ, aria labels |
| Chinese comments | Pass | V2 component + CSS 區塊註解 |
| RWD component segmentation | Pass | Desktop / portrait / landscape / intermediate gates 分離 |
| No inline style | Pass | |
| No `!important` | Pass | date-range-calculator-v2.css 已確認 |
| No CSS id selector | Pass | V2 scoped CSS 無 id selector |
| Locked components protected | Pass | 見 §4 |

---

## 6. Build / commands

```text
npm run build: Pass

複驗時間：2026-06-13 22:34
輸出：20 page(s) built — Complete!
```

Other commands:

```text
git commit 2b496b4 — Owner 批准後已執行（本報告撰寫不額外 commit）
```

---

## 7. Agent Routing

| Agent | Required? | Reason |
|---|---:|---|
| Experience Lead | Yes | 全 viewport 首屏可完成任務、sheet/landscape panel、膠囊可觸 |
| Brand Guardian | Yes | ECv2 對齊、5rem landscape 數字、Widget-like V2 shell |
| Tech Architect | Yes | V2 元件、RWD gates、JS DOM 契約、共用 baseline |
| Growth Strategist | Yes | FAQ JSON-LD、EN/ZH 路由、ToolAdSlot / SEO 內容區 |

---

## 8. Agents Review

| Agent | Result | Notes |
|---|---|---|
| Experience Lead | Pass | 桌機 inline calendar；portrait grid 首屏；landscape 三欄 + bottom capsule；overlay scroll lock 統一；Owner 實機通過 |
| Brand Guardian | Pass | 主/次結果層級、ECv2 5rem 對齊、824–899px 中間 breakpoint 視覺一致 |
| Tech Architect | Pass | RWD gates 與 JS 對齊；高度鏈修正；baseline 可复用；build Pass |
| Growth Strategist | Pass | FAQ JSON-LD 5 題；EN/ZH 路由；lower content 節奏未壓 SEO |

---

## 9. Manual QA needed from Owner

```text
- [x] Mobile portrait — Owner 已驗收
- [x] Mobile landscape — 第一屏 + 展開 panel Owner 已驗收
- [x] Desktop — Owner 前序已驗收（8px gap、calendar、drawer）
- [x] EN / ZH routes — Pass
- [x] Date selection / stats / clear — Owner 本輪回報正常
- [x] Orientation change — Owner 本輪回報正常
- [x] npm run build — Pass
- [ ] Deploy — 尚未 deploy（需 Owner 另行指示）
```

---

## 10. Known risks / minor notes

```text
- date-range.css 舊規則仍載入；V2 以 [data-date-range-v2] 高 specificity 覆寫，rollback 時需還原 route imports
- ToolAdSlot 仍為 is-reserved；Owner 可於 deploy 前決定是否改 is-disabled
- 舊 DateRangeCalculator.astro 保留但非 production route
- ECv2 overlay 依賴 body-level 選擇器；未來 V2 工具若 teleport overlay 需同樣處理
- 824–899px landscape 刻意使用 portrait capsule 尺寸（已確認設計決策）
- 本整合報告為 docs-only 新增，尚未 commit
```

---

## 11. Block issues

```text
None
```

---

## 12. Owner final approval question

```text
2026-06-13 當日 Date Range V2 全線調整已完成 Owner 實機驗收並 commit（2b496b4）。

本報告為當日完整整合摘要。若 Owner 確認內容無遗漏，可視為 Date Range V2 任務 documentation 結案。

Deploy 仍需 Owner 另行明示指令。
```

---

## 13. 當日工作時間線（參考）

| 階段 | 內容 | 狀態 |
|---|---|---|
| Layout migration | V2 shell、routes、drawer、FAQ JSON-LD、ToolAdSlot | Done |
| Shared baselines | tool-result-v2-baseline、stage→lower 48px、portrait control 56px | Done |
| Visual focus | 主/次結果層級、calendar 減輕 | Done |
| Portrait first screen | Grid 首屏、capsule in-stage、bottom sheet | Done |
| Overlay unification | tool-overlay-v2-baseline、JS scroll lock 同步 | Done |
| Desktop checkpoint | 8px title→result、calendar scale 保留 | Done |
| RWD 824–899px | Intermediate landscape portrait capsule | Done |
| Landscape first screen | 高度鏈、5rem 三欄、fixed column gap、capsule 可觸 | Done |
| Landscape panel | ECv2 sheet 風格（frozen） | Done |
| Owner QA + commit | 測試正常 → 2b496b4 | Done |
| 本整合報告 | docs/reports 歸檔 | Done（未 commit） |

---

## 14. 相關子報告索引

```text
- docs/reports/2026-06-13-date-range-calculator-v2-layout-migration-validation-report.md
- docs/reports/2026-06-13-date-range-v2-mobile-landscape-first-screen-validation-report.md
- docs/reports/2026-06-05-date-range-v2-shared-spacing-baseline-validation-report.md
- docs/reports/2026-06-05-tool-stage-lower-content-spacing-validation-report.md
- docs/reports/2026-06-05-date-range-v2-visual-focus-validation-report.md
- docs/reports/2026-06-05-mobile-portrait-first-screen-control-validation-report.md
- docs/reports/2026-06-05-date-range-v2-mobile-portrait-bottom-control-validation-report.md
```

Do not commit or deploy this report file until Owner explicitly requests.
