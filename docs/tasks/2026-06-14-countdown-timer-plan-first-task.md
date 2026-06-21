# Task: Countdown Timer Implementation Plan

Date: 2026-06-14
Owner: Jane / Timiva
Status: Draft — Plan-first only

---

## 1. Goal

```text
Create the implementation plan for Timiva's third V1 tool: Countdown Timer.

This task is plan-first only. Cursor must review the required documents, propose the implementation architecture and batch plan, and wait for Owner approval before editing any files.
```

---

## 2. Scope

### Allowed

```text
Plan proposed additions / modifications for:

- /en/countdown-timer/
- /zh/countdown-timer/
- Countdown Timer Astro component
- Countdown Timer client JavaScript
- Countdown Timer page-level styles
- Countdown Timer EN / ZH i18n messages
- Countdown Timer FAQ / JSON-LD / metadata
- Countdown Timer Related Tools
- ToolAdSlot placeholders in disabled state
- Mobile Custom time sheet using the existing Mobile Sheet Shared Style baseline
```

### Not allowed

```text
- Do not modify files during this task.
- Do not implement Countdown Timer yet.
- Do not commit.
- Do not deploy.
- Do not redesign Countdown Timer product decisions.
- Do not turn Countdown Timer into Pomodoro, Stopwatch, Fullscreen Timer, PWA, background notification system, history tracker, account system, sync feature, or social feature.
- Do not create a new one-off mobile sheet style.
- Do not create a new preview outer shell for shared component testing.
- Do not modify Event Countdown V2 production behavior.
- Do not modify Date Range Calculator V2 production behavior.
- Do not modify Header.
- Do not modify Footer visual layout.
- Do not modify BaseLayout.
- Do not modify global background.
- Do not modify live ads / AdSense.
- Do not add visible ads to live pages.
- Do not modify unrelated tools.
```

---

## 3. Required reading

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-decision-log.md
docs/timiva-countdown-timer-spec-v1.md
docs/timiva-mobile-sheet-shared-style-v1.md
docs/timiva-new-tool-development-rules-v2.md
docs/timiva-design-system-v2.md
docs/timiva-layout-system-v2.md
docs/timiva-tailwind-css-guidelines-v2.md
docs/timiva-tool-page-qa-checklist-v2.md
docs/timiva-ceo-workflow-v1.md
docs/timiva-agent-review-workflow-v1.md
agents/README.md
```

### Agent role files

```text
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/growth-strategist.md
```

---

## 4. Agent routing

Cursor must decide which Agents are required before editing.

```text
Experience Lead: Required
Reason:
Countdown Timer introduces a new tool flow, mobile portrait layout, mobile landscape layout, desktop interaction, time input behavior, sound toggle, and Custom time sheet.

Brand Guardian: Required
Reason:
Countdown Timer must preserve Timiva's calm, mobile-first, Widget-like visual language and align with V2 tool baselines.

Tech Architect: Required
Reason:
Countdown Timer requires new routes, component structure, client-side timer logic, localStorage, state machine behavior, and build validation.

Growth Strategist: Required
Reason:
Countdown Timer will add production pages with metadata, FAQ, JSON-LD, related tools, and tool-card availability context.
```

Default rule:

```text
If this task changes code, Tech Architect is usually Required.
If this task changes UI, layout, mobile behavior, or flow, Experience Lead and Brand Guardian are usually Required.
If this task changes SEO, FAQ, meta, internal links, content strategy, or ads, Growth Strategist is Required.
```

---

## 5. Implementation requirements

```text
- This task is Plan-first only.
- Cursor must not edit files until Owner approves the implementation plan.
- Use existing V2 tool page baselines where possible.
- Use the completed Mobile Sheet Shared Style baseline for the mobile Custom time sheet.
- Do not build another one-off sheet style.
- Do not build another preview outer shell.
- Keep semantic HTML.
- Use Tailwind CSS and existing Timiva CSS conventions.
- Add Chinese comments for major sections when implementation begins.
- Follow component-based RWD rules.
- Preserve EN / ZH route behavior.
- Preserve Header / Footer / BaseLayout / global background.
- Keep ToolAdSlot placeholders disabled in production state.
- Keep the implementation pure frontend and low-maintenance.
```

### Countdown Timer confirmed product rules

```text
Countdown Timer is a general countdown timer.

It is not:
- Pomodoro
- Stopwatch
- Fullscreen Timer
- PWA
- Background notification system
- Timer history tracker
- Login / sync / social feature

Quick Start:
- One-tap start, not additive.
- Includes Last duration only after a duration has actually been started.
- Includes 30s, 1m, 5m, 10m, 25m, 1h.
- Hidden during countdown, paused, and time's up states.
- Hidden in mobile landscape.

Custom time:
- Mobile tapping central time opens Custom time sheet.
- Desktop tapping central time enters inline edit.
- Mobile sheet fields are Hours / Minutes / Seconds.
- Hours range: 0–9.
- Minutes / Seconds range: 0–59.
- All zero disables Apply and start.
- No default autofocus.
- Numeric keyboard on mobile.
- Apply and start starts immediately and updates Last duration.
- Cancel closes without applying.

Sound:
- Default first visit: Sound off.
- User preference is saved locally.
- Sound can be toggled during countdown.
- Turning sound off while sound is playing stops sound immediately.

Countdown behavior:
- Active countdown uses target end timestamp for accurate remaining-time calculation.
- Refresh does not restore active countdown.
- Last duration and sound preference may persist.
- Time's up shows Done / 完成, not Restart.
- Done returns to initial 00:00.
```

### State machine to plan

```text
Cursor must plan the client JS state machine for:

1. initial
2. setup valid
3. countdown
4. paused
5. time's up
```

### Layout to plan

```text
Mobile portrait:
- Tool title at top.
- Thin calm ring.
- Sound toggle above central time inside ring.
- Central time with subtle editable underline in initial state.
- Quick Start in two centered rows.
- Large mobile control buttons near first-screen bottom.
- No first-screen scroll required for main controls.

Mobile landscape:
- Quick Start hidden.
- Compact three-column first-screen layout:
  Cancel left, ring/time center, primary action right.
- Tapping central time opens Custom time sheet.
- Custom sheet landscape must use the shared Mobile Sheet baseline:
  action row fixed, all inputs inside the single scrollable body if needed.

Desktop:
- Similar main timer visual.
- Quick Start in one row.
- Standard Timiva capsule controls near timer.
- Tapping central time enters inline edit.
```

---

## 6. Plan-first rule

Before editing files, Cursor must output:

```text
1. Files it plans to modify
2. Files it will not modify
3. Agent Routing
4. Existing components / CSS baselines it will reuse
5. Countdown Timer component architecture
6. Client JS state machine design:
   - initial
   - setup valid
   - countdown
   - paused
   - time's up
7. Mobile portrait layout strategy
8. Mobile landscape layout strategy
9. Desktop layout strategy
10. Custom time sheet integration with Mobile Sheet Shared Style baseline
11. EN / ZH i18n message strategy
12. FAQ / JSON-LD / Related Tools / metadata strategy
13. LocalStorage data plan:
   - what will be saved
   - what will not be saved
14. Risks and possible blockers
15. Proposed implementation batches
16. Validation checklist per batch
17. Protected / locked areas that will remain unchanged
```

Cursor must wait for Owner approval before implementation.

---

## 7. Validation checklist

```text
Plan-first validation:
- Required reading completed
- Agent routing completed
- Implementation files proposed
- Protected files listed
- Batch plan proposed
- Risks listed
- Owner approval requested before editing

Implementation validation after Owner approves a batch:
- npm run build
- EN route check: /en/countdown-timer/
- ZH route check: /zh/countdown-timer/
- Mobile portrait check
- Mobile landscape check
- Desktop check
- Custom time sheet portrait check
- Custom time sheet landscape check
- Quick Start behavior check
- Last duration localStorage check
- Sound preference localStorage check
- Refresh behavior check
- Time's up / Done behavior check
- Header / Footer unchanged
- Event Countdown V2 regression spot-check
- Date Range Calculator V2 regression spot-check
- No inline style
- No !important
- No CSS id selector
- No unexpected route changes
- FAQ / JSON-LD check
- Related Tools check
- ToolAdSlot disabled state check
- Required Agent Reviews completed
- Owner manual QA needed
```

---

## 8. Completion report

Cursor must create or paste a Timiva Validation Report using:

```text
docs/reports/_validation-report-template.md
```

The completion report must include:

```text
- Task name
- Date
- Final implementation summary
- Actual files modified
- Routes added
- Agent review results
- Mobile portrait results
- Mobile landscape results
- Desktop results
- EN / ZH content results
- FAQ / JSON-LD results
- Related Tools results
- ToolAdSlot disabled-state result
- Event Countdown V2 regression result
- Date Range Calculator V2 regression result
- npm run build result
- Remaining minor notes
- Owner Final Approval needed
```

Do not commit or deploy without Owner approval.
