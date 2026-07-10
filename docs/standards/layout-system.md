# Timiva Layout System V2

## 文件目的

本文件記錄 **目前已驗收通過的 preview layout 規則**，作為 Timiva 正式頁面套版與新工具開發的 layout baseline。

適用範圍：

* 將 `/preview/*` 規則套用到正式路由
* 新增工具頁、工具總覽、首頁、純文字頁時的版型依據
* Cursor / Agents 修改 layout 時的保護邊界

本文件 **不定義完整視覺 token**，視覺細節請參考 [Design System](./design-system.md)。
Tailwind 實作細節請參考 [Tailwind Guidelines](./tailwind-guidelines.md)。

**Baseline 來源（已測試通過）：**

```text
/preview/home
/preview/all-tools
/preview/tool
/preview/text
```

**已測試 viewport：**

```text
桌機
手機直式
手機橫式
```

---

## 1. Overview

Timiva layout system 的核心原則：

| 原則 | 說明 |
|---|---|
| Mobile-first | 先確保手機直式可用，再擴展平板與桌機 |
| App-like / iPhone Widget 感 | 卡片、間距、節奏像 widget，不像傳統表單頁 |
| 少工具但每個工具舒服 | 主工具優先，SEO / 推薦內容不壓過操作 |
| 共用 layout | 同一種元件在不同頁面視覺一致，差異只在外層 container |
| 深色玻璃感背景 | 全站共用 global background，頁面不各自發明背景 |
| 4px spacing 倍數 | 間距優先使用 4 的倍數（如 12、16、20、24、32、48、80） |
| Preview 即 baseline | `/preview/*` 為正式頁面的 layout 驗收基準，不可随意漂移 |

**穩定項目（已確認）：**

```text
BaseLayout 距離
Header / Footer
Home preview
All tools preview
Tool page preview
Text page preview
ToolCard
RelatedToolRow
Tool Drawer
手機橫式規則
Footer 前距離
```

---

## 2. Page Types

目前四種 preview page type：

| 路由 | 用途 |
|---|---|
| `/preview/home` | 首頁版型 preview：Hero、Featured Tools、View all tools |
| `/preview/all-tools` | 工具總覽版型 preview：Page Hero、分類區、ToolCard grid |
| `/preview/tool` | 工具頁版型 preview：第一屏工具區、Drawer、RelatedToolRow、FAQ、About |
| `/preview/text` | 純文字 / legal page 版型 preview：Page Hero、長文閱讀區 |

正式頁面應對應上述四種 page type，不應自行發明第五種骨架。

---

## 3. Base Layout Rules

### 3.1 全站骨架

```text
Header
Main
Footer
Global Background
```

由 `BaseLayout` 統一提供。各頁 **不應** 自行重建全站骨架。

### 3.2 Header 差異

| 頁型 | Header variant | 行為 |
|---|---|---|
| Home | `headerVariant="home"` | 顯示 Timiva logo |
| 內頁（All Tools / Tool / Text） | `headerVariant="inner"` | 顯示返回 Timiva pill |

Header component 為 locked component，layout 任務不應随意修改。

### 3.3 Main spacing 原則

* 內容區使用 `mx-auto` + `max-w-*` + `px-6` 控制水平節奏
* 區塊之間優先使用 `gap-*`（flex / grid），避免混用大量 `margin-bottom`
* 不同頁型共用 wrapper 時，應保持相同 top / bottom padding 規則

**常見 wrapper：**

| 頁型 | 外層 wrapper 參考 |
|---|---|
| Home | `max-w-5xl flex flex-col gap-12 px-6 py-20 md:gap-16` |
| All Tools / Text | `max-w-5xl flex flex-col gap-12 px-6 pb-20 pt-10 md:gap-16 md:pt-12` |
| Tool 下方內容 | `max-w-3xl px-6 pb-20` |

### 3.4 Footer 前距離

* **統一使用 `pb-20`（80px）** 作為 main content 與 Footer 之間距離
* Home 使用 `py-20`，等效於上下各 80px
* **禁止** 各頁自行 hard-code `pb-24`、`mb-24` 或其他不一致 footer spacing
* Footer component 為 locked component

### 3.5 Global Background

* 由 BaseLayout / global CSS 提供
* 頁面不應各自加不透明滿版背景覆蓋 global glow

### 3.6 Safe Area

* 手機底部、fixed 元素需保留 safe-area 空間
* Footer 與 fixed Drawer toggle 不得被 home indicator 遮擋

---

## 4. Home Preview Rules

路由：`/preview/home`

### 4.1 Hero

| 規則 | 說明 |
|---|---|
| 桌機置中 | `text-left md:text-center`，H1 / 副標 `md:mx-auto` |
| 手機置左 | eyebrow、H1、副標同一左側內容軸 |
| 手機橫式副標 | 使用 `.preview-page-hero-subtitle`，避免過早換行 |
| 桌機 CTA | 兩個 hero buttons，`hidden lg:flex` |
| 手機 / 平板 | 不顯示 hero buttons，只保留主副標 |

### 4.2 Featured Tools

* 使用 `ToolCard`
* Grid：`grid grid-cols-2 items-stretch gap-4 md:gap-5 lg:grid-cols-4`
* **桌機 4 欄**
* 手機 2×2 grid

### 4.3 View all tools

* 手機版置左：`justify-start md:justify-center`
* 桌機維持置中
* 與 Hero / 卡片區同一 `px-6` 內容軸

---

## 5. All Tools Preview Rules

路由：`/preview/all-tools`

### 5.1 Page Hero

| 規則 | 說明 |
|---|---|
| 桌機置中 | `text-left md:text-center`，副標 `md:mx-auto` |
| 手機直式 / 橫式置左 | 與 H1 同軸 |
| 手機橫式副標 | `.preview-page-hero-subtitle`，不過早換行 |

### 5.2 分類區

* 分類標題例：`Dates & Events`、`Momentum`、`Focus & Rhythm`
* 標題左對齊：`text-left text-lg font-semibold`

### 5.3 工具卡片

* 使用 `ToolCard`
* Grid：`grid grid-cols-2 items-stretch gap-4 md:gap-5`
* **桌機 2 欄**（不是 4 欄）
* 手機卡片只保留：**icon、工具名稱、右箭頭**
* 手機版 description 隱藏：`hidden md:block`
* 一行 / 兩行工具名稱上方基準一致（與 Home mobile card 相同結構）
* 箭頭不壓文字、不插入文字（absolute 右下角 arrow 已廢止，改用 ToolCard 統一規則）

---

## 6. Tool Preview Rules

路由：`/preview/tool`

### 6.1 第一屏工具區

| 規則 | 說明 |
|---|---|
| 置中邏輯 | 排除 Header 視覺高度後，第一屏內容置中 |
| 工具說明 | 可省略，各 viewport 保持一致 |
| 主結果數字 | Manrope，`font-weight: 400`，是主要焦點 |
| 資訊順序 | 工具名 → 數字 → Days remaining → Until 文案 → 操作列 |
| Until 文案 | 字級較大（`text-lg md:text-xl`） |
| 操作按鈕 | 在第一屏內合理靠下，非 fixed bottom |
| 手機橫式 | compact handling，完整顯示主結果與操作列 |

### 6.2 Drawer 右側欄

| 規則 | 說明 |
|---|---|
| 寬度 | `300px` |
| 高度 | 全高（`h-dvh`） |
| 背景 | 半透明 + 毛玻璃（`.preview-tool-drawer-frosted`） |
| 圓角 | 左上、左下圓角（`rounded-tl-3xl rounded-bl-3xl`） |
| 顯示 | 桌機 `xl:block`，手機依目前規則 |
| Related tools | 使用 `ToolCard`，**3 張**，單欄列表 |
| Neutral wrapper | 每張 ToolCard 外包 `<div>`，避免 `h-full` 被 flex scroll 區撐滿 |

### 6.3 下方 Related tools

* 使用 **`RelatedToolRow`**（不是 ToolCard）
* 顯示 **3 張**
* 一列一個（`space-y-3`）
* 橫向三欄：icon / 文字 / arrow，三欄垂直置中
* 比 ToolCard 更省高度
* Drawer 展開時 xl 隱藏下方區塊（`xl:hidden`）

### 6.4 FAQ

* 不用線框包住整區
* 使用分隔線（`border-t border-white/20`）
* 展開 icon：`+` / `-`

### 6.5 About / SEO 內容

* 置中 `max-w-3xl`，區塊內左對齊
* 不壓過第一屏工具體驗

### 6.6 Tool page sidebar and lower content rules

本節適用於 **正式工具頁**（production V2 tool pages），不限 preview route。新工具 B1A 與 Owner browser review 必須對照本節與既有正式工具（Date Range、Event Countdown、Countdown Timer、Year Progress 等）。

#### A. Tool page right sidebar rules

```text
Desktop 右側 sidebar 的 Related Tools 卡片不得使用 hover lift（translateY / 上浮）。
不得把首頁 ToolCard 的 hover translate 行為套用到工具頁右側欄。
Sidebar related cards 僅可使用已核准的 border、background、arrow、opacity 等 hover 狀態。
Sidebar related cards 不得在 hover 時改變高度、造成 layout shift、或向上移動。
新工具必須對齊既有正式工具的 production sidebar pattern。
除非 Owner 明確核准，新工具不得自創新的 sidebar card 互動模式。
```

若新工具 root 尚未納入 `tool-drawer-v2-baseline.css` 的 drawer selector，必須在 **工具 scoped CSS** 內複製同等 no-lift 規則，不得修改 shared baseline。

#### B. Drawer collapse / expand control

```text
Desktop 工具頁 drawer 必須包含已核准的 collapse / expand 控制項。
Collapse 控制項在 desktop 工具頁必須保持可見。
控制項的 markup、位置、aria 狀態與 open/closed 行為必須遵循既有 production 工具。
新工具必須複製既有 production drawer pattern，不得自創新的 drawer 系統。
若無法在不修改 shared baseline 的前提下保留 drawer 控制項，implementation 必須停止並請求 Owner 核准。
```

允許使用 component 內 **inline drawer toggle script**（與 Date Range Calculator V2 等相同 shell pattern）；此屬 shell behavior，不是工具計算邏輯。

#### C. Tool lower content structure

工具頁下方內容應遵循既有 production 順序與語意：

```text
1. About（工具專屬標題）
2. How to use（工具專屬標題）
3. Common uses / ideas / calculations（標籤 / chips 區）
4. {Tool Name} FAQ
5. Related Tools（適用時；例如 mobile lower 或 drawer 關閉時）
```

FAQ 標題必須使用 **工具名稱 + FAQ**，例如：

```text
EN: Date Range Calculator FAQ · Event Countdown FAQ · Countdown Timer FAQ · Age Calculator FAQ
ZH: 日期區間計算 FAQ · 事件倒數 FAQ · 倒數計時器 FAQ · 年齡計算 FAQ
```

避免在工具頁使用過於籠統的標題，例如：

```text
Frequently asked questions
FAQ
常見問題
```

除非頁面類型不是工具頁，或 Owner 明確核准。

#### D. Common uses / tags section

```text
工具頁應包含 common uses / ideas / calculations 標籤區，除非 product spec 明確排除。
Tags / chips 為資訊標籤，不是按鈕。
不得表現為 Quick Templates，除非 product spec 明確要求。
不得加入 click handler，除非 product spec 明確指定。
應使用既有 production chip 樣式（例如 drv2-keyword-chip 同型 scoped class）。
不得暗示 product spec 未支援的功能（例如 next birthday、星座、儲存生日等）。
```

#### E. Related Tools maximum

```text
每個工具頁最多顯示 3 個 Related Tools，除非 Owner 明確核准更多。
右側 sidebar 與下方 Related 區皆受此上限約束。
Related Tools 應優先最接近的使用者意圖，而非單純依新工具順序排列。
若超過 3 個工具相關，依下列優先序選前 3 個：
  1. 相同計算意圖
  2. 相同使用情境
  3. 相同分類
  4. 次要的時間感知 / 情緒相關性
不得只因站內工具變多就自動擴充 Related Tools 數量。
```

#### F. 手機第一屏控制區 baseline（一般工具）

本節適用於 **一般工具** 的手機 first-screen tool stage。特殊互動工具（例如 Countdown Timer）可例外，但例外必須在該工具 product spec 或任務提詞中 **明確指定**；Cursor 不得自行判斷某工具是否為例外。沒有明確例外時，一律套用本節。

##### F.1 手機第一屏結構

```text
手機第一屏需先保留下方主要操作按鈕區域。
主要結果內容區要在扣除按鈕區域後的剩餘空間中垂直置中。
不要把「結果區 + 按鈕」整組一起垂直置中。
主要操作按鈕屬於 first-screen tool stage，不是 viewport fixed。
「底部」指第一屏工具區底部，不是瀏覽器視窗底部。
使用者往下滑時，主要操作按鈕要跟著頁面一起滑動。
```

##### F.2 手機主要操作按鈕位置

```text
一般工具的主要操作按鈕位置應維持一致高度。
按鈕落在第一屏下方控制區，不可依各工具內容高度自由漂移。
主要操作按鈕與下方第一個內容標題（例如 You may also need / 相關工具）距離要維持一致。
這個距離是 mobile first-screen baseline 的一部分。
```

##### F.3 手機主要操作按鈕樣式

```text
手機主要操作按鈕沿用 Timiva 既有工具控制按鈕樣式。
樣式基準為 Event Countdown 的 Edit / Theme / Share。
Date Range 的手機日期按鈕也是同一套樣式，只是多了 icon。
不要新增另一套滿版大 CTA。
不要做成 fixed bottom action bar。
不要讓單一工具任意改變按鈕大小、重量或型態。
```

##### F.4 手機直式 bottom sheet

```text
手機直式 bottom sheet 內容採上下排列。
欄位列應依工具語意由上而下排列，例如：
  第一列：主要日期 / 主要輸入欄
  第二列：次要日期 / 次要設定欄
不要把直式 sheet 的欄位橫向壓縮成單列塞進直式畫面。
```

##### F.5 手機橫式第一屏

```text
手機橫式仍然是 mobile pattern，不是 desktop pattern。
一般工具的手機橫式第一屏，需把結果區與主要操作按鈕整理成 compact layout，完整呈現在第一屏內。
手機橫式按鈕尺寸與樣式要和其他一般工具頁一致，不可因單一工具任意縮小或變形。
如果結果區內容太多，應調整該工具的結果內容優先級與呈現方式，不應改壞按鈕樣式或造成重疊。
手機橫式不得套用 desktop inline input，除非該工具規格明確指定。
```

##### F.6 手機橫式 bottom sheet

```text
手機橫式 bottom sheet 內容可改為一列兩欄，以適應高度較低的畫面。
欄位可依工具語意分左右欄排列，例如：
  左欄：主要輸入欄
  右欄：次要輸入欄
不要把直式 sheet 直接壓扁套到橫式；橫式 sheet 應有獨立的 compact 版面規劃。
手機橫式 bottom sheet / panel 必須使用 landscape-specific compact panel，不得直接沿用手機直式 sheet 高度。
高度應採內容驅動的 compact layout，只容納：
  drag handle
  主要欄位內容
  必要內距
  safe area / browser UI 安全距離
若內容只有一列兩欄，不得撐出大面積空白 panel。
參考基準：Date Range landscape compact panel、Mobile Sheet baseline 的 landscape compact panel 規則。
```

##### F.7 Bottom sheet 開啟時的背景縮放

```text
bottom sheet 開啟時，背景的結果內容區要作為一整組縮放。
縮放對象是工具的結果內容區，不包含底部主要操作按鈕。
目的：讓使用者編輯下方欄位時，仍能看到上方結果區有狀態變化。
各工具可依自己的主視覺結構決定結果內容區包含哪些內容，但縮放群組邊界必須一致遵守：
  納入：主結果與其直接輔助呈現
  不納入：第一屏底部主要操作按鈕
```

##### F.7A Sheet-open 結果區定位基準

```text
bottom sheet 開啟時，背景結果內容區整組縮放後，必須重新定位在 sheet 上方的可視區域中。
位置要在上方導覽區（Header / 返回 Timiva）與 sheet 頂部之間保持視覺平衡。
不可只做 scale，導致結果區過度往上貼近 header。
不可讓 sheet 上方出現不自然的大量空白。
新工具必須對照已核准工具的 sheet-open 狀態驗收，例如 Event Countdown、Date Range。
若縮放後結果區位置失衡，應調整 translate / reposition，而不是改變 sheet 高度或破壞 first-screen baseline。
```

##### F.8 特殊工具例外

```text
以上規則適用於一般工具。
特殊互動工具可以例外，例如 Countdown Timer。
例外必須在該工具 product spec 或任務提詞中明確指定。
Cursor 不得自行判斷某工具是否為例外。
沒有明確例外時，一律套用標準 mobile first-screen baseline。
```

---

## 7. Text Preview Rules

路由：`/preview/text`

* 用於 privacy / terms / contact 等純文字頁
* 外層 wrapper 與 All Tools 一致：`max-w-5xl ... pb-20 pt-10 md:pt-12`
* Page Hero 寫法與 All Tools 一致（eyebrow + title + meta line）
* 內容閱讀寬度：`max-w-3xl`
* 段落行高：`leading-relaxed`
* Section heading 與 paragraph spacing 一致（`space-y-6`）
* Footer 前距離：`pb-20`

---

## 8. ToolCard Component Rules

元件：`src/components/ToolCard.astro`

### 8.1 使用位置

```text
/preview/home Featured Tools
/preview/all-tools 工具卡片
/preview/tool Drawer related tools
```

**三處卡片本體樣式一致。** 差異只由外層 container 控制：

| 位置 | Container |
|---|---|
| Home | 桌機 4 欄 grid |
| All Tools | 桌機 2 欄 grid |
| Tool Drawer | 單欄列表 + neutral wrapper |

### 8.2 卡片結構

```text
ToolCard root (a)
  icon
  title
  description
  arrow wrapper
```

### 8.3 Root class（baseline）

```text
relative flex h-full min-h-0 flex-col
rounded-2xl border border-white/10 bg-white/5
p-5 transition-colors hover:bg-white/[0.07]
md:p-6
```

重點：

* **`h-full`**：配合 grid `items-stretch` 達成同列等高
* **`min-h-0`**：不使用過大的 `min-h-[156px]` / `md:min-h-[192px]`
* 卡片高度由 **icon + title + description + arrow + padding + gap** 自然決定
* 同列等高到 **該列最高卡片**；較矮卡片由 **`mt-auto`** 把 arrow 推至卡片底部，空白留在 description 與 arrow 之間

### 8.4 Description 規則

```text
mt-2 hidden text-sm leading-relaxed text-slate-400 md:block
```

| 允許 | 禁止 |
|---|---|
| 自然一行 / 兩行 / 三行 | `min-height` 撐成固定兩行 |
| 依卡片寬度自然換行 | `max-width` 造成亂斷行 |
| 手機隱藏、桌機顯示 | `line-clamp` 製造不自然高度 |
| | 固定 `height` |

### 8.5 Arrow 規則

```text
mt-auto flex justify-end pt-4
```

| 允許 | 禁止 |
|---|---|
| normal flow | `absolute bottom-right` |
| `mt-auto`：同列等高時 arrow 底部對齊 | 僅用 `mt-4` 固定距離（同列被撐高時 arrow 無法底對齊） |
| `pt-4`：arrow 與上方內容保留合理間距 | 壓到 description 文字 |
| 靠右 | 脫離 normal flow |

**行為說明：**

* 單卡自然高度時，description 與 arrow 距離接近一般 `mt-4` 視覺
* Grid `items-stretch` + `h-full` 使同列等高時，所有卡片 arrow 對齊在卡片底部

### 8.6 同列等高

* Grid：`items-stretch`（Home、All Tools）
* ToolCard：`h-full`
* **不靠** description `min-height` 達成等高

### 8.7 Drawer neutral wrapper

Drawer 內每張 ToolCard 必須包一層 neutral `<div>`：

* 避免 ToolCard 的 `h-full` 在 `flex-1 overflow-y-auto` 容器中被解析為整個 Drawer 高度
* Drawer 單欄列表 **不需要** 同列等高，但卡片高度仍由內容自然決定

### 8.8 禁止事項

```text
❌ 不要用 description min-height 撐兩行
❌ 不要用 description max-width 造成亂斷行
❌ 不要讓 arrow absolute bottom-right
❌ 不要用 min-h-[156px] / md:min-h-[192px] 硬撐所有卡片
❌ 不要讓 Drawer 卡片被 h-full 撐滿整個 drawer
❌ 不要為 home / all-tools / drawer 發明三套不同 ToolCard
❌ 不要在工具頁右側 sidebar 使用首頁 ToolCard hover lift
```

---

## 9. RelatedToolRow Component Rules

元件：`src/components/RelatedToolRow.astro`

### 9.1 使用位置

```text
/preview/tool 下方 Related tools（非 Drawer）
```

**它不是 ToolCard。** 用於工具頁內容流下方的輕量推薦列表。

### 9.2 數量與排列

* 顯示 **3 張**
* 一列一個（`space-y-3`）
* 桌機、手機直式、手機橫式：**不應水平捲動**

### 9.3 三欄結構

```text
[icon]  [tool name + short description]  [→]
```

Root class：

```text
grid grid-cols-[auto_1fr_auto] items-center gap-3 md:gap-4
rounded-2xl border border-white/10 bg-white/5 p-4
transition-colors hover:bg-white/[0.07]
```

| 欄 | 規則 |
|---|---|
| 左欄 icon | `shrink-0`，垂直置中 |
| 中欄文字 | `flex flex-col justify-center`，名稱在上、說明在下 |
| 右欄 arrow | `shrink-0`，垂直置中 |

三欄視覺中心線一致（`items-center`）。

### 9.4 與 ToolCard 的差異

| | ToolCard | RelatedToolRow |
|---|---|---|
| 用途 | 主要工具卡片 | 工具頁下方輕量推薦 |
| 高度 | 較高，含 icon 上置 | 較省高度 |
| Description | 手機隱藏 | 始終顯示 |
| Layout | flex-col | grid 三欄 row |

---

## 10. Drawer Rules

Tool Drawer 僅用於工具頁 preview（`/preview/tool`）。

| 項目 | 規則 |
|---|---|
| 寬度 | `300px`（panel） |
| 高度 | 等同螢幕（`h-dvh`） |
| 背景 | 半透明 + 毛玻璃 |
| 圓角 | 左側 `rounded-tl-3xl rounded-bl-3xl` |
| 開合 | toggle button 可點，收合時往右滑出 |
| 內容 | ToolCard × 3，單欄 |
| 分離 | Drawer 開合邏輯 ≠ ToolCard 樣式，互不干擾 |

**不可因 ToolCard 修改而改動：**

```text
Drawer 寬度
Drawer 背景毛玻璃
Drawer fixed / overlay positioning
Drawer toggle button
Drawer 開合 JS 邏輯
```

---

## 11. Mobile Landscape Rules

手機橫式 **不是桌機版**，需有 compact handling。

### 11.1 Page Hero 副標

共用 class：`.preview-page-hero-subtitle`

```css
/* 預設 */
max-width: 36rem;

/* 手機橫式 */
@media (orientation: landscape) and (max-height: 700px) and (max-width: 1200px) {
  max-width: min(47.5rem, 100%);
}
```

適用：Home、All Tools page hero 副標。

### 11.2 Tool Page 第一屏

* 手機橫式縮小標題、結果區、間距
* 第一屏需完整顯示主結果數字與操作列
* 手機橫式仍採 mobile pattern；不得套用 desktop inline input（除非 product spec 明確指定）
* 主要操作按鈕樣式與位置須對齊 §6.7 mobile first-screen baseline
* 使用 `.preview-tool-landscape-*` 等 scoped 規則

### 11.3 通用

* Page hero 手機橫式仍 **置左**（不是桌機置中）
* ToolCard / RelatedToolRow **不要水平捲動**
* RelatedToolRow **不要變回大卡片**

---

## 12. Spacing Rules

### 12.1 4px 倍數

間距優先使用 Tailwind 4px 倍數：

```text
gap-3 (12px)  gap-4 (16px)  gap-5 (20px)
p-4 (16px)    p-5 (20px)    p-6 (24px)
pt-10 (40px)  pt-12 (48px)  pb-20 (80px)
```

### 12.2 Footer 前距離

* **統一 `pb-20` = 80px**
* 禁止各頁自行使用 96px 或其他不一致值

### 12.3 區塊節奏

* Page hero、content、card grid 之間用 **`gap-*`** 控制
* 避免同一頁混用大量 `mb-*` 與 `gap-*` 造成節奏漂移
* 調整距離時優先改 **共用 wrapper / component**，不要每頁 hard-code

### 12.4 Page Hero 副標（共用）

* 手機：`max-w-*` 不加 `mx-auto`（置左）
* 桌機：`md:mx-auto`（置中）
* 手機橫式：`.preview-page-hero-subtitle` 放寬 max-width

---

## 13. CSS / Code Rules

| 規則 | 說明 |
|---|---|
| 優先 Tailwind class | 元件與頁面 layout 用 utility class |
| 禁止 inline style | layout 問題不用 style attribute 修 |
| 禁止 `!important` | 避免 specificity 漂移 |
| 禁止 CSS id selector | id 可供 JS / a11y，不用於 styling |
| 禁止為 layout 新增 JS | 純排版問題用 HTML + CSS 解決 |
| 共用 component | ToolCard、RelatedToolRow、BaseLayout 優先重用 |
| Locked components | Header、Footer、BaseLayout 結構需 Owner 確認才可改 |

---

## 14. QA Checklist

部署或 layout 修改前，請逐項檢查。

### 14.1 Viewport

- [ ] 桌機（≥1280px 或專案 xl breakpoint）
- [ ] 手機直式（375–430px 寬）
- [ ] 手機橫式（landscape，height ≤700px）

### 14.2 Home (`/preview/home`)

- [ ] Hero 桌機置中、手機置左
- [ ] 手機橫式副標不過早換行
- [ ] Hero buttons 僅 lg+ 顯示
- [ ] Featured Tools 4 欄（桌機）/ 2 欄（手機）
- [ ] ToolCard 同列等高、description 自然高度
- [ ] View all tools 手機置左
- [ ] Footer 前距離 80px

### 14.3 All Tools (`/preview/all-tools`)

- [ ] Page hero 桌機置中、手機置左
- [ ] 手機橫式副標不過早換行
- [ ] 分類標題左對齊
- [ ] ToolCard 桌機 2 欄
- [ ] 手機卡片：icon + 名稱 + 箭頭（無 description）
- [ ] 一行 / 兩行名稱起始位置一致
- [ ] 無水平捲動

### 14.4 Tool (`/preview/tool`)

- [ ] 第一屏置中、主結果數字 Manrope 400
- [ ] 手機橫式第一屏 compact 完整可見
- [ ] 手機主要操作按鈕非 viewport fixed，會跟頁面一起滑動
- [ ] 手機主要操作按鈕樣式對齊 Event Countdown Edit / Theme / Share
- [ ] bottom sheet 開啟時，背景結果內容區整組縮放，底部主要按鈕不納入縮放群組
- [ ] sheet-open 時結果區縮放後在 Header 與 sheet 頂部之間視覺平衡
- [ ] landscape sheet 高度為內容驅動 compact panel，無大面積空白
- [ ] Drawer 300px、毛玻璃、3 張 ToolCard
- [ ] Drawer ToolCard 未被撐高
- [ ] 下方 RelatedToolRow 3 張、三欄垂直置中
- [ ] FAQ 分隔線式 accordion
- [ ] Footer 前距離 80px

### 14.5 Text (`/preview/text`)

- [ ] Page hero 與 All Tools 一致 wrapper
- [ ] 內容 `max-w-3xl` 可讀
- [ ] Section / paragraph spacing 一致
- [ ] Footer 前距離 80px

### 14.6 Components

- [ ] ToolCard：三處視覺一致
- [ ] ToolCard：無 description min-height / max-width
- [ ] ToolCard：arrow normal flow + `mt-auto` + `pt-4`（同列 arrow 底對齊）
- [ ] ToolCard：同列等高靠 grid stretch + h-full
- [ ] RelatedToolRow：3 張、三欄置中、省高度

### 14.7 Build

- [ ] `npm run build` 成功
- [ ] 無 console error
- [ ] 無 horizontal scroll（各 preview 頁）

---

## 版本與維護

| 項目 | 說明 |
|---|---|
| 文件版本 | V2（preview layout baseline） |
| 驗收基準 | `/preview/home`、`/preview/all-tools`、`/preview/tool`、`/preview/text` |
| 修改流程 | layout 變更需先改 preview → QA → Owner 確認 → 更新本文件 → 才套正式頁 |

**Owner 確認前不得將 preview 未驗收規則直接套用到正式頁面。**
