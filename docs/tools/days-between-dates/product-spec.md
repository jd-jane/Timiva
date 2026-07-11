# Timiva Days Between Dates 產品規格草案

建立日期：2026-07-11  
狀態：Draft · Ready for Owner review  
適用工具：Timiva V1.5 Search Foundation 第六個工具 — Days Between Dates / 日期差計算

---

## 1. 工具定位

### 工具名稱

```text
EN：Days Between Dates
ZH：日期差計算
```

### 工具路由

```text
/en/days-between-dates/
/zh/days-between-dates/
```

### 分類

```text
Important Dates / 重要日子
```

Days Between Dates 是 Timiva V1.5 Search Foundation 的下一個搜尋型日期工具。

### 工具目的

Days Between Dates 用於快速計算兩個日期之間相差幾天。

核心體驗：

```text
快速輸入兩個日期
即時得到相差天數
結果一眼看懂
不需要開日曆
不需要按 Calculate
手機上用日期膠囊 + Bottom Sheet 編輯
```

### 產品定位一句話

```text
ZH：快速輸入兩個日期，計算它們相差幾天。
EN：Quickly calculate how many days are between two dates.
```

---

## 2. 與既有工具的差異

### 與 Date Range Calculator 的差異

```text
Date Range Calculator：
日期區間分析工具，包含 Total Days / Workdays / Weekends 等區間資訊。

Days Between Dates：
快速日期差工具，只回答兩個日期相差幾天。
```

Days Between Dates 不做 workdays、weekends、holidays，避免與 Date Range Calculator 重疊。

### 與 Age Calculator 的關係

```text
Age Calculator：
用出生日期與計算日期，計算年齡。

Days Between Dates：
用兩個任意日期，計算相差天數。
```

Days Between Dates 應沿用 Age Calculator 沉澱後的日期輸入標準，但不沿用 Age Calculator 的年齡算法、生日週年規則或 As-of date 行為。

---

## 3. MVP 範圍

### Included

```text
EN / ZH
Desktop / Mobile portrait / Mobile landscape
主結果：X days / X 天
次結果：X weeks and Y days / X 週又 Y 天
兩個日期輸入
Smart Date Input
包含選擇的兩個日期選項
FAQ
FAQ JSON-LD
Related Tools
Meta title / description
ToolAdSlot disabled
```

### Not included

```text
日曆作為主要輸入
Date picker 作為主要互動
快速日期選單
+7 / +30 templates
Calculate button
Swap dates
主要 Reset button
LocalStorage
URL sharing
Workdays / weekends
Holidays
國定假日資料庫
日期加減
時分秒計算
多日期區間
Lunar calendar
分享圖片
帳號 / 同步 / 歷史紀錄
```

---

## 4. 日期輸入標準

### Source of truth

Days Between Dates 的日期輸入以此文件為準：

```text
docs/standards/date-input.md
```

規格原則：

```text
If this product spec and docs/standards/date-input.md conflict on date input behavior,
docs/standards/date-input.md wins.
```

### Smart Date Input

兩個日期欄位都使用同一套 Smart Date Input：

```text
From date / 從
To date / 到
```

支援：

```text
純數字 6 / 7 / 8 碼推斷
slash 輸入
dash 輸入
segment-based 編輯
empty / incomplete / valid / invalid 狀態
valid → invalid 歸零
```

輸入模式需明確區分（細節以 `date-input.md` 為準）：

```text
raw continuous input：逐鍵與 paste 同一串結果必須一致；6/7 碼不在逐鍵中過早 commit / auto-focus
slash / dash explicit input：尊重分段，不跑純數字推斷；鍵盤可直接輸入 / 或 -
segment-based editing：尊重 year/month/day，不可重合併再推斷
formatted display mode：valid 完成後才標準化
```

Desktop From → To auto-focus 僅在日期真正完成後觸發；Mobile sheet 不跨欄。

DBD 允許未來日期（1900–2100），不套用 Age Calculator birth date max=today。

### 純數字推斷

依 `date-input.md`：

```text
6 碼：YYYY / M / D
199011 → 1990 / 1 / 1

7 碼：依月份可能性推斷
1950820 → 1950 / 8 / 20
1950102 → 1950 / 10 / 2
1950131 → 1950 / 1 / 31

8 碼：YYYY / MM / DD
19900101 → 1990 / 01 / 01
19901101 → 1990 / 11 / 01
19991122 → 1999 / 11 / 22（逐鍵與 paste 必須同結果）
```

### Slash / dash 輸入

```text
2021/1/1 → 2021 / 01 / 01
2021-1-1 → 2021 / 01 / 01
2021/01/01 → 2021 / 01 / 01
```

若輸入含 `/` 或 `-`：

```text
尊重使用者分段
不套用 6 / 7 / 8 碼純數字推斷
月 / 日允許 1–2 位
完成後正規化為 YYYY / MM / DD
```

### 有效年份

```text
1900–2100
```

有效日期條件：

```text
年份必須介於 1900–2100
月份必須為 01–12
日期必須符合該月份實際天數
閏年 2 月 29 日有效
非閏年 2 月 29 日 invalid
```

錯誤提示：

```text
ZH：請輸入 1900–2100 之間的有效日期
EN：Enter a valid date between 1900 and 2100
```

---

## 5. 計算邏輯

### 預設計算

預設計算兩個日期之間的絕對天數差。

```text
不要求 from date 早於 to date
輸入順序反過來，結果相同
不需要 Swap dates
```

範例：

```text
2026 / 07 / 08 — 2026 / 07 / 15 = 7 天
2026 / 07 / 15 — 2026 / 07 / 08 = 7 天
```

### 同一天

預設不包含選擇的日期本身。

```text
2026 / 07 / 08 — 2026 / 07 / 08 = 0 天
```

### 包含選擇的兩個日期

使用者可啟用：

```text
ZH：包含選擇的兩個日期
EN：Include both dates
```

啟用後：

```text
結果 = 預設日期差 + 1
```

範例：

```text
2026 / 07 / 08 — 2026 / 07 / 08
預設：0 天
包含選擇的兩個日期：1 天
```

```text
2026 / 07 / 08 — 2026 / 07 / 15
預設：7 天
包含選擇的兩個日期：8 天
```

### 週數結果

次結果由主結果換算：

```text
weeks = floor(days / 7)
remainingDays = days % 7
```

範例：

```text
8 days → 1 week and 1 day
8 天 → 1 週又 1 天
```

---

## 6. 結果顯示

### 主結果

```text
EN：X days
ZH：X 天
```

### 次結果

```text
EN：X weeks and Y days
ZH：X 週又 Y 天
```

### 預設狀態

```text
From date = empty placeholder（YYYY / MM / DD）
To date = empty placeholder（YYYY / MM / DD）
Include both dates = Off
主結果 = 0 days / 0 天
次結果 = 0 weeks and 0 days / 0 週又 0 天

Result display remains 0 days / 0 weeks and 0 days until two valid dates are provided
```

### 輸入中 / 不完整 / 錯誤

```text
任一日期 empty → 結果 0
任一日期 incomplete → 結果 0
任一日期 complete invalid → 結果 0 + 欄位顯示 invalid 狀態
valid → invalid → 結果歸零
不得保留上一筆 valid 結果
```

---

## 7. Desktop UI

### Layout

桌機版採 Result-first：

```text
Tool name

0
days

0 weeks and 0 days

[ YYYY / MM / DD  —  YYYY / MM / DD ]

[ Include both dates ]
```

### 日期輸入

桌機視覺上是一個長型整合欄位，但內部是兩個 Smart Date Input。

```text
不顯示 Date 1 / Date 2 label
不顯示 From / To 可見 label
左側日期 = From date
右側日期 = To date
中間使用 —
```

輔助可及性：

```text
可使用 visually hidden label：
From date
To date
```

### 行為

```text
點左側日期可修改 From date
點右側日期可修改 To date
兩欄都完整有效後即時更新結果
第一個日期完成後可自動 focus 第二個日期
```

### 桌機貼上日期範圍

桌機支援貼上一整段日期範圍並自動拆開：

```text
2026/07/08-2026/09/17
2026-07-08 — 2026-09-17
```

自動拆成：

```text
From：2026 / 07 / 08
To：2026 / 09 / 17
```

---

## 8. Mobile UI

### 主畫面

手機主畫面只顯示結果與日期範圍膠囊。

```text
0
天

0 週又 0 天

[ Select dates ] / [ 選擇日期 ]
```

主畫面不顯示：

```text
包含選擇的兩個日期
Include both dates
```

若使用者想確認是否有開啟包含選項，可點日期膠囊打開 Bottom Sheet。

### 日期膠囊

```text
預設（From / To 皆 empty）：Select dates / 選擇日期
兩日期皆 valid：YYYY/MM/DD — YYYY/MM/DD（緊湊、無空格）
```

範例（已輸入）：

```text
2026/07/08 — 2026/07/08
```

### Bottom Sheet

點日期膠囊後開啟 Bottom Sheet。預設為 empty placeholder：

```text
[ 從  YYYY / MM / DD ]

[ 到  YYYY / MM / DD ]

[ 包含選擇的兩個日期 ]
```

EN：

```text
[ From  YYYY / MM / DD ]

[ To    YYYY / MM / DD ]

[ Include both dates ]
```

### Bottom Sheet 行為

```text
不放 Cancel button
不放 Done button
不放 Apply button
不放 Calculate button
輸入有效日期後結果即時更新
點背景 backdrop 關閉 Bottom Sheet
```

點背景關閉沿用 Timiva 已驗證的 tool overlay / backdrop baseline。

### Mobile landscape

```text
先沿用 mobile portrait 邏輯
不先做特殊 compact layout
內容較少，等實機測試再決定是否微調
```

---

## 9. Include both dates 控制

### 控制形式

使用打勾膠囊，不使用 switch。

### ZH

```text
Default：包含選擇的兩個日期
Active：✓ 已包含選擇的兩個日期
```

### EN

```text
Default：Include both dates
Active：✓ Both dates included
```

### 行為

```text
預設 Off
點擊後立即更新結果
再次點擊回到 Off
主結果與週數次結果都一起更新
```

### 位置

```text
Desktop：長日期輸入欄下方
Mobile：Bottom Sheet 內，兩個日期 input 下方
```

---

## 10. Reset / refresh / persistence

### 不放主要 Reset

Days Between Dates 是即時計算工具，MVP 不放主要 Reset button。

### Refresh

重新整理頁面後回到：

```text
From date = empty placeholder
To date = empty placeholder
Include both dates = Off
結果 = 0 days / 0 天
次結果 = 0 weeks and 0 days / 0 週又 0 天
```

### LocalStorage

MVP 不使用 LocalStorage。

### URL state

MVP 不使用 URL sharing / URL state。

---

## 11. 文案草案

### H1

```text
EN：Days Between Dates
ZH：日期差計算
```

### Short description

```text
EN：
Quickly calculate how many days are between two dates.

ZH：
快速計算兩個日期之間相差幾天。
```

### Meta title

```text
EN：
Days Between Dates Calculator | Timiva

ZH：
日期差計算｜兩個日期相差幾天｜Timiva
```

### Meta description

```text
EN：
Calculate the number of days between two dates with a fast, simple date input. You can also include both selected dates in the count.

ZH：
快速計算兩個日期相差幾天，支援直接輸入日期，也可以選擇是否包含選擇的兩個日期。
```

---

## 12. Lower content

### About

EN heading：

```text
About Days Between Dates
```

ZH heading：

```text
關於日期差計算
```

內容方向：

```text
說明此工具用於快速計算兩個日期之間相差幾天。
強調適合旅行、期限、紀念日、事件距離、專案日期等日常情境。
```

### How to use

EN heading：

```text
How to use Days Between Dates
```

ZH heading：

```text
如何使用日期差計算
```

EN：

```text
1. Enter the first date.
2. Enter the second date.
3. View the day difference instantly.
4. Turn on Include both dates if you want to count both selected dates.
```

ZH：

```text
1. 輸入第一個日期。
2. 輸入第二個日期。
3. 立即查看兩個日期相差幾天。
4. 如果想把選擇的兩個日期也算進去，可以開啟「包含選擇的兩個日期」。
```

### Common uses / tags

EN：

```text
Travel planning
Project deadlines
Event planning
Anniversaries
Date difference
```

ZH：

```text
旅行規劃
專案期限
活動安排
紀念日
日期差
```

---

## 13. FAQ

每語系 5–6 題。

### EN FAQ

```text
1. How do I calculate days between two dates?
Enter the two dates and the result updates automatically. You do not need to press a calculate button.

2. Does the result include both selected dates?
By default, no. The result counts the difference between the two dates. Turn on Include both dates if you want both selected dates counted.

3. Why does the same date show 0 days?
Because the default result shows the difference between the dates. If you want the selected date itself to count as one day, turn on Include both dates.

4. Does date order matter?
No. The tool calculates the absolute difference, so the result is the same even if the later date is entered first.

5. Can I enter dates without opening a calendar?
Yes. This tool is designed for fast date input. You can type compact dates or use slash / dash formats.

6. How is this different from Date Range Calculator?
Days Between Dates gives a quick day count. Date Range Calculator is better when you need more range details such as workdays or weekends.
```

### ZH FAQ

```text
1. 如何計算兩個日期相差幾天？
輸入兩個日期後，結果會自動更新，不需要再按計算按鈕。

2. 結果會包含我選擇的兩個日期嗎？
預設不會。預設結果是兩個日期之間的差距。如果想把選擇的兩個日期也算進去，可以開啟「包含選擇的兩個日期」。

3. 為什麼同一天到同一天是 0 天？
因為預設顯示的是兩個日期之間的差距。如果你希望選擇的日期本身也算 1 天，可以開啟「包含選擇的兩個日期」。

4. 日期順序會影響結果嗎？
不會。這個工具會計算兩個日期的絕對差，所以先輸入較晚日期或較早日期，結果都一樣。

5. 可以不開日曆，直接輸入日期嗎？
可以。這個工具以快速日期輸入為主，支援純數字日期，也支援斜線或橫線格式。

6. 這和日期區間計算有什麼不同？
日期差計算適合快速知道兩個日期相差幾天。日期區間計算則適合查看更多區間資訊，例如工作日或週末日。
```

---

## 14. Related Tools

MVP 建議：

```text
1. Date Range Calculator
2. Age Calculator
3. Event Countdown
```

排序理由：

```text
Date Range Calculator：最接近的日期區間工具
Age Calculator：同樣是日期輸入與日期差情境
Event Countdown：同屬 Important Dates，處理距離某個事件多久
```

若未來 Date Calculator / Add or Subtract Days 完成，可將 Event Countdown 替換或調整：

```text
Date Range Calculator
Age Calculator
Date Calculator
```

Related Tools 必須維持最多 3 個，並依最接近使用者意圖排序。

---

## 15. QA 重點

### 日期輸入 QA

需對照：

```text
docs/standards/date-input.md
docs/workflow/tool-page-qa.md §3.1
```

必測：

```text
6 碼純數字
7 碼純數字
8 碼純數字
slash 輸入
dash 輸入
回頭修改 year / month / day
刪除 year / month / day segment
全選刪除
任一欄 incomplete → 結果 0
任一欄 complete invalid → 結果 0
valid → invalid → 結果歸零
From / To 兩欄行為一致
From / To 互不干擾
```

### 計算 QA

```text
同一天 → 0 天
同一天 + Include both dates → 1 天
跨月
跨年
閏年 2/29
非閏年 2/29 invalid
From earlier than To
From later than To
Include both dates 開 / 關後週數結果同步更新
```

### UI QA

```text
Desktop 日期長欄位可正常編輯
Desktop include capsule 在日期欄下方
Mobile 日期膠囊可開 sheet
Mobile sheet 可點 backdrop 關閉
Mobile sheet 不顯示 Cancel / Done / Apply
Mobile 主畫面不顯示 include 狀態
Mobile landscape 不跑版
FAQ / Related Tools 在工具體驗之後
ToolAdSlot disabled
```

---

## 16. 實作批次建議

Days Between Dates 是新工具 MVP，屬於 L 層任務。建議採用既有 layout-first 流程：

```text
B0：V2 工具頁 scaffold
B1A：Lower content / SEO / FAQ / Related Tools
B1B：上方工具靜態畫面
B2A：日期輸入與 Smart Date Input 整合
B2B：日期差計算與 Include both dates
B3：QA / regression / polish
B4：Post-tool Link Integration
B5：Release check
```

---

## 17. Protected scope

不得在 Days Between Dates 任務中順手修改：

```text
Header
Footer visual layout
BaseLayout
Global background
Age Calculator 已驗收核心邏輯
Date Range Calculator 核心邏輯
Mobile Sheet baseline
Tool Drawer baseline
ToolCard visual baseline
Live ads / AdSense
```

若 Cursor 認為需要抽共用日期 input helper：

```text
必須先在 Plan-first 中提出
不得直接重構 Age Calculator
不得改變 Age Calculator production behavior
若有共用 helper 抽取風險，應先保持 Days Between Dates self-contained
```

---

## 18. Ready for Plan-first

本規格足以進入 Cursor Plan-first。

Plan-first 需要確認：

```text
1. 現有 Age Calculator 日期輸入實作可否低風險共用
2. date-input.md 如何映射到 Days Between Dates
3. Desktop 長型雙日期欄位的實作方式
4. Mobile Bottom Sheet 是否可沿用既有 baseline
5. 日期差 math lib 與 validator 設計
6. EN / ZH route 與 metadata 實作位置
7. Related Tools data source
8. B0–B3 實作批次
9. Targeted Agent Review 範圍
10. QA / validation scripts
```
