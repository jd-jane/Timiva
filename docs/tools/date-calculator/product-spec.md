# Timiva Date Calculator 產品規格

> 建立日期：2026-07-23
> 正式化：2026-07-24（D0 Docs Canonicalization）
> 狀態：Product specification complete · Implementation not started
> 適用工具：Timiva 第八個工具／V1.5 Search Foundation 第四個工具
> 開發層級：L — New Tool MVP
> 分類：Important Dates／重要日子

---

## 1. 工具定位

### 1.1 工具名稱

```text
EN：Date Calculator
ZH：日期加減計算
```

中文 Calculator 類工具統一使用「○○計算」，不使用「計算器」或「計算機」。

### 1.2 正式路由

```text
/en/date-calculator/
/zh/date-calculator/
```

### 1.3 工具目的

Date Calculator 用來從一個起始日期，加上或減去指定的年、月、週、日，得到新的目標日期。

主要使用情境：

```text
90 天後是哪一天？
3 週前是哪一天？
一年六個月後是哪一天？
從某一天減去兩個月又五天，結果是哪一天？
```

核心體驗：

```text
輸入起始日期
選擇加上或減去
輸入年／月／週／日
立即看見結果日期
```

本工具屬於 Important Dates／重要日子與 V1.5 Search Foundation／搜尋鋪路期，採純前端、低維護的快速日期計算方式。它不是日期區間計算，也不是工作日計算。

---

## 2. MVP 範圍

### 2.1 MVP 包含

```text
起始日期
全域加／減方向
年／月／週／日四種期間單位
單一單位或混合單位計算
即時計算
完整目標日期
星期
計算摘要
初始／無效狀態
錯誤 icon
Reset／重設
Desktop
Mobile portrait
Mobile landscape
EN／ZH
About
How to use
FAQ
FAQ JSON-LD
Related Tools
Meta title／description
```

### 2.2 MVP 不做

```text
Today／今天快捷
7 天、30 天、90 天等常用期間快捷
Calculate／計算按鈕
Apply／套用按鈕
Done／完成按鈕
Copy result
URL sharing
Native Share
LocalStorage
歷史紀錄
多組日期計算
工作日或國定假日排除
時區切換
帳號、後端或資料庫
```

重新整理頁面後回到預設空白狀態，不恢復上一次設定。

---

## 3. 核心資料模型

```text
Start date
Direction：Add／Subtract
Years
Months
Weeks
Days
```

概念模型：

```text
目標日期
＝ 起始日期
→ 加／減年
→ 加／減月
→ 加／減週
→ 加／減日
```

所有期間欄位共用同一個方向，不允許每一個單位各自設定正負號。

---

## 4. 起始日期規格

### 4.1 預設值

起始日期預設為空白，不自動帶入今天。

### 4.2 支援範圍

```text
最早：1900-01-01
最晚：2200-12-31
```

起始日期與最終結果日期都必須位於此範圍內。

### 4.3 Desktop 輸入方式

Desktop 使用 Smart Date Input 作為主要輸入，並保留小型 Calendar icon 作為輔助入口。

Placeholder：

```text
YYYY / MM / DD
```

Smart Date Input 必須沿用 `docs/standards/date-input.md`：

```text
支援 6／7／8 碼純數字推斷
支援 slash／dash
支援 keyboard-first 快速輸入
支援 year／month／day segment 編輯
回頭修改 segment 不可吃掉其他 segment
逐鍵輸入與貼上相同數字必須得到相同結果
valid → invalid 時必須清除舊結果
完成後正規化為 YYYY / MM / DD
```

Desktop Calendar 規則：

```text
Calendar 關閉時，直接點日期欄只進行 Smart Date Input，不自動開啟 Calendar
點 Calendar icon 才開啟 Calendar
選擇日期後立即寫回輸入欄
選擇完整日期後自動關閉 Calendar
不設 Apply／Confirm
點外部或 Esc 可關閉
Calendar 不可遮住主要結果
月份／年份選擇沿用目前核准的 Timiva Calendar baseline
不得重新使用過長的原生月份／年份 select
```

### 4.4 Mobile 輸入方式

Mobile portrait 與 mobile landscape 都使用原生 date picker：

```text
type="date"
min="1900-01-01"
max="2200-12-31"
```

程式邏輯仍必須重新驗證範圍，不可只依賴 HTML `min`／`max`。

Mobile 不使用 Year／Month／Day 三欄 segmented date input，避免與年／月／週／日四個期間欄位形成過高輸入密度。介面不額外顯示 1900–2200 的範圍說明。

---

## 5. 加減方向規格

使用單一全域方向控制：

```text
[ ＋ | － ]
```

```text
＋：Add／加上
－：Subtract／減去
預設：＋
```

切換方向時：

```text
保留起始日期
保留所有期間數值
立即重新計算
不清空欄位
不需要再次確認
```

`＋／－` 採雙選 segmented control，實際寬度、字級、邊框與狀態樣式留到 B1B 靜態版面階段調整。

---

## 6. 期間輸入規格

### 6.1 支援單位

```text
EN：Years／Months／Weeks／Days
ZH：年／月／週／日
```

可以只填一個單位，也可以同時填多個單位。

### 6.2 數值規則

```text
只接受非負整數
允許 0
空白視為 0
不接受正負號
不接受小數
不接受文字
```

欄位預設保持空白，顯示淡色 `0` placeholder，不預先填入實際 `value="0"`。

### 6.3 不自動換算

允許：

```text
Months 大於 11
Weeks 大於 52
Days 大於 365
```

例如 `18 months` 保持為 18 months，不自動改成 1 year 6 months。

禁止自動進位、自動拆分或重新分配到其他欄位。數值是否有效，以逐步計算後的結果是否仍在 1900–2200 範圍內判斷。

### 6.4 輸入行為

```text
不自動從一個期間欄位跳到下一欄
不限制每欄只能輸入固定長度
前導 0 可在輸入完成或 blur 後正規化
00012 → 12
```

可使用 `inputmode="numeric"` 與 `enterkeyhint` 作為 progressive enhancement，但不可成為核心操作依賴。

---

## 7. 計算規則

### 7.1 固定計算順序

混合單位必須依以下順序逐步計算：

```text
1. Year
2. Month
3. Week
4. Day
```

每一步都以前一步的結果作為新的基準。不得先把年與月合併成總月份，也不得把所有期間換算成總天數。

### 7.2 年的計算

加減年後，如果目標年份不存在原本日期，調整為目標月份最後一個有效日期。

```text
2024-02-29 + 1 year
→ 2025-02-28
```

### 7.3 月的計算

加減月後，如果目標月份不存在原本日期，調整為目標月份最後一個有效日期。

```text
2026-01-31 + 1 month
→ 2026-02-28

2028-01-31 + 1 month
→ 2028-02-29
```

### 7.4 週與日

```text
1 week = 7 calendar days
```

Weeks 與 Days 都使用自然日，不排除週末或國定假日。

### 7.5 混合單位範例

```text
Start：2024-02-29
Add：1 year, 1 month

Step 1：
2024-02-29 + 1 year
→ 2025-02-28

Step 2：
2025-02-28 + 1 month
→ 2025-03-28

Final：
2025-03-28
```

不可得到 `2025-03-29`。

### 7.6 全部期間為 0

起始日期有效且所有期間皆為空白或 0 時：

```text
結果日期 = 起始日期
```

摘要：

```text
EN：Starting date
ZH：起始日期
```

---

## 8. 即時計算規格

工具不設 Calculate 按鈕。

以下變更都立即更新結果：

```text
起始日期變成 valid
切換 ＋／－
修改 Years
修改 Months
修改 Weeks
修改 Days
```

輸入 incomplete 或 invalid 時，不進行正式計算，並立即清除舊結果。

---

## 9. 結果顯示規格

### 9.1 共用元件

結果區必須重用 production shared ResultSummary。

```text
ResultSummary
```

不得複製 Date Range Calculator 或 Business Days Calculator 的結果 DOM、controller 或 CSS。
不得以隱藏／假 secondary、或工具覆寫 `.rs-*` 來符合舊契約。

在 Date Calculator B1B 之前，須完成獨立 Shared ResultSummary Compatibility／Reuse Review（最小公開契約擴充）並經 Owner Gate。未完成前不得開始 B1B。

視覺密度 `standard`／`spacious` 於 B1B 靜態畫面與 Reuse Gate 檢查後決定；不以 variant 承擔內容結構語意。不預先鎖定 `variant=date`。

### 9.2 初始狀態

結果區始終存在。

主結果：

```text
?
```

摘要位置：

```text
EN：Enter a start date, then add or subtract a time period.
ZH：輸入起始日期，再加上或減去一段時間。
```

初始狀態不顯示星期。

### 9.3 有效結果格式

English：

```text
AUG 10, 2026
Monday
```

主日期月份使用三字母縮寫且全大寫；星期使用正常大小寫。

繁體中文：

```text
2026 年 8 月 10 日
星期一
```

### 9.4 計算摘要

摘要依起始日期、方向與所有非 0 單位產生自然語句。

English：

```text
Add 3 weeks to Jul 12, 2026.
Subtract 20 days from Jul 12, 2026.
Add 1 year, 5 months, 6 weeks, and 3 days to Jul 12, 2026.
```

只顯示非 0 單位，並正確處理 singular／plural。

繁體中文：

```text
從 2026 年 7 月 12 日起，加上 3 週。
從 2026 年 7 月 12 日起，減去 20 天。
從 2026 年 7 月 12 日起，加上 1 年 5 個月 6 週 3 天。
```

中文月份期間使用「個月」。

### 9.5 摘要長度

```text
最多兩行
不使用 ellipsis
不截斷重要內容
```

必要時可建立較精簡的同義 fallback，但不得改變計算意義。

---

## 10. 狀態規格

### 10.1 預設／空白

```text
Start date：empty
期間：全部 empty，淡色 0 placeholder
方向：＋
Result：?
Weekday：不顯示
Summary：初始提示
Error icon：不顯示
```

### 10.2 Start date incomplete

```text
Result：?
Weekday：不顯示
Summary：初始提示
舊結果立即清除
Error icon：不顯示
```

此行為沿用全站 Date Input Standard。

### 10.3 Start date complete invalid

例如：

```text
2026-02-30
低於 1900-01-01
高於 2200-12-31
```

行為：

```text
Result：?
Weekday：不顯示
Summary：初始提示
舊結果立即清除
Start date 右側顯示 !
```

不顯示長錯誤文字，不使用紅框。

### 10.4 Valid result

```text
顯示完整日期
顯示星期
顯示正式計算摘要
清除所有 error icon
```

### 10.5 計算結果超出範圍

依 `Year → Month → Week → Day` 逐步檢查。第一個讓結果超出範圍的步驟，其對應欄位顯示 `!`。

```text
Start：2199-12-31
Add：2 years, 3 months

Year step 已超出範圍
→ Years 欄位顯示 !
→ Months 不顯示 !
```

結果回到 `?`，星期不顯示，舊結果立即清除；不在結果區顯示錯誤文字。

### 10.6 Valid → invalid

任何有效結果變成 invalid、incomplete 或 out-of-range 時，立即清除舊結果並回到 `?`。

---

## 11. Error icon 規格

可見錯誤提示使用低調的 `!`。

```text
Start date invalid → 日期值右側
Year step overflow → Years 數值右側
Month step overflow → Months 數值右側
Week step overflow → Weeks 數值右側
Day step overflow → Days 數值右側
```

規則：

```text
icon 固定位置，避免 layout shift
不使用紅色外框
不在結果區顯示錯誤訊息
不得只依靠顏色表示錯誤
```

Accessibility 必須提供 `aria-invalid` 或其他可讀狀態說明，但不增加畫面上的長文案。

---

## 12. Reset／重設規格

工具只提供一種清除操作：

```text
Reset／重設
```

不另設 Clear、Cancel 或 Back to today。

Reset 後：

```text
Start date：清空
Direction：回到 ＋
Years／Months／Weeks／Days：清空
Result：?
Weekday：隱藏
Summary：回到初始提示
所有 error icon：清除
```

期間欄位清空後重新顯示淡色 `0` placeholder。

Desktop Reset：

```text
關閉 Calendar
blur 目前輸入
不自動 focus 任何欄位
```

Mobile Reset：

```text
收起鍵盤
關閉原生 date picker／移除 focus
不自動 focus 任何欄位
Bottom Sheet 維持開啟
```

Reset 的作用是清除設定，不是關閉設定面板。

---

## 13. Desktop 版面結構

```text
Tool title

Result group
- Main date／?
- Weekday
- Summary／initial helper

Input row 1
- Start date Smart Date Input
- Calendar icon

Input row 2
- ＋／－
- Years
- Months
- Weeks
- Days

Reset
```

正式排列：第一列為 Start date；第二列為 `＋／－、Years、Months、Weeks、Days`；下方放低層級純文字 Reset。起始日期與期間不塞在同一列。

---

## 14. Mobile Portrait 結構

### 14.1 Bottom Sheet 關閉狀態

```text
Tool title

Result group
- Main date／?
- Weekday
- Summary／initial helper

Bottom primary control
- Set date and duration／設定日期與期間
```

按鈕只負責開啟 Bottom Sheet，不是 Calculate、Apply 或 Done。

```text
EN：Set date and duration
ZH：設定日期與期間
```

### 14.2 Bottom Sheet 內容

結構：

```text
Start date

[ ＋ | － ]

Years        Months
Weeks        Days

Reset
```

第一列為 native date picker；第二列為單獨一列的 `＋／－`；期間欄位採 2 × 2；最後放低層級 Reset。實際欄寬與視覺平衡於 B1B 靜態畫面後微調。

### 14.3 Bottom Sheet 關閉

可透過既有共用方式關閉，例如點背景遮罩。關閉後保留目前設定與結果。不設 Done、Apply 或 Calculate。

---

## 15. Mobile Landscape 結構

### 15.1 關閉狀態

手機橫式採 compact mobile layout，不直接套用 Desktop inline input。

```text
Tool title

Main date + Weekday 同一列

Summary／initial helper

Set date and duration 按鈕
```

範例：

```text
AUG 10, 2026    Monday

Add 3 weeks to Jul 20, 2026.

[ Set date and duration ]
```

初始或無效狀態時，日期位置顯示 `?`、星期不顯示、下方顯示初始提示。

### 15.2 Mobile Landscape Panel

```text
第一列
Start date

第二列
[ ＋ | － ]  Years  Months  Weeks  Days

第三列
Reset
```

Panel 必須內容驅動高度、保持 compact、不直接沿用 portrait sheet 高度、不產生大片空白，且鍵盤開啟時仍維持 compact。Reset 後 panel 維持開啟。

---

## 16. 共用 Mobile Sheet 行為

必須沿用 Timiva Mobile Sheet baseline：

```text
sheet open 時背景 scroll lock
點背景可關閉
sheet 內不可放廣告
背景結果群組縮放
底部主要操作按鈕不納入縮放群組
結果群組在 Header 與 sheet 之間保持視覺平衡
```

Mobile portrait keyboard-open：

```text
Result group 與 sheet 一起為鍵盤讓位
不能只移動 sheet
sheet 與 keyboard 間不可露出 Related Tools 或 lower content
keyboard 關閉後立即恢復一般 sheet-open 狀態
不可使用大面積延伸底色遮空隙
```

Mobile landscape keyboard-open：

```text
不套用 portrait keyboard lift
panel 保持 compact
不可產生異常高度或多餘色塊
```

---

## 17. 視覺規格邊界

整體樣式沿用既有 Timiva 一般工具：

```text
V2 tool page shell
ResultSummary shared baseline
Mobile Bottom Control
Mobile Sheet
Utility Capsule
Smart Date Input
Calendar baseline
Related Tools／Drawer
```

功能規格階段不鎖定：

```text
主日期字級
? 的實際尺寸
星期字級
摘要字級
欄位寬度
segmented control 寬度
上下間距
結果區垂直位置
精確 padding／gap
```

以上項目待 B1B 靜態畫面完成後，由 Owner 依實際畫面逐步微調。Cursor 不得自行推定固定 pixel 值。

---

## 18. EN／ZH UI 文案

| EN | ZH |
|---|---|
| Start date | 起始日期 |
| Years | 年 |
| Months | 月 |
| Weeks | 週 |
| Days | 日 |
| Reset | 重設 |
| Set date and duration | 設定日期與期間 |

Direction semantics：

| Symbol | EN | ZH |
|---|---|---|
| ＋ | Add | 加上 |
| － | Subtract | 減去 |

視覺可只顯示符號，但 accessible label 必須包含完整語意。

Initial helper：

```text
EN：Enter a start date, then add or subtract a time period.
ZH：輸入起始日期，再加上或減去一段時間。
```

Zero duration：

```text
EN：Starting date
ZH：起始日期
```

---

## 19. Accessibility

至少包含：

```text
所有 input 有正式 label
＋／－控制有明確 selected state
符號按鈕有 Add／Subtract accessible label
錯誤欄位使用 aria-invalid
錯誤 icon 不作為唯一可讀資訊
ResultSummary 沿用 shared accessibility baseline
鍵盤可操作 Desktop Smart Date Input 與 Calendar
Esc 可關閉 Desktop Calendar
focus 樣式不可移除
觸控目標沿用 Timiva 共用標準
```

即時計算結果更新沿用 ResultSummary shared controller 與既有 live-region 規則，不自行建立重複方案。

---

## 20. Lower Content／SEO 範圍

B1A 必須建立：

```text
Date Calculator 專屬 About 標題與內容
Date Calculator 專屬 How to use 標題與步驟
Common uses／tags
Date Calculator FAQ
FAQ JSON-LD
Related Tools
Meta title
Meta description
canonical
hreflang
ToolAdSlot disabled
```

FAQ 建議方向：

```text
如何計算某日期的幾天後？
可以同時加上年、月、週、日嗎？
月底日期不存在時怎麼計算？
一週是否固定等於七天？
是否會排除週末或國定假日？
可以計算過去的日期嗎？
```

Outbound Related Tools（已確認）：

```text
1. Days Between Dates／日期差計算
2. Date Range Calculator／日期區間計算
3. Business Days Calculator／工作日計算
```

B1A 只建立本工具 outbound Related；不修改其他工具 relatedIds、Home Featured、All Tools。
正式 FAQ 題數與文案於 B1A 提出，經 Owner browser review 後定稿。

---

## 21. 技術與共用元件邊界

優先重用：

```text
V2 Tool Page Shell
ResultSummary
Smart Date Input parser／controller
Desktop Calendar baseline
Mobile Sheet
Mobile Bottom Control
Related Tools／Drawer
ToolAdSlot disabled
SEO／FAQ JSON-LD 既有結構
```

禁止：

```text
複製 ResultSummary DOM／CSS
為 Date Calculator 重寫另一套 Smart Date Input
自行修改 Header
自行修改 Footer
自行修改 BaseLayout
自行改 Global background
自行改 shared containers
自行改 production ResultSummary baseline
順手重構既有工具
```

需要修改 shared baseline 或 locked component 時，Cursor 必須停止並回報 Owner。

---

## 22. 開發流程與批次

本工具為 L 層 New Tool MVP。

正式流程：

```text
1. Owner／ChatGPT 完成功能規格
2. Owner 確認規格
3. Cursor 輸出完整 Implementation Plan
4. Owner 審核並核准 Plan
5. D0 Docs Canonicalization
6. 才能開始 B0 實作
```

核准後批次順序：

```text
D0 → B0 → B1A → Shared ResultSummary Compatibility／Owner Gate → B1B → Owner visual → B2+ → Standalone Final → commit 授權 → Link Integration（另行授權）
```

### D0 — Docs Canonicalization

```text
product-spec.md 正式化
README.md
Implementation Plan 歸檔（local-docs）
```

D0 不建立 routes、不修改 production code。

### B0 — V2 工具頁版型 Scaffold

```text
建立 EN／ZH routes
套用 V2 tool page shell
Header／Footer
tool page root
first-screen／stage
lower content area
drawer
ToolAdSlot disabled
catalog entry available:false
```

B0 不是空白頁，但不得加入正式計算互動。

### B1A — Lower Content

```text
About
How to use
Common uses／tags
FAQ
FAQ JSON-LD
Related Tools（本工具 outbound：DBD → DRC → BDC）
Meta
EN／ZH 文案
```

B1A 完成後先做 Owner browser review，再進入 Shared ResultSummary Compatibility（非直接 B1B）。

### Shared ResultSummary Compatibility

獨立 L 層 shared task（最小公開契約擴充）。
未完成、未過 Owner Gate 前，不得開始 Date Calculator B1B。

### B1B — 上方工具靜態畫面

```text
Desktop static
Mobile portrait closed
Mobile portrait sheet-open
Mobile landscape closed
Mobile landscape panel-open
```

先使用靜態 placeholder 呈現 `?`、日期、星期、summary、inputs、buttons 與 error icon positions，不得在 B1B 寫正式計算 state machine。

Owner 在此階段調整字級、間距、比例、欄寬、結果位置與控制項視覺。確認靜態畫面可行後，才進入 B2。

### B2+ — 功能與動態

依 Atomic Component 拆分：

```text
日期輸入與 Calendar
期間輸入與正規化
加／減方向
日期計算核心
ResultSummary 狀態
錯誤與 overflow
Reset
Mobile Sheet
keyboard／focus
完整 EN／ZH runtime copy
```

不得把 D0、B0、B1A、Shared Compatibility、B1B 與 B2 合併成一次完整工具實作，除非 Owner 明確批准。

---

## 23. QA 核心案例

### 23.1 日期輸入

```text
empty
incomplete
complete valid
complete invalid
valid → invalid
1900-01-01
2200-12-31
低於 min
高於 max
6／7／8 碼
slash
dash
逐鍵輸入
paste
回頭修改 year／month／day
Backspace／Delete
全選清空
Calendar open／close
native picker
```

### 23.2 計算

```text
全部為 0
只加／減 days
只加／減 weeks
只加／減 months
只加／減 years
混合年／月／週／日
正向與反向
月底 clamp
閏年 2/29
跨年
跨多個月份
Weeks = 7 days
結果剛好 1900-01-01
結果剛好 2200-12-31
Year／Month／Week／Day step overflow
```

### 23.3 代表性預期結果

```text
2024-02-29 + 1 year
→ 2025-02-28

2024-02-29 + 1 year + 1 month
→ 2025-03-28

2026-01-31 + 1 month
→ 2026-02-28

2028-01-31 + 1 month
→ 2028-02-29

2026-03-31 - 1 month
→ 2026-02-28

2026-07-12 + 3 weeks
→ 2026-08-02

2026-07-12 + 0
→ 2026-07-12
```

### 23.4 Reset

```text
Desktop Reset closes Calendar
Desktop Reset blurs inputs
Mobile Reset dismisses keyboard
Mobile Reset keeps Bottom Sheet／panel open
Reset clears all errors
Reset returns direction to ＋
Reset returns result to ?
Reset does not auto-focus
```

### 23.5 Layout

```text
Desktop EN／ZH
Mobile portrait EN／ZH
Mobile landscape EN／ZH
portrait closed
portrait sheet-open
portrait keyboard-open
landscape closed
landscape panel-open
landscape keyboard-open
rotation portrait ↔ landscape
no horizontal overflow
```

---

## 24. Acceptance Criteria

```text
[ ] EN／ZH 正式路由可用
[ ] 起始日期預設空白
[ ] Desktop Smart Date Input 符合 date-input standard
[ ] Desktop Calendar 為輔助入口
[ ] Mobile 使用 native date picker
[ ] 支援加／減年、月、週、日
[ ] 混合單位依 Year → Month → Week → Day 計算
[ ] 月底與閏年 clamp 正確
[ ] Weeks 固定為 7 calendar days
[ ] 支援範圍為 1900-01-01～2200-12-31
[ ] 無 Calculate／Apply／Done
[ ] 所有有效修改都即時更新
[ ] 初始與無效狀態顯示 ?
[ ] empty／incomplete 不顯示 invalid icon
[ ] complete invalid 顯示 invalid icon
[ ] Valid → invalid 不保留舊結果
[ ] Overflow icon 顯示在第一個造成失敗的單位
[ ] Reset 完整恢復預設狀態
[ ] Mobile Reset 後 sheet 保持開啟
[ ] Desktop／portrait／landscape 結構符合規格
[ ] ResultSummary 使用 shared baseline
[ ] About／How to use／FAQ／Related／Meta 完整
[ ] FAQ JSON-LD 與畫面內容一致
[ ] ToolAdSlot 維持 disabled
[ ] npm run build PASS
[ ] 相關 validator PASS
[ ] Targeted Agent Review 無 Block
[ ] Owner Desktop／portrait／landscape 實機驗收通過
```

---

## 25. 發布邊界

Standalone tool 完成不等於正式上線。

後續仍需：

```text
Standalone Final QA
Owner acceptance
Standalone commit
Post-tool Link Integration Gate
Link Integration QA
Link Integration commit
Owner 明示 push
Cloudflare Pages deploy
Production verification
```

Cursor 不得自行：

```text
commit
push
deploy
開始 Post-tool Link Integration
修改 Home Featured
修改 All Tools 排序
修改既有 Related Tools
```

以上皆需 Owner 明確授權。
