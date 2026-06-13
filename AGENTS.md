# AGENTS.md — Timiva Project Operating Guide

> 目的：這是 Cursor / Agents / Owner 的**任務入口檔**。  
> 使用方式：每次開新任務時，先讀本檔，再讀 `docs/timiva-current-status.md`，最後讀該任務的 `docs/tasks/*.md`。  
> 注意：根目錄只保留這一份 `AGENTS.md`。4 個代理人的詳細角色定義放在 `agents/`，不要再把舊版 monolithic agents 文件放回根目錄，避免 Cursor 混淆。

---

## 1. Project identity

Timiva 是一個手機優先、低維護、Widget-like 的時間與生活節奏工具網站。

核心方向：

```text
少工具，但每個都超舒服。
Mobile-first
Widget-like
Calm UI
Pure frontend first
SEO supports UX, but never overrides UX
```

正式技術方向：

```text
Astro
Tailwind CSS
Cloudflare Pages
English / 繁體中文
LocalStorage for low-risk local state
URL sharing only when useful and safe
No backend by default
No database by default
```

---

## 2. Required reading order

### Every Cursor task must read

```text
1. AGENTS.md
2. docs/timiva-current-status.md
3. docs/timiva-decision-log.md
4. docs/timiva-project-brief-v1.md
5. docs/timiva-product-principles-v2.md
6. docs/timiva-ceo-workflow-v1.md
7. docs/timiva-agent-review-workflow-v1.md
8. agents/README.md
9. the specific docs/tasks/*.md file for the current task
```

### Agent role files

Cursor must read the relevant role files based on Agent Routing. For broad or high-risk tasks, read all four:

```text
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/growth-strategist.md
```

### Layout / UI tasks additionally read

```text
docs/timiva-layout-system-v2.md
docs/timiva-design-system-v2.md
docs/timiva-tailwind-css-guidelines-v2.md
docs/timiva-wireframe-index-v1.md
```

### Tool page tasks additionally read

```text
docs/timiva-new-tool-development-rules-v2.md
docs/timiva-tool-page-qa-checklist-v2.md
docs/timiva-seo-aeo-ai-search-guidelines-v2.md
```

### SEO / content tasks additionally read

```text
docs/timiva-seo-aeo-ai-search-guidelines-v2.md
docs/timiva-product-architecture-v3.md
```

### Ads tasks additionally read

```text
docs/timiva-ad-layout-guidelines-v1.md
```

### Commit / deploy tasks additionally read

```text
docs/timiva-pre-deploy-checklist-v1.md
```

---

## 3. Locked components

Unless the task explicitly says otherwise, do not modify:

```text
Header
Footer visual layout
BaseLayout
Global background
Shared containers
Existing verified tool core logic
Preview baseline layout
```

If a locked component seems necessary to modify, stop and report first:

```text
Component:
Why it seems necessary:
Affected pages:
Safer alternative:
Regression tests needed:
Owner approval required: yes
```

---

## 4. Non-negotiable implementation rules

```text
Do not rewrite the whole site.
Do not expand scope.
Do not commit or deploy without Owner approval.
Do not add ads unless the task explicitly requests it.
Do not place ads in Legal / Text pages.
Do not place ads in Bottom Sheet.
Do not put SEO content before the main tool experience.
Do not create a new page skeleton if an existing layout applies.
Do not invent a fifth page type beyond Home / Tool / All Tools / Legal Text.
```

CSS / Tailwind rules:

```text
Use Tailwind CSS.
Keep semantic HTML.
Add Chinese comments for major sections.
Write RWD by component section, not all desktop first then all mobile at the end.
Do not use inline style.
Do not use !important.
Do not use CSS id selectors.
Avoid random hard-coded colors and arbitrary values.
Prefer existing tokens and shared components.
```

---

## 5. Cursor workflow

For every task:

```text
1. Read AGENTS.md.
2. Read docs/timiva-current-status.md.
3. Read docs/timiva-decision-log.md.
4. Read docs/timiva-agent-review-workflow-v1.md.
5. Read agents/README.md and relevant agent role files.
6. Read the task brief in docs/tasks/.
7. Create an implementation plan only.
8. Include Agent Routing in the plan.
9. List files to modify and files not to modify.
10. Wait for Owner approval before editing.
11. Implement only the approved scope.
12. Run required checks.
13. Create a validation report.
14. Wait for Owner final approval before commit / deploy.
```

Recommended Cursor command:

```text
Read AGENTS.md, docs/timiva-current-status.md, docs/timiva-decision-log.md, docs/timiva-agent-review-workflow-v1.md, agents/README.md, the relevant files in agents/, and docs/tasks/[TASK_FILE].md.
Create an implementation plan only, including Agent Routing. Do not edit files yet.
```

---

## 6. Four Agents

Timiva uses four review roles:

```text
Experience Lead = mobile UX, flow, touch targets, simplicity
Brand Guardian = visual consistency, Widget-like feel, layout drift
Tech Architect = Astro / Tailwind / semantic HTML / JS stability / build
Growth Strategist = SEO / AEO / FAQ Schema / related tools / internal links
```

Agent definitions live in:

```text
agents/README.md
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/growth-strategist.md
```

Every implementation plan must include:

```text
Experience Lead: Required / N/A — reason
Brand Guardian: Required / N/A — reason
Tech Architect: Required / N/A — reason
Growth Strategist: Required / N/A — reason
```

---

## 7. Owner Final Approval

Timiva is currently in Phase A: Owner-led confirmation.

This means:

```text
Agents passing does not mean automatic launch.
Cursor finishing does not mean commit is allowed.
Build passing does not mean deploy is allowed.
```

Cursor may only proceed when Owner says something equivalent to:

```text
確認，可以進入下一步。
```
