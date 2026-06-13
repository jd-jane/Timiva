# Task: Tool Page Ad Placeholder Slots

Date: 2026-06-13  
Owner: Jane / Timiva  
Status: Draft

---

## 1. Goal

```text
Add shared ad placeholder slots to the Timiva tool page layout before live AdSense integration.

This task should reserve consistent ad positions for all tool pages:
1. Main content ad slot below the result area and above Related Tools.
2. Desktop sidebar native-style ad slot above sidebar Related Tools.
```

This task is only for placeholder / layout preparation.  
Do not connect live Google AdSense in this task.

---

## 2. Scope

### Allowed

```text
- Add a reusable tool-page ad component, suggested file:
  src/components/ToolAdSlot.astro

- Modify the existing shared tool page layout / shell / tool content wrapper if one exists.

- Modify the existing desktop sidebar / drawer content composition only to insert the sidebar ad slot above sidebar Related Tools.

- Add the main ad slot to the shared tool page content flow:
  Tool result area
  → Main Ad Slot
  → Related Tools
  → FAQ / SEO content
  → Footer

- Add the desktop sidebar ad slot:
  Sidebar Native Ad Slot
  → Sidebar Related Tools

- Apply the shared layout behavior to the currently completed / verified tool pages:
  /en/event-countdown/
  /zh/event-countdown/
  /en/date-range-calculator/
  /zh/date-range-calculator/

- Use placeholder labels only:
  EN: Sponsored / Ad
  ZH: 廣告
```

### Not allowed

```text
- Do not modify Header.
- Do not modify Footer visual layout.
- Do not modify BaseLayout.
- Do not modify global background.
- Do not modify Preview layout baseline.
- Do not modify ToolCard baseline.
- Do not modify RelatedToolRow baseline.
- Do not modify Tool Drawer baseline behavior.
- Do not modify LegalTextLayout spacing.
- Do not modify EventCountdownV2 core logic.
- Do not modify Date Range Calculator core logic.
- Do not modify unrelated tools.
- Do not modify Home page.
- Do not modify All Tools page.
- Do not modify Legal / Text pages.
- Do not add ads to Legal / Text pages.
- Do not add live Google AdSense.
- Do not add adsbygoogle.
- Do not add publisher id.
- Do not add ad slot id.
- Do not add third-party ad scripts.
- Do not add cookie / consent logic.
- Do not commit / deploy.
```

If the current codebase does not have a shared tool page layout / shell, Cursor must stop and report the minimum safe option before editing.  
Do not hard-insert ad slots separately into every route unless Owner approves that fallback.

---

## 3. Required reading

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-ceo-workflow-v1.md
docs/timiva-agent-review-workflow-v1.md
agents/README.md
docs/timiva-ad-layout-guidelines-v1.md
docs/timiva-layout-system-v2.md
docs/timiva-design-system-v2.md
docs/timiva-tailwind-css-guidelines-v2.md
docs/timiva-tool-page-qa-checklist-v2.md
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
This task affects tool page ad placement, mobile portrait behavior, mobile landscape behavior, and whether ads interfere with the main tool flow.

Brand Guardian: Required
Reason:
This task adds visible UI containers. The sidebar ad must match Timiva's calm dark native-style visual language without looking like a ToolCard or Related Tool.

Tech Architect: Required
Reason:
This task changes code and should use a reusable component in the shared tool page layout without modifying protected components or duplicating layout in each route.

Growth Strategist: Required
Reason:
This task affects ad placement, content flow, Related Tools order, and the relationship between ads, SEO, and AI-search-friendly content.
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
- Do not use inline style.
- Do not use !important.
- Do not use CSS id selector.
- Avoid unnecessary arbitrary values.
- Prefer existing tokens / component patterns.
- Do not connect live AdSense.
```

### Suggested component

```text
src/components/ToolAdSlot.astro
```

Suggested props / variants:

```text
variant="main"
variant="sidebar"
locale="en" | "zh"
```

If the project has a better existing pattern for props or locale handling, follow the existing pattern and report it.

---

### Main Ad Slot requirements

Placement:

```text
Tool result area
→ Main Ad Slot
→ Related Tools
→ FAQ / SEO Content
→ Footer
```

Size / behavior:

```text
Desktop: 728x90
Mobile portrait: 320x100
Mobile landscape:
- Do not show in the main tool first screen.
- Do not compress the main result.
- Do not place near Bottom Control.
- If space is insufficient, delay the slot to lower content flow or hide it.
- Report the chosen mobile landscape behavior.
```

Visual requirements:

```text
- Low distraction.
- Clear Ad / Sponsored / 廣告 label.
- Must not look like the main CTA.
- Must not look like the tool result.
- Must not appear above the main result.
- Must not be inside the input area.
- Must not be inside Bottom Sheet.
- Must not be near Bottom Control.
```

---

### Sidebar Native Ad Slot requirements

Placement:

```text
Desktop sidebar
→ Sidebar Native Ad Slot
→ Sidebar Related Tools
```

Display:

```text
Desktop sidebar only.
Do not show sidebar ad on mobile.
```

Size / behavior:

```text
Do not force 300x250.
Current sidebar available width is about 258px.
Use a responsive / fluid container.
Width should follow parent container with max-width: 100%.
Height may use a conservative min-height placeholder.
Do not change sidebar / drawer width to fit the ad.
```

Visual direction:

```text
- Inspired by YouTube-style sidebar sponsored / native ad placement.
- Use Timiva dark UI.
- Soft radius.
- Low-contrast border.
- Calm glassmorphism / dark card feeling.
- Should not look like an ugly external ad image pasted into the page.
- Must still clearly be an ad.
- Must show Sponsored / Ad / 廣告 label.
- Must not pretend to be Timiva content.
- Must not look identical to ToolCard.
- Must not look like Related Tools.
- Must not look like a system notification.
- Must not behave like a primary CTA.
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

### Additional plan-first checks

Before editing, Cursor must also report:

```text
1. What is the actual shared tool page layout / shell / content wrapper file?
2. What is the actual sidebar / drawer composition file?
3. Can this be implemented without modifying Header, Footer, BaseLayout, global background, ToolCard baseline, RelatedToolRow baseline, and Tool Drawer baseline behavior?
4. Can this be implemented without modifying EventCountdownV2 core logic?
5. Can this be implemented without modifying Date Range Calculator core logic?
6. Can the ad slots be added through shared layout instead of route-by-route hard inserts?
7. If a protected area seems necessary to modify, stop and explain why before editing.
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
- ToolCard baseline unchanged
- RelatedToolRow baseline unchanged
- Tool Drawer baseline behavior unchanged
- EventCountdownV2 core logic unchanged
- Date Range Calculator core logic unchanged
- Home page unaffected
- Legal pages unaffected and still contain no ads
- No inline style
- No !important
- No CSS id selector
- No unexpected route changes
- No live AdSense script
- No adsbygoogle
- No publisher id
- No ad slot id
- Required Agent Reviews completed
- Owner manual QA needed
```

### Required page checks

```text
/en/event-countdown/
/zh/event-countdown/
/en/date-range-calculator/
/zh/date-range-calculator/
```

### Device-specific checks

Desktop:

```text
- Main Ad Slot appears below the result area and above Related Tools.
- Main Ad Slot reserves 728x90.
- Sidebar Native Ad Slot appears above sidebar Related Tools.
- Sidebar Native Ad Slot uses responsive / fluid width and does not force 300x250.
- Sidebar ad does not compress the main tool.
- Sidebar / drawer width is not changed to fit the ad.
```

Mobile portrait:

```text
- Main Ad Slot appears below the result area and above Related Tools.
- Main Ad Slot reserves 320x100.
- Ad slot does not appear inside Bottom Sheet.
- Ad slot is not near Bottom Control.
- Main result remains clear.
```

Mobile landscape:

```text
- Ad does not appear in the main tool first screen.
- Main result is not compressed.
- Bottom Control is not affected.
- If hidden or delayed, the behavior is documented in the report.
```

---

## 8. Completion report

Cursor must create or paste a Timiva Validation Report using:

```text
docs/reports/_validation-report-template.md
```

Do not commit or deploy without Owner approval.

### Required report title

```text
# Timiva Validation Report — Tool Page Ad Placeholder Slots
```

### Required report content

```text
## 1. 本次完成內容
- ...

## 2. 修改檔案
- 新增：
- 修改：

## 3. 是否新增共用元件
- Yes / No
- 元件名稱：
- Props / variant：

## 4. 是否修改 locked / protected components
- Yes / No
- 若 Yes，請說明 Owner 是否已確認

## 5. 廣告版位確認
| Slot | Device | Placement | Size / Behavior | Result |
|---|---|---|---|---|
| Main Ad Slot | Desktop | Result below / Related Tools above | 728x90 | Pass / Block |
| Main Ad Slot | Mobile portrait | Result below / Related Tools above | 320x100 | Pass / Block |
| Main Ad Slot | Mobile landscape | Not in first tool screen | Hidden / delayed / visible with notes | Pass / Block |
| Sidebar Native Ad Slot | Desktop | Sidebar Related Tools above | responsive / fluid, max-width 100% | Pass / Block |

## 6. 禁止位置檢查
| Check | Result | Notes |
|---|---|---|
| Not above main result | Pass / Block | |
| Not inside input area | Pass / Block | |
| Not inside Bottom Sheet | Pass / Block | |
| Not near Bottom Control | Pass / Block | |
| Not disguised as Related Tools | Pass / Block | |
| Not added to Legal pages | Pass / Block | |
| Not connected to live AdSense | Pass / Block | |

## 7. Device QA
| Device | Result | Notes |
|---|---|---|
| Desktop | Pass / Block | |
| Mobile portrait | Pass / Block | |
| Mobile landscape | Pass / Block | |

## 8. Technical checks
| Check | Result | Notes |
|---|---|---|
| npm run build | Pass / Block | |
| Semantic HTML | Pass / Block | |
| Chinese comments | Pass / Block | |
| Tailwind CSS | Pass / Block | |
| No inline style | Pass / Block | |
| No !important | Pass / Block | |
| No CSS id selector | Pass / Block | |
| No formal AdSense script | Pass / Block | |

## 9. Regression checks
- Event Countdown EN:
- Event Countdown ZH:
- Date Range Calculator EN:
- Date Range Calculator ZH:
- Home unaffected:
- Legal pages unaffected:
- Header / Footer unaffected:

## 10. Owner Final Approval Required
- Yes
- 請等待 Owner 確認，不要自行 commit / deploy。
```
