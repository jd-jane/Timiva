# Task: [Task Name]

Date: YYYY-MM-DD  
Owner: Jane / Timiva  
Status: Draft

---

## 1. Goal

```text
Describe the exact goal of this task in one or two sentences.
```

---

## 2. Scope

### Allowed

```text
- [file / component / page]
- [file / component / page]
```

### Not allowed

```text
- Do not modify Header.
- Do not modify Footer visual layout.
- Do not modify BaseLayout.
- Do not modify global background.
- Do not modify unrelated tools.
- Do not add ads unless explicitly requested.
- Do not commit / deploy.
```

---

## 3. Required reading

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-ceo-workflow-v1.md
docs/timiva-agent-review-workflow-v1.md
agents/README.md
[add task-specific docs]
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
Experience Lead: Required / N/A
Reason:

Brand Guardian: Required / N/A
Reason:

Tech Architect: Required / N/A
Reason:

Growth Strategist: Required / N/A
Reason:
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

---

## 7. Validation checklist

```text
- npm run build
- Mobile portrait check
- Mobile landscape check
- Desktop check
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

Do not commit or deploy without Owner approval.
