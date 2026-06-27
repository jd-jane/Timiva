# Timiva Product Principles V2

## 文件目的

本文件定義 Timiva 的產品原則、品牌定位、功能取捨與開發判斷標準。

所有新功能、頁面、元件、內容、SEO、廣告與技術決策，都應先回到本文件確認是否符合 Timiva 的核心方向。

---

## 1. Timiva 的產品定位

Timiva 是一個手機優先的時間與生活節奏工具網站。

Timiva 提供少量但高度打磨的工具，幫助使用者處理：

```text
重要日子
計時與專注
日常節奏
人生進度
```

Timiva 不是傳統工具站，也不是大型 productivity app。

Timiva 更像：

```text
一組可以直接放進生活裡使用的 iPhone Widget-like 小工具。
```

---

## 2. Timiva 的核心策略

Timiva 的核心策略是：

```text
少工具，但每個都超舒服。
```

Timiva 不追求一開始就做很多工具。

Timiva 追求的是：

```text
1. 每個工具幾秒內就能理解
2. 手機上操作舒服
3. 主結果一眼看懂
4. 視覺安靜、有品牌感
5. 工具像一張可互動、可截圖的小卡片
6. SEO / FAQ 補充工具體驗，但不壓過主工具
7. 技術上保持低維護、純前端優先
```

---

## 3. 品牌感

Timiva 應該帶給使用者的感覺：

```text
安靜
乾淨
舒服
清楚
手機好用
像 Widget
有一點生活感
不焦慮
不過度工具化
```

Timiva 不應該帶給使用者的感覺：

```text
資訊很滿
工具很多但很普通
廣告干擾
像傳統工具大全
像後台系統
像複雜 productivity app
像需要學習的軟體
```

---

## 4. 四大分類原則

Timiva 採用情境化分類名稱，正式文件、線稿、工具索引、首頁分類與相關工具區都應統一使用以下名稱：

```text
1. Important Dates
2. Timers & Focus
3. Daily Rhythm
4. Life Progress
```

中文對應：

```text
1. 重要日子
2. 計時與專注
3. 日常節奏
4. 人生進度
```

不要在正式文件、程式資料命名或 UI 顯示中使用舊分類名稱，避免 Cursor 混用或產生命名錯誤。

---

## 5. Important Dates 原則

中文名稱：重要日子

處理重要日期、事件倒數與日期計算。

適合工具：

```text
Event Countdown
Date Range Calculator
Days Between Dates
Add / Subtract Days
Age Calculator
Birthday Countdown
Holiday Countdown
Anniversary Countdown
```

產品原則：

```text
1. 幫使用者看見重要日子
2. 幫使用者快速計算日期距離
3. 不需要複雜設定
4. 結果要一眼看懂
5. 避免高維護節日資料庫
```

---

## 6. Timers & Focus 原則

中文名稱：計時與專注

處理正在進行的一段時間，例如倒數計時、碼表、專注與工作節奏。

適合工具：

```text
Countdown Timer
Stopwatch
Fullscreen Timer
Pomodoro Timer
Focus Timer
Interval Timer
Meeting Timer
```

產品原則：

```text
1. 讓使用者快速開始
2. 操作要比傳統計時器更舒服
3. 大數字與低干擾視覺優先
4. 不急著做複雜通知或背景執行
5. 不做大型生產力報表
```

---

## 7. Daily Rhythm 原則

中文名稱：日常節奏

處理每天的節奏、專注、休息、能量與恢復。

適合工具：

```text
Breathing Timer
Fasting / Recovery Timer
Circadian Energy Planner
Break Timer
Focus Flow Timer
Energy Reset Timer
Stretch Timer
```

產品原則：

```text
1. 只做時間追蹤、節奏提示與狀態安排
2. 不做醫療建議
3. 不做健康診斷
4. 不做營養建議
5. 不承諾療效或健康結果
6. 必要時加入聲明文字
```

建議聲明：

```text
本工具僅用於時間追蹤與節奏參考，不提供醫療、營養或健康建議。
```

---

## 8. Life Progress 原則

中文名稱：人生進度

處理年度、月份、人生、自訂時間範圍與目標里程碑的長期進度。

適合工具：

```text
Life Progress Bar
Year Progress
Month Progress
Milestone Tracker
Goal Countdown
Habit Streak Counter
Personal Timeline
```

產品原則：

```text
1. 讓時間變得具體
2. 讓使用者看見進度
3. 給使用者正向緊迫感
4. 不做大型目標管理系統
5. 不做社群打卡或排行榜
6. 優先使用 LocalStorage 保存低風險資料
```

---

## 9. 每個工具都要像小 App

Timiva 的工具頁不應該只是：

```text
一個表單
一個按鈕
一段結果
一堆 SEO 文字
```

每個工具都應該像一個獨立小 App。

每個工具應該具備：

```text
大數字
清楚主視覺
很少的輸入欄位
手機單手好操作
可截圖的畫面感
可分享的結果感
像 Widget 一樣一眼看懂
```

也就是：

```text
一張高質感、可互動、可保存的生活卡片。
```

---

## 10. UX 原則

Timiva 的 UX 應優先考慮：

```text
1. 手機單手操作
2. 幾秒內理解用途
3. 主結果一眼看懂
4. 觸控目標清楚
5. 輸入欄位少
6. 狀態文案短
7. Bottom sheet 不干擾主結果
8. 手機橫式不能跑版
9. 使用者不需要學習就能使用
```

避免：

```text
選項太多
步驟太長
設定太細
功能堆疊
讓使用者不知道下一步做什麼
```

---

## 11. 視覺原則

Timiva 的視覺方向應保持：

```text
App-like
Widget-like
Soft card
Bento Grid
Large number
Low-friction input
Clear hierarchy
Screenshot-friendly result
Calm UI
```

避免：

```text
資訊過密
色彩太吵
像傳統工具站
像表格型網站
按鈕太多
卡片樣式不一致
每頁視覺語言不同
```

---

## 12. 技術原則

Timiva 技術上應維持：

```text
Astro
Cloudflare Pages
Tailwind CSS
語意化 HTML
純前端為主
低維護
LocalStorage 優先
URL sharing 視工具需要加入
不預設後端
不預設資料庫
```

Tailwind 使用原則：

```text
1. Tailwind 負責樣式
2. HTML 保持語意化
3. 每個主要段落要有中文註解
4. RWD 以元件為單位分段書寫
5. 可用 @apply 整理重複元件樣式
6. 不使用 inline style
7. 不使用 !important
8. 不使用 CSS id selector
```

---

## 13. SEO / AEO 原則

Timiva 需要 SEO / AEO / AI Search，但 SEO 不能破壞 App-like 工具體驗。

頁面優先順序：

```text
1. App 感工具主體
2. 結果區 / 狀態區
3. 相關工具推薦
4. FAQ / 說明 / SEO 內容
5. Footer
```

SEO 原則：

```text
工具體驗在前
SEO 補充在後
FAQ 解答真問題
不要堆關鍵字
不要讓頁面變成傳統工具站
```

---

## 14. 廣告原則

Timiva 未來可以使用 Google AdSense 變現，但廣告不應破壞工具體驗。

廣告不得放在：

```text
主結果上方
主要輸入區中間
Bottom sheet 內
固定底部操作列附近
容易造成誤觸的位置
```

廣告較適合放在：

```text
使用者完成主要任務之後
結果區下方
相關工具區附近
FAQ / SEO 區塊前後
頁面底部內容區
```

純文字頁不放廣告。

---

## 15. 新功能判斷標準

之後每次要新增功能、調整 UI 或擴充工具時，都應該先問：

```text
1. 這個功能有沒有讓工具更舒服？
2. 這個功能有沒有讓手機操作更直覺？
3. 這個功能會不會讓頁面變像傳統工具站？
4. 這個功能是否值得增加維護成本？
5. 這個功能有沒有強化 Widget-like 的感覺？
6. 這個功能是否符合 Important Dates / Timers & Focus / Daily Rhythm / Life Progress？
```

如果答案不明確，就先不要做，或縮小成更單純的版本。

---

## 16. 不做項目

Timiva V1 不應包含：

```text
會員系統
登入 / 註冊
雲端同步
大型資料庫
高維護節日資料庫
後端 API
AI 教練
健康診斷
營養建議
睡眠分析
醫療暗示
社群功能
排行榜
複雜報表
大量推播
高複雜度通知系統
```

---

## 17. 取捨原則

Timiva 的取捨原則是：

```text
寧願少做
也不要做得普通

寧願簡單
也不要複雜到破壞使用感

寧願慢慢擴充
也不要變成傳統工具大全
```

---

## 18. 結論

Timiva 應該明確走這條路：

```text
少量工具
高完成度
Mobile-first
Widget-like
SEO 不干擾 UX
Tailwind + semantic HTML
低維護
品牌感明確
Owner 前期最終確認
```

Timiva 不需要看起來工具很多。

Timiva 要讓人覺得：

```text
每一個工具都值得被放到手機桌面上。
```

這會讓 Timiva 和傳統工具站拉開距離，也讓它更適合長期累積品牌、搜尋流量與使用者信任。
