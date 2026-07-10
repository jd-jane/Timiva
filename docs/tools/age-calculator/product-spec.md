# Timiva Age Calculator Product Spec

Date: 2026-07-05
Last updated: 2026-07-10
Owner: Jane / Timiva
Status: Standalone 實作完成 · B3D Final QA Re-check 通過 · No blocking issues found · 尚未 Post-tool Link Integration · 尚未 push / deploy

Related docs:

```text
docs/tools/age-calculator/README.md
docs/core/product-architecture.md
docs/core/roadmap.md
docs/project/current-status.md
docs/project/decision-log.md
docs/workflow/new-tool-development.md
docs/workflow/tool-link-integration.md
```

工具名稱：Age Calculator／年齡計算  
分類：Important Dates／重要日子  
Timiva 第五個工具

正式路由：

```text
/en/age-calculator/
/zh/age-calculator/
```

---

## 0. 目前實作狀態（B3D · 2026-07-10）

### 0.1 進度

```text
B1B / B2A / B2B / B2C / B3C bugfix 已完成
B3D Final QA Re-check：Pass
No blocking issues found
尚未 Post-tool Link Integration
尚未 push / deploy
```

### 0.2 Commits

```text
cb09fc6 — feat: add Age Calculator B1B
72c3d58 — feat: add Age Calculator B2A
fb2d21f — feat: add Age Calculator B2B
cc31c79 — feat: add Age Calculator B2C
f5416b6 — fix: reset Age Calculator invalid birth state
```

### 0.3 最終輸入／As-of 規格（以實作為準）

```text
Desktop birth：單一智慧 input（YYYY / MM / DD）+ calendar popover
Desktop birth calendar：month / year select；不得選未來日
Mobile birth：Year / Month / Day 三欄 input + auto-advance
As-of 預設：today（As of today / 截至今天）
Desktop As-of：calendar popover；與 birth calendar 互斥
Desktop As-of 非 today：日期旁 back icon → 回到 today；點擊不開 calendar
Mobile As-of：原生 type="date"；不顯示 back icon
As-of 範圍：1900-01-01 ～ today（不可未來）
```

### 0.4 最終狀態／計算規格（以實作為準）

```text
出生年份：1900 ～ today
1900 / 01 / 01 → valid
1899 / 12 / 31 → invalid
future birth → invalid
empty / incomplete → 結果 0，不顯示 invalid icon
complete invalid → 結果 0，顯示 invalid icon（不保留上一個 valid 結果）
as-of earlier than birth → 結果 0 + as-of invalid
leap day 2/29：閏年 2/29；非閏年週年 3/1
自然日曆完整年、月、日
total days lived：生日當天 Day 0
初始畫面顯示 0 歲與 0 年／月／日、0 天（與實作一致）
```

### 0.5 B3D QA

```text
npm run build — Pass
validate-seo-head — Pass（460）
validate-sitemap — Pass（375）
validate-age-calculator-math — Pass（130）
git diff --check — Pass
Desktop EN / ZH — Pass
Mobile portrait EN / ZH — Pass
Mobile landscape EN / ZH — Pass
Content / SEO / Related Tools — Pass
```

> 以下章節保留產品意圖與文案；若與 §0 衝突，**以 §0 與目前程式實作為準**。

---

## 1. 工具定位

Age Calculator 用來計算使用者截至今天或指定日期的年齡。

核心體驗：

```text
輸入一個出生日期
立即看見目前歲數
查看精準的年、月、日
看見實際已走過的總天數
```

工具應維持：

```text
Mobile-first
Widget-like
Pure frontend
低維護
輸入簡單
結果一眼看懂
```

它不是生日資料大全，也不應加入大量趣味資訊或生命統計。

---

## 2. MVP 功能

### 2.1 包含

```text
出生日期智慧輸入
日期選擇器
預設以今天作為計算日期
允許修改計算日期
完整歲數
精準年齡：年、月、日
生活總天數
Mobile portrait
Mobile landscape
Desktop
EN / ZH
About
How to use
FAQ
FAQ JSON-LD
Related Tools
Meta title / description
```

### 2.2 不包含

```text
距離下次生日
星座
生肖
出生星期
下一次生日星期
世代分類
心跳、呼吸等生命統計
LocalStorage
分享功能
圖片匯出
會員或雲端同步
歷史計算紀錄
空的「更多資訊」收合區塊
```

未來若增加延伸資料，優先放入可收合的「更多資訊」，收合時仍維持目前簡潔的第一屏。

---

## 3. 主結果

### 3.1 初始狀態

未輸入出生日期時，主結果顯示：

```text
0 歲
```

英文：

```text
0 years old
```

初始畫面不另外顯示：

```text
選擇出生日期，查看精準年齡
```

出生日期欄位本身負責引導使用者操作。

初始狀態顯示（與實作一致）：

```text
0 年 0 個月 0 天
已走過 0 天
```

### 3.2 有效結果

中文範例：

```text
32 歲

32 年 4 個月 12 天
已走過 8,888 天
```

英文範例：

```text
32 years old

32 years, 4 months, 12 days
8,888 days so far
```

### 3.3 資訊層級

```text
第一層：完整歲數
第二層：精準年齡
第三層：生活總天數
```

主視覺只使用：

```text
大字
字級差異
字重
間距
對比
```

不加入：

```text
圓環
進度圖
圖表
生日裝飾
卡片框線
額外分隔線
```

---

## 4. 第一屏結構

### 4.1 基本順序

```text
工具名稱

主結果
完整歲數
精準年齡
生活總天數

底部操作區
出生日期
計算日期控制
```

主結果始終是第一視覺。

出生日期控制放在結果下方，延續 Timiva 既有工具的第一屏操作節奏。

不放主畫面的「計算」按鈕；有效日期輸入完成後自動更新結果。

---

## 5. 出生日期輸入

### 5.1 Desktop：單一智慧日期欄位

Desktop 出生日期使用單一智慧輸入欄位。

欄位格式：

```text
[ 出生日期    YYYY / MM / DD    日曆圖示 ]
```

欄位沿用 Timiva 共用輸入語言：

```text
Label 固定放在欄位內
輸入後 Label 不消失
不使用 floating label
不把 Label 放到欄位上方
```

### 5.1b Mobile：Year / Month / Day 三欄

Mobile（portrait / landscape）在 bottom sheet 內使用三欄：

```text
年 YYYY · 月 MM · 日 DD
```

```text
支援數字輸入
Year 滿 4 碼、Month 可判斷時 auto-advance
invalid icon 可多欄同時顯示
不使用 Desktop 單一 masked input 作為 Mobile 主輸入
```

### 5.2 連續數位輸入（Desktop）

使用者可以直接輸入：

```text
19950812
```

系統即時格式化為：

```text
1995 / 08 / 12
```

使用者不需要：

```text
自行輸入斜線
手動切換欄位
```

### 5.3 支援貼上

可以貼上常見完整格式：

```text
19950812
1995/08/12
1995-08-12
1995.08.12
```

統一格式化為：

```text
1995 / 08 / 12
```

出生年份必須為完整四位數。

### 5.4 日期選擇器（Desktop calendar popover）

欄位最右側保留日期選擇器入口。

```text
calendar popover
month / year select
不得選擇今天之後的日期
不存在的日期不可選
與 As-of calendar 互斥（不可同時開啟）
```

日期選擇器是輔助方式；Desktop 直接輸入數位是主要快速方式。

### 5.5 自動更新

完整且有效日期後：

```text
自動更新主結果
不需要按計算
```

不足完整日期時視為輸入中，不顯示 invalid icon。

---

## 6. 計算日期（As-of）

### 6.1 預設狀態

工具預設以使用者裝置的本地今天計算。

主畫面顯示輕量次要控制：

```text
截至今天
```

英文：

```text
As of today
```

計算日期不是主要輸入，不做成與出生日期同等明顯的第二個完整欄位。

### 6.2 修改後

中文：

```text
截至 2026 / 07 / 01
```

英文：

```text
As of 2026 / 07 / 01
```

As-of 範圍：

```text
1900-01-01 ～ today
不可選擇未來日期
```

若 as-of 早於 birth date：

```text
結果歸零
顯示 as-of invalid 狀態
```

---

## 7. Desktop 計算日期操作

桌機版點擊「截至今天／截至某日」後，開啟 As-of calendar popover。

```text
與 birth calendar 使用同一套 desktop calendar factory
month / year select
與 birth calendar 互斥
有效後立即更新結果
日期不是 today 時，日期旁顯示 back icon
點 back icon → 回到 As of today / 截至今天
點 back icon 不會同時打開 calendar
不開啟 Bottom Sheet
不做第二個完整智慧日期文字欄位作為主編輯方式
```

---

## 8. Mobile 計算日期操作

手機版 As-of 使用原生 `type="date"` picker。

```text
不使用 Year / Month / Day 三欄編輯 As-of
不顯示 As-of back icon
原生 clear／空值時回到 today
範圍：min 1900-01-01、max today
沿用既有 Mobile Sheet（出生日期三欄 + As-of native）
```

Mobile portrait 使用 Bottom Sheet。

Mobile landscape 使用既有 compact sheet 規則，不重新發明版型。

---

## 9. 日期輸入狀態

### 9.1 空白

出生日期完全空白時：

```text
顯示 0 歲
精準年齡與總天數顯示 0 狀態文案
不顯示 invalid icon
```

### 9.2 輸入中（incomplete）

日期尚未完整時：

```text
結果維持 0
不顯示 invalid icon
```

### 9.3 完整且有效

```text
立即更新主結果
移除 invalid 狀態
```

### 9.4 完整但無效

例如：

```text
1995 / 02 / 30
2025 / 02 / 29（非閏年）
2030 / 01 / 01（未來）
1899 / 12 / 31（早於 1900）
```

```text
結果歸零（不保留上一個 valid 結果）
顯示 invalid icon
不自動修正日期
```

B3C 已修正：invalid birth 路徑不得因殘留函式呼叫中斷 `renderZeroState()`。

### 9.5 清除

MVP 不在欄位內預設加入 `×` 清除按鈕。

出生日期清空後：

```text
回到 0 歲與 0 狀態文案
計算日期維持既有 as-of（清空 birth 不強制重置 as-of）
```

---

## 10. 日期有效範圍

### 10.1 出生日期

```text
使用西曆 Gregorian calendar
四位數年份
有效範圍：1900 ～ today
不得晚於 today
1900 / 01 / 01 → valid
1899 / 12 / 31 → invalid
```

### 10.2 計算日期（As-of）

```text
可以是 today
可以是過去日期（≥ 1900-01-01）
不可是未來日期
若早於 birth date → 結果 0 + as-of invalid
```

---

## 11. 計算規則

### 11.1 基本原則

精準年齡採自然日曆計算：

```text
完整年數
＋完整月數
＋剩餘實際天數
```

不可使用：

```text
總天數 ÷ 365
總天數 ÷ 365.25
timestamp 小時差
以固定 30 天換算一個月
```

日期計算以純日曆日期為準，不受時區、小時或夏令時間影響。

### 11.2 精準年齡演算法

1. 從出生日期開始計算完整週年數。
2. 從最近一次生日週年開始，計算可完整經過的日曆月份。
3. 再計算剩餘實際日曆天數。
4. 年、月、日相加後，必須能自然回推至計算日期。

範例：

```text
出生日期：1995 / 08 / 12
計算日期：2026 / 07 / 05

＋30 年 → 2025 / 08 / 12
＋10 個月 → 2026 / 06 / 12
＋23 天 → 2026 / 07 / 05

結果：
30 年 10 個月 23 天
```

月末加月時，若目標月份沒有相同日期，使用該月最後一個有效日期。

### 11.3 完整歲數

完整歲數在生日週年到達時增加一歲。

例如：

```text
生日：1995 / 08 / 12

2026 / 08 / 11 → 30 歲
2026 / 08 / 12 → 31 歲
```

### 11.4 生活總天數

生活總天數：

```text
計算日期 − 出生日期
```

出生當天為：

```text
Day 0
```

隔天為：

```text
已走過 1 天
```

總天數必須是兩個日期之間實際經過的日曆天數，不因精準年齡的年月拆分方式改變。

### 11.5 2 月 29 日生日

2 月 29 日出生者：

```text
閏年：2 月 29 日為生日週年
非閏年：3 月 1 日為生日週年
```

例如：

```text
出生：2000 / 02 / 29

2023 / 02 / 28
→ 尚未滿 23 歲

2023 / 03 / 01
→ 23 年 0 個月 0 天
```

這項規則須在 FAQ 中清楚說明。

---

## 12. 資料與隱私

MVP 不使用 LocalStorage。

不儲存：

```text
出生日期
計算日期
計算結果
歷史紀錄
```

重新整理或重新開啟頁面後：

```text
回到 0 歲
出生日期清空
計算日期回到今天
```

MVP 不加入 URL sharing 或 Native Share。

---

## 13. Responsive Layout

### 13.1 Mobile portrait

```text
工具名稱置頂
主結果位於第一屏中央
出生日期控制位於第一屏底部操作區
計算日期為出生日期下方的輕量控制
主要操作不需捲動即可完成
```

鍵盤開啟時：

```text
輸入區不得被鍵盤遮住
操作區跟隨 visualViewport
主結果可視需要稍微上移或縮小
不做重複縮放
```

### 13.2 Mobile landscape

初版保留完整內容：

```text
完整歲數
精準年齡
生活總天數
出生日期
計算日期控制
```

先不預先隱藏任何資訊。

實機確認後才決定是否需要：

```text
縮小主數位
縮短上下間距
將精準年齡與總天數改為同列
在極低高度裝置隱藏第三層資訊
```

### 13.3 Desktop

```text
主結果置中
出生日期控制位於主結果下方
不使用底部 fixed control
計算日期在原位置就地編輯
不使用 Bottom Sheet
```

---

## 14. 主畫面狀態表

| 狀態 | 主結果 | 精準年齡 / 總天數 | 出生日期 | 計算日期 |
|---|---|---|---|---|
| 初始 | `0 歲` | 顯示 0 狀態文案 | 空白提示 | 截至今天 |
| incomplete | `0 歲` | 0 狀態文案 | 部分輸入 | 維持 |
| 有效日期 | 完整歲數 | 顯示計算結果 | 正式日期 | 今天或指定日期 |
| invalid birth | `0 歲` | 0 狀態文案 + invalid icon | Invalid | 維持 |
| as-of &lt; birth | `0 歲` | 0 狀態文案 + as-of invalid | 維持有效 birth | 指定日期 |
| 清除 birth | `0 歲` | 0 狀態文案 | 空白提示 | 維持 as-of |
| 自訂 as-of（有效） | 重新計算 | 重新計算 | 維持 | 截至指定日期；非 today 顯示 back icon（Desktop） |

---

## 15. 中文介面文案

### H1

```text
年齡計算
```

### 初始結果

```text
0 歲
```

### 日期欄位

```text
出生日期
計算日期
YYYY / MM / DD
```

### 計算日期控制

```text
截至今天
截至 2030 / 01 / 01
回到今天
套用
```

### 結果

```text
32 歲
32 年 4 個月 12 天
已走過 8,888 天
```

### 必要錯誤狀態

```text
日期無效
```

完整無障礙錯誤文案：

```text
請輸入有效日期
出生日期不能晚於今天
計算日期不能早於出生日期
```

---

## 16. 英文介面文案

### H1

```text
Age Calculator
```

### Initial result

```text
0 years old
```

### Date fields

```text
Birth date
Calculation date
YYYY / MM / DD
```

### Calculation date control

```text
As of today
As of 2030 / 01 / 01
Back to today
Apply
```

### Result

```text
32 years old
32 years, 4 months, 12 days
8,888 days so far
```

### Error states

```text
Invalid date
Enter a valid date
Birth date cannot be later than today
Calculation date cannot be earlier than the birth date
```

---

## 17. About

### 中文

## 關於年齡計算

輸入出生日期，即可查看截至今天或指定日期的年齡。結果包含完整歲數、精準的年／月／日，以及已走過的總天數。

### English

## About the Age Calculator

Enter a birth date to calculate an age as of today or another date. The result includes the completed age, the exact years, months, and days, and the total number of days lived.

---

## 18. How to use

### 中文

## 使用方式

1. 直接輸入出生日期，或使用日曆選擇。
2. 工具預設以今天計算；需要時可以修改計算日期。
3. 查看完整歲數、精準年齡與已走過的總天數。

### English

## How to use

1. Enter a birth date directly or choose it from the calendar.
2. The calculator uses today by default, but you can change the calculation date.
3. View the completed age, exact age, and total days lived.

---

## 19. FAQ

### 中文

## 常見問題

### 年齡是怎麼計算的？

工具會先計算完整年數，再計算完整月數與剩餘天數，顯示精準的年、月、日結果。

### 「已走過的總天數」怎麼計算？

總天數是出生日期與計算日期之間實際經過的日曆天數。出生當天為第 0 天，隔天才算走過 1 天。

### 可以計算過去或未來某一天的年齡嗎？

可以。工具預設以今天計算，你也可以修改計算日期，查看自己在指定日期的年齡。

### 2 月 29 日出生的人怎麼計算？

在閏年以 2 月 29 日作為生日；非閏年則以 3 月 1 日作為生日週年。

### 工具會儲存我的出生日期嗎？

不會。出生日期與計算結果只會用於目前頁面的計算，重新整理或離開頁面後不會儲存。

### English

## Frequently asked questions

### How is age calculated?

The calculator first counts completed years, then completed months, and finally the remaining days to show an exact calendar age.

### How is the total number of days calculated?

It is the actual number of calendar days between the birth date and the calculation date. The birth date is day 0, and the following day is one full day lived.

### Can I calculate my age on a past or future date?

Yes. The calculator uses today by default, but you can change the calculation date to see an age on another date.

### How are February 29 birthdays calculated?

In a leap year, the birthday anniversary is February 29. In a non-leap year, March 1 is used as the birthday anniversary.

### Does the calculator save my birth date?

No. Your birth date and result are used only for the current calculation and are not stored after you refresh or leave the page.

---

## 20. Related Tools

初版推薦順序：

```text
1. Date Range Calculator
2. Event Countdown
3. Year Progress
```

中文：

```text
1. 日期區間計算
2. 事件倒數
3. 今年進度
```

理由：

```text
Date Range Calculator：同樣處理日期差，關聯最高
Event Countdown：可延伸至生日或重要日期倒數
Year Progress：同樣將時間轉成容易感受的結果
```

Countdown Timer 與本工具關聯較低，初版不推薦。

未來若以下工具正式上線：

```text
Days Between Dates
Birthday Countdown
```

可優先取代 Year Progress。

Related Tools 只連結已發布的正式工具，不顯示 Coming Soon 或無效入口。

---

## 21. SEO 草案

### EN Meta title

```text
Age Calculator – Exact Age and Days Lived | Timiva
```

### EN Meta description

```text
Calculate your exact age in years, months, and days, plus the total number of days lived. Use today or choose another calculation date.
```

### ZH Meta title

```text
年齡計算｜精準年齡與生活總天數 | Timiva
```

### ZH Meta description

```text
輸入出生日期，快速計算完整歲數、精準的年／月／日，以及已走過的總天數。預設以今天計算，也可選擇指定日期。
```

SEO 基本需求：

```text
H1
Canonical
hreflang
EN / ZH alternate path
FAQ JSON-LD
Related Tools
Sitemap
ToolAdSlot is-disabled
```

---

## 22. Accessibility

```text
日期欄位使用明確 label
Label 不可只存在 placeholder
日曆圖示有 accessible name
Invalid 狀態不可只靠顏色
錯誤欄位使用 aria-invalid
錯誤說明使用 aria-describedby 或 live region
Bottom Sheet focus 正確進入與返回觸發控制
Esc / backdrop / close 行為符合既有 baseline
鍵盤可操作桌機計算日期
Reduced motion 下不使用晃動動畫
```

若 Invalid 狀態使用輕微左右晃動：

```text
只播放一次
幅度小
prefers-reduced-motion 時停用
```

---

## 23. QA 驗收重點

### 計算

```text
一般生日
生日當天
生日前一天
生日後一天
跨月底
月底生日
跨年度
閏年
2 月 29 日生日
指定過去計算日期
指定未來計算日期
總天數與實際日期差一致
```

### 智慧輸入

```text
輸入 19950812
自動格式化
貼上 1995/08/12
貼上 1995-08-12
不足 8 碼
無效月份
無效日期
閏年 2 月 29 日
非閏年 2 月 29 日
刪除內容
```

### Mobile portrait

```text
第一屏完整
主結果清楚
出生日期固定於底部操作區
鍵盤不遮住輸入
計算日期 Bottom Sheet 正常
日曆選擇器正常
```

### Mobile landscape

```text
完整結果先保留
主結果不擠壓
出生日期可操作
計算日期 Sheet 正常
鍵盤開啟後欄位與操作列可見
```

### Desktop

```text
出生日期可直接輸入
日曆入口正常
計算日期可原位置編輯
回到今天正常
不開啟 Mobile Sheet
```

### Privacy

```text
重新整理後出生日期清空
重新整理後計算日期回到今天
沒有 LocalStorage key
URL 不包含出生日期
```

### Site integration

```text
EN / ZH route
Footer language switch
All Tools
Related Tools inbound / outbound
FAQ Schema
Canonical / hreflang
Sitemap
npm run build
link integration validator
```

---

## 24. 實作邊界

不得修改：

```text
Header
Footer visual layout
BaseLayout
Global background
既有工具核心功能
既有 Mobile Sheet 共用 baseline
ToolCard
Related Tools visual baseline
Live AdSense
```

工具使用既有：

```text
V2 tool page shell
Tool result rhythm
Mobile Sheet
Overlay / scroll lock
Drawer
ToolAdSlot is-disabled
Utility control baseline
```

---

## 25. 建議開發流程

Age Calculator 為新工具 MVP，已完成 standalone 批次：

```text
產品規格完成
→ Plan-first / Owner Review
→ B0–B1B scaffold / upper visual
→ B2A birth input（Desktop masked + Mobile YMD）
→ B2B Desktop birth calendar
→ B2C As-of（Desktop calendar + Mobile native）
→ B3 Final QA
→ B3C invalid birth reset bugfix（f5416b6）
→ B3D Final QA Re-check（Pass）
→（下一步）Post-tool Link Integration
→ Link QA / commit
→ push / deploy checkpoint
```

---

## 26. Definition of Done

### Standalone（已完成 · B3D）

```text
Desktop birth 單一 input + calendar
Mobile birth 三欄 + auto-advance
完整歲數 / 精準年齡 / 總天數正確
2 月 29 日規則正確
As-of 預設 today
Desktop As-of calendar + back icon
Mobile As-of native date picker（無 back icon）
invalid birth 歸零
empty / incomplete / as-of-before-birth 行為正確
Mobile portrait / landscape / Desktop 通過
EN / ZH 通過
About / How to / FAQ / FAQ JSON-LD / Related Tools 完成
build / seo-head / sitemap / age-calculator-math / diff-check 通過
B3D Final QA Re-check：Pass
```

### 尚未完成

```text
Post-tool Link Integration
Owner 授權後的 push / deploy
```

```text
未經 Owner 授權不 commit / push / deploy
```
