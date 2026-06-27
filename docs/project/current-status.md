# Timiva 專案現況

> 用途：每次開新討論串、給 Cursor 任務、或請 ChatGPT 判斷專案狀態時的主要事實來源。
> 更新日期：2026-06-28
> 狀態來源：整合既有 Timiva docs、三個正式工具 Owner 實機驗收與 deploy、Countdown Timer Post-tool Link Integration 與完成提示音改善、Year Progress V2 實作與站內連結整合（rebuild/main 本地 commit）、文件架構重組。

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
| Current session status | **已部署**：Home、Event Countdown V2、Date Range Calculator V2、Countdown Timer V2（含站內連結整合）。**本地 commit 完成、尚未 push / deploy**：Year Progress V2（`f39f8bc`）與 Link Integration（`20c379d`）。 |

---

## 2. Current completed scope

### 2.1 Core project foundation

```text
Astro project foundation
English / Traditional Chinese route structure
Home / Tool / All Tools / Legal Text page types
Header / Footer / BaseLayout baseline
Preview layout baseline
Design / layout / Tailwind / SEO / QA docs（見 docs/standards/、docs/workflow/）
Four-Agent review model（agents/）
Post-tool Link Integration Gate（docs/workflow/tool-link-integration.md）
```

### 2.2 Home pages completed and deployed

EN / ZH 首頁已完成 Home Content & Animation task、通過 final check，**已部署**。

Completed home scope:

```text
/en/
/zh/
Hero title / subtitle updated
Hero CTA buttons removed
Hero chips added as visual-only, non-interactive labels
Featured tool cards（4 tools）:
Event Countdown → Date Range Calculator → Countdown Timer → Year Progress（本地 catalog 已更新；遠端 deploy 仍為舊版直至 push）
View all tools retained
FAQ & Help added with 7 Q&A per locale
Ad Container implemented but production state is-disabled
Home JSON-LD: WebSite, Organization, ItemList, FAQPage
Home entrance animation with prefers-reduced-motion support
```

Home page verification:

```text
Owner real-device testing passed（EN / ZH）
Mobile portrait / landscape / Desktop passed
npm run build passed
Final check passed
Deployed
```

Home animation decision:

```text
Lightweight entrance animation remains enabled
Existing ToolCard hover remains unchanged
Animated glow overlay was tested and disabled（performance）
Do not re-enable Home / All Tools animated glow overlay in V1 unless explicitly approved
```

### 2.3 Completed / verified tool pages（已部署）

```text
Event Countdown V2 — 已部署
Date Range Calculator V2 — 已部署
Countdown Timer V2 — 已部署 · 站內連結整合完成（2c44484）
```

工具 README：`docs/tools/event-countdown/`、`docs/tools/date-range-calculator/`、`docs/tools/countdown-timer/`

---

## 3. Event Countdown V2 current status

**實作完成，已部署。** 視為 stable baseline。

Routes:

```text
/en/event-countdown/
/zh/event-countdown/
```

Current verified state:

```text
EventCountdownV2 i18n, client messages, route meta, FAQ / JSON-LD, related tools, share, theme sheet, edit sheet, quick templates — working
Chinese quick templates: 2027 新年, 2026 聖誕節, 2027 情人節
Owner real-device: Mobile portrait / landscape / Desktop passed
```

2026-06-13 overlay regression note:

```text
Sheet overlay teleported to document.body; scoped selectors briefly broke backdrop
Fixed with body-level overlay selectors
Edit / Theme backdrop, scroll lock, backdrop click-to-close — normal
Do not modify EC V2 core logic unless task explicitly targets it
```

Ad state: ToolAdSlot is-disabled · no live AdSense

---

## 4. Date Range Calculator V2 current status

**實作完成，已部署。**

Routes:

```text
/en/date-range-calculator/
/zh/date-range-calculator/
```

Primary implementation:

```text
DateRangeCalculatorV2 component
EN / ZH V2 routes
Drawer / sidebar V2 layout
FAQ JSON-LD · Related Tools
ToolAdSlot is-disabled
Old component retained for rollback
Calculation logic not rewritten
Main commit: 2b496b4
```

Verified across desktop, intermediate RWD, mobile portrait, mobile landscape. Shared overlay / scroll lock baseline aligned with Event Countdown V2.

Ad state: ToolAdSlot main / sidebar is-disabled

---

## 5. Countdown Timer current status

**實作完成，已部署。** Post-tool Link Integration **已完成**。

Routes:

```text
/en/countdown-timer/
/zh/countdown-timer/
```

Commits:

```text
77c6aa8 — feat: add Countdown Timer V2
2c44484 — feat: wire Countdown Timer links across home and catalog pages
```

Core features:

```text
Quick Start · Target end timestamp · Desktop inline edit · Mobile Custom time sheet
Start / Pause / Resume / Cancel · Progress ring · Sound preference
Last duration in localStorage · Refresh does not restore active countdown
EN / ZH · FAQ / JSON-LD · Related Tools
```

Site integration（Owner confirmed）:

```text
Home card → formal EN / ZH routes
All Tools listed
Event Countdown / Date Range Related Tools include Countdown Timer
Locale-aware routes preserved
```

Full spec: `docs/tools/countdown-timer/product-spec.md`

### 5.1 完成提示音改善（2026-06-28）

**實作完成 · Owner 實機驗收通過 · 本地 commit 已完成 · 尚未 push / deploy**

```text
主要播放路徑：本地 WAV（public/audio/countdown-complete.wav）+ HTMLAudioElement
Fallback：Web Audio 三音 chime（播放失敗時）
Sound 預設、localStorage key、倒數狀態機、UI：不變
```

Owner 實機驗收：

```text
iPhone Safari 靜音模式開啟：有聲
iPhone Safari 靜音模式關閉：有聲
低媒體音量：清楚可辨識
桌機：有聲且較先前清楚
```

驗證：

```text
npm run build：通過
git diff --check：通過
dist/audio/countdown-complete.wav：已輸出
```

已知限制：

```text
僅保證頁面位於前景、瀏覽器正常開啟時的完成提示音。
背景、鎖屏或系統暫停頁面時，不保證原生鬧鐘等級提醒。
```

---

## 6. Year Progress current status

**實作完成 · 站內連結整合完成（rebuild/main 本地 commit）· 尚未 push / deploy**

Routes:

```text
/en/year-progress/
/zh/year-progress/
```

Commits（rebuild/main）:

```text
f39f8bc — feat: add Year Progress V2
20c379d — feat: integrate Year Progress links
```

Current status:

```text
B0–B3 standalone: complete
Link Integration: complete · validate-tool-link-integration.mjs passed · Owner QA passed
Catalog: year-progress available:true
Home fourth card: year-progress（本地）
All Tools: visible under Momentum（本地）
Related Tools: all four production tools cross-link
Not pushed · Not deployed
HTTPS Share success verification: pending（non-blocking, post-deploy）
```

Core MVP:

```text
Integer year percentage · Days passed / remaining
12 monthly pill segments · One monthly note
Theme（Mist / 霧光, Forest / 森光 + eligible Timiva themes）
Share · EN / ZH · About / How to / FAQ / JSON-LD / Related Tools
```

Primary specification:

```text
docs/tools/year-progress/product-spec.md（含產品流程）
docs/tools/year-progress/README.md
```

Plans / validation reports（local-only）:

```text
local-docs/plans/year-progress/
local-docs/reports/year-progress/
local-docs/tasks/year-progress/
```

Protected boundary:

```text
Tool Theme Layer is tool-specific
Do not modify BaseLayout or global background
Do not refactor Event Countdown themes in unrelated tasks
```

---

## 7. Shared V2 tool baselines（2026-06-13 起）

### 7.1 Tool result baseline

```text
src/styles/tools/tool-result-v2-baseline.css
src/styles/tools/tool-drawer-v2-baseline.css
```

Rules: 48px stage→lower spacing · 8px desktop title→result gap · shared drawer hover（no translateY）

### 7.2 Tool overlay baseline

```text
src/styles/tools/tool-overlay-v2-baseline.css
body.tool-operation-open scroll lock
Event Countdown overlay teleported to document.body — CSS must support body-level selectors
```

### 7.3 Tool ad placeholder baseline

```text
ToolAdSlot main / sidebar · is-disabled in production
No live AdSense connected
```

共用互動基準長期規則：[互動控制規範](../standards/interactive-controls.md)

---

## 8. Legal pages completed

Six pages via Markdown + `LegalTextLayout`:

```text
/zh/privacy/ · /zh/terms/ · /zh/contact/
/en/privacy/ · /en/terms/ · /en/contact/
```

Legal pages do not contain ads. Chinese label: 使用條款.

---

## 9. Footer language switch completed

Footer preserves corresponding page route on language switch.

Examples:

```text
/zh/event-countdown/ ↔ /en/event-countdown/
/zh/date-range-calculator/ ↔ /en/date-range-calculator/
/zh/countdown-timer/ ↔ /en/countdown-timer/
/zh/year-progress/ ↔ /en/year-progress/（route ready; deploy pending）
```

---

## 10. Current locked / protected areas

Unless a task explicitly says otherwise, do not modify:

```text
Header · Footer visual layout · BaseLayout · Global background
Preview layout baseline · ToolCard · RelatedToolRow · Tool Drawer · LegalTextLayout spacing
EventCountdownV2 core / theme / share / quick templates
Date Range calculation / date selection core
Countdown Timer accepted implementation
Year Progress accepted implementation（after Owner sign-off）
ToolAdSlot visual style
```

---

## 11. Current no-go list

```text
Do not redesign EC V2 / DR V2 / Countdown Timer / Year Progress without new task
Do not rewrite Legal Pages layout
Do not add visible ads or live AdSense
Do not add ads to Legal / Text pages
Do not re-enable Home / All Tools animated glow overlay in V1
Do not modify Footer visual / BaseLayout / global background
Do not add backend, database, login, cloud sync, social, leaderboard
Do not generate large programmatic SEO pages yet
Do not push / deploy without Owner confirmation
```

---

## 12. Current active next step

```text
Event Countdown V2 — deployed baseline
Date Range Calculator V2 — deployed baseline
Countdown Timer V2 — deployed · site-integrated
Year Progress V2 + Link Integration — local commits complete（f39f8bc, 20c379d）
```

Next workflow:

```text
Owner authorization
→ Pre-deploy final check（docs/workflow/pre-deploy.md）
→ Push rebuild/main
→ Deploy to Cloudflare Pages
→ HTTPS Share verification for Year Progress
```

Important:

```text
Task briefs and validation reports live in local-docs/ — not Git tracked paths
Do not push or deploy without explicit Owner authorization
Year Progress is NOT live until push / deploy completes
```

---

## 13. Possible next project tasks

Recommended order:

```text
1. Pre-deploy final check
2. Push / deploy authorization（when approved）
3. HTTPS Share verification after deploy
4. All Tools final content check on production
```

Parallel / later:

```text
Cloudflare Pages / domain final confirmation
Ad placeholder strategy only; ads remain disabled
文件重構完成（canonical 路徑見 `docs/README.md`）
```

---

## 14. Documentation map（canonical tracked paths）

### Core

```text
docs/core/project-brief.md
docs/core/product-principles.md
docs/core/product-architecture.md
docs/core/roadmap.md
```

### Standards

```text
docs/standards/design-system.md
docs/standards/layout-system.md
docs/standards/tailwind-guidelines.md
docs/standards/seo-guidelines.md
docs/standards/ad-layout-guidelines.md
docs/standards/wireframe-index.md
docs/standards/mobile-sheet.md
```

### Workflow

```text
docs/workflow/new-tool-development.md
docs/workflow/tool-page-qa.md
docs/workflow/tool-link-integration.md
docs/workflow/pre-deploy.md
docs/workflow/cursor-commands.md
```

### Project

```text
docs/project/current-status.md（本文件）
docs/project/decision-log.md
```

### Tools

```text
docs/tools/event-countdown/README.md
docs/tools/date-range-calculator/README.md
docs/tools/countdown-timer/README.md + product-spec.md
docs/tools/year-progress/README.md + product-spec.md
```

### Local-only（不納入 Git tracked）

```text
local-docs/tasks/ — task briefs
local-docs/reports/ — validation reports
local-docs/plans/ — implementation plans
local-docs/templates/ — reusable templates
```

正式文件已遷移至 `docs/core/`、`docs/standards/`、`docs/workflow/`、`docs/project/`、`docs/tools/`。Task brief 與 validation report 請使用 `local-docs/`。

---

## 15. How to start a new Cursor task

```text
Read AGENTS.md,
docs/project/current-status.md,
docs/project/decision-log.md,
docs/core/project-brief.md,
docs/core/product-principles.md,
relevant docs/workflow/ and docs/tools/ files,
and the task brief in local-docs/tasks/ if applicable.
Create an implementation plan only. Do not edit files yet.
```

---

## 16. How to start a new ChatGPT discussion

```text
這是 Timiva 專案。請以 AGENTS.md、docs/project/current-status.md 與 docs/project/decision-log.md 為主要上下文。

已部署：Home、Event Countdown V2、Date Range Calculator V2、Countdown Timer V2（含站內連結整合 commit 2c44484）。

Year Progress / 今年進度（第四個 V1 工具）已在 rebuild/main 完成實作（f39f8bc）與站內連結整合（20c379d），自動化驗證與 Owner QA 已通過，但尚未 push / deploy — 請勿描述為已上線。

規格：docs/tools/year-progress/product-spec.md
流程：同文件「產品流程」章節
站內整合規則：docs/workflow/tool-link-integration.md

Task briefs 與 validation reports 在 local-docs/，不納入 Git tracked。

Phase A：不要 push / deploy / commit 除非 Owner 明確授權。不要修改 Header、Footer、BaseLayout、global background 或既有工具核心功能，除非任務明確指定。
```
