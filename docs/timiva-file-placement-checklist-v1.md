# Timiva File Placement Checklist V1

## 文件目的

本文件用來檢查 Timiva 新專案文件、Agents、Skills、Cursor Rules 是否放在正確位置。

當你下載所有 `.md` 與 `.mdc` 檔案後，可以依照本文件逐一確認，避免放錯資料夾或漏放文件。

---

## 1. 建議資料夾結構

Timiva 新專案建議結構如下：

```text
timiva/
├── AGENTS.md
├── docs/
├── agents/
│   └── skills/
└── .cursor/
    └── rules/
```

如果資料夾還沒建立，可以在專案根目錄執行：

```bash
mkdir -p docs
mkdir -p agents/skills
mkdir -p .cursor/rules
```

---

## 2. 專案根目錄

以下檔案放在專案根目錄：

```text
timiva/
└── AGENTS.md
```

檢查：

```text
[ ] AGENTS.md
```

---

## 3. docs/ 文件

以下文件放在：

```text
timiva/docs/
```

### 3.1 Core Docs

```text
[ ] timiva-core-docs-index-v1.md
[ ] timiva-project-brief-v1.md
[ ] timiva-product-principles-v2.md
```

### 3.2 Product Architecture Docs

```text
[ ] timiva-product-architecture-v3.md
[ ] timiva-v1-roadmap-v2.md
[ ] timiva-new-tool-development-rules-v2.md
```

### 3.3 Design System Docs

```text
[ ] timiva-layout-system-v2.md
[ ] timiva-design-system-v2.md
[ ] timiva-tailwind-css-guidelines-v2.md
[ ] timiva-wireframe-index-v1.md
[ ] timiva-ad-layout-guidelines-v1.md
```

### 3.4 AI Collaboration Docs

```text
[ ] timiva-decision-validation-flow-v1.md
[ ] timiva-ceo-workflow-v1.md
[ ] timiva-cursor-command-patterns-v1.md
```

### 3.5 Execution & Validation Docs

```text
[ ] timiva-tool-page-qa-checklist-v2.md
[ ] timiva-seo-aeo-ai-search-guidelines-v2.md
[ ] timiva-pre-deploy-checklist-v1.md
[ ] timiva-file-placement-checklist-v1.md
```

---

## 4. agents/ 代理人文件

以下文件放在：

```text
timiva/agents/
```

檢查：

```text
[ ] experience-lead.md
[ ] brand-guardian.md
[ ] tech-architect.md
[ ] growth-strategist.md
```

注意：本專案前期採用可見資料夾 `agents/`，不要使用隱藏資料夾 `.agents/`。

---

## 5. agents/skills/ Skills 文件

以下文件放在：

```text
timiva/agents/skills/
```

檢查：

```text
[ ] user-flow-review-skill.md
[ ] mobile-landscape-review-skill.md
[ ] wireframe-to-layout-review-skill.md
[ ] component-visual-review-skill.md
[ ] css-cleanup-skill.md
[ ] tool-page-qa-skill.md
[ ] seo-aeo-tool-page-skill.md
[ ] content-growth-review-skill.md
[ ] ad-placement-review-skill.md
[ ] pre-deploy-check-skill.md
```

---

## 6. .cursor/rules/ Cursor Rules

以下文件放在：

```text
timiva/.cursor/rules/
```

檢查：

```text
[ ] timiva-core-principles.mdc
[ ] timiva-tailwind-rules.mdc
[ ] timiva-layout-rules.mdc
[ ] timiva-mobile-rules.mdc
[ ] timiva-seo-rules.mdc
[ ] timiva-qa-rules.mdc
```

注意：`.cursor` 是隱藏資料夾。  
Finder 看不到時，按：

```text
Command + Shift + .
```

---

## 7. docs/wireframes/ 線稿資料夾

線稿之後放在：

```text
timiva/docs/wireframes/
```

建議先建立：

```bash
mkdir -p docs/wireframes
```

建議檔案：

```text
[ ] README.md
[ ] home-desktop.png
[ ] home-mobile-portrait.png
[ ] home-mobile-landscape.png
[ ] tool-desktop.png
[ ] tool-mobile-portrait.png
[ ] tool-mobile-landscape.png
[ ] all-tools-desktop.png
[ ] all-tools-mobile-portrait.png
[ ] legal-desktop.png
[ ] legal-mobile-portrait.png
[ ] ad-placement-reference.png
```

如果線稿還沒全部準備好，可以先放 `README.md`，之後再補圖。

---

## 8. 完整結構參考

完成後建議結構如下：

```text
timiva/
├── AGENTS.md
├── docs/
│   ├── timiva-core-docs-index-v1.md
│   ├── timiva-project-brief-v1.md
│   ├── timiva-product-principles-v2.md
│   ├── timiva-product-architecture-v3.md
│   ├── timiva-v1-roadmap-v2.md
│   ├── timiva-new-tool-development-rules-v2.md
│   ├── timiva-layout-system-v2.md
│   ├── timiva-design-system-v2.md
│   ├── timiva-tailwind-css-guidelines-v2.md
│   ├── timiva-wireframe-index-v1.md
│   ├── timiva-ad-layout-guidelines-v1.md
│   ├── timiva-decision-validation-flow-v1.md
│   ├── timiva-ceo-workflow-v1.md
│   ├── timiva-cursor-command-patterns-v1.md
│   ├── timiva-tool-page-qa-checklist-v2.md
│   ├── timiva-seo-aeo-ai-search-guidelines-v2.md
│   ├── timiva-pre-deploy-checklist-v1.md
│   ├── timiva-file-placement-checklist-v1.md
│   └── wireframes/
├── agents/
│   ├── experience-lead.md
│   ├── brand-guardian.md
│   ├── tech-architect.md
│   ├── growth-strategist.md
│   └── skills/
│       ├── user-flow-review-skill.md
│       ├── mobile-landscape-review-skill.md
│       ├── wireframe-to-layout-review-skill.md
│       ├── component-visual-review-skill.md
│       ├── css-cleanup-skill.md
│       ├── tool-page-qa-skill.md
│       ├── seo-aeo-tool-page-skill.md
│       ├── content-growth-review-skill.md
│       ├── ad-placement-review-skill.md
│       └── pre-deploy-check-skill.md
└── .cursor/
    └── rules/
        ├── timiva-core-principles.mdc
        ├── timiva-tailwind-rules.mdc
        ├── timiva-layout-rules.mdc
        ├── timiva-mobile-rules.mdc
        ├── timiva-seo-rules.mdc
        └── timiva-qa-rules.mdc
```

---

## 9. 終端機檢查指令

在 Timiva 專案根目錄執行：

```bash
find docs agents .cursor/rules -maxdepth 3 -type f | sort
```

你應該會看到所有文件列出。

如果想確認資料夾：

```bash
find docs agents .cursor -maxdepth 3 -type d | sort
```

---

## 10. Cursor 開始開發前檢查

Cursor 開始正式開發前，請先確認：

```text
[ ] docs/ 核心文件已放好
[ ] AGENTS.md 已放在根目錄
[ ] agents/ 四個角色文件已放好
[ ] agents/skills/ 十個 Skills 已放好
[ ] .cursor/rules/ 六個 rules 已放好
[ ] docs/wireframes/ 已建立
[ ] Cursor 可以看到 docs/ 和 agents/
[ ] .cursor/rules/ 已建立成功
```

---

## 11. 結論

本文件的目的只是確認檔案位置。

如果檔案位置正確，Cursor 才能依照以下順序理解 Timiva：

```text
產品方向
功能架構
版型與視覺
Tailwind 實作
Agents 分工
Skills 流程
Rules 限制
QA / SEO / Deploy 檢查
```

確認完成後，才建議開始建立 Astro 專案與共用版型。
