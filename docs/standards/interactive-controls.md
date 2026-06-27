# Timiva 互動控制項 Baseline

## 文件目的

本文件是 Timiva V2 工具頁**互動控制項**的 canonical 規則， distilled 自共用 baseline 實作與驗收。

涵蓋兩層架構：

```text
A. Global Interactive Cursor Baseline — 全站語意化 cursor
B. Utility Capsule Control — V2 次要膠囊按鈕的 hover 動效
```

本文件是**規範**，不是 plan。實作細節以 `src/styles/` 為準。

相關標準：

- [`docs/standards/design-system.md`](design-system.md)
- [`docs/workflow/new-tool-development.md`](../workflow/new-tool-development.md)
- [`docs/workflow/tool-page-qa.md`](../workflow/tool-page-qa.md)

---

## 1. 兩層架構原則

| 層級 | 負責 | 來源 |
|---|---|---|
| **Global Interactive Cursor** | enabled 語意控制項 → `cursor: pointer`；disabled / aria-disabled → `cursor: default` | `src/styles/global.css` `@layer base` |
| **Utility Capsule Control** | transition、hover lift、shadow、active reset、fine-pointer 保護、reduced-motion | `src/styles/tools/tool-utility-control-v2-baseline.css` |

**分工原則：**

```text
Global cursor 依互動語意（button、a、summary…）
Utility Capsule hover 動效依元件角色（.tool-utility-control）
.tool-utility-control 不得宣告 cursor: pointer
```

---

## 2. Global Interactive Cursor Baseline

### 2.1 背景

Tailwind v4 preflight 將 `button { cursor: default }` 設為預設，需在 `@layer base` 以語意選擇器還原 pointer。

### 2.2 Enabled → pointer

適用於 **enabled** 的語意互動元素：

```text
a[href]（非 aria-disabled）
button（非 :disabled、非 aria-disabled）
input[type=button|submit|reset]（非 disabled）
select（非 disabled）
summary
[role=button]、[role=link]（非 aria-disabled）
```

### 2.3 Disabled → default

```text
button:disabled
button[aria-disabled=true]
input:disabled · select:disabled · textarea:disabled
a[aria-disabled=true]
[role=button][aria-disabled=true]
[role=link][aria-disabled=true]
```

### 2.4 明確排除（保持瀏覽器預設）

```text
一般文字內容、裝飾容器
text input、textarea（保留 text cursor）
未使用語意互動標記的可點 div
```

### 2.5 禁止做法

```text
* { cursor: pointer }
div:hover { cursor: pointer }
[onclick] { cursor: pointer }
!important 覆寫全站 cursor
在 .tool-utility-control 重複宣告 cursor: pointer
```

### 2.6 特殊 cursor 保留

元件若刻意使用 `grab`、`text`、`not-allowed` 等特殊 cursor，**保留** tool-local 宣告；global baseline 只負責一般語意 pointer / default。

### 2.7 冗餘 local cursor 清理

已被 global baseline 覆蓋的語意 `<button>` / `<summary>` / `<a href>`，不應再重複 `cursor: pointer` 或 Tailwind `cursor-pointer`。

**允許保留的 local pointer 範例：** date field label、`input[type=date]`、`::-webkit-calendar-picker-indicator`（global 選擇器無法涵蓋）。

### 2.8 驗證

```bash
node scripts/validate-global-interactive-cursor-baseline.mjs
```

---

## 3. Utility Capsule Control

### 3.1 角色定義

**V2 Utility Capsule Control** = 首屏、**次要**、緊湊膠囊按鈕，支援主任務但不屬於：

```text
primary data entry · primary task execution · text action
navigation / structural control · sheet action
```

**語意 opt-in class：** `.tool-utility-control`

**視覺 shell（非語意）：** `.preview-tool-control-btn` — 多種角色共用，不可只靠此 class 判斷互動。

### 3.2 十項資格（全部成立才可加 class）

```text
1.  相對於主任務為次要
2.  位於首屏 result / operation stage 或其正下方
3.  觸發支援性動作或設定
4.  使用 V2 緊湊膠囊 presentation
5.  與 preview-tool-control-btn shell 相容
6.  不是 primary data entry
7.  不是 primary task action
8.  不是 text-only action
9.  不是 navigation / structural control
10. 不是 sheet action
```

### 3.3 目前 Included

| 工具 | 控制項 |
|---|---|
| Event Countdown | Edit, Theme, Share |
| Year Progress | Theme, Share |

### 3.4 明確 Excluded

| 控制項 | 原因 |
|---|---|
| DR date range capsule | Primary task entry |
| DR Clear Dates | Text action |
| CT Start / Pause / Resume / Done / Cancel | Primary task（獨立 `-1px` 合約） |
| CT Quick Start | Primary preset |
| CT Sound | 功能性 secondary，但**不是** Utility Capsule |
| Sheet Cancel / Apply | Sheet baseline 角色 |
| Drawer toggles（全工具） | Navigation / structural |
| FAQ summary | 內容 disclosure（有 global pointer，無 utility lift） |
| Related Tools cards | Drawer baseline 禁止 translateY |
| Header / Footer / language switch | Global chrome |

### 3.5 Markup API

```html
<button
  type="button"
  class="preview-tool-control-btn tool-utility-control …"
>
```

### 3.6 Import 鏈

```text
tool-result-v2-baseline.css
  → @import tool-utility-control-v2-baseline.css
```

四個 V2 工具 route 已透過 `tool-result-v2-baseline.css` 自動繼承；**不需** per-route 改 import。

---

## 4. Utility Capsule 互動合約

### 4.1 Transition（shared baseline 唯一擁有）

```css
.tool-utility-control {
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}
```

**Tool-local CSS 不得**對已 migrate 的控制項再宣告 `transition` shorthand（會覆寫 transform / box-shadow）。

### 4.2 Fine-pointer hover

僅在 `@media (hover: hover) and (pointer: fine)` 內：

```text
:hover  → transform: translateY(-2px)
       → box-shadow: 0 10px 28px rgb(0 0 0 / 0.18)
:active → transform: translateY(0)
       → box-shadow: 0 4px 14px rgb(0 0 0 / 0.12)
```

### 4.3 Tool-local 視覺（shared 不擁有）

```text
default / hover 的 background、border、text color
theme token
:focus-visible outline 顏色與 outline-offset
width、height、padding、border-radius
coarse-pointer :active 色 feedback（若需要）
```

### 4.4 Focus-visible

```text
:focus-visible 留在 button 元素上，tool-local 定義 outline
鍵盤 focus 不得依賴 hover capability
shared baseline 不得在 :hover 上清除 outline
```

### 4.5 Touch 裝置

```text
hover lift 僅在 fine-pointer media 內生效
不用 JavaScript 模擬 hover
tap 後不得留下 sticky transform
```

### 4.6 Reduced motion

`@media (prefers-reduced-motion: reduce)` 對 `.tool-utility-control`：

```text
transition-duration: 0s
hover / active 的 transform: none
不得用 box-shadow: none 抹平所有 hover 層級
保留 background / border / text 的 hover 色 feedback
```

這是 **Utility Capsule 範圍內**的 accessibility 規則，不是全站 motion policy。

---

## 5. 所有權邊界（Ownership）

```text
global.css @layer base
  → 一般語意 cursor（pointer / default）

tool-utility-control-v2-baseline.css
  → Utility Capsule 的 motion only（不含 cursor）

tool-local CSS
  → 顏色、focus ring、layout、primary task 合約、特殊 cursor
```

**Functional utility ≠ Utility Capsule Control**

例：Countdown Timer Sound 是 secondary 功能，但**不是** Utility Capsule，不得加 `.tool-utility-control`。

---

## 6. 新工具 opt-in 規則

新增 V2 工具時：

```text
1. 逐一檢查十項資格
2. 符合者加 .tool-utility-control + preview-tool-control-btn
3. tool-local 只寫顏色與 focus；不重寫 transform / transition / shared shadow
4. 不符合者維持 tool-local 或 primary task 合約
5. 跑 validate script 確認 included / excluded
```

```bash
node scripts/validate-tool-utility-control-baseline.mjs
```

---

## 7. QA 檢查要點

工具頁 QA 涉及控制項時確認：

```text
[ ] Utility Capsule 有 .tool-utility-control
[ ] Desktop fine-pointer 有 -2px lift + shared shadow
[ ] pointer 離開後 smooth 回彈（shared transition）
[ ] :active 重置 translateY(0)
[ ] Touch 無 sticky hover
[ ] Reduced-motion 無 transform 位移
[ ] :focus-visible 清晰
[ ] Primary / text / navigation / sheet 未誤加 class
[ ] Enabled 控制項顯示 pointer（global）
[ ] Disabled / aria-disabled 顯示 default arrow（global）
[ ] Text input 仍為 text cursor
```

---

## 8. Scope include / exclude 速查

### Include（`.tool-utility-control`）

```text
EC: Edit, Theme, Share
YP: Theme, Share
Future: 符合十項資格的 V2 secondary capsule
```

### Exclude（不得加 class）

```text
DR #range-display-trigger（primary entry）
DR Clear Dates
CT 全部 primary row + Quick Start + Sound
All drawer toggles
All sheet actions
FAQ、Related Tools、Header、Footer
```

### Global cursor include

```text
所有 enabled 語意互動元素（見 §2.2）
```

### Global cursor exclude

```text
disabled / aria-disabled
非互動內容
text inputs（保留 text cursor）
```

---

## 9. 常見錯誤

| 錯誤 | 正確做法 |
|---|---|
| 在 `.tool-utility-control` 寫 `cursor: pointer` | 交給 global baseline |
| 只靠 `.preview-tool-control-btn` 套用 lift | 必須 opt-in `.tool-utility-control` |
| tool-local 再寫 `transition:` shorthand | 只寫顏色；motion 交 shared |
| 把 Sound 或 DR date capsule 當 Utility Capsule | 查 §3.4 excluded 表 |
| 全站 `* { cursor: pointer }` | 只用語意選擇器 |

---

## 10. 驗證命令

```bash
npm run build
node scripts/validate-global-interactive-cursor-baseline.mjs
node scripts/validate-tool-utility-control-baseline.mjs
```

涉及 theme 時另跑：

```bash
node scripts/validate-tool-themes.mjs
```

---

## 11. 決策紀錄

此 baseline 源於 Year Progress B3 Owner review 發現的 cross-tool hover 不一致，以及全站 cursor 問題。詳細 plan 與 validation report 存於 `local-docs/plans/shared/` 與 `local-docs/reports/site-wide/`；**本文件為 tracked canonical 摘要**。
