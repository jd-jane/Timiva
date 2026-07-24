# Timiva Decision Log

> 用途：記錄已確認的產品、設計、技術、SEO、法務與工作流決策。
> 原則：只記錄「之後會影響判斷」的決策，不記錄每個小修改細節。

---

## 2026-07-24 — Shared DesktopCalendar Phase A–E（local；尚未 push／deploy）

### 背景

```text
第二次以上 Desktop Calendar pattern（BDC／DRC／Age）觸發 Reuse Gate。
Phase A–D 完成 shared foundation 與三工具 Desktop migration；
Owner Gate B／C／D Final PASS；Phase E 建立 canonical validator 與文件收尾。
```

### 決策

```text
1. 正式命名：DesktopCalendar、data-desktop-calendar、data-sdc-*、.sdc-*。
2. 架構：Astro component＋base controller＋shared CSS＋thin adapters。
3. Shared ownership：day grid、month 3×4、year input＋scroll list、
   Esc／outside／focus、popover／inline chrome。
4. Adapter ownership：selection、min／max、selectable、close policy、
   input／結果同步、placement／nudge／avoidRects。
5. Variant 僅兩種：inline-large（DRC Desktop）、popover-compact（BDC、Age、未來 Date Calculator）。
6. 視覺 baseline：以 BDC Desktop Calendar 語彙為準；差異只走 variant tokens。
7. yearList.mode full｜nearby 是資料策略，不是 variant。
   DRC Desktop：nearby ±10；BDC／Age：full（各自 min／max）。
8. DRC Clear 留在工具外層，不進 Shared Calendar。
9. Age Birth／As-of 互斥：Shared DesktopCalendarRegistry＋adapter onBeforeOpen。
10. Dynamic positioning：shared 使用 CSS variables（--sdc-pos-*）；
    工具只提供 anchor／placement／nudge／avoidRects／resolvePopoverPosition。
11. Tool CSS 不得覆寫 .sdc-* 或 [data-desktop-calendar] internals；
    僅允許核准的 root stacking／composition。
12. DRC Mobile／Intermediate／Landscape legacy data-drv2-* calendar
    為核准 transitional exception；不代表可新增第二套 Desktop Calendar。
    未來 Mobile Calendar 共用化須另立任務。
13. Canonical validator：scripts/validate-desktop-calendar.mjs
    （與 compile-check-desktop-calendar.mjs 分離）。
14. Local commits（尚未 push／deploy）：
    3c37d7a feat: add shared DesktopCalendar foundation
    6f7ab99 feat: migrate Business Days Calculator to DesktopCalendar
    9ce6c35 feat: migrate Date Range Calculator desktop calendar to DesktopCalendar
    f25d107 feat: migrate Age Calculator desktop calendars to DesktopCalendar
15. Date Calculator 尚未開始；未來只能接 popover-compact；
    需要新 variant → L 層 Plan＋Owner 核准（預設拒絕）。
```

### 影響

```text
後續工具 Desktop Calendar 必須走 Shared DesktopCalendar＋Reuse Gate。
不得複製 BDC／DRC／Age calendar DOM／controller／CSS。
Production 在 push／deploy 前仍以 origin/main（ResultSummary baseline）為準。
```

---

## 2026-07-22 — ResultSummary Phase A–I production deploy

### 背景

```text
ResultSummary Phase A–I（shared foundation、DRC／BDC migration、Reuse Gate、canonical validator）
已完成並通過 Owner Gates；本輪 push 至 main，由 Cloudflare Pages 自動部署。
Owner 完成正式網域 production visual QA。
```

### 決策／現況

```text
1. ResultSummary Phase A–I 已完成、push、deploy。
2. Production HEAD：c1aea32。
3. DRC 使用 variant=standard；BDC 使用 variant=spacious。
4. DRC／BDC 共用 shared DOM／controller／CSS、三 layout、digit behavior、accessibility。
5. Reuse Gate（docs/workflow/shared-component-reuse-gate.md）與
   canonical validator（scripts/validate-result-summary.mjs）已正式啟用。
6. 正式網域 EN／ZH × Desktop／Mobile Portrait／Mobile Landscape Owner QA：PASS。
7. 首次載入、首次計算、位數字級、欄距、Sheet／Panel：PASS。
8. Blocking issue：無。
9. Production deployed baseline 與 local main／origin/main 已同步。
10. 下一個獨立任務：Age Calculator Desktop calendar 月份／年份下拉樣式修正。
11. Date Calculator 尚未開始。
```

### 影響

```text
ResultSummary 已成為 production shared baseline。
後續工具結果摘要必須走 ResultSummary＋Reuse Gate；不得複製 DRC／BDC 結果 DOM／CSS。
```

---

## 2026-07-19 — Business Days Calculator 正式上線與 Calendar interaction 決策

### 背景

```text
Business Days Calculator／工作日計算完成 standalone、站內連結整合與 Production QA。
需鎖定上線事實、Home／All Tools／Related 整合規則，以及 Desktop Calendar 最終互動，
供後續工具與 Age Calculator 相關修正參考。
```

### 決策

```text
1. BDC 成為 Timiva 第七個工具、V1.5 Search Foundation 第三個工具；已正式上線。
2. 工具只排除週六、週日；起訖皆計入；不維護國定假日資料庫。
3. Home Featured 不加入 BDC；維持既有 4 張：
   Date Range Calculator → Age Calculator → Event Countdown → Year Progress。
4. All Tools dates-events 排序：
   Event Countdown → Date Range Calculator → Days Between Dates → Business Days Calculator → Age Calculator。
5. Inbound Related：
   Days Between Dates：Date Range Calculator → Business Days Calculator → Age Calculator
   Date Range Calculator：Days Between Dates → Business Days Calculator → Event Countdown
6. BDC outbound Related：
   Days Between Dates → Date Range Calculator → Event Countdown
7. Desktop Calendar 最終互動：
   - Calendar 關閉時，日期欄只做 Smart Date 快速輸入（不自動開日曆）
   - Calendar icon 開啟完整 range 模式
   - Calendar 已開啟時，點開始／結束欄切換單端修改（edit-start / edit-end）
   - range 完成後自動關閉
   - edit 模式選日後保持開啟，由使用者自行關閉
8. 不採用原生月份／年份超長 <select>；BDC 使用月份 3×4 grid＋固定高度可捲年份面板（1900–2100）＋4 位輸入。
9. Age Calculator 仍有相同原生 select 問題，留待獨立 regression fix；不視為本次 BDC 上線阻塞。
10. Production QA PASS；Deployed HEAD：8977fe5。
11. 下一支開發工具：Date Calculator／日期加減計算；接續 Hours Calculator。
```

### 影響

```text
BDC 視為已上線 stable tool；未授權不得改寫已驗收核心邏輯。
後續日期工具可沿用 BDC Calendar 月份／年份面板模式，避免原生超長 select。
```

---

## 2026-07-13 — Chinese Calculator tool names standardized

### 背景

```text
Owner 發現中文工具名稱不一致，同時出現「計算機」「計算器」「計算」。
需要建立可長期套用的中文 Calculator 命名規則。
```

### 決策

```text
英文 Calculator 名稱不變。
中文 Calculator 類工具統一使用「○○計算」。
不加「器」，也不使用「計算機」。
非 Calculator 類工具不受影響（例如倒數計時器保留「器」）。
route / slug / tool ID / 英文名 / 排序 / 核心邏輯不變。
Event Countdown 的「事件倒數／事件倒數計時器」現況本輪不統一。
```

### 正式對照

```text
Date Range Calculator → 日期區間計算
Age Calculator → 年齡計算
Days Between Dates → 日期差計算
Business Days Calculator → 工作日計算
Date Calculator / Add or Subtract Days → 日期加減計算
Hours Calculator → 時數計算
```

### 長期規則位置

```text
docs/core/product-principles.md §4.1 中文 Calculator 工具命名
```

---

## 2026-07-13 — Business Days Calculator moved ahead of Date Calculator

### 背景

```text
Date Calculator / Add or Subtract Days 的產品功能規則已大致討論完成，
但預期實作、邊界測試與視覺調整所需時間較多。

Business Days Calculator 的功能較單純，
且 Desktop / Mobile 日期輸入、日期區間選擇、Bottom Sheet、
Smart Date Input 與 RWD 結構可高度沿用 Days Between Dates 已驗證基礎。
```

### 決策

```text
這是開發與實作優先順序調整，不是分類變更、產品方向變更、
Date Calculator 取消／重做，也不是 V1.5 Search Foundation 策略變更。

Business Days Calculator 成為 Timiva 第七個工具與下一支開發工具。
Date Calculator / Add or Subtract Days 改為第八個工具。
Hours Calculator 維持第九個工具。

因此 Owner 決定先完成 Business Days Calculator，
再接續 Date Calculator / Add or Subtract Days。
```

### 原因

```text
Business Days 可較快沿用 Days Between Dates 已驗證的日期輸入與區間 UI 基礎。
Date Calculator 規則雖已大致討論完成，但實作與測試成本較高，延後可降低並行風險。
```

### 更新後順序

```text
5. Age Calculator — 已完成 · 已上線
6. Days Between Dates — 已完成 · 已上線
7. Business Days Calculator — 下一支開發工具
8. Date Calculator / Add or Subtract Days — 接續開發
9. Hours Calculator
```

### 不變邊界

```text
V1.5 仍為 Search Foundation／搜尋鋪路期
四大產品分類不變
Date Calculator 規則討論成果保留，但暫不進入實作
Business Days Calculator MVP 維持：
  只排除星期六與星期日
  不做國定假日完整資料庫
  不做國家／地區假日選擇
  不做自訂工作週或自訂假日
不因本決策修改 production 工具、routes、catalog 或程式碼
```

---

## 2026-07-11 — Days Between Dates production complete

### 背景

```text
Days Between Dates standalone + Post-tool Link Integration 已完成並 push。
B7 Production Verification 於 timiva.app 通過。
```

### 決策／現況

```text
Days Between Dates 已正式上線於 https://timiva.app。
視為 V1.5 Search Foundation 第二個工具 · Timiva 第六個工具。
standalone + link integration complete。
B7 Production Verification：PASS · No blocking issues found。
Standalone commit：69ba30b feat: add Days Between Dates standalone tool
Link Integration commit / Deployed HEAD：18a262c feat: integrate Days Between Dates links
```

### 站內整合結果

```text
Home：不加入 Days Between Dates；維持固定 4 張 Featured
  Date Range → Age Calculator → Event Countdown → Year Progress
All Tools：加入 Days Between Dates
  dates-events：Event Countdown → Date Range → Days Between Dates → Age Calculator
Inbound Related Tools：
  Date Range Calculator includes Days Between Dates
  Age Calculator includes Days Between Dates
  Event Countdown / Year Progress / Countdown Timer：未加入 DBD inbound
```

### 邊界

```text
不得在未授權任務中改寫已驗收 Days Between Dates 核心邏輯。
文件以 docs/tools/days-between-dates/ 與 docs/project/current-status.md 為準。
```

---

## 2026-07-11 — Days Between Dates Post-tool Link Integration

### 背景

```text
Days Between Dates standalone 已完成並 commit：
69ba30b939980b40a438f1d2016a641e2502d958（feat: add Days Between Dates standalone tool）
Owner 批准進入 Post-tool Link Integration。
```

### 決策

```text
Home：不加入 Days Between Dates（維持固定 4 張 Featured）
All Tools：加入 Days Between Dates
dates-events 排序：
  event-countdown → date-range → days-between-dates → age-calculator
Inbound Related Tools：
  Date Range：[days-between-dates, event-countdown, age-calculator]
    （替換 countdown-timer）
  Age Calculator：[date-range, days-between-dates, event-countdown]
    （替換 year-progress）
  Event Countdown / Year Progress / Countdown Timer：本輪不加 DBD
DBD outbound：改用 catalog getRelatedTools
  [date-range, age-calculator, event-countdown]
Icon：calendar（不用 plus-square）
```

### 狀態邊界

```text
Link Integration 已完成並上線（見「Days Between Dates production complete」）。
Deployed HEAD：18a262c。
```

---

## 2026-07-10 — V1.5 redefined as Search Foundation

### 背景

```text
Age Calculator 已正式上線於 https://timiva.app。
Owner 希望 V1.5 先鋪高搜尋、高流量、低維護的日期與時間工具，
再補齊 Daily Rhythm 等品牌差異化工具線。
```

### 決策

```text
V1.5 改為 Search Foundation／搜尋鋪路期。
先做高搜尋意圖、低維護日期與時間工具。
四大分類完整補齊（含 Daily Rhythm）延後至 V2。
這是開發優先順序策略，不改變 Timiva 四大分類。
```

### 暫定順序

```text
5. Age Calculator — 已完成 · 已上線
6. Days Between Dates — 已完成 · 已上線
7. Date Calculator / Add or Subtract Days
8. Business Days Calculator
9. Hours Calculator
10. Lunar Date Converter — optional
11. Pet Age Calculator — optional
12. Japanese Era Converter — optional
```

> 註：此暫定順序已於 2026-07-13 調整，最新順序以後續決策「Business Days Calculator moved ahead of Date Calculator」為準。

### 邊界

```text
不做大型資料庫
不做健康建議
不做農民曆 / 宜忌 / 吉日 / 沖煞
不做國定假日完整資料庫
不改變 Timiva 四大分類
Business Days MVP：排除週末即可
Japanese Era：只做現代年號換算
```

### 發布節奏

```text
V1.5 搜尋型工具採：
單工具開發 → 單工具驗收 → 單工具站內整合 → 單工具 release check
→ Owner 確認後 deploy
工具頁完成 ≠ 可直接上線
仍需 Post-tool Link Integration Gate
```

---

## 2026-07-10 — Age Calculator 正式上線（V1.5 + B7 Production Verification）

### 背景

```text
Age Calculator 完成 standalone、Post-tool Link Integration、Home Featured reorder、
Home copy alignment，並經 B5 pre-push QA、B6 push、B7 production verification。
```

### 決策／現況

```text
Age Calculator 已正式上線於 https://timiva.app。
視為 V1.5：standalone + link integration 完成。
Deployed HEAD：f48df91 feat: integrate Age Calculator links。
Cloudflare Pages 自動部署成功。
main 與 origin/main 同步 · working tree clean。
B7 Deploy / Production Verification：Pass · No blocking issues found。
```

### Home Featured Tools（固定 4 張）

```text
1. Date Range Calculator
2. Age Calculator
3. Event Countdown
4. Year Progress
Countdown Timer 不在首頁 Featured；仍保留 All Tools / 路由 / Related / 核心功能。
```

### Production QA 摘要

```text
Home EN / ZH — Pass
All Tools EN / ZH — Pass（含 Age Calculator 與 Countdown Timer）
Age Calculator EN / ZH · Desktop / Mobile — Pass
Related Tools — Pass
Existing tools quick check — Pass
```

### 邊界

```text
不得在未授權任務中改寫已驗收 Age Calculator 核心邏輯。
文件以 docs/tools/age-calculator/ 與 docs/project/current-status.md 為準。
```

---

## 2026-07-10 — Age Calculator standalone 完成與 B3D Final QA Re-check

### 背景

```text
Age Calculator 完成 B1B / B2A / B2B / B2C 與 B3C invalid birth reset bugfix，
並通過 B3D Final QA Re-check。
```

### 決策／現況

```text
Age Calculator standalone 視為實作完成（尚未 Post-tool Link Integration）。
B3D Final QA Re-check：Pass · No blocking issues found。
HEAD：f5416b6（fix: reset Age Calculator invalid birth state）。
尚未 push / deploy。
下一步：Owner 授權後執行 Post-tool Link Integration。
```

### 最終規格摘要（影響後續判斷）

```text
Desktop birth：單一智慧 input + calendar popover（month / year select）
Mobile birth：Year / Month / Day 三欄 + auto-advance
As-of 預設 today
Desktop As-of：calendar popover；非 today 顯示 back icon；與 birth calendar 互斥
Mobile As-of：原生 date picker；不顯示 back icon
出生年份：1900 ～ today
empty / incomplete → 結果 0，無 invalid icon
complete invalid birth → 結果 0 + invalid icon（不保留上一個 valid 結果）
as-of earlier than birth → 結果 0 + as-of invalid
As-of 不可未來；範圍 1900-01-01 ～ today
leap day 2/29：閏年 2/29；非閏年週年 3/1
Day 0 規則；自然日曆年／月／日
```

### Commits

```text
cb09fc6 — feat: add Age Calculator B1B
72c3d58 — feat: add Age Calculator B2A
fb2d21f — feat: add Age Calculator B2B
cc31c79 — feat: add Age Calculator B2C
f5416b6 — fix: reset Age Calculator invalid birth state
```

### B3D 驗證摘要

```text
npm run build — Pass
validate-seo-head — Pass（460）
validate-sitemap — Pass（375）
validate-age-calculator-math — Pass（130）
git diff --check — Pass
Desktop EN / ZH · Mobile portrait / landscape EN / ZH — Pass
Content / SEO / Related Tools — Pass
```

### 邊界

```text
不得在未授權任務中改寫已驗收 Age Calculator 核心邏輯。
不得自行開始 Post-tool Link Integration / push / deploy。
文件以 docs/tools/age-calculator/ 與 docs/project/current-status.md 為準。
```

---

## 2026-06-30 — Official-domain V1 smoke test passed

### 背景

```text
timiva.app 已連接 Cloudflare Pages，DNS / HTTPS / www redirect / email forwarding 完成後，
Owner 在正式網域進行 V1 production smoke test。
```

### 決策

```text
Timiva V1 視為已在正式網域 timiva.app 提供服務。
V1 production smoke test：PASS（非 exhaustive QA；不代表所有瀏覽器、裝置與 edge cases 均已完整覆蓋）。
```

### 驗證範圍（Owner 實測摘要）

```text
網域與 HTTPS
EN / ZH
首頁與 Legal 頁
四個 V1 工具主要流程
全站導覽與語系切換
Desktop · mobile portrait · mobile landscape
Chrome mobile · Safari Private Browsing
Consent / GA4 on timiva.app
Legal mobile-landscape meta hotfix（40761d3）已部署並通過
```

### Safari 快取 QA note

```text
Safari 一般瀏覽模式曾出現異常舊版畫面；
Chrome mobile 與 Safari Private Browsing 均正常。
清除 timiva.app 的 Safari 網站資料後恢復正常。
確認為舊 cache / website data，未新增 Safari-specific workaround 或 production code。
```

---

## 2026-06-30 — www redirects to apex domain

### 決策

```text
Canonical host 採 timiva.app（apex）。
www.timiva.app 使用 Cloudflare 301 redirect 至 timiva.app。
Redirect 保留 path 與 query string。
```

### 實作摘要

```text
移除 Porkbun pixie 舊 www 與 wildcard *.timiva.app DNS records。
```

### 驗證範例

```text
https://www.timiva.app/ → https://timiva.app/
https://www.timiva.app/zh/ → https://timiva.app/zh/
```

---

## 2026-06-29 — timiva.app connected to Cloudflare Pages

### 決策

```text
timiva.app 採 Cloudflare 作為 authoritative DNS。
Porkbun 保留為 domain registrar 與 email forwarding provider。
Cloudflare Pages 使用 timiva.app 作為正式主網域。
HTTPS / SSL 啟用完成。
```

### 驗證

```text
Cloudflare zone：Active
Pages custom domain：Active
HTTPS / SSL：PASS
正式主網域：https://timiva.app
MX / SPF records 保留（Porkbun email forwarding）
hello@timiva.app 寄信測試成功；郵件轉寄正常
```

---

## 2026-06-28 — GA4 採 privacy-first Basic Consent

### 背景

```text
Timiva 需要了解網站與工具使用情況以改善產品，但必須在使用者明確同意前避免載入 Google tag 或傳送 Analytics 資料。
廣告（AdSense）仍屬未來範圍，不可與 Analytics consent 混為一談。
```

### 決策

```text
使用 Google Analytics 4 direct Google tag（gtag.js）
不使用 Google Tag Manager
未取得明確同意前不載入 Google tag
unknown / rejected 不傳送 Analytics
accepted 才允許 analytics_storage = granted
ad_storage、ad_user_data、ad_personalization 永遠 denied
Consent 儲存於 LocalStorage（timiva.analytics.consent，v:1）
使用者可從 Footer Analytics settings / 分析設定變更選擇
consentSaved 與 tagLoaded 必須分離（Save 成功不等於 tag 已載入）
localhost 可保存 consent，但不得載入 tag（零 googletagmanager request）
Google Signals 與 user-provided data collection 關閉
不使用 Google Ads 或廣告個人化（透過此 analytics 設定）
Measurement ID 只能由 PUBLIC_GA_MEASUREMENT_ID 提供
無 env 時 Consent UI、Footer 分析設定、script 引用必須完全停用
Privacy / Terms（EN / ZH）必須與實作同步
scripts/validate-analytics-consent.mjs 為正式防回歸 validator
```

### 邊界

```text
廣告仍屬未來可能範圍；Legal 已分開描述，未啟用 AdSense 或廣告追蹤。
不在 repo 內硬編碼 Measurement ID。
不在 localhost / 無 env build 輸出 Consent 或載入 tag。
```

### 驗證

```text
Batch A–D 完成
Owner 實機 QA（本地）：通過
validate-analytics-consent.mjs：disabled 179/0 · placeholder enabled 172/0
runtime harness：50/0
validate-tool-link-integration.mjs：176/0
```

### 線上驗證（timiva.pages.dev · post-deploy）

```text
Cloudflare Production 已設定 PUBLIC_GA_MEASUREMENT_ID（僅 env，未寫入 Git）
設定 env 後重新部署完成
Online Consent / Network QA：PASS
GA4 Realtime：PASS（1 active user · 4 page views；/en/ · /en/countdown-timer/ · /en/event-countdown/ · /en/privacy/）

Consent 實測摘要：
- unknown：Banner 顯示 · 0 GA requests
- Necessary only：consent 保存 · 0 googletagmanager / collect requests
- Allow analytics：gtag.js 200 · collect 204 · accepted 狀態保留
- Allow → Necessary only：切換後無新 GA requests · rejected 狀態保留
```

### 正式網域驗證（timiva.app · post-domain cutover）

```text
Official-domain Consent / Network QA：PASS

unknown：Consent Banner 顯示 · 0 GA requests
Necessary only：consent 正常保存 · 0 googletagmanager / collect requests
Allow analytics：gtag.js 正常載入 · collect 正常送出 · consent 刷新後保留
Allow analytics → Necessary only：停止後續 GA requests · rejected 狀態保留

GA4 Realtime：成功收到 timiva.app 頁面瀏覽資料（smoke-test 驗證；非正式流量統計）
```

---

## 2026-06-28 — Countdown Timer 完成提示音改用本地音檔

### 背景

```text
原本使用 Web Audio API 三音 chime。
桌機低系統音量下過小聲。
iPhone 靜音模式會使 Web Audio 無聲。
Owner 平常長期使用靜音模式與低媒體音量。
```

### 決策

```text
使用原創本地 WAV（public/audio/countdown-complete.wav）
搭配 HTMLAudioElement 作為主要完成提示音。
既有 Web Audio chime 保留為 fallback。
```

### 原因

```text
提高低音量下的可辨識度
改善 iPhone 靜音模式的真實使用情境
不新增外部套件
不依賴遠端音訊資源
維持既有 UI、狀態機與 Sound preference（timiva-countdown-timer-sound-enabled）
```

### 邊界

```text
只保證頁面位於前景時的提示音。
不承諾背景、鎖屏或原生鬧鐘能力。
```

### 驗證

```text
Owner 已完成桌機與 iPhone 實機驗收。
iPhone 靜音模式開啟與關閉皆可播放。
低媒體音量下可辨識。
npm run build 通過。
已 push 至 origin/main（5ee7613）。
Cloudflare Pages 線上驗收通過。
```

規格：`docs/tools/countdown-timer/product-spec.md` §7.4、不可回歸條件

---

## 2026-06-27 — Global Interactive Cursor Baseline

Decision:

```text
Promote cursor behavior to a global semantic base rule in src/styles/global.css.
Remove cursor ownership from Utility Capsule baseline.
```

Context:

```text
Initial Owner finding appeared limited to Year Progress and Event Countdown.
A temporary cursor:pointer was added to .tool-utility-control.
Broader review showed Tailwind v4 button cursor behavior affected the whole site.
```

Result:

```text
Global baseline: cursor for enabled semantic interactive elements
Utility Capsule baseline: transition, hover lift, shadow, active reset only
```

Validator：`node scripts/validate-global-interactive-cursor-baseline.mjs`

Follow-up (same day):

```text
Redundant local cursor:pointer and cursor-pointer removed from ordinary semantic controls.
Global base layer is the sole ordinary pointer source.
Later-loaded local pointer rules must not override disabled / aria-disabled default.
```

---

## 2026-06-27 — Global Interactive Cursor + Utility Capsule Owner approval

Decision:

```text
Global Interactive Cursor Baseline and Shared Utility Capsule Control Baseline
passed automated validation and Owner real-device verification (2026-06-27).

Global base layer is the sole ordinary semantic pointer source.
Utility Capsule baseline owns motion only.
Year Progress B3 final standalone approval passed.

Next gate: standalone commit.
```

Owner verification covered:

```text
Desktop fine pointer, mobile portrait, mobile landscape, EN, ZH
Enabled / disabled / text-input cursor states
EC and YP Utility Capsule hover
Date Range and Countdown Timer regression checks
```

---

## 2026-06-27 — Shared Utility Capsule Control interaction baseline

Decision:

```text
Centralize V2 Utility Capsule Control interaction in tool-utility-control-v2-baseline.css.
Semantic opt-in class: .tool-utility-control
```

Triggered during:

```text
Year Progress B3 Owner final review — Theme / Share hover inconsistency vs Event Countdown
```

Actions:

```text
Event Countdown interaction promoted from local reference to shared baseline
Year Progress local duplicate hover / transition removed
Shared semantic role chosen instead of styling all .preview-tool-control-btn controls
Date Range and Countdown Timer explicitly excluded
```

Included controls:

```text
Event Countdown: Edit, Theme, Share
Year Progress: Theme, Share
```

Excluded examples:

```text
Date Range date trigger (primary task entry)
Countdown Timer Sound (functionally secondary, not a Utility Capsule Control)
Countdown Timer primary row, Quick Start, sheet actions, drawer toggles
```

Canonical rule:

```text
docs/standards/interactive-controls.md
```

當時完成共用互動基準規劃與驗證；現行長期規則已整理至互動控制規範。

---

## 2026-06-10 — Project workflow becomes file-driven

Decision:

```text
Timiva 後續不再依賴每次複製長 prompt。
改成 AGENTS.md + current-status + task brief + validation report 的文件驅動工作流。
```

Reason:

```text
降低 ChatGPT / Cursor 之間貼來貼去的負擔。
讓 Cursor 每次讀固定規則與任務檔。
讓新討論串可以快速接續狀態。
```

Implementation:

```text
AGENTS.md
docs/project/current-status.md
docs/project/decision-log.md
local-docs/tasks/
local-docs/reports/
```

---

## 2026-06-10 — Current recommended next task

Decision:

```text
Event Countdown V2 中文版、Legal Pages、Footer 語系切換完成後，下一步優先做 Pre Deploy Final Check。
```

Reason:

```text
目前可視為收尾的範圍已包含：
1. Event Countdown V2 中文正式切換
2. Legal Pages 正式內容與 Markdown 架構
3. Footer 語系切換體驗補強
```

---

## 2026-06-10 — Legal pages architecture

Decision:

```text
Legal / Text Pages 正式採用獨立 Markdown 內容檔 + Astro route entry + LegalTextLayout。
```

Rules:

```text
正式長文放在 src/content/legal/{locale}/*.md。
Route 只負責載入 Markdown、套用 LegalTextLayout、設定 metadata。
不把正式長文直接寫死在 .astro。
不使用 MDX。
不新增新的 LegalLayout。
純文字頁不放廣告。
```

---

## 2026-06-10 — Legal naming

Decision:

```text
中文正式命名使用「使用條款」，不使用「使用規範」。
英文 Footer 使用 Terms；英文頁面正式標題使用 Terms of Use。
```

English naming:

```text
Footer: Terms
Page H1: Terms of Use
Meta title: Terms of Use | Timiva
Route: /en/terms/
File: terms.md
```

---

## 2026-06-10 — Footer language switch behavior

Decision:

```text
Footer language switch should preserve the corresponding route instead of sending users back to language home.
```

Examples:

```text
/zh/privacy/ → /en/privacy/
/en/terms/ → /zh/terms/
/zh/contact/ → /en/contact/
/zh/event-countdown/ → /en/event-countdown/
```

---

## 2026-06-10 — Event Countdown V2 Chinese production route

Decision:

```text
/zh/event-countdown/ uses EventCountdownV2 in production mode.
```

Protected scope:

```text
Do not modify /en/event-countdown/ unless explicitly asked.
Do not modify /preview/event-countdown-v2 unless explicitly asked.
Do not go back to V1 unless a critical rollback is requested.
```


---

## 2026-06-13 — Date Range Calculator V2 production migration completed

Decision:

```text
Date Range Calculator 正式遷移到新版工具頁 V2 layout。
EN / ZH 路由皆切換至 DateRangeCalculatorV2。
```

Confirmed scope:

```text
/en/date-range-calculator/
/zh/date-range-calculator/
Desktop
Desktop → mobile intermediate breakpoints
Mobile portrait
Mobile landscape
Opened date panel
Overlay / scroll lock
FAQ JSON-LD
Tool Drawer
ToolAdSlot
```

Rules:

```text
Date Range V2 is now treated as the production baseline.
Do not return to the old DateRangeCalculator layout unless a rollback is explicitly requested.
Old DateRangeCalculator component can remain as rollback reference.
Do not rewrite Date Range calculation logic unless a future task explicitly targets calculation behavior.
```

---

## 2026-06-13 — Tool page V2 result rhythm baseline

Decision:

```text
新版工具頁需要共用結果區視覺節奏，而不是每個工具單獨微調。
```

Confirmed baseline:

```text
Desktop tool title → main result gap: 8px.
Tool stage → lower content spacing: at least 48px.
Main result number colors should stay consistent across tools.
Result label / meta colors should stay consistent across tools.
Result number size may vary per tool type and breakpoint.
```

Rules:

```text
Tool title style should remain consistent across tools.
Tool title → result spacing should be treated as shared rhythm.
Only position / size may be adjusted per tool when content type requires it.
Do not reduce shared spacing in order to force everything into the first screen.
```

---

## 2026-06-13 — Date Range V2 responsive mode rules

Decision:

```text
Date Range V2 must use mutually exclusive RWD modes.
Desktop, mobile portrait, and mobile landscape compact rules must not appear at the same time.
```

Rules:

```text
Desktop / tablet-wide can use inline control and inline calendar.
Mobile portrait uses first-screen result + Start date — End date capsule + bottom sheet calendar.
Mobile landscape compact uses compact result layout and compact opened panel.
Intermediate widths must not be misclassified as mobile landscape compact.
824–899px uses portrait-level capsule size.
True compact button sizing is only allowed for real mobile landscape / low-height conditions.
```

Avoid:

```text
Duplicate Start date — End date controls.
Inline calendar appearing in the wrong RWD mode.
Mobile landscape rules being triggered by width alone.
Desktop and mobile controls visible at the same time.
```

---

## 2026-06-13 — Date Range V2 mobile landscape layout

Decision:

```text
Date Range V2 mobile landscape uses a dedicated compact layout rather than the mobile portrait result stack.
```

First-screen structure:

```text
Back Timiva button
Tool title + result row as one centered visual group
Start date — End date capsule pinned to the first-screen bottom area
```

Result row:

```text
Total Days / Workdays / Weekends are shown as three equal columns.
All three numbers use the same size in mobile landscape.
All three labels use the same size, color, and spacing.
The number size may align with Event Countdown V2 mobile landscape compact result number.
```

Opened panel:

```text
Start date and End date are shown as two side-by-side fields.
Fields follow Event Countdown V2 sheet input visual language.
Label stays inside the field and does not disappear.
Clear dates is a left-aligned plain text button on the second row.
Clear dates should not be a capsule button.
```

---

## 2026-06-13 — Shared tool overlay / backdrop baseline

Decision:

```text
All new tool-page mobile sheets / panels should share one overlay, backdrop, and scroll-lock baseline.
```

Rules:

```text
Opening a tool operation sheet / panel should show a semi-transparent dark backdrop.
Background page scroll should be locked while the sheet / panel is open.
Clicking the backdrop should close the active sheet / panel.
Closing the sheet / panel should remove backdrop and scroll lock.
Mobile portrait and mobile landscape use the same overlay visual language.
Panel height / position may differ between portrait and landscape.
```

Implementation note:

```text
Shared baseline file: tool-overlay-v2-baseline.css.
Shared scroll lock class: tool-operation-open.
Event Countdown V2 overlay may be teleported to document.body, so body-level selectors may be required.
Do not break Event Countdown V2 overlay behavior while sharing the baseline.
```

---

## 2026-06-13 — Tool ad placeholders stay disabled before live ads

Decision:

```text
ToolAdSlot placeholders exist for future monetization planning, but live tool pages should not show reserved ad boxes in production state yet.
```

Rules:

```text
Event Countdown V2 main and sidebar ToolAdSlot use is-disabled.
Date Range V2 main and sidebar ToolAdSlot use is-disabled.
is-disabled should not render visible dashed boxes or ad-size labels.
The tool stage → lower content spacing should remain stable even when ads are disabled.
Do not add live AdSense, adsbygoogle, publisher IDs, or ad slot IDs until a future ad integration task explicitly approves it.
```

---


## 2026-06-14 — Countdown Timer V1 product specification finalized

Decision:

```text
Countdown Timer is Timiva V1's third tool.
The product / interaction / layout specification is mostly finalized.
This is not a production implementation task yet.
```

Scope:

```text
Countdown Timer is a general countdown timer.
It is not Pomodoro, Stopwatch, Fullscreen Timer, floating timer, or PWA in V1.
```

Core interaction decisions:

```text
Quick Start buttons are one-tap starts, not additive settings.
Last duration appears as the first Quick Start option after a duration has actually been started.
Mobile tapping the central time opens Custom time bottom sheet.
Desktop tapping the central time enters inline edit.
Sound defaults to off and can be toggled during countdown.
Active countdown uses target end time for accurate recalculation after returning from background.
Refreshing does not restore an active countdown; only Last duration and sound preference may persist.
```

Layout decisions:

```text
Mobile portrait keeps all main operations in the first screen.
Mobile landscape hides Quick Start and uses a three-column compact layout: Cancel left, ring/time center, primary control right.
Desktop keeps the same main visual structure, shows Quick Start in one row, and uses standard Timiva capsule controls near the timer instead of bottom-fixed controls.
```

Custom sheet decision:

```text
Custom time bottom sheet uses Hours / Minutes / Seconds inputs with fixed labels and no default focus.
The sheet primary action is Apply and start / 套用並開始.
The sheet Cancel uses a plain text-button style, referencing the Clear button inside the Date Range Calculator sheet.
This sheet Cancel style does not apply to the main timer Cancel control.
```

---

## 2026-06-14 — Mobile Sheet Shared Style should precede Countdown Timer implementation

Decision:

```text
Before implementing Countdown Timer, Timiva should define and preview a shared Mobile Sheet style baseline.
```

Reason:

```text
Countdown Timer will introduce a Custom time bottom sheet.
A shared baseline should be defined first so the new tool does not create another one-off sheet style.
```

Task order:

```text
1. Mobile Sheet Shared Style spec + preview baseline
2. Countdown Timer implementation task
3. Later, optionally align existing sheets if Owner starts a cleanup task
```

Shared style decisions:

```text
Mobile sheet titles are not default.
Use a short title only when the sheet has multiple option groups or the function would otherwise be unclear.
Portrait and landscape fields should use compact inline field language: label on / inside the left side and always visible.
No floating labels and no disappearing labels.
Portrait usually uses one field per row.
Landscape can use 2-column or 3-column rows.
Countdown Timer H / M / S may use three columns even in portrait because time input is a natural group.
```

Button decisions:

```text
Sheet primary actions use the current Timiva capsule button style.
Sheet secondary actions use plain text-button style.
Cancel / Clear-style sheet actions reference the Clear button inside the Date Range Calculator sheet.
```

Protected scope:

```text
Do not modify Event Countdown V2 production behavior in the Mobile Sheet Shared Style task.
Do not modify Date Range Calculator V2 production behavior in the Mobile Sheet Shared Style task.
Do not modify Header, Footer, BaseLayout, or global background.
Do not commit or deploy without Owner approval.
```

---

## 2026-06-14 — Mobile Sheet Shared Style baseline completed

Decision:

```text
Mobile Sheet Shared Style preview baseline is completed and Owner real-device verified.
It is now ready to inform the Countdown Timer Custom time sheet task.
```

Final preview route:

```text
/preview/mobile-sheet-shared-style/
```

Final implementation decisions:

```text
The preview uses the validated /preview/tool shared tool page shell.
The preview adds only an Open sheet test button inside the shared tool page environment.
The task tests only the Mobile Sheet body, overlay, fields, action row, portrait bottom sheet, and landscape compact panel.
It does not create a custom preview-only outer shell.
```

Final landscape decision:

```text
In mobile landscape, only the action row is fixed.
Cancel / Apply and start remain visible.
All inputs live inside one scrollable sheet body:
H / M / S
Name
Start / End
H / M / S do not need to remain fixed in landscape.
Avoid tiny nested scroll areas on iPhone Safari / Chrome.
The first visible input row must not be clipped.
```

Files / architecture:

```text
src/styles/preview/tool-preview-first-screen.css
src/pages/preview/tool.astro
src/pages/preview/mobile-sheet-shared-style/index.astro
src/components/preview/MobileSheetSharedStylePreview.astro
src/styles/tools/tool-mobile-sheet-v2-baseline.css
public/scripts/mobile-sheet-shared-style-preview.js
```

Validation:

```text
Owner real-device testing passed.
Mobile portrait passed.
Mobile landscape passed.
npm run build passed.
Validation report accepted after correcting report date to 2026-06-14.
No production Event Countdown V2 / Date Range Calculator V2 behavior was modified.
No Header / Footer / BaseLayout / global background changes.
```

Minor notes:

```text
Preview msb-scroll-lock is not yet the same as production tool-operation-open.
Portal overlay rules may later be consolidated with tool-overlay-v2-baseline.css.
Landscape height token should be rechecked when integrated into a production tool.
iOS keyboard / interactive-widget behavior still needs tool-level QA during Countdown Timer implementation.
```

---

## 2026-06-14 — Shared component previews must use validated tool page shell

Decision:

```text
Shared tool components should be preview-tested inside the already validated shared tool page shell.
Do not create a separate preview-specific viewport / safe-area / landscape outer shell to test shared components.
```

Reason:

```text
The Mobile Sheet task initially spent unnecessary time re-testing preview outer shell behavior such as viewport-fit, safe-area, Header stacking, and mobile landscape first-screen alignment.
Those behaviors had already been validated in the shared tool page layout.
Future component previews should reuse the common tool page environment so the task tests only the component under review.
```

Rule:

```text
共用工具元件要放在共用工具頁版型中測試。
外層用已驗收的，不重新測；本輪只驗元件本體。
```

---

## 2026-06-14 — New tool implementation order becomes layout-first

Decision:

```text
Timiva 後續新增工具時，正式採用「版型 → 下方內容 → 上方靜態工具畫面 → 互動與動態」的實作順序。
```

Standard order:

```text
1. 建立正確工具頁版型
   先建立 route、V2 tool page shell、Header / Footer、first-screen container、lower content area、drawer / ToolAdSlot disabled 結構。

2. 補下方靜態內容
   先完成 About、How to use、FAQ、FAQ JSON-LD、Related Tools、EN / ZH 文案。

3. 做上方工具靜態畫面
   先不寫互動，確認 mobile portrait、mobile landscape、desktop 的整體視覺、比例、節奏。

4. 最後才加互動與動態
   再做 JS state machine、使用者操作、LocalStorage、bottom sheet、動畫、音效等。
```

Reason:

```text
先建立正確版型與內容，可以避免工具尚未成形時就把時間花在複雜 JS、互動狀態或動態效果上。
這個順序能讓 Owner 先確認頁面是否像 Timiva 工具，再進入高風險互動開發。
也能降低 layout drift、減少回頭重修版型與測試環境的成本。
```

Rules:

```text
B0 scaffold 必須使用既有 V2 工具頁共用版型，不是只有 Header / Footer + 空白內容。
下方 About / How to use / FAQ / Related Tools 可以在上方工具靜態畫面之前先完成。
上方工具靜態畫面完成並經 Owner 視覺確認後，才開始工具互動程式。
不要在同一批次混做版型、內容、靜態 UI、state machine 與動態效果，除非 Owner 明確批准。
```

Application:

```text
Countdown Timer 開始採用此順序：
B0：V2 工具頁版型 scaffold
B1A：下方內容層（About / How to use / FAQ / Related Tools）
B1B：上方工具靜態畫面
B2+：互動程式、state machine、sheet、音效與動態效果
```

---

## Standing decision — Product direction

Decision:

```text
Timiva is a mobile-first, Widget-like time and daily rhythm tool site.
```

Core principle:

```text
少工具，但每個都超舒服。
```

Avoid:

```text
Traditional tool site
Dense SEO portal
Large productivity app
Feature-heavy dashboard
Backend/database-heavy service
```

---

## Standing decision — Owner approval

Decision:

```text
Timiva is currently in Phase A: Owner-led confirmation.
```

Rules:

```text
Agents passing does not mean automatic launch.
Cursor finishing does not mean commit is allowed.
Build passing does not mean deploy is allowed.
Owner must explicitly approve next step, commit, or deploy.
```

---

## 2026-06-21 — Countdown Timer final accepted product decisions

Status: Accepted · Owner real-device confirmed · Final QA passed · Committed `77c6aa8` · Not pushed · Not deployed

Decision:

```text
Countdown Timer V2 is complete on Desktop, Mobile portrait, Mobile landscape, EN, and ZH.
The accepted implementation is now frozen except for explicit regression tasks.
```

Final rules:

```text
Desktop tick ring is decorative and non-interactive.
Mobile portrait uses a 60-tick interactive ring with 1-minute snap.
Initial untouched ring state is 0; after interaction, 12 o'clock represents 60 minutes.
Selection modifies existing tick elements; no dot or overlay radial line.
Mobile portrait and landscape share one Custom time sheet implementation.
Mobile landscape hides ring, Sound UI, Quick Start, and Last UI.
Refresh does not restore active countdown.
Only Last duration and Sound preference persist.
```

Commit:

```text
77c6aa8 — feat: add Countdown Timer V2
23 files changed
Build passed
Working tree clean after commit
```

Release state:

```text
Tool implementation committed.
Post-tool Link Integration later completed by Owner confirmation.
The integration commit hash was not provided in this discussion.
Push / deploy status after integration was not provided.
```

---

## 2026-06-21 — Shared drawer baseline consolidation

Status: Accepted · Regression spot-check PASS

Decision:

```text
Related Tools drawer hover suppression is centralized in tool-drawer-v2-baseline.css.
Event Countdown V2, Date Range Calculator V2, and Countdown Timer V2 share the same no-translate drawer card behavior.
```

---

## 2026-06-21 — Post-tool Link Integration Gate adopted

Status: Accepted workflow decision

Decision:

```text
A tool is not considered fully integrated when its standalone implementation is complete.
After Owner real-device verification and the tool implementation commit, every new tool must pass a separate Post-tool Link Integration Gate.
```

Standard flow:

```text
Tool implementation complete
→ Owner real-device confirmation
→ Tool implementation commit
→ Post-tool Link Integration
→ Link Integration QA
→ Link Integration commit
→ Push / Deploy Readiness
```

Required integration scope:

```text
Canonical tool catalog / data source
All Tools inclusion for every published tool
Inbound Related Tools links from relevant existing tools
Home integration only when a card already exists or Owner selects the tool as featured
EN / ZH locale-preserving routes
Alternate paths, canonical, hreflang, sitemap, and ItemList checks where applicable
Build, broken-link, and regression QA
```

Rules:

```text
Do not redesign ToolCard or Related Tools during link integration.
Do not modify the completed tool's core functionality.
Do not hard-code duplicate tool data across Home, All Tools, and Related Tools.
Link Integration should use a separate QA checkpoint and normally a separate commit.
```

Documents:

```text
docs/workflow/tool-link-integration.md
local-docs/tasks/_tool-link-integration-task-template.md
```

First application:

```text
Countdown Timer is the first formal application of this Gate.
Its tool implementation is committed as 77c6aa8.
Completed by Owner confirmation:
- connected the existing Home card
- added Countdown Timer to All Tools
- added Countdown Timer inbound cards to Event Countdown and Date Range Calculator
```

Release state:

```text
Countdown Timer implementation committed.
Link Integration completed by Owner confirmation.
Link Integration commit hash not provided in this discussion.
Push / deploy status after integration not provided.
```

---

## 2026-06-21 — Countdown Timer Post-tool Link Integration completed

Status: Owner confirmed complete

Decision:

```text
Countdown Timer is fully implemented and integrated into site discovery.
The previous “Link Integration pending” status is closed.
```

Completed scope:

```text
Home formal EN / ZH links
All Tools availability
Event Countdown inbound Related Tools link
Date Range Calculator inbound Related Tools link
Locale-aware route behavior
```

Record boundary:

```text
Countdown Timer tool implementation commit remains 77c6aa8.
The Link Integration commit hash was not provided in this discussion.
Do not invent or infer the missing commit identifier.
```

---

## 2026-06-21 — V1 fourth tool changed to Year Progress

Status: Product decision confirmed

Decision:

```text
Timiva V1’s fourth tool is Year Progress / 今年進度.
It replaces the earlier V1 plan for a multi-mode Life Progress Bar.
```

Routes:

```text
/en/year-progress/
/zh/year-progress/
```

Category:

```text
Life Progress / 人生進度
```

Reason:

```text
Year Progress is clearer, zero-input, lower-maintenance, easier to understand in seconds, and better aligned with Timiva’s “few tools, each very comfortable” principle.
```

Future rule:

```text
Do not place Year / Month / Milestone / Life / Goal modes inside one Life Progress Bar tool.
Create focused standalone tools when those concepts are developed.
```

Potential future tools:

```text
Month Progress
Milestone Progress（working name）
Life Timeline
Goal Countdown
```

---

## 2026-06-21 — Year Progress MVP and visual hierarchy confirmed

Status: Product specification confirmed

MVP:

```text
Current-year integer percentage
Days passed / days remaining
One monthly note
12 monthly pill segments
Theme
Share
EN / ZH
About / How to / FAQ / JSON-LD / Related Tools
```

Main visual:

```text
Full-bleed and immersive
No literal card shell
Large percentage is primary
Monthly note is the emotional layer
12 segments provide quiet annual rhythm
```

Responsive:

```text
Mobile portrait and desktop show the full hierarchy.
Mobile landscape hides the monthly note and 12-segment progress.
Mobile landscape keeps the main result and controls compact.
```

Not included:

```text
Life mode
Custom timeline
Milestones
Birth date
Goal date
Habit tracking
Multi-mode switching
Image export
Backend / CMS / database
```

---

## 2026-06-21 — Year Progress calculation and content rules confirmed

Status: Product behavior confirmed; exact code formula must be proposed in Plan-first

Decision:

```text
Use the user device’s local date and local time.
Normal year uses 365 days.
Leap year uses 366 days.
The active year must not display 100% early on Dec 31.
At rollover, the page switches to the new year.
```

12-segment rule:

```text
Always 12 segments.
Past months fully filled.
Current month partially filled using actual month length.
Future months low contrast.
Leap-year February uses 29 days and does not create a 13th segment.
```

Days rule:

```text
Days passed means fully elapsed calendar days before today.
Days remaining includes the current day.
```

Monthly notes:

```text
Use one independent EN / ZH content data file.
One confirmed note per calendar month.
No CMS, backend, daily randomization, AI generation, or user-uploaded notes.
```

---

## 2026-06-21 — Year Progress theme and shared Tool Theme Layer confirmed

Status: Product and architecture boundary confirmed

Decision:

```text
Year Progress extends Event Countdown’s visual language.
Add Mist / 霧光 and Forest / 森光.
Mist is the default Year Progress feeling.
Forest is a low-saturation natural forest theme.
```

Forest boundaries:

```text
Deep green / gray green
Soft forest-like glow
No literal forest image
No leaf pattern
No bright or neon green
```

Shared architecture decision:

```text
Create a reusable Tool Theme Layer for tool-specific first-screen gradients, glows, progress active colors, and control accents.
```

Protected boundary:

```text
The Tool Theme Layer is not the global background.
Do not modify BaseLayout, global background, Header, or Footer.
Year Progress uses the shared layer first.
Do not refactor Event Countdown themes in the same task.
A later Event Countdown migration requires a separate Owner-approved task.
```

---

## 2026-06-21 — Year Progress is ready for Plan-first

Status: Ready

Decision:

```text
Year Progress product discussion is complete enough to begin a repository-aware Plan-first task.
```

Plan-first must determine:

```text
Actual reusable V2 tool shell and component patterns
Actual theme file / token architecture
Actual Event Countdown share reuse
Actual theme persistence alignment
Exact desktop dimensions
Implementation batches and QA gates
```

Plan-first remains no-edit:

```text
Cursor inspects the repository and outputs a plan.
Owner reviews the plan.
No implementation begins before Owner approval.
```

---

## 2026-06-27 — Year Progress Link Integration completed

Status: Committed (commit hash reported at finalize gate; not embedded in this log entry)

Decisions:

```text
- Year Progress replaces the Life Progress placeholder as the fourth V1 Home tool.
- Year Progress uses approved messages.tools.yearProgress copy on Home.
- Explicit fourth-tool Life Progress references on Home were updated to Year Progress.
- toolsCatalog.ts remains the source of truth for Related Tools.
- Countdown Timer now consumes getRelatedTools("countdown-timer").
- Each of the four available tools recommends the other three.
- Legacy ToolRelatedTools.astro remained unchanged because it is not used by production V2 routes.
- Footer tagline wording was shortened without CSS or layout changes.
```

Outcome:

```text
year-progress available:true
Home fourth card: Year Progress
All Tools: Year Progress under Momentum
Related Tools: full four-tool internal-link graph
Link integration validator added
Owner real-device QA passed
Footer tagline EN/ZH refinement passed
Push not performed
Deploy not performed
HTTPS Share verification pending after HTTPS preview/deploy
```

> **歷史備註（2026-06-27）：** 上述 entry 記錄 link integration 完成當下尚未 push。Year Progress 與四工具現已 production deployed。

---

## 2026-07-04 — V1 SEO Technical Closeout

### 背景

```text
2026-07-01 SEO technical audit 找到 3 個 B 級問題。
三批 implementation（Batch 1–3）已完成並通過 production 驗證。
Owner 核准進行 canonical documentation closeout。
```

### 決策 — Formal pages

```text
正式 EN / ZH 頁面使用 self canonical
提供 en、zh-Hant、x-default alternates
Formal page canonical / hreflang 為正式 baseline
18 個正式頁可索引；在 Sitemap
```

### 決策 — Preview routes

```text
Preview routes 保留 HTTP 200，供 internal preview 使用
robots = noindex, nofollow
不提供 canonical
不提供 hreflang
不進 Sitemap
未來是否刪除 Preview routes 另案決定
```

六個 Preview routes：

```text
/preview/home/
/preview/all-tools/
/preview/tool/
/preview/text/
/preview/mobile-sheet-shared-style/
/preview/event-countdown-v2/
```

### 決策 — Custom 404

```text
使用單一 static 404.html（src/pages/404.astro）
不新增 /en/404/ 或 /zh/404/
不使用 Worker / Function / _redirects
Unknown URL 保持原網址並回 HTTP 404
pathname 僅用於 locale content（非 redirect）
/en/ unknown → 英文內容與連結
/zh/ unknown → 中文內容與連結
Root unknown → preferredLocale → navigator.language → EN fallback
robots = noindex, follow
不輸出 canonical / hreflang / JSON-LD
404 不在 Sitemap
404 不顯示 Footer
Header 與 CTA 依 locale 連到正確正式頁
```

### 決策 — BaseLayout

```text
新增 showFooter?: boolean
default = true
為向後相容 additive prop
只有 404 使用 showFooter={false}
Header / Footer component 視覺未修改
```

### 延後決策（Deferred · Non-blocking）

```text
Open Graph / Twitter Card metadata
WebApplication / SoftwareApplication schema
Root HTTP 301（目前 noindex + JS redirect）
Preview legacy cleanup
```

原因：

```text
不屬於 A / B 級問題
不阻擋 V1 SEO technical closeout
避免在 closeout 批次擴張 scope
```

### Evidence

```text
Batch 1 — 9c10f39 — canonical / hreflang — Production verified
Batch 2 — f7629de — Preview noindex — Production verified
Batch 3 — b5b150f — localized custom 404 — Production verified
Production baseline：b5b150f
```

Canonical audit baseline：[`docs/project/seo-technical-audit.md`](seo-technical-audit.md)

---

## 2026-07-05 — Age Calculator product specification confirmed

### 背景

```text
Timiva 四個 V1 工具與 Year Progress 已上線。
Owner 完成 Age Calculator 產品規格討論，核准納入 canonical 文件系統。
Age Calculator 為 Timiva 第五個工具，下一步為 repository-aware Plan-first。
```

### 決策

```text
- Age Calculator 成為 Timiva 第五個工具
- Category：Important Dates／重要日子
- Routes：/en/age-calculator/、/zh/age-calculator/
- MVP 主結果：完整歲數、精準年／月／日、已走過總天數
- 初始狀態顯示 0 歲
- 出生日期：單一智慧日期欄位；支援 8 位連續輸入（如 19950812）；自動格式化 YYYY / MM / DD；支援常見完整日期貼上；保留日期選擇器
- 計算日期預設今天；Desktop 原位置修改；Mobile 使用既有 Mobile Sheet
- 2 月 29 日出生者在非閏年以 3 月 1 日作為生日週年
- 自然日曆算法：完整年數、完整月數、剩餘實際天數；出生當天為 Day 0
- MVP 不使用 LocalStorage
- MVP 不加入分享、距離下次生日、星座、生肖或生命統計
- Ready for Plan-first；Implementation not started
```

### Canonical spec

```text
docs/tools/age-calculator/product-spec.md
docs/tools/age-calculator/README.md
```

### 狀態

```text
Not committed · Not pushed · Not deployed
Implementation not started
```

---

## 2026-07-07 — Tool page sidebar and lower content consistency rules

### 背景

```text
Age Calculator B1A 完成後，Owner 實際瀏覽器檢查再次發現工具頁 sidebar / lower content regression：
右側 Related Tools hover lift、drawer 收合按鈕缺失、FAQ 使用 generic 標題、缺少 common uses / tags 區、
Related Tools 數量與選擇原則未在 canonical docs 中明確記錄。
類似問題曾在先前工具修正，需升格為全站工具頁標準。
```

### 決策

```text
All new Timiva tool pages must preserve the approved production tool-page sidebar and lower-content structure.
```

### 規則

```text
- Sidebar related cards do not use hover lift.
- Sidebar related cards must not reuse homepage ToolCard hover translate behavior.
- Desktop drawer collapse / expand control must remain visible and functional.
- Lower content FAQ heading uses {Tool Name} FAQ.
- Lower content includes a common uses / tags section unless explicitly excluded by product spec.
- Related Tools are capped at 3 per tool page unless Owner explicitly approves more.
- Related Tools should be chosen by closest user intent, not by newest tools or automatic all-to-all linking.
```

### 原因

```text
The same sidebar / lower-content regression occurred again during Age Calculator B1A after similar issues
had been corrected in prior tools. The rule must be elevated from per-tool feedback into canonical tool-page standards.
```

### 影響

```text
Future B1A tasks, tool-page QA, and Post-tool Link Integration must check these rules before moving forward.
Canonical references: docs/standards/layout-system.md §6.6, docs/workflow/tool-page-qa.md §11A,
docs/workflow/tool-link-integration.md §8.2.1.
```

---

## 2026-07-08 — 手機第一屏控制區與 bottom sheet 狀態基準

### 背景

```text
Age Calculator B1B 實作與 Owner 瀏覽器檢查中，再次出現手機第一屏控制區不一致問題：
底部主要按鈕被做成 viewport fixed、按鈕樣式偏離既有工具控制按鈕、
手機橫式誤用桌機 inline input、bottom sheet 開啟時背景縮放對象錯誤、
手機直式與橫式 sheet 版面未分開規劃。
需將一般工具的手機 first-screen baseline 升格為 canonical docs，避免新工具重複發生。
```

### 決策

```text
一般工具的手機第一屏控制區與 bottom sheet 開啟狀態，必須遵循統一的 mobile first-screen baseline。
```

### 規則

```text
- 一般工具的手機第一屏主要操作按鈕屬於 first-screen tool stage，不是 viewport fixed。
- 「底部」指第一屏工具區底部；使用者往下滑時，主要操作按鈕要跟著頁面一起滑動。
- 按鈕位置、按鈕樣式、按鈕與下方內容標題距離需維持一致，作為 mobile first-screen baseline 的一部分。
- 手機主要按鈕樣式沿用 Event Countdown 的 Edit / Theme / Share；Date Range 手機日期按鈕為同型（可含 icon）。
- 不得新增滿版大 CTA 或 fixed bottom action bar。
- 手機橫式仍採 mobile pattern；結果區與按鈕需整理進第一屏 compact layout，不得誤用 desktop inline input（除非 product spec 明確指定）。
- 手機直式 bottom sheet 內容可上下排列；手機橫式 bottom sheet 內容可一列兩欄，不可把直式 sheet 直接壓扁套到橫式。
- bottom sheet 開啟時，背景結果內容區整組縮放，但不包含底部主要操作按鈕。
- 特殊互動工具可例外，但必須在 product spec 或任務提詞中明確指定；Cursor 不得自行判斷。
```

### 原因

```text
手機第一屏控制區是 Timiva 工具頁的核心體驗節奏。
若各工具自行發明 fixed CTA、不同按鈕樣式或錯誤的 sheet 縮放邊界，會破壞 Widget-like 一致性，
並在 B1B / B2 階段造成難以回歸的 layout drift。
```

### 影響

```text
未來 B1B、B2 任務與 tool-page QA 必須在進入互動實作前檢查四種手機狀態：
mobile portrait closed / sheet-open、mobile landscape closed / sheet-open。
Canonical references: docs/standards/layout-system.md §6.7,
docs/workflow/tool-page-qa.md §7、§11B,
docs/workflow/new-tool-development.md §8.2.
```

---

## 2026-07-08 — 手機 bottom sheet 開啟狀態的位置與高度補強

### 背景

```text
Age Calculator B1B regression fix 與 Owner 瀏覽器檢查中，再次發現 sheet-open 狀態的兩類問題：
只做 scale 但結果區位置錯誤（過度貼近 header 或 sheet 上方大空白）；
手機橫式 sheet 直接沿用直式高度，撐出大面積空白 panel。
既有 §6.7 已規範縮放對象，但尚未明確寫入定位基準與 landscape compact panel 高度基準。
```

### 決策

```text
一般工具的手機 bottom sheet 開啟狀態，除縮放群組邊界外，必須同時遵守結果區定位基準與 landscape sheet 高度基準。
```

### 規則

```text
- bottom sheet 開啟時，背景結果內容區整組縮放後，須重新定位在 sheet 上方可視區域中，於 Header 與 sheet 頂部之間保持視覺平衡。
- 不可只做 scale，導致結果區過度貼近 header，或 sheet 上方出現不自然大空白。
- 手機橫式 bottom sheet / panel 高度應採內容驅動 compact layout，不得直接沿用直式 sheet 高度。
- 若內容只有一列兩欄，不得撐出大面積空白 panel。
- 新工具 sheet-open 驗收需對照 Event Countdown、Date Range 等已核准工具。
```

### 原因

```text
縮放與定位是兩個獨立驗收點；只做 scale 無法保證 sheet-open 狀態的視覺平衡。
橫式 viewport 高度有限，沿用直式 sheet 高度會破壞 compact panel 基準並浪費可視空間。
```

### 影響

```text
B1B / B2 前 QA 必須在 mobile portrait sheet-open 與 mobile landscape sheet-open 狀態檢查定位與高度。
Canonical references: docs/standards/layout-system.md §6.7 F.6、F.7、F.7A,
docs/workflow/tool-page-qa.md §7、§11B,
docs/workflow/new-tool-development.md §8.2.
```

---

## 2026-07-10 — Mobile bottom sheet keyboard-open composition baseline

### 背景

```text
Age Calculator B2A 與 Owner 真機檢查中，再次出現 mobile portrait keyboard-open 問題：
只移動 bottom sheet，result group 停在一般 sheet-open 位置，
導致 sheet 被夾在結果區與 keyboard 中間，並露出背景結果內容。
另曾出現以大面積 ::after 延伸底色遮空隙、以及 landscape 被 portrait keyboard lift 影響的偏差。
需將 keyboard-open composition 升格為全站共用規則，避免後續有 sheet input focus 的工具重複發生。
```

### 決策

```text
一般工具的 mobile bottom sheet，在 keyboard-open 時必須把 result group 與 bottom sheet
視為同一個 composition，一起為鍵盤讓位。
```

### 規則

```text
- mobile portrait keyboard-open 時，result group 與 bottom sheet 要作為同一個 composition 一起為鍵盤讓位。
- 不可只移動 sheet，導致 sheet 被夾在結果區與鍵盤中間。
- result group 應依同一組 keyboard inset / shift 重新定位；keyboard 關閉後立即回到一般 sheet-open 狀態。
- 不使用大面積延伸底色（例如大面積 ::after）遮空隙；sheet 本體維持正常 panel 高度。
- sheet 開啟與 input focus 時維持 scroll lock；不可因 Safari input focus / visualViewport 把背景捲到 You may also need 或下方內容。
- mobile landscape 不直接套用 portrait keyboard lift，應維持 compact panel。
- landscape 若需例外，必須在該工具 product spec 或任務提詞明確指定。
- 此規則用於後續有 mobile bottom sheet 與 input focus 的一般工具。
```

### 原因

```text
keyboard-open 是 sheet 互動的核心狀態之一。
若只抬 sheet、不重定位 result group，會破壞結果區與操作區的連續視覺組合，
並在 iPhone Safari 上露出背景內容，造成明顯 layout drift。
portrait 與 landscape 的 keyboard 行為必須分開規範，避免 compact panel 被直式 lift 破壞。
```

### 影響

```text
B1B / B2 與含 sheet input 的工具 QA，必須檢查 portrait keyboard-open composition、
keyboard 關閉恢復、scroll lock，以及 landscape 不被 portrait keyboard lift 影響。
Canonical references: docs/standards/layout-system.md §6.7 F.7B,
docs/workflow/tool-page-qa.md §7、§11B,
docs/workflow/new-tool-development.md §8.2、§20.
```

---

## 2026-07-22 — ResultSummary shared foundation＋Reuse Gate

### 決策

```text
ResultSummary 成為正式 shared 結果摘要元件。
Date Range Calculator（standard）與 Business Days Calculator（spacious）已遷移。
三 layout 的 typography／grid／gap／digits／accessibility 由 shared 擁有。
Tool CSS 只做外部 composition；不得選 .rs-* 或接管 ResultSummary 內部 grid／gap。
Shared Component Reuse Gate 正式啟用（canonical：docs/workflow/shared-component-reuse-gate.md）。
Canonical validator：scripts/validate-result-summary.mjs。
```

### 原因

```text
DRC／BDC 第二次出現相同結果摘要 pattern；複製改名會造成兩套 digit／typography 漂移。
必須以 shared DOM／controller／CSS + 工具 layout contract 形成可复用架構。
```

### 影響

```text
後續工具若需結果摘要，必須使用 ResultSummary。
第二次相同 UI pattern 的 Plan 必須先做 Reuse Review。
Phase A–I 完成（含 Owner Gate I PASS）；canonical validator 與 Reuse Gate 已就緒。
```

> **歷史備註：** 本 entry 寫於 Phase I docs checkpoint 當下，當時尚未 push／deploy。
> 後續已 push／deploy（Production HEAD：`c1aea32`）；見上方「2026-07-22 — ResultSummary Phase A–I production deploy」。
