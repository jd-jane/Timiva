# Timiva Business Days Calculator 產品規格

建立日期：2026-07-13
最後更新：2026-07-19
狀態：Final accepted product spec · Production complete / Deployed · Deployed HEAD `8977fe5`
工具順序：Timiva 第七個工具 · V1.5 Search Foundation 第三個工具
開發階段：V1.5 Search Foundation
分類：Important Dates／重要日子

---

## 1. 工具名稱

```text
EN：Business Days Calculator
ZH：工作日計算
```

正式路由規劃：

```text
/en/business-days-calculator/
/zh/business-days-calculator/
```

正式路由已上線於 `https://timiva.app`。

中文正式名稱統一為「工作日計算」：不加「器」，也不使用「計算機」。

---

## 2. 工具定位

Business Days Calculator／工作日計算用來計算兩個日期之間共有多少個星期一至星期五。

核心使用情境：

```text
計算工作排程共有幾個工作日
估算專案或交付時程
查看一段日期內有多少平日
排除週末後計算實際可用天數
```

工具應保持：

```text
快速輸入
自動計算
不需要額外設定
手機操作舒服
結果一眼看懂
```

---

## 3. MVP 功能範圍

### 3.1 MVP 定位

```text
計算兩個日期之間共有多少個星期一至星期五
開始日期與結束日期皆納入區間
星期六、星期日排除
不扣除國定假日
```

### 3.2 MVP 包含

```text
開始日期
結束日期
工作日數
總天數
週末天數
Desktop 日期區間日曆
Mobile segmented date input
反向日期自動交換
EN / ZH
About
How to use
Common uses
FAQ
Related Tools
FAQ JSON-LD
```

### 3.3 MVP 不做

```text
國家／地區選擇
國定假日資料庫
自訂假日
自訂工作週
週六工作設定
半天工作日
請假日
上下班時間
工時換算
LocalStorage
URL sharing
Clear dates
Calculate 按鈕
手機原生日期元件
Mobile calendar
```

---

## 4. 日期範圍

正式支援範圍：

```text
最小日期：1900-01-01
最大日期：2100-12-31
```

規則：

```text
支援範圍內的過去與未來日期
超出範圍視為 complete invalid
結果歸零
顯示既有 invalid input 狀態
不得保留上一組 valid 結果
```

Desktop input、Desktop calendar、Mobile segmented input 都必須使用同一日期範圍。

---

## 5. 初始狀態

開始日期與結束日期皆不提供預設值。

頁面初次開啟時：

```text
開始日期：空白
結束日期：空白
```

中文初始結果固定顯示：

```text
0
個工作日

共 0 天 · 其中 0 天為週末
```

英文初始結果固定顯示：

```text
0
business days

0 days total · 0 weekend days
```

結果區在初始狀態即保持完整結構，避免輸入日期後內容突然增加而造成版面位移。

---

## 6. 日期輸入方式

### 6.1 Desktop

Desktop 完整沿用 Days Between Dates 的日期區間輸入模式。

畫面使用一個大型日期區間輸入框：

```text
┌─────────────────────────────────────────────┐
│ Start date     →     End date           📅 │
│ YYYY / MM / DD       YYYY / MM / DD          │
└─────────────────────────────────────────────┘
```

規則：

```text
開始日期與結束日期放在同一個大型輸入框內
兩個日期皆可直接用鍵盤輸入
最右側只放一個日曆按鈕
不拆成兩個獨立外框
日期有效後立即更新結果
不需要 Calculate 按鈕
支援 Smart Date Input
支援 range paste
```

直接輸入支援：

```text
20260713
2026/07/13
2026-07-13
貼上完整日期
修改年、月、日其中一段
```

Smart Date Input 的：

```text
6 / 7 / 8 碼推斷
slash / dash
segment edit
caret 行為
empty / incomplete / valid / invalid
range paste
From → To 輸入流程
```

皆沿用 Days Between Dates 與現行日期輸入標準。

### 6.2 Desktop 日期區間日曆

點擊輸入框最右側的日曆按鈕，開啟日期區間日曆。

完整沿用 Date Range Calculator 現有日曆行為：

```text
第一次選擇開始日期
第二次選擇結束日期
完整區間使用既有樣式標示
選完兩個日期後自動關閉
日期自動回填至輸入框
結果立即更新
再次打開時保留目前選取狀態
重新選擇日期時進入新的區間選取流程
```

不為 Business Days Calculator 建立專屬 calendar interaction。

### 6.3 Mobile

Mobile 完整沿用 Days Between Dates。

第一屏使用既有日期操作入口，開啟 Bottom Sheet。

Bottom Sheet 內分成兩組日期：

```text
開始日期
Year　Month　Day

結束日期
Year　Month　Day
```

規則：

```text
開始日期與結束日期分成兩組
每組使用 Year / Month / Day segmented input
使用數字鍵盤
沿用既有 auto-advance
不使用手機原生日期選擇器
不顯示原生日期元件入口
不增加 Mobile calendar
不增加 Apply、Calculate 或 Clear 按鈕
日期完整有效後即時更新結果
```

Start Day 預設不自動跨組跳到 End Year，避免使用者回頭修改時受到干擾。

Mobile portrait、mobile landscape、keyboard-open composition、overlay、scroll lock、sheet-open result positioning 都沿用既有正式 baseline。

---

## 7. 計算規則

### 7.1 起訖日期皆納入計算

開始日期與結束日期本身皆包含在日期區間內。

正式公式概念：

```text
總天數 = 結束日期與開始日期的差距 + 1
週末天數 = 區間內星期六與星期日的總數
工作日數 = 總天數 − 週末天數
```

只有星期一至星期五計為工作日。

### 7.2 計算範例

```text
週一 → 週五
總天數：5
週末天數：0
工作日數：5
```

```text
週五 → 下週一
總天數：4
週末天數：2
工作日數：2
```

```text
同一個平日
總天數：1
週末天數：0
工作日數：1
```

```text
同一個週末日
總天數：1
週末天數：1
工作日數：0
```

```text
週六 → 週日
總天數：2
週末天數：2
工作日數：0
```

### 7.3 反向日期

若使用者輸入的結束日期早於開始日期，例如：

```text
開始日期：2026 / 07 / 20
結束日期：2026 / 07 / 13
```

系統自動整理為：

```text
開始日期：2026 / 07 / 13
結束日期：2026 / 07 / 20
```

規則：

```text
自動交換成較早日期 → 較晚日期
不顯示錯誤
不顯示 invalid icon
不要求重新輸入
只在兩個日期皆 complete valid 後交換
empty、incomplete、complete invalid 不交換
交換後立即重新計算
```

Desktop direct input、range paste、calendar selection 與 Mobile segmented input 行為一致。

---

## 8. 結果內容

### 8.1 中文

主結果：

```text
5
個工作日
```

次要摘要：

```text
共 7 天 · 其中 2 天為週末
```

完整結果：

```text
5
個工作日

共 7 天 · 其中 2 天為週末
```

中文不做單複數變化：

```text
0 個工作日
1 個工作日
2 個工作日
```

### 8.2 英文

主結果：

```text
5
business days
```

次要摘要：

```text
7 days total · 2 weekend days
```

英文 UI 使用 sentence case（除非位於標題或 H1）：

```text
business day
business days
```

### 8.3 英文單複數

正式規則：

```text
0 business days
1 business day
2 business days

1 day total
2 days total

1 weekend day
2 weekend days
```

### 8.4 文案規則

中文不使用：

```text
日曆日
Calendar days 的直接翻譯
```

「排除週六與週日，不扣除國定假日」不放在第一屏主結果區。

此限制改放於：

```text
About
How to use
FAQ
```

---

## 9. 結果狀態

### Empty／Incomplete

任一日期完全空白，或任一日期尚未輸入完整：

```text
結果歸零
不顯示 invalid icon
```

顯示：

```text
0 個工作日
共 0 天 · 其中 0 天為週末
```

英文對應：

```text
0 business days
0 days total · 0 weekend days
```

### Complete invalid

任一日期為完整但不存在的日期，或超出正式日期範圍，例如：

```text
2026 / 02 / 30
1899 / 12 / 31
2101 / 01 / 01
```

規則：

```text
結果歸零
錯誤欄位顯示既有 invalid 狀態
不得保留上一組 valid 結果
```

### Complete valid

兩個日期都完整且有效：

```text
更新工作日數
更新總天數
更新週末天數
```

---

## 10. 重設與儲存規則

不提供 Clear dates 按鈕。

規則：

```text
不使用 LocalStorage
不儲存上次日期
不儲存上次結果
重新整理頁面後日期回到空白
重新整理後結果回到 0
使用者可直接覆寫日期
手動清空任一日期後，結果回到初始狀態
```

---

## 11. Desktop／Mobile 版面

Desktop、Mobile Portrait、Mobile Landscape 的：

```text
工具名稱位置
主結果字級層級
次要摘要
日期操作區
Bottom Sheet
overlay
scroll lock
keyboard-open composition
第一屏主要操作位置
下方內容間距
```

皆沿用 Days Between Dates 與現有 Timiva 工具樣式。

不建立 Business Days Calculator 專屬版面模式。

---

## 12. H1、Short description 與 SEO

### H1

```text
EN：Business Days Calculator
ZH：工作日計算
```

### Short description

```text
EN：
Calculate the number of business days between two dates, excluding Saturdays and Sundays.

ZH：
計算兩個日期之間的工作日數，排除星期六與星期日。
```

### Meta title

```text
EN：
Business Days Calculator | Timiva

ZH：
工作日計算｜Timiva
```

### Meta description

```text
EN：
Calculate business days between two dates. See the total number of weekdays and weekend days, with both start and end dates included.

ZH：
計算兩個日期之間共有多少個工作日，並查看總天數與週末天數。開始日期與結束日期皆納入計算。
```

### FAQ heading

```text
EN：Business Days Calculator FAQ
ZH：工作日計算常見問題
```

---

## 13. About

### EN title

```text
About the Business Days Calculator
```

### EN copy

```text
The Business Days Calculator shows how many weekdays fall between two dates. Both the start and end dates are included when they fall on a Monday through Friday. Saturdays and Sundays are excluded, while public holidays are not deducted.
```

### ZH title

```text
關於工作日計算
```

### ZH copy

```text
工作日計算可以算出兩個日期之間共有多少個星期一至星期五。開始日期與結束日期若為平日，都會納入計算；星期六與星期日會被排除。目前不扣除國定假日。
```

---

## 14. How to use

### EN title

```text
How to use the Business Days Calculator
```

### EN content

```text
1. Enter a start date and an end date.
2. Type the dates directly, or use the desktop calendar to select a date range.
3. View the number of business days, total days, and weekend days automatically.
```

### ZH title

```text
如何使用工作日計算
```

### ZH content

```text
1. 輸入開始日期與結束日期。
2. 可直接輸入日期，或在桌機使用日曆選擇日期區間。
3. 工具會自動顯示工作日數、總天數與週末天數。
```

---

## 15. Common uses

Common uses 為資訊標籤，不可點擊。

### EN

```text
Project schedules
Delivery estimates
Work planning
Deadline checks
Business timelines
```

### ZH

```text
專案排程
交付時程
工作安排
期限計算
商務時程
```

---

## 16. FAQ

正式保留 5 題。

### 1

```text
EN Q：What counts as a business day?
EN A：Monday through Friday count as business days. Saturdays and Sundays are excluded.

ZH Q：什麼是工作日？
ZH A：星期一至星期五會計為工作日，星期六與星期日不會列入。
```

### 2

```text
EN Q：Are the start and end dates included?
EN A：Yes. Both dates are included when they fall on a weekday. If either date falls on a weekend, that date is not counted as a business day.

ZH Q：開始日期與結束日期會算進去嗎？
ZH A：會。開始日期與結束日期若為平日，都會納入工作日數；若日期落在週末，則不會計為工作日。
```

### 3

```text
EN Q：Does the calculator exclude public holidays?
EN A：No. The current version excludes Saturdays and Sundays only. Public holidays and custom days off are not deducted.

ZH Q：工作日計算會扣除國定假日嗎？
ZH A：不會。目前只排除星期六與星期日，不會扣除國定假日或其他自訂休假日。
```

### 4

```text
EN Q：What happens if the dates are entered in reverse order?
EN A：The calculator automatically places the earlier date first and calculates the same date range.

ZH Q：如果開始日期晚於結束日期會怎麼處理？
ZH A：工具會自動將較早的日期放在前面，再計算相同的日期區間，不需要重新輸入。
```

### 5

```text
EN Q：Can I calculate past and future date ranges?
EN A：Yes. You can calculate any valid date range from January 1, 1900, through December 31, 2100.

ZH Q：可以計算過去或未來的日期嗎？
ZH A：可以。工具支援 1900 年 1 月 1 日至 2100 年 12 月 31 日之間的有效日期區間。
```

---

## 17. Related Tools

正式 outbound 排序：

```text
1. Days Between Dates／日期差計算
2. Date Range Calculator／日期區間計算
3. Event Countdown／事件倒數
```

理由：

```text
Days Between Dates：最接近的日期差需求
Date Range Calculator：提供完整日期區間統計
Event Countdown：延伸至期限與重要日期情境
```

Date Calculator / Add or Subtract Days 尚未發布，不得建立正式連結或 Coming Soon。

Inbound Related Tools 留待 Post-tool Link Integration 階段決定。

---

## 18. Edge cases

必須測試：

```text
日期最小值（1900-01-01）
日期最大值（2100-12-31）
低於最小值
高於最大值
同一天平日
同一天週末
週一到週五
週五到下週一
只包含週末
跨月
跨年
跨閏年
包含 2 月 29 日
反向日期
empty
incomplete
complete invalid
valid → invalid
invalid → valid
純數字 6 / 7 / 8 碼
slash
dash
range paste
Desktop calendar
Mobile segmented input
portrait keyboard-open
landscape keyboard-open
重新整理後回到空白
英文單複數
```

---

## 19. 不可回歸條件

```text
不得修改 Days Between Dates 核心邏輯
不得修改 Date Range Calculator 日曆行為
不得使用手機原生日期元件
不得新增 Clear
不得新增 Calculate
不得新增 LocalStorage
不得新增國定假日資料庫
不得修改 Header、Footer、BaseLayout
不得自行修改共用 Mobile Sheet baseline
不得在工具完成前開始 Post-tool Link Integration
不得建立指向未發布工具的正式連結或 Coming Soon
```

---

## 20. 開發順序

Business Days Calculator 為新工具 MVP，屬 L 層任務。

正式流程：

```text
Owner 確認完整產品規格
→ 建立 tracked product spec
→ Cursor 只輸出完整 Implementation Plan
→ Owner 審核 Plan
→ 核准後分批實作
→ Standalone QA
→ Standalone commit
→ Post-tool Link Integration
→ Link QA
→ Owner 授權 push / deploy
```

實作批次：

```text
B0：V2 工具頁版型 scaffold
B1A：About / How to use / Common uses / FAQ / Related Tools
B1B：上方工具靜態畫面
B2A：日期輸入與狀態
B2B：工作日計算邏輯與結果
B2C：Desktop calendar 與 Mobile Sheet 整合
B3：完整 standalone QA
```
