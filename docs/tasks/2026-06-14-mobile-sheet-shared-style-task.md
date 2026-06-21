# Task: Mobile Sheet Shared Style Baseline

Date: 2026-06-14
Owner: Jane / Timiva
Status: Draft

---

## 1. Goal

```text
Create a shared Timiva mobile sheet style baseline before implementing Countdown Timer.
The task should define and preview reusable mobile sheet / compact panel styles without modifying stable production tools first.
```

This task exists because Countdown Timer will introduce a Custom time sheet, and Timiva should not create another one-off sheet style.

---

## 2. Scope

### Allowed

```text
- docs/timiva-mobile-sheet-shared-style-v1.md
- src/styles/tools/[new shared mobile sheet CSS file, proposed name only]
- src/pages/preview/mobile-sheet-shared-style/index.astro or equivalent preview-only route
- preview-only component(s) if needed
- preview-only JavaScript if needed to demonstrate open / close / scroll lock
```

Allowed behavior:

```text
- Create an isolated preview sandbox for the shared mobile sheet style.
- Demonstrate portrait bottom sheet and landscape compact panel states.
- Demonstrate compact inline fields.
- Demonstrate Countdown Timer H / M / S three-column example.
- Demonstrate secondary text button + primary capsule button action row.
```

### Not allowed

```text
- Do not modify Header.
- Do not modify Footer visual layout.
- Do not modify BaseLayout.
- Do not modify global background.
- Do not modify Event Countdown V2 production behavior.
- Do not modify Date Range Calculator V2 production behavior.
- Do not modify existing stable tool routes.
- Do not connect the shared style to production tools in this task unless Owner explicitly approves it after plan review.
- Do not add visible ads.
- Do not connect live AdSense.
- Do not commit / deploy.
```

Important testing boundary:

```text
Because Event Countdown V2 and Date Range Calculator V2 are already verified, this task should test the new shared style through a preview-only sandbox first.
Existing production tools should be treated as references, not first-pass implementation targets.
```

---

## 3. Required reading

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-decision-log.md
docs/timiva-ceo-workflow-v1.md
docs/timiva-agent-review-workflow-v1.md
agents/README.md
docs/timiva-mobile-sheet-shared-style-v1.md
docs/timiva-countdown-timer-spec-v1.md
docs/timiva-design-system-v2.md
docs/timiva-layout-system-v2.md
docs/timiva-tool-page-qa-checklist-v2.md
docs/timiva-tailwind-css-guidelines-v2.md
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
Reason: This task changes mobile sheet UX, field layout, orientation behavior, and interaction flow.

Brand Guardian: Required
Reason: This task defines shared visual language for Timiva tool sheets and must preserve the calm Widget-like brand feel.

Tech Architect: Required
Reason: This task may add shared CSS and a preview route / preview component, and must avoid side effects on stable tools.

Growth Strategist: N/A
Reason: This task does not change SEO, FAQ, metadata, internal links, content strategy, or ads.
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
- Use existing components and styles where possible.
- Keep semantic HTML.
- Use Tailwind CSS and existing Timiva design tokens where appropriate.
- Add Chinese comments for major sections.
- Follow component-based RWD rules.
- Preserve EN / ZH route behavior.
- Keep the preview route isolated from production navigation.
- Reuse existing overlay / scroll-lock baseline where possible.
- Do not introduce inline style.
- Do not use !important.
- Do not use CSS id selectors.
```

Shared style requirements:

```text
- Mobile sheet fields use compact inline field layout in both portrait and landscape.
- Label appears on / inside the left side of the field and remains visible.
- No floating labels.
- No disappearing labels.
- Portrait usually uses one field per row.
- Landscape may use 2-column or 3-column rows.
- Countdown Timer H / M / S may use three columns side by side even in portrait.
- Sheet primary action uses existing Timiva capsule button style; size can reference Event Countdown sheet action button.
- Sheet secondary action uses plain text-button style; Cancel / Clear references Date Range Calculator sheet Clear button.
- Sheet titles are not default; only use a short title when multiple option groups or unclear function require it.
```

---

## 6. Plan-first rule

Before editing files, Cursor must output:

```text
1. Files it plans to modify
2. Files it will not modify
3. Agent Routing
4. Risks
5. Verification steps
```

Cursor must wait for Owner approval before implementation.

Cursor must explicitly confirm whether it plans to create a preview-only route. If it proposes touching Event Countdown V2 or Date Range V2 production components, it must stop and ask Owner approval first.

---

## 7. Validation checklist

```text
- npm run build
- Preview route loads successfully
- Mobile portrait preview check
- Mobile landscape preview check
- Desktop preview check, if preview is accessible on desktop
- Backdrop appears when sheet / panel opens
- Background scroll lock works while open
- Backdrop click closes sheet / panel
- Close removes scroll lock
- Compact inline field labels remain visible
- Portrait one-row field example works visually
- Landscape 2-column / 3-column examples work visually
- Countdown Timer H / M / S three-column example works visually
- Secondary text button matches Date Range sheet Clear direction
- Primary capsule button matches existing Timiva / Event Countdown sheet button direction
- Existing Event Countdown V2 still loads unchanged
- Existing Date Range Calculator V2 still loads unchanged
- Header / Footer unchanged
- No inline style
- No !important
- No CSS id selector
- No unexpected route changes
- Required Agent Reviews completed
- Owner manual QA needed
```

---

## 8. Completion report

Cursor must create or paste a Timiva Validation Report using:

```text
docs/reports/_validation-report-template.md
```

Report must include:

```text
- Files changed
- Whether a preview-only route was created
- Confirmation that Event Countdown V2 production behavior was not modified
- Confirmation that Date Range Calculator V2 production behavior was not modified
- Mobile portrait verification
- Mobile landscape verification
- npm run build result
- Known limitations / follow-up needed before Countdown Timer implementation
```

Do not commit or deploy without Owner approval.
