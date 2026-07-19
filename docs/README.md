# Timiva 文件索引

## 文件目的

本文件是 Timiva 專案文件的**單一入口**，整合原 `timiva-core-docs-index` 與 `timiva-file-placement-checklist` 的用途。

它用來回答：

```text
Timiva 需要哪些核心文件？
每份文件負責什麼？
Cursor 應該優先閱讀哪些文件？
哪些文件進 Git、哪些留在本機？
任務應該用 P / S / M / L 哪一層？
```

完整 Owner 工作流程見 [`docs/workflow/owner-workflow.md`](workflow/owner-workflow.md)。

---

## 1. 專案文件原則

Timiva 的文件不是為了堆疊規範，而是讓產品、設計、技術與內容策略在開發過程中保持一致。

所有文件都應服務以下目標：

```text
1. 保持 Timiva 的產品核心
2. 避免開發過程中樣式漂移
3. 避免工具越做越像傳統工具站
4. 讓 Cursor 可以理解專案脈絡
5. 讓 Agents 能依照固定角色審查
6. 讓 Owner 可以在前期保有最終確認權
```

Timiva 的核心方向：

```text
少工具 · 高完成度 · Mobile-first · Widget-like · 低維護 · SEO 不干擾 UX
```

---

## 2. 單一來源原則（Single Source of Truth）

| 類型 | 權威位置 | 說明 |
|---|---|---|
| 產品方向 | `docs/core/` | 專案 brief、原則、架構、roadmap |
| 設計與實作標準 | `docs/standards/` | layout、design system、Tailwind、SEO、互動 baseline |
| 工作流程 | `docs/workflow/` | Owner workflow、Agent review、QA、pre-deploy |
| 專案狀態 | `docs/project/` | current-status、decision-log、seo-technical-audit |
| 工具規格 | `docs/tools/<tool>/` | 每工具最小 tracked 集合 |
| Cursor 任務入口 | 根目錄 `AGENTS.md` | 每次任務必讀 |
| Agent 角色定義 | `agents/` | 四代理人角色檔 |
| 工作證據 | `local-docs/` | plans、tasks、reports、screenshots（不 push） |

**規則：**

```text
active canonical 文件只保留一份，不使用 -v1 / -v2 後綴。
歷史版本進 Git history 或 local-docs/archive/。
計劃、任務 brief、驗證報告、截圖不當 daily canonical。
```

若兩份文件內容衝突，以 `docs/core/`、`docs/standards/`、`docs/project/current-status.md` 為準。

---

## 3. 語言規則

| 文件類型 | 語言 |
|---|---|
| 產品規範、workflow、standards | **繁體中文為主**；技術名詞、檔名、API、class name 可用 English |
| 程式碼註解 | 主要區塊加繁體中文註解 |
| 使用者可見 UI copy | English / 繁體中文 雙語路由各自撰寫 |
| local-docs 工作證據 | 繁體中文或 English 皆可；保持任務內一致 |

---

## 4. 檔名規則

### Active canonical（tracked）

```text
不使用 -v1 / -v2 / -v3 後綴
使用語意化 kebab-case 檔名
例：docs/core/product-architecture.md
    docs/standards/design-system.md
    docs/workflow/owner-workflow.md
```

### 工作證據（local-docs）

```text
保留日期前綴：YYYY-MM-DD-<topic>-<type>.md
例：2026-06-27-year-progress-b3-full-standalone-qa-validation-report.md
```

### 禁止

```text
rebuild / redo / old / legacy 出現在 active canonical 檔名
把歷史版本與現行版本並列為 daily reference
```

---

## 5. Tracked vs local-docs 規則

### 進 Git（tracked）

```text
AGENTS.md
docs/README.md
docs/core/**
docs/standards/**
docs/workflow/**
docs/project/current-status.md
docs/project/decision-log.md
docs/project/seo-technical-audit.md
docs/tools/age-calculator/README.md
docs/tools/age-calculator/product-spec.md
docs/tools/<tool>/ 最小規格集合（README、product-spec 等）
docs/wireframes/（線稿 JPG；Owner 可另行決定是否改 local）
agents/**
.cursor/rules/**
```

### 留在本機（local-docs，不 push）

```text
實作計劃（plans）
任務 brief（tasks）
驗證報告（reports）
QA 截圖（screenshots）
handoffs
templates
archive（已被取代的舊版文件）
```

`.gitignore` 以 `local-docs/` 為主要機制。已 tracked 的證據文件若改為 local-only，需 `git rm --cached` 後 commit。

**備份：** local-docs 不 push 時，依賴 Time Machine、雲端同步或定期 zip。

---

## 6. local-docs 結構

```text
local-docs/
├── README.md                  # 本機備份政策說明（gitignore）
├── plans/
│   ├── year-progress/
│   └── shared/
├── tasks/
│   ├── year-progress/
│   └── site-wide/
├── reports/
│   ├── year-progress/
│   ├── shared/
│   └── site-wide/
├── screenshots/
│   └── year-progress/
├── handoffs/
├── templates/
│   ├── task-brief-template.md
│   ├── validation-report-template.md
│   ├── tool-link-integration-task.md
│   └── cursor-plan-review-workflow.md
└── archive/
    ├── product-architecture-v3.md
    ├── roadmap-v2.md
    ├── legacy-agents-v1.md
    └── merge-notes/
```

---

## 7. 建議 repo 結構

```text
timiva/
├── AGENTS.md
├── docs/
│   ├── README.md                          # 本文件
│   ├── core/
│   │   ├── project-brief.md
│   │   ├── product-principles.md
│   │   ├── product-architecture.md
│   │   └── roadmap.md
│   ├── standards/
│   │   ├── design-system.md
│   │   ├── layout-system.md
│   │   ├── tailwind-guidelines.md
│   │   ├── seo-guidelines.md
│   │   ├── ad-layout-guidelines.md
│   │   ├── wireframe-index.md
│   │   ├── mobile-sheet.md
│   │   ├── interactive-controls.md
│   │   └── date-input.md
│   ├── workflow/
│   │   ├── owner-workflow.md
│   │   ├── agent-review.md
│   │   ├── new-tool-development.md
│   │   ├── tool-page-qa.md
│   │   ├── pre-deploy.md
│   │   └── cursor-commands.md
│   ├── project/
│   │   ├── current-status.md
│   │   ├── decision-log.md
│   │   └── seo-technical-audit.md
│   ├── wireframes/
│   └── tools/
│       ├── event-countdown/
│       ├── date-range-calculator/
│       ├── countdown-timer/
│       ├── year-progress/
│       ├── age-calculator/
│       ├── days-between-dates/
│       ├── business-days-calculator/
│       └── shared/
├── agents/
│   ├── README.md
│   ├── experience-lead.md
│   ├── brand-guardian.md
│   ├── tech-architect.md
│   ├── growth-strategist.md
│   └── skills/
└── .cursor/
    └── rules/
```

---

## 8. 文件分類

### 8.1 Core（`docs/core/`）

定義 Timiva 是什麼、要做成什麼樣子、工具分類與開發順序。

| 文件 | 用途 |
|---|---|
| [`project-brief.md`](core/project-brief.md) | 專案總說明、技術基礎、V1 目標 |
| [`product-principles.md`](core/product-principles.md) | 產品原則與判斷標準 |
| [`product-architecture.md`](core/product-architecture.md) | 四大分類、工具清單、優先順序 |
| [`roadmap.md`](core/roadmap.md) | Phase 0–4 開發順序 |

### 8.2 Standards（`docs/standards/`）

定義畫面、元件、CSS、SEO、互動 baseline。

| 文件 | 用途 |
|---|---|
| [`layout-system.md`](standards/layout-system.md) | 全站 layout、頁型、RWD |
| [`design-system.md`](standards/design-system.md) | 視覺風格、元件、Bento / card |
| [`tailwind-guidelines.md`](standards/tailwind-guidelines.md) | Tailwind 實作規範 |
| [`seo-guidelines.md`](standards/seo-guidelines.md) | SEO / AEO / FAQ Schema |
| [`ad-layout-guidelines.md`](standards/ad-layout-guidelines.md) | 廣告版位 |
| [`wireframe-index.md`](standards/wireframe-index.md) | 線稿索引 |
| [`mobile-sheet.md`](standards/mobile-sheet.md) | Mobile Sheet 共用樣式 |
| [`interactive-controls.md`](standards/interactive-controls.md) | Global cursor + Utility Capsule 互動 baseline |
| [`date-input.md`](standards/date-input.md) | 日期輸入互動標準、Smart Date Input、快速日期輸入、Mobile segmented input、雙日期欄位 QA |

### 8.3 Workflow（`docs/workflow/`）

定義 Cursor、Agents、Owner 如何協作。

| 文件 | 用途 |
|---|---|
| [`owner-workflow.md`](workflow/owner-workflow.md) | **P/S/M/L 分層、角色分工、授權邊界** |
| [`agent-review.md`](workflow/agent-review.md) | Targeted Agent Review 規則 |
| [`new-tool-development.md`](workflow/new-tool-development.md) | 新工具開發規則 |
| [`tool-page-qa.md`](workflow/tool-page-qa.md) | 工具頁 QA checklist |
| [`pre-deploy.md`](workflow/pre-deploy.md) | 部署前檢查 |
| [`cursor-commands.md`](workflow/cursor-commands.md) | Cursor 指令模式 |

### 8.4 Project（`docs/project/`）

| 文件 | 用途 |
|---|---|
| [`current-status.md`](project/current-status.md) | 專案現況事實來源 |
| [`decision-log.md`](project/decision-log.md) | 已確認決策紀錄 |
| [`seo-technical-audit.md`](project/seo-technical-audit.md) | V1 technical SEO audit、問題分級、修正批次與 production closeout baseline |

**閱讀時機：** SEO audit、SEO closeout、pre-deploy SEO 檢查時視情況閱讀；非每次 Cursor 任務必讀。

### 8.5 Tools（`docs/tools/`）

每工具保留最小 tracked 集合；詳細 plan / report 放 `local-docs/`。

| 工具 | 部署狀態（撰寫時） |
|---|---|
| Home | 已部署 |
| Event Countdown (EC) | 已部署 |
| Date Range Calculator (DR) | 已部署 |
| Countdown Timer (CT) | 已部署 |
| Year Progress (YP) | 已部署 |
| Age Calculator (AC) | 已部署 · V1.5 first Search Foundation tool |
| Days Between Dates (DBD) | 已部署 · V1.5 second Search Foundation tool |
| Business Days Calculator (BDC) | 已部署 · V1.5 third Search Foundation tool |

Canonical docs：`docs/tools/<tool>/README.md`、`docs/tools/<tool>/product-spec.md`（例：age-calculator、days-between-dates、business-days-calculator）

---

## 9. Cursor 必讀順序

### 每次 Cursor 任務

```text
1. AGENTS.md
2. docs/project/current-status.md
3. docs/project/decision-log.md
4. docs/core/project-brief.md
5. docs/core/product-principles.md
6. docs/workflow/owner-workflow.md        ← 確認 P/S/M/L 層級
7. docs/workflow/agent-review.md          ← L 層或 pre-deploy 才需完整 Agent 流程
8. agents/README.md
9. 該任務的 local-docs/tasks/*.md 或 Owner 提供的 task brief
```

### Layout / UI 任務額外閱讀

```text
docs/standards/layout-system.md
docs/standards/design-system.md
docs/standards/tailwind-guidelines.md
docs/standards/wireframe-index.md
docs/standards/interactive-controls.md    ← 涉及按鈕 / 控制項互動時
```

### 工具頁任務額外閱讀

```text
docs/workflow/new-tool-development.md
docs/workflow/tool-page-qa.md
docs/standards/seo-guidelines.md
docs/tools/<tool>/ 下對應規格
docs/standards/date-input.md              ← 涉及日期輸入 / 快速日期輸入時
```

### Pre-deploy 任務額外閱讀

```text
docs/workflow/pre-deploy.md
docs/workflow/agent-review.md             ← 四代理人完整審查
```

---

## 10. P / S / M / L 快速參考

詳見 [`docs/workflow/owner-workflow.md`](workflow/owner-workflow.md)。

| 層級 | 典型任務 | Plan | Agent Review | 驗證強度 |
|---|---|---|---|---|
| **P** Polish | 視覺微調、spacing、顏色、文案 polish | 不需要 | 不需要 | Owner + Cursor 迭代即可 |
| **S** Small | 小 bug、單檔修正、明確範圍的小改動 | 不需要正式 plan | 不需要 | 簡短自檢 + Owner 確認 |
| **M** Medium | 單一工具功能、單工具 QA、link integration | 簡短 plan | 通常不需要 | Owner QA + 簡短 validation report |
| **L** Large | 跨工具、共用 baseline、架構、新工具 MVP | 完整 plan | **Targeted** Agent Review | 完整 validation report + targeted agents |
| **Pre-deploy** | 上線前總檢 | pre-deploy checklist | **四代理人完整審查** | 完整報告 + Owner Final Approval |

**Cursor 升級規則：** 若任務觸及 locked components、跨工具 CSS baseline、SEO 結構、或 scope 超出原層級，必須停止並建議升級至更高層級，等待 Owner 確認。

---

## 11. Agents 與 Cursor Rules 放置

### agents/

```text
agents/README.md
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/growth-strategist.md
agents/skills/          ← 固定檢查流程（可選）
```

注意：使用可見資料夾 `agents/`，不要用 `.agents/`。舊版 monolithic agents 封存於 `local-docs/archive/legacy-agents-v1.md`。

### .cursor/rules/

```text
.cursor/rules/timiva-core-principles.mdc
.cursor/rules/timiva-tailwind-rules.mdc
.cursor/rules/timiva-layout-rules.mdc
.cursor/rules/timiva-mobile-rules.mdc
.cursor/rules/timiva-seo-rules.mdc
.cursor/rules/timiva-qa-rules.mdc
```

---

## 12. 文件輸出規則（摘要）

| 層級 | tracked docs 是否更新 | local-docs 輸出 |
|---|---|---|
| P | 通常不更新 | 不需要 report |
| S | 必要時更新 decision-log | 可選簡短 note |
| M | 涉及決策時更新 decision-log | validation report |
| L | 更新 standards / workflow / decision-log 若為 canonical 變更 | plan + validation report |
| Pre-deploy | 更新 current-status | full validation report |

**未經 Owner 明確確認，不得 commit / push / deploy。**

---

## 13. 終端機檢查

在專案根目錄：

```bash
# 列出 tracked docs 結構
find docs agents .cursor/rules -maxdepth 4 -type f | sort

# 確認 local-docs 存在（本機）
ls local-docs/
```

---

## 14. 文件維護原則

```text
1. 保持簡潔，不寫過度抽象理論
2. 優先寫 Cursor 可以執行的規則
3. 每份 active canonical 文件只負責一個主要目的
4. 不重複貼大量相同內容；用交叉引用
5. UI 與實作穩定後，再補精準數值
6. 舊 timiva-*-vN 路徑僅作搬移過渡；新引用一律用 docs/core|standards|workflow|project|tools/
```

---

## 15. 相關入口

| 需求 | 前往 |
|---|---|
| Cursor 任務入口 | 根目錄 `AGENTS.md` |
| Owner 完整 workflow | [`docs/workflow/owner-workflow.md`](workflow/owner-workflow.md) |
| Agent 審查 | [`docs/workflow/agent-review.md`](workflow/agent-review.md) |
| 專案現況 | [`docs/project/current-status.md`](project/current-status.md) |
| 已確認決策 | [`docs/project/decision-log.md`](project/decision-log.md) |
