# Timiva Agents Skills

## 文件目的

本文件定義 `agents/skills/` 的用途、使用時機與 Cursor 讀取規則。

Skills 是 Timiva 專案中可重複使用的檢查流程。它們不是代理人角色，也不是產品決策文件，而是協助 Cursor、Agents 與 Owner 在固定情境下完成一致的檢查。

---

## 1. Skills 與 Agents 的關係

Timiva 的 AI 協作分工如下：

```text
agents/ = 誰來審查
agents/skills/ = 怎麼檢查
docs/*workflow* = 整體流程怎麼跑
```

也就是：

```text
Experience Lead / Brand Guardian / Tech Architect / Growth Strategist
= 審查角色

Skills
= 可重複執行的檢查方法

Workflow docs
= 任務從討論、計畫、實作、驗收到 Owner 確認的順序
```

Agents 負責判斷，Skills 負責檢查步驟。  
Cursor 應依任務類型選擇相關 skill，不需要每次讀取所有 skills。

---

## 2. 資料夾位置

Timiva 目前使用可見資料夾：

```text
agents/skills/
```

不要使用：

```text
.agents/skills/
```

原因：

```text
1. Owner 比較容易在 Finder / VS Code 中找到
2. Cursor 比較容易明確讀取
3. 與目前專案文件放置規則一致
```

---

## 3. 建議檔案清單

```text
agents/skills/
├── README.md
├── user-flow-review-skill.md
├── mobile-landscape-review-skill.md
├── wireframe-to-layout-review-skill.md
├── component-visual-review-skill.md
├── css-cleanup-skill.md
├── tool-page-qa-skill.md
├── seo-aeo-tool-page-skill.md
├── content-growth-review-skill.md
├── ad-placement-review-skill.md
└── pre-deploy-check-skill.md
```

如果某些 skill 尚未建立，可以先保留本 README，之後依任務需要逐步新增。

---

## 4. Skill 使用對照表

| 任務類型 | 建議讀取 Skill | 主要對應 Agent |
|---|---|---|
| 使用流程、CTA、觸控、Bottom Sheet | `user-flow-review-skill.md` | Experience Lead |
| 手機橫式、轉向、compact layout | `mobile-landscape-review-skill.md` | Experience Lead / Tech Architect |
| 線稿轉正式 layout | `wireframe-to-layout-review-skill.md` | Brand Guardian / Experience Lead |
| 元件視覺一致、卡片、按鈕、icon | `component-visual-review-skill.md` | Brand Guardian |
| Tailwind / CSS 清理 | `css-cleanup-skill.md` | Tech Architect |
| 工具頁完整 QA | `tool-page-qa-skill.md` | Experience Lead / Tech Architect |
| 工具頁 SEO / FAQ / Schema | `seo-aeo-tool-page-skill.md` | Growth Strategist |
| 內容成長、內部連結、AI Search | `content-growth-review-skill.md` | Growth Strategist |
| 廣告版位與誤觸檢查 | `ad-placement-review-skill.md` | Experience Lead / Brand Guardian / Growth Strategist |
| commit / deploy 前總檢查 | `pre-deploy-check-skill.md` | Tech Architect / Growth Strategist |

---

## 5. Cursor 讀取規則

Cursor 開始任務時，應先讀：

```text
1. AGENTS.md
2. docs/project/current-status.md
3. docs/project/decision-log.md
4. local-docs/tasks/[TASK_FILE].md
5. agents/README.md
6. 相關 Agent 檔案
7. 相關 skill 檔案
```

不需要每次讀取所有 skills。

正確做法：

```text
本次任務是 SEO / FAQ 補強
→ 讀 Growth Strategist
→ 讀 seo-aeo-tool-page-skill.md
→ 視情況讀 content-growth-review-skill.md
```

```text
本次任務是手機橫式跑版修正
→ 讀 Experience Lead
→ 讀 Tech Architect
→ 讀 mobile-landscape-review-skill.md
→ 視情況讀 tool-page-qa-skill.md
```

```text
本次任務是 deploy 前檢查
→ 讀 Tech Architect
→ 讀 Growth Strategist
→ 讀 pre-deploy-check-skill.md
→ 視情況讀 tool-page-qa-skill.md
```

---

## 6. Skill 不應做的事

Skills 不應：

```text
1. 取代 Owner final decision
2. 自行擴大任務範圍
3. 自行修改 locked components
4. 自行 commit / deploy
5. 把 minor notes 當成 block
6. 為了完成檢查而重寫整頁
7. 忽略 docs/project/current-status.md
8. 把 discussion / drafts 當成 finalized decision
```

若 skill 發現需要修改 locked components，Cursor 必須先停止並回報：

```text
Component:
原因:
影響頁面:
替代方案:
需要回歸測試:
是否需要 Owner 確認:
```

---

## 7. Agent Routing 與 Skill Routing

每個 task brief 應包含 Agent Routing 與 Skill Routing。

建議格式：

```text
## Agent Routing
- Experience Lead: Required / N/A — reason
- Brand Guardian: Required / N/A — reason
- Tech Architect: Required / N/A — reason
- Growth Strategist: Required / N/A — reason

## Skill Routing
- user-flow-review-skill.md: Required / N/A — reason
- mobile-landscape-review-skill.md: Required / N/A — reason
- wireframe-to-layout-review-skill.md: Required / N/A — reason
- component-visual-review-skill.md: Required / N/A — reason
- css-cleanup-skill.md: Required / N/A — reason
- tool-page-qa-skill.md: Required / N/A — reason
- seo-aeo-tool-page-skill.md: Required / N/A — reason
- content-growth-review-skill.md: Required / N/A — reason
- ad-placement-review-skill.md: Required / N/A — reason
- pre-deploy-check-skill.md: Required / N/A — reason
```

若任務很小，可以只列出 relevant skills，不必列出全部。

---

## 8. Validation Report 補充格式

Cursor 完成任務後，validation report 應補充 Skill Review。

建議格式：

```text
## Skill Review

| Skill | Used? | Result | Notes |
|---|---|---|---|
| user-flow-review-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| mobile-landscape-review-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| wireframe-to-layout-review-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| component-visual-review-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| css-cleanup-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| tool-page-qa-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| seo-aeo-tool-page-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| content-growth-review-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| ad-placement-review-skill.md | Yes / No | Pass / Minor / Block / N/A | |
| pre-deploy-check-skill.md | Yes / No | Pass / Minor / Block / N/A | |
```

如果某個 skill 沒有使用，需簡短說明原因。

---

## 9. 常見任務範例

### 9.1 新增工具主體

建議讀取：

```text
agents/experience-lead.md
agents/brand-guardian.md
agents/tech-architect.md
agents/skills/user-flow-review-skill.md
agents/skills/component-visual-review-skill.md
agents/skills/tool-page-qa-skill.md
```

### 9.2 SEO / FAQ 補強

建議讀取：

```text
agents/growth-strategist.md
agents/skills/seo-aeo-tool-page-skill.md
agents/skills/content-growth-review-skill.md
```

### 9.3 手機橫式修正

建議讀取：

```text
agents/experience-lead.md
agents/tech-architect.md
agents/skills/mobile-landscape-review-skill.md
agents/skills/tool-page-qa-skill.md
```

### 9.4 廣告版位評估

建議讀取：

```text
agents/experience-lead.md
agents/brand-guardian.md
agents/growth-strategist.md
agents/skills/ad-placement-review-skill.md
```

### 9.5 Deploy 前總檢查

建議讀取：

```text
agents/tech-architect.md
agents/growth-strategist.md
agents/skills/pre-deploy-check-skill.md
```

---

## 10. Owner Final Approval

目前 Timiva 採用 Phase A：Owner 主導確認期。

即使 Agents 與 Skills 都回傳 Pass，Cursor 仍不得自行 commit / deploy。

必須等待 Owner 明確確認後，才可以進入：

```text
commit
deploy
重大結構調整
locked components 修改
```

---

## 11. 簡單記法

```text
agents/ = 誰來看
agents/skills/ = 怎麼檢查
local-docs/tasks/ = 這次要做什麼
local-docs/reports/ = 做完怎麼回報
docs/project/current-status.md = 目前真實狀態
docs/project/decision-log.md = 已定案決策
```
