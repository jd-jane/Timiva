# Timiva Current Status

> 用途：這是每次開新討論串、給 Cursor 任務、或請 ChatGPT 判斷專案狀態時的主要事實來源。  
> 更新日期：2026-06-10  
> 狀態來源：整合既有 Timiva docs 與 `docs/handovers/2026-06-10-event-countdown-legal-pages-handoff.md`。

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

### 2.2 Completed / verified tool pages

```text
Event Countdown
Date Range Calculator
```

Event Countdown current status:

```text
/en/event-countdown/ exists and should remain unaffected.
/zh/event-countdown/ has switched from V1 to EventCountdownV2 production.
EventCountdownV2 i18n, client messages, route meta helper, FAQ / JSON-LD, related tools, and share feedback are working.
Chinese quick templates use titles: 2027 新年, 2026 聖誕節, 2027 情人節.
Owner has confirmed real-device testing passed.
```

Date Range Calculator current status:

```text
Tool is treated as completed / verified from prior rounds.
Do not redesign or rewrite unless a new task explicitly targets it.
```

### 2.3 Legal pages completed

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

### 2.4 Footer language switch completed

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
```

---

## 3. Current locked / protected areas

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
Date Range Calculator core logic
```

If a task seems to require touching these areas, Cursor must stop and ask for Owner approval first.

---

## 4. Current active next step

Recommended next task:

```text
Timiva Pre Deploy Final Check
```

Minimum scope:

```text
/en/
/zh/
/en/event-countdown/
/zh/event-countdown/
/en/date-range-calculator/
/zh/date-range-calculator/
/en/privacy/
/zh/privacy/
/en/terms/
/zh/terms/
/en/contact/
/zh/contact/
Footer language switch
Mobile portrait
Mobile landscape
Desktop
npm run build
```

Suggested task brief already exists:

```text
docs/tasks/2026-06-10-pre-deploy-final-check.md
```

---

## 5. Possible next product tasks after pre-deploy

Choose one after Pre Deploy Final Check:

```text
1. Cloudflare Pages / formal domain final confirmation
2. Home / All Tools final content check
3. Age Calculator task planning
4. Life Progress Bar task planning
5. Ad placeholder strategy only; ads remain disabled
```

---

## 6. Current no-go list

Do not do these unless Owner explicitly starts a new task:

```text
Do not redesign Event Countdown V2.
Do not rewrite Legal Pages layout.
Do not add ads to live pages yet.
Do not add ads to Legal / Text pages ever.
Do not modify Footer visual layout.
Do not modify BaseLayout or global background.
Do not add member system, backend, database, login, cloud sync, social features, leaderboard, or push backend.
Do not generate large programmatic SEO pages yet.
Do not commit / deploy without Owner confirmation.
```

---

## 7. How to start a new Cursor task

Use this command:

```text
Read AGENTS.md, docs/timiva-current-status.md, and docs/tasks/[TASK_FILE].md.
Create an implementation plan only. Do not edit files yet.
```

Then review Cursor's plan before allowing edits.

---

## 8. How to start a new ChatGPT discussion

Paste this short context:

```text
這是 Timiva 專案。請以 AGENTS.md 和 docs/timiva-current-status.md 為主要上下文。
目前 Timiva 已完成 Event Countdown V2 中文正式切換、Legal Pages Markdown 架構與正式文案、Footer 語系切換同頁對應。
目前建議下一步是 Timiva Pre Deploy Final Check。
請不要重新推翻已驗收設計，也不要主動建議修改 locked components。
```
