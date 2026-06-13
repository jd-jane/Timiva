# Task: Timiva Pre Deploy Final Check

Date: 2026-06-10  
Owner: Jane / Timiva  
Status: Ready for Cursor plan

---

## 1. Goal

Run a final pre-deploy verification for the current Timiva V1 baseline after Event Countdown V2 Chinese production switch, Legal Pages completion, and Footer language-switch improvement.

This task is a verification task, not a redesign or implementation task.

---

## 2. Scope

### Pages to check

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
```

### Features to check

```text
Footer language switch preserves same-page route.
Event Countdown V2 Chinese route works.
EN Event Countdown remains unaffected.
Legal pages load Markdown content through LegalTextLayout.
Mobile portrait works.
Mobile landscape works.
Desktop works.
npm run build succeeds.
```

---

## 3. Not allowed

```text
Do not redesign any page.
Do not modify Header.
Do not modify Footer visual layout.
Do not modify BaseLayout.
Do not modify global background.
Do not modify EventCountdownV2 core logic.
Do not modify Date Range Calculator core logic.
Do not add ads.
Do not change routing unless a broken route is found and reported first.
Do not commit.
Do not deploy.
```

If a Block issue is found, Cursor must report it before fixing anything.

---

## 4. Required reading

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-pre-deploy-checklist-v1.md
docs/timiva-tool-page-qa-checklist-v2.md
docs/timiva-seo-aeo-ai-search-guidelines-v2.md
docs/handovers/2026-06-10-event-countdown-legal-pages-handoff.md
```

---

## 5. Plan-first rule

Cursor must first output a check plan only:

```text
1. Commands to run
2. Pages to inspect
3. Device / viewport checks
4. Files expected not to change
5. What will count as Block
```

Do not edit files before Owner approval.

---

## 6. Required checks

### Build

```bash
npm run build
```

### Manual / visual checks

```text
Mobile portrait
Mobile landscape
Desktop
Footer language switch
Legal pages text spacing
Event Countdown quick templates
Event Countdown share feedback
Date Range Calculator basic calculation
No visible regression on Home / All Tools if present
```

### SEO checks

```text
H1 exists
Title / description present
FAQ / JSON-LD not broken on tool pages
EN / ZH content not mixed
Canonical / hreflang not obviously broken
```

---

## 7. Report output

Use this report title:

```text
Timiva Pre Deploy Final Check Report — 2026-06-10
```

Report must include:

```text
1. Result: Pass / Pass with minor notes / Block
2. Modified files: should be none unless Owner later approves fixes
3. Build result
4. Pages checked
5. Mobile portrait result
6. Mobile landscape result
7. Desktop result
8. Footer language switch result
9. SEO / FAQ result
10. Block issues, if any
11. Minor notes, if any
12. Owner final approval question
```

Do not commit or deploy without Owner approval.
