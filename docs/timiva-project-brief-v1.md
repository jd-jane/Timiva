# Timiva Project Brief V1

## 文件目的

本文件定義 Timiva 新專案的基礎方向、建置目標、V1 範圍、技術基礎與開發注意事項。

本文件是 Cursor、Agents、Skills 進入專案前的第一份必讀文件。

所有後續設計、開發、SEO、工具擴充與驗收流程，都應以本文件作為起點。

---

## 1. 專案基本資料

| 項目 | 內容 |
|---|---|
| 專案名稱 | Timiva |
| 網域 | timiva.app |
| 網域註冊商 | Porkbun |
| 部署平台 | Cloudflare Pages |
| 建站框架 | Astro |
| Styling | Tailwind CSS |
| 專案方向 | UX + 品牌感 + Mobile-first |
| 核心感覺 | 像 iPhone Widget App |
| 主要語系 | English / 繁體中文 |
| 主要商業模式 | 搜尋流量 + Google AdSense |
| 維護方向 | 低維護、純前端優先 |

---

## 2. Timiva 是什麼

Timiva 是一個手機優先的時間與生活節奏工具網站。

Timiva 提供少量但高度打磨的工具，幫助使用者處理：

```text
重要日子
計時與專注
日常節奏
人生進度
```

Timiva 不是傳統工具大全，也不是功能堆疊型 productivity app。

Timiva 更接近：

```text
一組乾淨、舒服、打開就能用的 iPhone Widget-like 小工具。
```

---

## 3. 產品定位

英文定位：

```text
Simple tools for important dates, focus, daily rhythm, and life progress.
```

中文定位：

```text
簡單、舒服、手機好用的時間與生活節奏工具。
```

更口語的理解：

```text
Timiva 讓使用者更容易看見時間、計算時間、使用時間，並感覺自己正在生活節奏裡前進。
```

---

## 4. Timiva 的核心策略

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

## 5. 四大工具分類

Timiva 採用情境化分類名稱，不使用抽象的內部分類名稱。

正式分類如下：

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

正式文件、線稿、工具索引、首頁分類、相關工具區與程式資料命名，都應統一使用以上 4 個分類名稱。

---

### 5.1 Important Dates

中文名稱：重要日子

處理重要日期、事件倒數與日期計算。

代表工具：

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

使用情境：

```text
生日還有幾天？
旅行還有幾天？
兩個日期差幾天？
N 天後是哪一天？
今年生日是幾歲？
```

---

### 5.2 Timers & Focus

中文名稱：計時與專注

處理正在進行的一段時間，例如倒數計時、碼表、專注與工作節奏。

代表工具：

```text
Countdown Timer
Stopwatch
Fullscreen Timer
Pomodoro Timer
Focus Timer
Interval Timer
Meeting Timer
```

使用情境：

```text
我要倒數 10 分鐘。
我要計算這件事花多久。
我要開一個全螢幕計時器。
我要專注 25 分鐘。
我要控制會議或簡報時間。
```

---

### 5.3 Daily Rhythm

中文名稱：日常節奏

處理每天的身體節奏、能量安排、呼吸、休息與恢復。

此分類只處理時間追蹤、節奏提示與狀態安排，不提供醫療、健康診斷、營養建議或療效承諾。

代表工具：

```text
Breathing Timer
Fasting / Recovery Timer
Circadian Energy Planner
Break Timer
Focus Flow Timer
Energy Reset Timer
Stretch Timer
```

使用情境：

```text
我想休息一下。
我想做一段呼吸計時。
我想追蹤斷食或恢復時間。
我想知道今天比較適合專注或休息的區間。
我想建立更舒服的日常節奏。
```

---

### 5.4 Life Progress

中文名稱：人生進度

處理年度、月份、人生、自訂時間範圍與目標里程碑的長期進度。

代表工具：

```text
Life Progress Bar
Year Progress
Month Progress
Milestone Tracker
Goal Countdown
Habit Streak Counter
Personal Timeline
```

使用情境：

```text
今年已經過了多少？
這個月還剩多少？
人生進度目前到哪裡？
距離目標期限還有多久？
目前進度是超前還是落後？
```

---

## 6. V1 建置目標

Timiva V1 的目標不是一次完成很多工具，而是先建立一組能代表品牌方向的核心工具。

V1 應建立：

```text
1. 重要日子的搜尋流量基礎
2. 倒數與計時的 App-like 體驗
3. 長期進度的品牌差異化
4. 手機優先的使用體驗
5. 低維護的純前端架構
6. 中英文基本架構
7. 全站一致的 Header / Footer / Layout
8. 基本 SEO / AEO / FAQ 架構
```

---

## 7. V1 核心工具

V1 建議先完成以下 4 個工具：

```text
1. Event Countdown
2. Date Range Calculator
3. Countdown Timer
4. Life Progress Bar
```

這 4 個工具分別代表：

| 工具 | 分類 | 代表價值 |
|---|---|---|
| Event Countdown | Important Dates | 情緒感、事件感、倒數需求 |
| Date Range Calculator | Important Dates | 穩定 SEO 流量、低維護日期計算 |
| Countdown Timer | Timers & Focus | App 感、即時使用情境 |
| Life Progress Bar | Life Progress | 品牌差異化、長期時間感 |

---

## 8. V1 基礎頁面

V1 至少應包含以下頁面：

```text
Home Page
All Tools Page
Event Countdown
Date Range Calculator
Countdown Timer
Life Progress Bar
Privacy Policy
Terms of Use
Contact
```

建議路由：

```text
/en/
/zh/

/en/tools/
/zh/tools/

/en/event-countdown/
/zh/event-countdown/

/en/date-range-calculator/
/zh/date-range-calculator/

/en/countdown-timer/
/zh/countdown-timer/

/en/life-progress-bar/
/zh/life-progress-bar/

/en/privacy/
/zh/privacy/

/en/terms/
/zh/terms/

/en/contact/
/zh/contact/
```

根目錄 `/` 建議導向英文版：

```text
/ → /en/
```

---

## 9. 技術方向

Timiva 技術上應維持低維護、靜態優先、純前端優先。

技術方向：

```text
Astro
Cloudflare Pages
Tailwind CSS
HTML semantic structure
JavaScript for tool logic only
LocalStorage for low-risk local state
URL sharing for simple shareable states
No backend by default
No database by default
```

Tailwind 實作方向：

```text
1. 使用 Tailwind CSS 作為主要 styling 工具
2. HTML 必須保持語意化
3. 每個主要區塊都要有中文註解
4. RWD 必須以元件為單位分段書寫
5. 可使用 @apply 整理重複元件樣式
6. 不使用 inline style
7. 不使用 !important
8. 不使用 CSS id selector
```

RWD 書寫順序：

```text
Header
├── Header desktop
└── Header mobile

Tool
├── Tool desktop
└── Tool mobile

Footer
├── Footer desktop
└── Footer mobile
```

不要採用：

```text
全部 desktop 寫完
再把全部 mobile 集中寫在最後
```

---

## 10. 開發方式

Timiva 採用 CEO Workflow。

也就是：

```text
Owner 拆任務
↓
Cursor 做單一 Atomic Component
↓
Agents 依角色審查
↓
Skills 執行固定檢查
↓
Cursor 輸出驗證報告
↓
Owner 最終確認
↓
進入下一步
```

Cursor 不應一次完成整站，也不應一次完成完整工具。

每次任務應限制在：

```text
一個 Atomic Component
一個頁面區塊
一個工具功能
一個 SEO / FAQ 補強任務
一個 layout 調整任務
一個 QA 修正任務
```

---

## 11. Locked Components 規則

當以下元件完成並經 Owner 確認後，應視為 locked components：

```text
Header
Footer
Base Layout
全站背景
共用容器
```

除非 Owner 明確要求，Cursor 不得自行修改 locked components。

如果 Cursor 認為必須修改 locked components，必須先回報：

```text
1. 為什麼需要修改
2. 會影響哪些頁面
3. 是否有替代方案
4. 是否需要重新跑回歸測試
```

Owner 確認後才可以修改。

---

## 12. Agents 與決策權限

Timiva 使用 4 個核心代理人：

```text
1. Experience Lead
2. Brand Guardian
3. Tech Architect
4. Growth Strategist
```

代理人職責：

| Agent | 中文角色 | 核心任務 |
|---|---|---|
| Experience Lead | UI/UX 體驗長 | 手機操作、流程、觸控目標、減法設計 |
| Brand Guardian | 視覺風格官 | 色系、Bento Grid、layout、元件一致性 |
| Tech Architect | 技術架構師 | Astro、Tailwind、元件重用、JS 正確性 |
| Growth Strategist | SEO 與增長駭客 | Meta、FAQ Schema、內部連結、搜尋流量 |

目前 Timiva 應採用：

```text
Phase A：Owner 主導確認期
```

這代表：

```text
Agents 可以審查
Skills 可以輔助驗證
Cursor 可以整理建議
但最終是否進入實作、commit、deploy，必須由 Owner 確認
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
說明文字保持乾淨
不要堆關鍵字
不要讓頁面變成傳統工具站
```

每個工具頁至少應包含：

```text
H1
Meta title
Meta description
主要工具區
Related Tools
FAQ
FAQ Schema
語意化 HTML
```

---

## 14. 廣告與變現方向

Timiva 未來可以使用 Google AdSense 變現，但 V1 前期不應讓廣告干擾工具體驗。

廣告原則：

```text
不干擾主要操作
不遮住主結果
不破壞 App 感
不放在 Bottom sheet
不放在固定底部操作列附近
不造成誤觸
手機版與桌機版可以有不同廣告位置
優先放在使用者完成主要任務之後
```

較適合的廣告位置：

```text
結果區下方
相關工具區附近
FAQ / SEO 區塊前後
頁面底部內容區
```

純文字頁：

```text
不放廣告
```

---

## 15. V1 不做項目

V1 不應包含：

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

## 16. Cursor 開發注意事項

Cursor 在任何任務中都應遵守：

```text
1. 不要一次做整站
2. 不要一次做完整工具
3. 每次只處理 Owner 指定的範圍
4. 優先使用既有 Astro components
5. 不要自行重寫 Header / Footer / Base Layout
6. 使用 Tailwind CSS，但保持 HTML 語意化
7. 每個主要區塊都要有中文註解
8. RWD 必須以元件為單位分段書寫
9. 不使用 inline style
10. 不使用 !important
11. 不使用 CSS id selector
12. 完成後必須輸出驗證報告
13. Phase A 不得自行 commit / deploy
```

---

## 17. V1 成功標準

Timiva V1 成功標準：

```text
1. 使用者打開頁面後能在幾秒內理解用途
2. 手機直式與橫式都能穩定操作
3. 每個工具都像獨立小 App，而不是傳統工具表單
4. 主結果一眼看懂
5. Header / Footer / Layout 全站一致
6. SEO / FAQ 有補充價值，但不壓過主工具體驗
7. 中英文頁面結構清楚
8. 部署後即使短期不頻繁維護，也能穩定運作
```

---

## 18. 結論

Timiva 的核心不是做很多工具，而是打造少量但高度打磨、手機使用非常舒服的時間與生活節奏工具。

Timiva 應該保持：

```text
少工具
高完成度
Mobile-first
Widget-like
Tailwind + semantic HTML
SEO 不干擾 UX
低維護
Owner 前期最終確認
```

所有後續文件、設計、開發與驗收，都應以本 Project Brief 作為基礎。
