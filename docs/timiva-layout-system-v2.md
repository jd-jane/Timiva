# Timiva Layout System V2

## 文件目的

本文件記錄 **目前已驗收通過的 preview layout 規則**，作為 Timiva 正式頁面套版與新工具開發的 layout baseline。

適用範圍：

* 將 `/preview/*` 規則套用到正式路由
* 新增工具頁、工具總覽、首頁、純文字頁時的版型依據
* Cursor / Agents 修改 layout 時的保護邊界

本文件 **不定義完整視覺 token**，視覺細節請參考 `timiva-design-system-v2.md`。  
Tailwind 實作細節請參考 `timiva-tailwind-css-guidelines-v2.md`。

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
* 同列等高到 **該列最高卡片**，較矮卡片剩餘空白在 arrow 下方

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
mt-4 flex justify-end
```

| 允許 | 禁止 |
|---|---|
| normal flow | `absolute bottom-right` |
| 與 description 固定距離（`mt-4`） | `mt-auto` 在 description 與 arrow 間撐大空白 |
| 靠右 | 壓到 description 文字 |

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
❌ 不要用 mt-auto 把 arrow 推到底部（在 description 與 arrow 間留大空白）
❌ 不要用 min-h-[156px] / md:min-h-[192px] 硬撐所有卡片
❌ 不要讓 Drawer 卡片被 h-full 撐滿整個 drawer
❌ 不要為 home / all-tools / drawer 發明三套不同 ToolCard
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
- [ ] ToolCard：arrow normal flow + `mt-4`
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
