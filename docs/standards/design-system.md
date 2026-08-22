# Timiva Design System V2

## 文件目的

本文件定義 Timiva 的視覺方向、品牌感、元件樣式與 UI 設計原則。

本文件不定義完整 Tailwind 實作細節。Tailwind 實作規則應由 [Tailwind Guidelines](./tailwind-guidelines.md) 定義。

---

## 1. 設計核心

Timiva 的設計核心是：

```text
Mobile-first
Widget-like
Calm UI
Soft card
Clear hierarchy
Large number
Low-friction input
Screenshot-friendly result
```

Timiva 不應該像：

```text
傳統工具站
表格型網站
資訊密集頁面
大型 productivity app
廣告入口站
```

---

## 2. 視覺感受

Timiva 應帶給使用者的感覺：

```text
安靜
乾淨
柔和
舒服
專注
現代
有生活感
像手機小 App
```

避免：

```text
科技感過重
霓虹過多
對比太硬
資訊太滿
按鈕太多
卡片太雜
背景太搶戲
```

---

## 3. 設計語言

Timiva 的設計語言可以描述為：

```text
一組高質感、安靜、手機優先的時間 Widget。
```

每個工具都應像：

```text
一張可互動的生活卡片
一個可截圖的結果畫面
一個打開就能用的小 App
```

---

## 4. 色彩方向

色彩應保持：

```text
深色基底
柔和光感
低飽和
不刺眼
少量品牌色點綴
結果數字清楚
CTA 清楚但不吵
```

避免：

```text
大量亮色
太多漸層
每頁不同主色
廣告感很重的色塊
硬切色塊
```

### 4.1 Tool UI Semantic Color Contract（docs-first；Batch 1）

新工具（含 Lunar）應依下列 **semantic roles** 選色，不得從 white-alpha `0.1`–`0.22` 任意挑選。本節是 **role contract**，**不**代表 Batch 1 已新增 CSS variables。

| Semantic role | Production baseline value | Notes |
|---|---|---|
| Primary Result / primary text | slate-50 family（`rgb(248 250 252)`） | ResultSummary primary |
| Tool title / secondary UI text | `text-slate-300` / `rgb(203 213 225)` | Tool title baseline |
| Supporting Result Text / muted UI | slate-400 / `rgb(148 163 184)` | Support text；Muted Text Action base |
| Standard Pill Field surface | `rgb(255 255 255 / 0.06)` | Lineage C |
| Standard Pill Field border | `1px rgb(255 255 255 / 0.12)` | Lineage C |
| Textual Result Support Divider | `rgb(255 255 255 / 0.2)` | Named divider only |
| Invalid indicator | slate-300 @ ~0.76（`rgb(203 213 225 / 0.76)`）；bang fill `#0f172a` | Canonical `!`；bang 為正式例外 |
| Accent | existing indigo family（如 `rgb(165 180 252 / …)`、`--timiva-accent*`） | Accent Action Link／選取態 |

責任邊界：

```text
--rs-* → 只負責 ResultSummary public／component roles
--ame-* → 只負責 Adaptive Mobile Editor
既有 --timiva-* → 可沿用；cross-tool field／action CSS vars 是否建立留 Batch 2（依 Lunar 需求）
舊工具 hard-code／near-duplicate → 不強制本輪 migration
```

視覺／互動細節見 [`layout-system.md`](layout-system.md)（spacing／geometry）與 [`interactive-controls.md`](interactive-controls.md)（text actions／capsules／mode switch）。

---

## 5. 背景原則

背景應支撐工具，而不是搶走注意力。

可以使用：

```text
深色背景
柔和漸層
少量光暈
細微層次
```

避免：

```text
大面積刺眼光圈
過度動態背景
背景比工具更搶眼
每個頁面背景完全不同
```

---

## 6. Bento Grid / Card-based Layout

Timiva 可以使用 Bento Grid / card-based layout，但要保持安靜與清楚。

適合使用於：

```text
首頁工具卡片
全部工具頁
Related Tools
工具輔助資訊
結果輔助卡片
```

原則：

```text
卡片數量不要太多
卡片層級要清楚
主工具卡片優先
輔助卡片不要搶主結果
手機版避免過度密集
```

---

## 7. 卡片樣式

卡片應保持：

```text
圓角柔和
邊框細
背景半透明或低對比
陰影克制
內容留白足夠
```

卡片不應：

```text
太像廣告
太像傳統表格
文字塞太滿
每張卡片風格不同
```

---

## 8. 按鈕樣式

按鈕應清楚分層：

```text
Primary Action
Secondary Action
Ghost / Text Action
Danger / Reset Action
```

Primary Action 用於：

```text
開始
確認
建立
計算
套用
```

Secondary Action 用於：

```text
清除
重設
切換
查看更多
```

按鈕原則：

```text
觸控面積足夠
文字簡短
層級清楚
不要同時出現太多 primary buttons
```

---

## 8.0 Global Interactive Cursor Baseline

Timiva 在 `src/styles/global.css` 的 `@layer base` 為**語意化可互動元素**恢復 pointer 游標（Tailwind v4 preflight 預設 button 為 `cursor: default`）。

### 規則

```text
Enabled semantic interactive elements → pointer
Disabled controls → default
aria-disabled controls → default
Normal text/content → unchanged
Text input → text cursor (not globally forced to pointer)
Special-purpose cursors (grab, text, resize, not-allowed) → component-specific
```

### 涵蓋範圍（語意選擇器）

```text
a[href]（非 aria-disabled）
button（enabled，非 aria-disabled）
input[type=button|submit|reset]（enabled）
select（enabled）
summary
[role=button] / [role=link]（非 aria-disabled）
```

### 禁止

```text
不要 per-tool 重複加 cursor:pointer 或 cursor-pointer
不要從 hover 樣式推斷可點擊性
不要用 * { cursor: pointer }
不要對非互動容器套用 pointer
不要讓後載 local pointer 規則覆寫 disabled / aria-disabled 的 default
```

### 最終所有權（2026-06-27 cleanup）

```text
Global base layer 是 ordinary semantic pointer 的唯一來源。
Tool-local cursor 僅保留給例外互動（date input、label 日期欄、webkit picker indicator、grab / resize / not-allowed 等）。
Utility Capsule Control 只擁有 motion，不擁有 cursor。
```

Validator：`node scripts/validate-global-interactive-cursor-baseline.mjs`

---

## 8.1 V2 Utility Capsule Control

**Utility Capsule Control** 是 V2 工具頁第一屏的次要膠囊控制項語意角色，由 opt-in class `.tool-utility-control` 治理。

### 定義

```text
A first-screen, secondary, compact capsule/button that supports the main task
without serving as primary input, primary task execution, text action,
navigation, or structural control.
```

**Functionally secondary does not automatically mean Utility Capsule Control.**

範例：Countdown Timer 的 Sound 在功能上屬次要，但不是 Utility Capsule Control（非膠囊呈現、不在此 baseline 範圍）。

### 十項資格（全部成立才可 opt in）

```text
1.  Secondary to the main task
2.  Located in or immediately below the first-screen result or operation stage
3.  Triggers a supporting action or setting
4.  Uses the accepted V2 compact capsule/button presentation
5.  Uses or is structurally compatible with preview-tool-control-btn shell
6.  Not primary data entry
7.  Not a primary task action
8.  Not a text-only action
9.  Not a navigation or structural control
10. Not a sheet action
```

### 目前 included / excluded

**Included（code truth）：** Event Countdown Edit / Theme / Share；Year Progress Theme / Share；**Hours Calculator mobile capsule**；**Japanese Era Converter mobile capsule**

**Excluded 摘要：** Date Range date trigger、Clear／Reset 等 text action、Countdown Timer primary／Sound、sheet actions、drawer toggles、FAQ、Related Tools、Header／Footer、**conversion／mode switch**、primary-entry capsule（視覺可像 capsule，但不得因「長得像」就加 lift）

完整 Included／Excluded 與 visual shell vs interaction 分層以 [`interactive-controls.md`](interactive-controls.md) 為準。

### Markup API

```html
class="preview-tool-control-btn tool-utility-control …"
```

**Cursor** 來自 Global Interactive Cursor Baseline（語意化 `<button>`）。**Hover movement** 來自 `.tool-utility-control` shared baseline。

### Shared transition contract（`src/styles/tools/tool-utility-control-v2-baseline.css`）

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

Fine-pointer hover: `translateY(-2px)` + `box-shadow: 0 10px 28px rgb(0 0 0 / 0.18)`

Active reset: `translateY(0)` + `box-shadow: 0 4px 14px rgb(0 0 0 / 0.12)`

Guard: `@media (hover: hover) and (pointer: fine)`

### Touch

Hover lift 僅在 fine-pointer capability gate 內；touch 裝置不應有 sticky hover。

### Reduced motion

`prefers-reduced-motion: reduce` 時禁用 transform movement；顏色與靜態 shadow hierarchy 可保留；不得因 reduced motion 單獨設 `box-shadow: none`。

### Tool-local visual ownership

工具 CSS 僅負責：background / border / text 預設與 hover 值、theme tokens、`:focus-visible` outline、尺寸與 spacing。

**禁止**在 tool-local CSS 重複宣告 `transition`、`transform` hover lift、shared shadow、active reset、**或 `cursor: pointer`**。

Import：透過 `tool-result-v2-baseline.css` 自動繼承。

---

## 9. Icon 規則

Icon 應：

```text
使用一致風格
大小使用 4px 倍數
搭配 currentColor（優先）
不搶文字焦點
與文字垂直對齊（inline-flex items-center）
```

避免：

```text
不同套 icon 混用
icon 過大
icon 顏色過亮
icon 和文字風格不一致
```

### 9.1 Recurring icon contract（新工具）

```text
優先 inline SVG／既有 Timiva visual language；不為新工具引入無關 icon family
Outline icon 優先 stroke-width ≈ 1.5
Rounded caps／joins
優先 currentColor
Field／invalid／control 常用約 14px（0.875rem）
Utility capsule 內 icon 約 16–18px（既有 portrait token 可至 1.125rem）
Icon + text gap 約 0.375rem–0.5rem
Product-specific icon 可存在（如 CT ring、theme glyphs），但不得混入無關風格
不要為了統一而重畫全部 production icons；不要建立 icon component library（本階段）
```

### 9.2 Canonical invalid `!`

```text
Triangle + bang（與 AmeFieldError／Age→JEC production 同 path）
Size ≈ 0.875rem
Triangle：currentColor
Bang fill：#0f172a（正式例外，非 currentColor）
Circle-i 等 info icon ≠ invalid indicator
```

---

## 10. 工具結果數字與結果層級

工具結果是 Tool Page 的視覺核心。

結果數字應：

```text
大
清楚
好讀
留白足夠
能截圖
手機上一眼看懂
```

結果數字不應：

```text
被輸入欄位擠壓
被廣告壓過
被 FAQ 搶走焦點
在手機橫式被壓扁
```

### 10.1 Tool Title

正式 baseline（一般工具）：

```text
Mobile：text-sm
Desktop：md:text-base
Weight：500（font-medium）
Color：text-slate-300
```

不得建立 tool-local title visual variant，除非有明確特殊 product composition（須在 product spec／任務提詞註明）。

Title → result **spacing** 見 [`layout-system.md`](layout-system.md) §6.0（standard gap A1；DRC compact exception）。

### 10.2 Textual Primary Result default size（Decision B3）

新 textual `ResultSummary` adopter 的 **canonical defaults**（EN／ZH **相同**）：

| Viewport | Default size |
|---|---|
| Desktop | `5rem` |
| Mobile Portrait | `4.75rem` |
| Mobile Landscape | `3.75rem` |

```text
第一次呈現就使用上述 default；不得從偏小的 shared textual fallback 當 first paint 起點再逐支放大
不預先建立 locale-specific sizing
只有實際結果出現明顯長度／換行／overflow／比例問題，才做 tool-specific 或 locale-specific override
不因單一 extreme string 降低整個語系 default
Primary size override 不得連帶修改：Tool title、title→result gap、Supporting Result Text
JEC Desktop 8.5rem = 特殊 composition override，不是 general default
Numeric ResultSummary digit ladder 已 canonical，不重開
Batch 1 = docs only；shared CSS default 實作留 Batch 2（result-summary.css）
```

### 10.3 Supporting Result Text

```text
Size：16px
Weight：400
Color：slate-400 / rgb(148 163 184)
Line-height：1.45
ResultSummary 既有 alignment／max-width 原則保留
```

另保留較弱的 **muted meta／hint** semantic level；不要把所有補充文字都定義為 Supporting Result Text。

Batch 1 = docs contract；CSS default 留 Batch 2。

### 10.4 Textual Result Support Divider

正式命名：**Textual Result Support Divider**（不是全站唯一 divider）。

```text
Width：48px
Height：1px
Color：white / 0.2
Vertical spacing：24px
```

適用新的 textual result composition。Age／DBD／EC／DRC 等既有 divider **不 migration**。

---

## 11. 表單與輸入

輸入欄位應：

```text
低摩擦
少欄位
好點擊
手機友善
使用原生 picker 優先
清楚顯示目前狀態
```

避免：

```text
過多欄位
過小 input
難點擊的 dropdown
複雜自訂 picker
手機鍵盤遮住主結果
```

### 11.1 Standard Pill Field

一般 **single-input／converter** 類新工具的 default field visual language：

```text
Height：3.25rem
Radius：pill（9999px）
Background：white / 0.06
Border：1px white / 0.12
Backdrop blur：10px
Text：0.9375rem / 500
Standard Desktop form cluster：420px
```

Production lineage：Age → Date Calculator → Hours → Japanese Era Converter。

正式保留不同 semantic variant（不為 baseline 而 migration）：

```text
DBD／BDC dual-date shell = range-specific
DC duration cells = tool-specific grouped numeric control
```

Desktop stage／cluster geometry 見 [`layout-system.md`](layout-system.md) §6.0。

### 11.2 Field-level Error UI（Pattern A／B）

Canonical invalid icon 見 §9.2。正式保留兩個 field-level variants：

**Pattern A — Invalid Indicator only**

```text
只顯示 canonical ! indicator
```

**Pattern B — Invalid Indicator + Supporting Message**

```text
同一個 canonical ! indicator
加上 visible supporting message（JEC AME production values）：
  font-size：0.75rem
  weight：400
  line-height：1.3
  color：rgb(148 163 184 / 0.92)
  field block gap：0.35rem
僅在使用者無法單靠欄位 + indicator 理解錯誤規則時使用
```

```text
AME form-level .ame-error（紅色 banner）是不同 semantic，不得與 Pattern A／B 合併
本階段不抽 Desktop shared invalid component；視覺契約以本節與 AmeFieldError 為準
```

Plain text actions／Utility Capsule／Conversion mode switch 見 [`interactive-controls.md`](interactive-controls.md)。

---

## 12. Bottom Control / Bottom Sheet

手機工具頁可以使用 Bottom Control / Bottom Sheet。

設計原則：

```text
Bottom Control 像手機 App 操作列
Bottom Sheet 放設定與輸入
開啟後主畫面仍可理解
關閉後畫面恢復正常
點擊背景可以關閉
```

Bottom Sheet 不應放：

```text
廣告
長篇 SEO 文字
過多選項
容易誤觸的固定底部區塊
```

---

## 13. Related Tools

Related Tools 應像自然推薦，而不是工具列表堆疊。

原則：

```text
最多 3 個
不要求一定滿 3 個
只有 1–2 個真正相關工具時就維持較少數量
不為湊滿而加入低相關推薦
卡片式
文字簡短
優先同分類
再推薦互補情境
不要放在主工具上方
```

---

## 14. FAQ / SEO 區塊

FAQ / SEO 區塊應保持乾淨。

原則：

```text
放在工具體驗之後
不壓過主工具
問題自然
答案簡短
支援 AI Search 理解
不要寫成長篇行銷文
```

---

## 15. 廣告容器視覺規則

廣告容器應低干擾，不應破壞 App 感。

原則：

```text
清楚標示廣告
不要偽裝成工具內容
不要使用太突兀的視覺
不要放在主結果上方
不要放在 Bottom Sheet
不要靠近固定底部操作列
```

廣告可以靠近：

```text
結果區下方
Related Tools 附近
FAQ / SEO 區塊前後
頁面底部內容區
```

---

## 16. 桌機版視覺原則

桌機版可以更寬，但仍應保持：

```text
主工具聚焦
留白足夠
不過度表格化
右側欄不壓縮主工具
FAQ 不過度分散
Footer 對齊一致
```

---

## 17. 手機直式視覺原則

手機直式是 Timiva 最重要的體驗。

手機直式應保持：

```text
一眼看懂
單手可操作
主要數字清楚
按鈕容易點
輸入不擠
頁面可以自然滑動
```

---

## 18. 手機橫式視覺原則

手機橫式應獨立處理。

注意：

```text
主結果不能被壓扁
標題不要不必要省略
輸入欄位不能超出
Bottom Sheet 不能過高
轉回直式後 layout 要恢復
```

---

## 19. 中文註解與可維護性

因為 Timiva 會使用 Cursor、Agents 與 Skills 協作，主要區塊都應有中文註解。

建議格式：

```astro
<!-- Header｜桌機版主導覽 -->
<!-- Header｜手機版主導覽 -->
<!-- Tool｜桌機版工具主體 -->
<!-- Tool｜手機版工具主體 -->
<!-- Footer｜桌機版頁尾 -->
<!-- Footer｜手機版頁尾 -->
```

註解應清楚說明區塊用途，不要只寫：

```astro
<!-- section -->
<!-- div -->
<!-- layout -->
```

---

## 19.5 Component Style Baseline — transitional / do not reuse（新工具）

「Do not reuse」= 新工具不要當 default；**不是**要求 migration 或刪除 production legacy。

新工具（含 Lunar）**不要**沿用：

```text
舊 textual ResultSummary 偏小 fallback 作為 first paint 起點
EC／DRC 3rem white／0.18 divider 作為新 textual result default
Age／DBD slate divider 作為新 textual result default
dual-date shell 作為 single-input converter default
Hours Add-break accent style 作為所有 plain text action default
V1 gradient result number
preview CSS 作為 production Frame
Legacy MSB 作為新工具 Mobile Editor
Utility Capsule lift 套在 mode-switch／primary-entry control
JEC 8.5rem 作為 general textual primary default
EN／ZH 預設不同 textual primary size
從 white-alpha 0.1–0.22 任意選 field／divider 色
為單一工具自由新增 title→result spacing（見 layout-system §6.0）
```

正式 visual／interaction recipes 以本文件 §4.1／§9–§11、[`layout-system.md`](layout-system.md)、[`interactive-controls.md`](interactive-controls.md) 為準。

---

## 20. 結論

Timiva 的視覺設計應保持：

```text
安靜
乾淨
柔和
App-like
Widget-like
Mobile-first
主結果清楚
工具體驗優先
```

每個工具都應讓使用者覺得：

```text
這是一個舒服、清楚、值得放到手機桌面上的小工具。
```
