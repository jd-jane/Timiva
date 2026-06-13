# Timiva Workflow Docs Pack — Agents Merged

這個資料包把 Timiva 目前的專案規範、交接摘要、新工作流，以及舊版 `AGENTS.md` 的 4 個代理人內容整合成可直接放進專案根目錄的結構。

---

## 1. 這次整合重點

```text
1. 根目錄 AGENTS.md 保留為 Cursor 任務入口。
2. 舊版 monolithic AGENTS.md 不覆蓋新版入口，改封存到 docs/archive/legacy-agents-v1.md。
3. 4 個代理人細節拆到 agents/。
4. agents/README.md 整合代理人總覽、流程、Routing 與回報格式。
5. docs/timiva-agent-review-workflow-v1.md 補強四代理人審查流程。
6. task brief / validation report 模板維持 Agent Routing 與 Agent Review。
```

---

## 2. 建議放置方式

將本資料包內容放到 Timiva 專案根目錄後，結構應類似：

```text
timiva/
├── AGENTS.md
├── agents/
│   ├── README.md
│   ├── experience-lead.md
│   ├── brand-guardian.md
│   ├── tech-architect.md
│   └── growth-strategist.md
├── docs/
│   ├── timiva-current-status.md
│   ├── timiva-decision-log.md
│   ├── timiva-agent-review-workflow-v1.md
│   ├── tasks/
│   ├── reports/
│   ├── handovers/
│   └── archive/
└── .cursor/
    └── rules/
```

---

## 3. 最重要的入口檔

```text
AGENTS.md
```

這份是 Cursor 每次任務的第一份文件。  
不要再把舊版 `AGENTS.md` 放回根目錄覆蓋它。

---

## 4. ChatGPT 新討論串最小文件

```text
docs/timiva-current-status.md
docs/timiva-decision-log.md
docs/tasks/[本輪任務].md
```

如果是討論 Cursor / Agents / 驗證流程，再加：

```text
AGENTS.md
docs/timiva-agent-review-workflow-v1.md
agents/README.md
```

---

## 5. Cursor 新任務建議指令

```text
Read AGENTS.md, docs/timiva-current-status.md, docs/timiva-decision-log.md, docs/timiva-agent-review-workflow-v1.md, agents/README.md, the relevant files in agents/, and docs/tasks/[TASK_FILE].md.
Create an implementation plan only, including Agent Routing. Do not edit files yet.
```

---

## 6. 日常使用方式

1. ChatGPT 討論方向。
2. 產出 `docs/tasks/[task].md`。
3. Cursor 讀 `AGENTS.md` + `current-status` + `decision-log` + task brief + relevant agents。
4. Cursor 先出 plan，不直接改。
5. Owner 同意後 Cursor 實作。
6. Cursor 輸出 `docs/reports/[report].md`。
7. Owner 實機測試。
8. ChatGPT 根據 report / 截圖判斷下一步。

---

## 7. 建議下一步

先執行：

```text
docs/tasks/2026-06-10-pre-deploy-final-check.md
```

Cursor 指令：

```text
Read AGENTS.md, docs/timiva-current-status.md, docs/timiva-decision-log.md, docs/timiva-agent-review-workflow-v1.md, agents/README.md, all four files in agents/, and docs/tasks/2026-06-10-pre-deploy-final-check.md.
Create an implementation plan only, including Agent Routing. Do not edit files yet.
```
