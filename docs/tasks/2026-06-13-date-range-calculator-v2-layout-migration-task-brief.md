# Task: Date Range Calculator V2 Layout Migration

Date: 2026-06-13  
Owner: Jane / Timiva  
Status: Draft

---

## 1. Goal

```text
Migrate Date Range Calculator from its old layout into the new Timiva tool page layout pattern, using Event Countdown V2 as the layout reference.

Do not rebuild the Date Range tool from scratch. Preserve the existing Date Range main app area, date selection behavior, calculation logic, reset behavior, and content data as much as possible, and place that work area inside the new V2 tool page shell.
```

Primary outcome:

```text
Date Range Calculator V2 should visually and structurally align with Event Countdown V2:
- first-screen tool experience
- lower content area
- Main ToolAdSlot
- Related Tools
- About / How to use / FAQ / SEO content
- desktop sidebar / drawer if applicable
- Sidebar ToolAdSlot if sidebar is implemented
- mobile portrait and mobile landscape handling
```

Important background:

```text
ToolAdSlot was already created in the previous task.
Date Range Calculator was intentionally not modified in the previous ad placeholder task because it is still using the old layout.
This task is the proper place to migrate Date Range to the new layout and then wire in ToolAdSlot.
```

---

## 2. Scope

### Allowed

```text
- Inspect current Date Range Calculator files and identify layout vs core logic.
- Create a Date Range Calculator V2 component if needed.
- Reuse Event Countdown V2 as a layout reference only.
- Move or wrap the existing Date Range main app area into the new tool page layout.
- Add Main ToolAdSlot to Date Range V2 lower content.
- Add Sidebar ToolAdSlot only if Date Range V2 uses the same desktop sidebar / drawer pattern.
- Update Date Range route entries only after V2 layout is confirmed safe.
- Update EN / ZH Date Range i18n only if needed for layout labels or new section labels.
- Create a validation report after implementation.
```

Likely files Cursor may inspect or propose modifying:

```text
src/components/tools/DateRangeCalculator.astro
src/pages/en/date-range-calculator/index.astro
src/pages/zh/date-range-calculator/index.astro
src/components/ToolAdSlot.astro
src/styles/tool-ad-slot.css
src/i18n/en.ts
src/i18n/zh.ts
```

Possible new file, if safer than rewriting the old component directly:

```text
src/components/tools/date-range-calculator-v2/DateRangeCalculatorV2.astro
```

Cursor must confirm the actual file paths before editing.

### Not allowed

```text
- Do not modify Header.
- Do not modify Footer visual layout.
- Do not modify BaseLayout.
- Do not modify global background.
- Do not modify Home page.
- Do not modify All Tools page.
- Do not modify Legal / Text pages.
- Do not modify Event Countdown V2.
- Do not modify ToolAdSlot unless there is a clear bug and Owner approves first.
- Do not modify ToolCard baseline.
- Do not modify RelatedToolRow baseline.
- Do not modify Tool Drawer baseline behavior.
- Do not rewrite Date Range calculation logic.
- Do not rewrite Date Range date selection behavior.
- Do not change Date Range result formulas.
- Do not change FAQ / JSON-LD content unless required by the migration and approved.
- Do not add live AdSense.
- Do not add adsbygoogle.
- Do not add publisher id.
- Do not add ad slot id.
- Do not add third-party ad scripts.
- Do not commit / deploy.
```

If Cursor believes any protected area must be modified, stop and report:

```text
1. Component / file that seems necessary to modify
2. Reason
3. Affected pages
4. Safer alternative
5. Whether Owner approval is required
```

---

## 3. Required reading

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-ceo-workflow-v1.md
docs/timiva-agent-review-workflow-v1.md
agents/README.md
docs/timiva-layout-system-v2.md
docs/timiva-design-system-v2.md
docs/timiva-tailwind-css-guidelines-v2.md
docs/timiva-tool-page-qa-checklist-v2.md
docs/timiva-ad-layout-guidelines-v1.md
docs/timiva-seo-aeo-ai-search-guidelines-v2.md
docs/reports/2026-06-13-tool-page-ad-placeholder-slots-validation-report.md
```

### Agent role files

```text
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/growth-strategist.md
```

Task-specific reference:

```text
Use Event Countdown V2 as a layout reference, not as a logic source.
Do not copy Event Countdown countdown logic into Date Range.
Do not modify Event Countdown V2 while working on this task.
```

---

## 4. Agent routing

Cursor must decide which Agents are required before editing.

```text
Experience Lead: Required
Reason: This task changes Date Range tool layout, mobile behavior, first-screen hierarchy, ad placement, and lower content flow.

Brand Guardian: Required
Reason: Date Range V2 must visually align with Event Countdown V2 and Timiva's Widget-like dark interface without style drift.

Tech Architect: Required
Reason: This task migrates an old-layout tool into a new component structure while preserving existing calculation and date selection logic.

Growth Strategist: Required
Reason: This task changes content flow around Related Tools, ToolAdSlot, FAQ / SEO, and internal tool navigation.
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
- Use existing components where possible.
- Keep semantic HTML.
- Use Tailwind CSS.
- Add Chinese comments for major sections.
- Follow component-based RWD rules.
- Preserve EN / ZH route behavior.
- Keep Date Range core logic intact.
- Keep Date Range date selection behavior intact.
- Keep Date Range reset / clear behavior intact.
- Keep Date Range result meaning intact.
- Reuse ToolAdSlot instead of creating another ad component.
- Do not connect live ads.
```

### Layout direction

```text
Date Range Calculator V2 should use the new tool page layout pattern:

New tool page shell
├── First-screen tool area
│   ├── Tool title / short context
│   ├── Main Date Range result
│   ├── Date Range main app area / controls
│   └── Primary actions / clear action if applicable
├── Lower content
│   ├── Main ToolAdSlot
│   ├── Related Tools
│   ├── About / How to use
│   └── FAQ / SEO content
└── Desktop sidebar / drawer if applicable
    ├── Sidebar ToolAdSlot
    └── Sidebar Related Tools
```

### Main ToolAdSlot rules

```text
Placement:
Result / first-screen experience
→ lower content
→ Main ToolAdSlot
→ Related Tools
→ About / HowTo / FAQ / SEO

Desktop: 728x90
Mobile portrait: 320x100
Mobile landscape compact gate: hidden
```

Mobile landscape compact gate:

```css
(orientation: landscape) and (max-height: 700px) and (max-width: 1200px)
```

### Sidebar ToolAdSlot rules

```text
Only add this if Date Range V2 uses the same desktop sidebar / drawer pattern.

Placement:
Sidebar heading
→ Sidebar ToolAdSlot
→ Sidebar Related Tools

Rules:
- Desktop sidebar only
- Fluid width
- max-width: 100%
- Do not force 300x250
- Do not change drawer width
- Do not change drawer behavior
- Do not change ToolCard baseline
```

### Date Range main app preservation

Cursor must identify and preserve:

```text
- Date input / date range selection behavior
- Drag / select range behavior if present
- Start date and end date display behavior
- Total days result
- Workdays result
- Weekends result
- Clear dates behavior
- Empty state behavior
- Mobile bottom control / sheet behavior if currently used
- Any LocalStorage or URL behavior if currently used
```

If current Date Range logic is tightly coupled to the old layout, Cursor must report before editing:

```text
1. Which code is layout-only
2. Which code is logic-critical
3. Whether a V2 wrapper can safely reuse the old app area
4. Whether a small extraction step is needed before migration
5. Risks and rollback plan
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

Plan must also include:

```text
1. Current Date Range file map
2. Current Date Range route file map
3. Which files contain layout markup
4. Which files contain calculation / date selection logic
5. Whether DateRangeCalculatorV2.astro should be created
6. Whether route switching can happen in this task or should be delayed
7. How ToolAdSlot will be wired
8. Whether sidebar / drawer is included in this migration
9. Mobile portrait plan
10. Mobile landscape plan
11. Desktop plan
12. Rollback plan
```

Owner checkpoint questions Cursor must answer before editing:

```text
- Can Date Range V2 reuse the old main app area safely?
- Is a new DateRangeCalculatorV2.astro recommended?
- Will the route entries be switched in this task?
- Will Date Range V2 include a desktop sidebar / drawer in this task?
- Are any protected components required to change?
```

---

## 7. Validation checklist

```text
- npm run build
- Mobile portrait check
- Mobile landscape check
- Desktop check
- Header / Footer unchanged
- BaseLayout unchanged
- Global background unchanged
- Event Countdown V2 unchanged
- ToolAdSlot unchanged unless explicitly approved
- ToolCard baseline unchanged
- RelatedToolRow baseline unchanged
- No inline style
- No !important
- No CSS id selector
- No unexpected route changes
- No live AdSense
- Required Agent Reviews completed
- Owner manual QA needed
```

### Required page checks

```text
/en/date-range-calculator/
/zh/date-range-calculator/
/en/event-countdown/
/zh/event-countdown/
/en/
/zh/
/en/privacy/
/zh/privacy/
/en/terms/
/zh/terms/
/en/contact/
/zh/contact/
```

### Date Range functional QA

```text
- Default state displays correctly
- Selecting start date works
- Selecting end date works
- Result updates correctly
- Total days result remains correct
- Workdays result remains correct
- Weekends result remains correct
- Clear dates works
- Empty state works
- Mobile controls are usable
- Mobile bottom sheet / control behavior still works if present
- No console error
- No layout break after orientation change
```

### Date Range layout QA

```text
Desktop:
- First-screen tool area matches new Timiva V2 layout direction
- Main result remains the visual focus
- Main ToolAdSlot appears below result / above Related Tools
- Main ToolAdSlot reserves 728x90
- Sidebar ToolAdSlot appears above sidebar Related Tools if sidebar is included
- Sidebar ad does not overflow

Mobile portrait:
- Main result remains clear
- Main app area remains usable
- Main ToolAdSlot reserves 320x100
- Ad is below result and above Related Tools
- Ad is not in Bottom Sheet
- Ad is not near Bottom Control

Mobile landscape:
- Main result remains visible
- Main app area remains usable
- Main ToolAdSlot hidden under compact gate
- No overlap with Bottom Control
- No orientation recovery issue
```

### Regression QA

```text
- Event Countdown V2 remains unchanged
- Event Countdown ad placeholders remain unchanged
- Home remains unchanged
- Legal pages remain unchanged
- Header / Footer remain unchanged
- ToolAdSlot still works on Event Countdown V2
- No new ads on Legal / Text pages
```

---

## 8. Completion report

Cursor must create or paste a Timiva Validation Report using:

```text
docs/reports/_validation-report-template.md
```

Required report path:

```text
docs/reports/2026-06-13-date-range-calculator-v2-layout-migration-validation-report.md
```

Completion report must include:

```text
1. Result: Pass / Pass with minor notes / Block
2. Modified files
3. Created files
4. Whether DateRangeCalculatorV2.astro was created
5. Whether route entries were switched
6. Whether Date Range core logic changed
7. Whether Date Range date selection behavior changed
8. Whether ToolAdSlot was reused
9. Whether ToolAdSlot itself was modified
10. Main ToolAdSlot desktop / mobile / landscape results
11. Sidebar ToolAdSlot result if included
12. Device QA: desktop / mobile portrait / mobile landscape
13. Functional QA results
14. Regression results
15. Agent review results
16. Known risks / minor notes
17. Block issues, if any
18. Owner Final Approval question
```

Do not commit or deploy without Owner approval.
