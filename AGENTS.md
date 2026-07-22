# AGENTS.md — Timiva Project Operating Guide

> 目的：這是 Cursor / Agents / Owner 的**任務入口檔**。  
> 使用方式：每次開新任務時，先讀本檔與 `docs/README.md` 的閱讀順序，再讀 `docs/project/current-status.md`。  
> 注意：根目錄只保留這一份 `AGENTS.md`。4 個代理人的詳細角色定義放在 `agents/`。

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
2. docs/README.md（閱讀順序與文件分類）
3. docs/project/current-status.md
4. docs/project/decision-log.md
5. docs/core/project-brief.md
6. docs/core/product-principles.md
7. docs/workflow/owner-workflow.md
8. agents/README.md
9. 若任務有對應 brief：local-docs/tasks/ 下的相關檔案（local-only，不進 Git）
```

### Agent role files

依任務等級與 `docs/workflow/agent-review.md` 判斷是否讀取。L 級或 Pre-deploy 時，讀取相關角色檔：

```text
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/growth-strategist.md
```

### Layout / UI tasks additionally read

```text
docs/standards/layout-system.md
docs/standards/design-system.md
docs/standards/tailwind-guidelines.md
docs/standards/wireframe-index.md
docs/wireframes/README.md
```

### Tool page tasks additionally read

```text
docs/workflow/new-tool-development.md
docs/workflow/tool-page-qa.md
docs/workflow/shared-component-reuse-gate.md
docs/standards/seo-guidelines.md
docs/tools/[tool-name]/README.md
```

### Shared UI pattern／第二次相同 pattern 任務 additionally read

```text
docs/workflow/shared-component-reuse-gate.md
```

### SEO / content tasks additionally read

```text
docs/standards/seo-guidelines.md
docs/core/product-architecture.md
```

### Ads tasks additionally read

```text
docs/standards/ad-layout-guidelines.md
```

### Commit / deploy tasks additionally read

```text
docs/workflow/pre-deploy.md
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

If a locked component seems necessary to modify, stop and report first.

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
Write RWD by component section.
Do not use inline style.
Do not use !important.
Do not use CSS id selectors.
Prefer existing tokens and shared components.
When the same UI pattern appears a second time, follow docs/workflow/shared-component-reuse-gate.md (Reuse Review before implementation).
```

---

## 5. Cursor workflow

依 `docs/workflow/owner-workflow.md` 的 **P / S / M / L** 等級執行：

```text
P 級：直接實作與微調，不需 Plan，不需 Agent Review
S 級：直接實作，不需正式 Plan
M 級：精簡 Plan → Owner 審核 → 實作 → 驗收
L 級：完整 Plan → 分階段實作 → Targeted Agent Review → 驗收
```

超出原範圍時必須停止並回報升級建議，不可自行擴大。

Validation reports 與 task briefs 放 `local-docs/`，不進 Git。

---

## 6. Four Agents

Timiva 使用四個審查角色。是否啟用見 `docs/workflow/agent-review.md`（Targeted Review，非每任務全跑）。

```text
Experience Lead = mobile UX, flow, touch targets, simplicity
Brand Guardian = visual consistency, Widget-like feel, layout drift
Tech Architect = Astro / Tailwind / semantic HTML / JS stability / build
Growth Strategist = SEO / AEO / FAQ Schema / related tools / internal links
```

L 級 Plan 需標註 Targeted Agent Review 範圍與原因。

---

## 7. Owner Final Approval

Timiva 目前為 Phase A：Owner 主導確認期。

```text
Agents passing does not mean automatic launch.
Cursor finishing does not mean commit is allowed.
Build passing does not mean deploy is allowed.
commit 授權 ≠ push 授權 ≠ deploy 授權
```

Cursor may only proceed when Owner explicitly approves the next step.
