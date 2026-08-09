# Timiva 專案現況

> 用途：每次開新討論串、給 Cursor 任務、或請 ChatGPT 判斷專案狀態時的主要事實來源。
> 更新日期：2026-08-09
> 狀態來源：整合既有 Timiva docs、正式網域 timiva.app、V1 tools + Year Progress + Age Calculator + Days Between Dates + Business Days Calculator + Date Calculator + **Hours Calculator** production。**Hours Calculator／時數計算（第九）：已正式上線。** Standalone `44289b7`；Link Integration `67a2bb1`；**Deployed／Production HEAD：`fd2ed68`**。Owner Production QA＝PASS。catalog `available:true` · `featured:false` · icon `calendar`；Home Featured 不含 Hours；All Tools dates-events＝EC→DRC→DBD→BDC→DC→Hours→Age；inbound Related＝BDC only（DBD→DRC→Hours）；Hours outbound＝DBD→BDC→DC。Cloudflare Pages 由 main push 自動部署（未 manual deploy）。**Date Calculator（第八）** 仍維持已上線（其當次 Production HEAD：`df2d82b`）。**Adaptive Mobile Editor**／Legacy MSB Archive-in-Place 已上線；Option C／B9.3 未授權。獨立 dirty（非本 release）：`astro.config.mjs`、Phase C `tool-mobile-sheet-v2-baseline.css`。
---

## 1. Project snapshot

| Item | Current status |
|---|---|
| Project | Timiva |
| Domain | `timiva.app` |
| Registrar | Porkbun |
| Deployment | Cloudflare Pages |
| Framework | Astro |
| Styling | Tailwind CSS |
| Languages | English / 繁體中文 |
| Core direction | Mobile-first, Widget-like, calm, low-maintenance |
| Business model | Search traffic + future Google AdSense |
| Maintenance direction | Pure frontend first, low maintenance |
| Owner phase | Phase A：Owner 主導確認期 |
| Current session status | **Timiva 已在正式網域 [https://timiva.app](https://timiva.app) 提供服務。** V1 四工具、**Age**、**DBD**、**BDC**、**Date Calculator（第八）**、**Hours Calculator（第九）** 皆已上線。Production HEAD：`fd2ed68`。Home Featured 維持 4 張（不含 BDC／DC／Hours）。 |

### 1.1 Current work tracks（2026-08-05）

**Date Calculator／日期加減計算（Timiva 第八 · V1.5 Search Foundation 第四 · production deployed）：**

```text
Status：DEPLOYED · Owner Production QA＝PASS · Desktop Hotfix Verification＝PASS
Routes：/en/date-calculator/ · /zh/date-calculator/
Mobile：Adaptive Mobile Editor · lifecycle＝live · sibling mount
Desktop：Smart Date Input＋DesktopCalendar popover-compact＋live result
Catalog：available:true · featured:false
Home Featured：維持 4 張 · 不含 DC
All Tools dates-events：EC → DRC → DBD → BDC → DC → Hours → Age
Outbound Related：DBD → BDC → Date Range
Inbound：DRC／DBD 各含 DC；BDC inbound 已改為 Hours（見 Hours B5）
Key commits：
  3d9600e feat: add Date Calculator standalone tool
  ae1c751 feat: integrate Date Calculator across site links（Owner Link QA PASS）
  d09dce2 test: add Date Calculator adopter validator
  6d1ce1c test: align validators for Date Calculator release
  4545121 docs: record Date Calculator release readiness（initial release docs）
  adf34be fix: harden Date Calculator desktop duration and result layout
  df2d82b fix: polish Date Calculator result layout
Initial release HEAD：4545121
Desktop hotfix：adf34be＋df2d82b
Deployed／Production HEAD：df2d82b
Push range（hotfix）：4545121..df2d82b
Cloudflare Pages：main push auto-deploy（未 manual deploy）
Hotfix verified：duration guard／paste／Add／Subtract／Clear／?＋!／ZH result layout；EN／ZH · Desktop／Mobile 無回歸
Docs：docs/tools/date-calculator/README.md · product-spec.md
Independent dirty（not this release）：astro.config.mjs · Phase C tool-mobile-sheet-v2-baseline.css
```

**Hours Calculator／時數計算（Timiva 第九 · V1.5 Search Foundation · production deployed）：**

```text
Status：DEPLOYED · Owner Production QA＝PASS
Routes：/en/hours-calculator/ · /zh/hours-calculator/
Mobile：Adaptive Mobile Editor · Numeric Keypad · live evaluate
Desktop：range／break text input · live evaluate
Catalog：available:true · featured:false · icon:calendar
Home Featured：維持 4 張 · 不含 Hours
All Tools dates-events：EC → DRC → DBD → BDC → DC → Hours → Age
Outbound Related：DBD → BDC → Date Calculator
Inbound Related：僅 Business Days Calculator（DBD → DRC → Hours）
  DBD／Date Calculator Related graph 不變
ToolAdSlot：is-disabled
Key commits：
  44289b7 feat: add Hours Calculator standalone tool
  67a2bb1 feat: integrate Hours Calculator across site links
  6352702 docs: sync Hours Calculator commit references
  fd2ed68 chore: sync AME protected baseline for Hours wiring
Deployed／Production HEAD：fd2ed68
Cloudflare Pages：main push auto-deploy（未 manual deploy）
Docs：docs/tools/hours-calculator/README.md · product-spec.md
```

**Adaptive Mobile Editor／Legacy MSB（shared · on production with DC release chain）：**

```text
Status：B7 Lab Hardening PASS · B8 Date Calculator First Adopter COMPLETE · on production
Gates：
  B8.1 Shared Visual Contract＝PASS
  Shared Shell Focus Outline＝PASS
  B8.2 Live Update Lifecycle＝PASS
  B9 Decision Gate＝PASS（scoped canonical · D1／MSB Option B · Option D 否決）
  B9.1 Canonical Docs Adoption＝COMPLETE
  B9.2A Legacy MSB Archive-in-Place＝COMPLETE（commit 5f244af）
  Option C（刪除 MSB Lab sources）＝NOT AUTHORIZED
  B9.3 next adopter＝NOT AUTHORIZED
Key commits（included in production HEAD df2d82b）：
  5f244af chore: archive legacy mobile sheet lab
  2e096e0 feat: add Adaptive Mobile Editor foundation
  d1e3ebd test: normalize Adaptive Mobile Editor validators
Legacy MSB：Lab＝Historical／Superseded；baseline CSS／msb-*／Age／DBD／BDC／CT sheets＝KEEP
Forbidden：Option C without Owner；B9.3 without Owner
Docs：docs/workflow/shared-component-reuse-gate.md §8 · docs/standards/mobile-sheet.md §0／§17 · new-tool-development.md §22
```

**Tool category display labels（label-only · production deployed）：**

```text
Production HEAD：0fe3e1f docs: record tool category label alignment
Pushed range：5c55672..0fe3e1f
  cdde8e2 docs: record DesktopCalendar deployment
  e02e48f fix: align tool category display labels
  0fe3e1f docs: record tool category label alignment
當次 production checkpoint（0fe3e1f）：main＝origin/main；working tree clean
目前 local／production：main＝origin/main＝df2d82b（Date Calculator deployed）
Date Calculator：已正式上線；Production HEAD：df2d82b；Owner Production QA＋Desktop Hotfix Verification＝PASS
Production baseline：origin/main＝df2d82b
Cloudflare Pages auto-deploy：成功（未 manual deploy）
Owner Production Verification：PASS
  /en/tools/、/zh/tools/ 顯示正常
  正式分類標題正確
正式顯示名稱：
  Important Dates / 重要日子
  Timers & Focus / 計時與專注
  Daily Rhythm / 日常節奏
  Life Progress / 人生進度
正式 All Tools：只顯示有 available 工具的三類
  Important Dates · Timers & Focus · Life Progress
Daily Rhythm：無 available 工具時繼續隱藏（不顯示空分類）
Preview／all-tools：已同步四組正式 EN 名稱（layout fixture）
Internal IDs 保留（不遷移）：
  dates-events · productivity · body-flow · momentum
Canonical validator：scripts/validate-tool-category-labels.mjs
Home ZH chip「重要日期」：未改（marketing chip，不是分類標題）
Date Calculator：catalog available:true · All Tools 含 DC（production）
```

**Shared Desktop Calendar track（Phase A–E · production deployed）：**

```text
Deployed HEAD：5c55672 chore: formalize DesktopCalendar reuse gate
Cloudflare Pages auto-deploy：成功（未 manual deploy）
Owner Production QA：Desktop／Mobile Final PASS
Production smoke／signature：PASS
  BDC EN／ZH → popover-compact
  DRC EN／ZH → Desktop inline-large；Mobile legacy transitional path 保留
  Age EN／ZH → Birth／As-of 各一 popover-compact

Commit chain：
  3c37d7a feat: add shared DesktopCalendar foundation
  6f7ab99 feat: migrate Business Days Calculator to DesktopCalendar
  9ce6c35 feat: migrate Date Range Calculator desktop calendar to DesktopCalendar
  f25d107 feat: migrate Age Calculator desktop calendars to DesktopCalendar
  5c55672 chore: formalize DesktopCalendar reuse gate

Shared foundation：DesktopCalendar.astro＋desktop-calendar-controller＋desktop-calendar.css
Variants（僅兩種）：inline-large｜popover-compact
Canonical validator：scripts/validate-desktop-calendar.mjs（63 passed／0 failed）
Reuse Gate／date-input：正式啟用
Shared Desktop Calendar：正式視為 production baseline
DRC Mobile legacy calendar：核准 transitional exception（仍保留 data-drv2-*；不得擴大為第二套 Desktop Calendar）
Date Calculator：B8 COMPLETE · Desktop Calendar＝popover-compact · production deployed（HEAD：df2d82b）
```

**Shared ResultSummary track（Phase A–I 完成 · 已 push／deploy）：**

```text
Production HEAD：c1aea32 docs: clarify ResultSummary release status
Shared foundation：ResultSummary.astro + result-summary-controller + result-summary.css
DRC：variant=standard；BDC：variant=spacious
Reuse Gate 正式啟用：docs/workflow/shared-component-reuse-gate.md
Canonical validator：scripts/validate-result-summary.mjs
正式網域 Owner visual QA（EN／ZH × Desktop／Portrait／Landscape）：PASS
Blocking issue：無
```

**Release track（production）：**

```text
Event Countdown、Date Range Calculator、Countdown Timer、Year Progress：已部署 timiva.app
Age Calculator：已部署 timiva.app（V1.5 standalone + link integration）
Days Between Dates：已部署 timiva.app（V1.5 Search Foundation 第二個工具 · Timiva 第六個工具）
Business Days Calculator：已部署 timiva.app（V1.5 Search Foundation 第三個工具 · Timiva 第七個工具）
  Routes：/en/business-days-calculator/ · /zh/business-days-calculator/
  Standalone commit：cc09f32 feat: add Business Days Calculator standalone
  Link Integration commit：8977fe5 feat: integrate Business Days Calculator links
  Production QA：PASS · No blocking issues found
ResultSummary Phase A–I：已 push／deploy（Production HEAD：c1aea32）
  DRC／BDC ResultSummary production visual QA：PASS
Shared Desktop Calendar Phase A–E：已正式部署（Deployed HEAD：`5c55672`）
  BDC／DRC／Age EN／ZH production signature／Owner QA：PASS
  Canonical validator：scripts/validate-desktop-calendar.mjs（63／0）
Cloudflare Pages 自動部署成功（未 manual deploy）
Production deployed baseline（timiva.app）：origin/main＝df2d82b
目前 local／production：main＝origin/main＝df2d82b
Date Calculator：已正式上線；Production HEAD：df2d82b；Owner Production QA＋Desktop Hotfix Verification＝PASS
V1 SEO technical closeout：完成（Batch 1–3 production PASS；docs `c5c0a22`）
可選：Year Progress HTTPS Share verification（non-blocking）
```

**Product development track：**

```text
Age Calculator：V1.5 完成並已上線（standalone + Post-tool Link Integration）
Days Between Dates：V1.5 Search Foundation 第二個工具 · production complete
Business Days Calculator：V1.5 Search Foundation 第三個工具 · production complete
Home Featured Tools 維持 4 張（Date Range → Age Calculator → Event Countdown → Year Progress）
  Home 不加入 Days Between Dates、不加入 Business Days Calculator
Countdown Timer 仍保留於 All Tools 與工具頁
All Tools 分類顯示（正式名稱；空分類隱藏）：
  Important Dates／重要日子（dates-events）
  Timers & Focus／計時與專注（productivity）
  Life Progress／人生進度（momentum）
  Daily Rhythm／日常節奏（body-flow）：無 available 工具 → 不顯示
All Tools dates-events 排序：
  Event Countdown → Date Range Calculator → Days Between Dates → Business Days Calculator → Date Calculator → Hours Calculator → Age Calculator
Inbound Related（Hours B5 Link Integration）：
  Business Days：Days Between Dates → Date Range → Hours Calculator
  Date Range／Days Between Dates／Date Calculator：Related graph 不變（仍含既有 DC 連線）
Hours outbound Related：Days Between Dates → Business Days Calculator → Date Calculator
Age Calculator Desktop calendar：已由 Shared DesktopCalendar Phase D 取代（production；Birth／As-of 各一 popover-compact）
四大分類顯示名稱：已上線（Production HEAD：0fe3e1f；Owner Production Verification PASS）
下一個產品方向：V1.5 Search Foundation／搜尋鋪路期
Date Calculator／日期加減計算：已正式上線（Production HEAD：df2d82b）；catalog available:true；Home Featured 不含 DC
  Desktop Calendar＝popover-compact
Hours Calculator／時數計算：已正式上線（Production HEAD：fd2ed68）；catalog available:true；Home Featured 不含 Hours；Owner Production QA＝PASS
近期開發順序：
  Lunar Date Converter（optional）
  Pet Age Calculator（optional）
  Japanese Era Converter（optional）
Business Days Calculator 已上線邊界（維持）：
  只排除星期六與星期日；起訖皆計入；不扣除國定假日
中文 Calculator 工具命名（2026-07-13）：
  統一「○○計算」（不加「器」、不用「計算機」）
  Date Range → 日期區間計算；Age → 年齡計算；DBD → 日期差計算
  Business Days → 工作日計算；Date Calculator → 日期加減計算；Hours → 時數計算
  Event Countdown 命名現況本輪不統一
```

---

## 2. Current completed scope

### 2.1 Core project foundation

```text
Astro project foundation
English / Traditional Chinese route structure
Home / Tool / All Tools / Legal Text page types
Header / Footer / BaseLayout baseline
Preview layout baseline
Design / layout / Tailwind / SEO / QA docs（見 docs/standards/、docs/workflow/）
Four-Agent review model（agents/）
Post-tool Link Integration Gate（docs/workflow/tool-link-integration.md）
```

### 2.2 Home pages completed and deployed

EN / ZH 首頁已完成 Home Content & Animation task、通過 final check，**已部署**。

Completed home scope:

```text
/en/
/zh/
Hero title / subtitle updated
Hero CTA buttons removed
Hero chips added as visual-only, non-interactive labels
Featured tool cards（固定 4 張；2026-07-10 起）:
Date Range Calculator → Age Calculator → Event Countdown → Year Progress
Countdown Timer 不在首頁 Featured（仍在 All Tools）
Hero chips 對齊 Featured 方向（含 Age Calculator；不含 Countdown Timer）
Home FAQ 描述 Timiva 工具集合，不綁死首頁 4 張卡
View all tools retained
FAQ & Help added with 7 Q&A per locale
Ad Container implemented but production state is-disabled
Home JSON-LD: WebSite, Organization, ItemList, FAQPage
Home entrance animation with prefers-reduced-motion support
```

Home page verification:

```text
Owner real-device testing passed（EN / ZH）
Mobile portrait / landscape / Desktop passed
npm run build passed
Final check passed
Deployed
```

Home animation decision:

```text
Lightweight entrance animation remains enabled
Existing ToolCard hover remains unchanged
Animated glow overlay was tested and disabled（performance）
Do not re-enable Home / All Tools animated glow overlay in V1 unless explicitly approved
```

### 2.3 Completed / verified tool pages（已部署）

```text
Event Countdown V2 — 已部署
Date Range Calculator V2 — 已部署
Countdown Timer V2 — 已部署 · 站內連結整合完成（2c44484）
Year Progress V2 — 已部署 · 站內連結整合完成（f39f8bc, 20c379d）
Age Calculator V2 — 已部署 · standalone + 站內連結整合完成（f48df91）
Days Between Dates V2 — 已部署 · standalone + 站內連結整合完成（69ba30b, 18a262c）
Business Days Calculator V2 — 已部署 · standalone + 站內連結整合完成（cc09f32, 8977fe5）
```

工具 README：`docs/tools/event-countdown/`、`docs/tools/date-range-calculator/`、`docs/tools/countdown-timer/`、`docs/tools/year-progress/`、`docs/tools/age-calculator/`、`docs/tools/days-between-dates/`、`docs/tools/business-days-calculator/`

---

## 3. Event Countdown V2 current status

**實作完成，已部署。** 視為 stable baseline。

Routes:

```text
/en/event-countdown/
/zh/event-countdown/
```

Current verified state:

```text
EventCountdownV2 i18n, client messages, route meta, FAQ / JSON-LD, related tools, share, theme sheet, edit sheet, quick templates — working
Chinese quick templates: 2027 新年, 2026 聖誕節, 2027 情人節
Owner real-device: Mobile portrait / landscape / Desktop passed
```

2026-06-13 overlay regression note:

```text
Sheet overlay teleported to document.body; scoped selectors briefly broke backdrop
Fixed with body-level overlay selectors
Edit / Theme backdrop, scroll lock, backdrop click-to-close — normal
Do not modify EC V2 core logic unless task explicitly targets it
```

Ad state: ToolAdSlot is-disabled · no live AdSense

---

## 4. Date Range Calculator V2 current status

**實作完成，已部署。**

Routes:

```text
/en/date-range-calculator/
/zh/date-range-calculator/
```

Primary implementation:

```text
DateRangeCalculatorV2 component
EN / ZH V2 routes
Drawer / sidebar V2 layout
FAQ JSON-LD · Related Tools
ToolAdSlot is-disabled
Old component retained for rollback
Calculation logic not rewritten
Main commit: 2b496b4
```

Verified across desktop, intermediate RWD, mobile portrait, mobile landscape. Shared overlay / scroll lock baseline aligned with Event Countdown V2.

Ad state: ToolAdSlot main / sidebar is-disabled

---

## 5. Countdown Timer current status

**實作完成，已部署。** Post-tool Link Integration **已完成**。

Routes:

```text
/en/countdown-timer/
/zh/countdown-timer/
```

Commits:

```text
77c6aa8 — feat: add Countdown Timer V2
2c44484 — feat: wire Countdown Timer links across home and catalog pages
```

Core features:

```text
Quick Start · Target end timestamp · Desktop inline edit · Mobile Custom time sheet
Start / Pause / Resume / Cancel · Progress ring · Sound preference
Last duration in localStorage · Refresh does not restore active countdown
EN / ZH · FAQ / JSON-LD · Related Tools
```

Site integration（Owner confirmed）:

```text
Home card → formal EN / ZH routes
All Tools listed
Event Countdown / Date Range Related Tools include Countdown Timer
Locale-aware routes preserved
```

Full spec: `docs/tools/countdown-timer/product-spec.md`

### 5.1 完成提示音改善（2026-06-28）

**實作完成 · Owner 實機驗收通過 · 已 push · 線上驗收通過**

Commit：

```text
5ee7613 — fix: improve Countdown Timer completion sound
```

```text
主要播放路徑：本地 WAV（public/audio/countdown-complete.wav）+ HTMLAudioElement
Fallback：Web Audio 三音 chime（播放失敗時）
Sound 預設、localStorage key、倒數狀態機、UI：不變
```

Owner 實機驗收：

```text
iPhone Safari 靜音模式開啟：有聲
iPhone Safari 靜音模式關閉：有聲
低媒體音量：清楚可辨識
桌機：有聲且較先前清楚
```

驗證：

```text
npm run build：通過
git diff --check：通過
dist/audio/countdown-complete.wav：已輸出
已 push 至 origin/main（5ee7613）
Cloudflare Pages 線上驗收：通過
```

已知限制：

```text
僅保證頁面位於前景、瀏覽器正常開啟時的完成提示音。
背景、鎖屏或系統暫停頁面時，不保證原生鬧鐘等級提醒。
```

---

## 6. Year Progress current status

**實作完成 · 站內連結整合完成 · 已部署。**

Routes:

```text
/en/year-progress/
/zh/year-progress/
```

Commits:

```text
f39f8bc — feat: add Year Progress V2
20c379d — feat: integrate Year Progress links
```

Current status:

```text
B0–B3 standalone: complete
Link Integration: complete · validate-tool-link-integration.mjs passed · Owner QA passed
Catalog / Home / All Tools / Related Tools: integrated
Deployed to timiva.app
HTTPS Share success verification: optional follow-up（non-blocking）
```

Core MVP:

```text
Integer year percentage · Days passed / remaining
12 monthly pill segments · One monthly note
Theme（Mist / 霧光, Forest / 森光 + eligible Timiva themes）
Share · EN / ZH · About / How to / FAQ / JSON-LD / Related Tools
```

Primary specification:

```text
docs/tools/year-progress/product-spec.md（含產品流程）
docs/tools/year-progress/README.md
```

Plans / validation reports（local-only）:

```text
local-docs/plans/year-progress/
local-docs/reports/year-progress/
local-docs/tasks/year-progress/
```

Protected boundary:

```text
Tool Theme Layer is tool-specific
Do not modify BaseLayout or global background
Do not refactor Event Countdown themes in unrelated tasks
```

---

## 7. Age Calculator current status

**已正式上線 · V1.5 standalone + link integration 完成 · B7 Deploy / Production Verification 通過 · No blocking issues found**

Timiva **第五個工具**。Production URL：`https://timiva.app`

Routes:

```text
/en/age-calculator/
/zh/age-calculator/
```

Category:

```text
Important Dates / 重要日子
```

Production / release:

```text
Deployed HEAD：f48df91 feat: integrate Age Calculator links
Cloudflare Pages 自動部署成功
當次部署完成時：main 與 origin/main 同步 · working tree clean
B4 Link Integration commit：f48df91
B5 Final pre-push QA：Pass
B6 push origin main：Pass
B7 Production Verification：Pass
```

Commits（關鍵）：

```text
cb09fc6 — feat: add Age Calculator B1B
72c3d58 — feat: add Age Calculator B2A
fb2d21f — feat: add Age Calculator B2B
cc31c79 — feat: add Age Calculator B2C
f5416b6 — fix: reset Age Calculator invalid birth state
852e580 — docs: update Age Calculator status
f48df91 — feat: integrate Age Calculator links
```

Core shipped features:

```text
Desktop birth：單一智慧 input + Shared DesktopCalendar（popover-compact）
Mobile birth：Year / Month / Day 三欄 + auto-advance
As-of 預設 today
Desktop As-of：Shared DesktopCalendar（popover-compact）+ 非 today 時 back icon
Mobile As-of 原生 date picker（無 back icon）
invalid birth 歸零（B3C 已修 ReferenceError）
empty / incomplete → 0、無 invalid icon
as-of earlier than birth → 0 + as-of invalid
出生年份 1900～today；leap day 2/29 規則
自然日曆年／月／日；Day 0
EN / ZH · About / How to / Common uses / FAQ / FAQ JSON-LD · Related Tools（3）
MVP 無 LocalStorage、無分享、無星座／生肖／生命統計
```

站內連結整合（B4）：

```text
All Tools EN / ZH：顯示 Age Calculator
Home Featured Tools（4 張）：
1. Date Range Calculator
2. Age Calculator
3. Event Countdown
4. Year Progress
Countdown Timer：僅從首頁 Featured 移除；All Tools / 路由 / Related / 核心功能保留
Related Tools inbound：Event Countdown / Date Range / Year Progress 含 age-calculator
Countdown Timer Related：維持既定三張（不含 age-calculator）
Hero chips / Home FAQ 文案已對齊（不暗示 CT 一定在首頁）
```

B7 Production QA（2026-07-10）：

```text
Home EN / ZH — Pass
All Tools EN / ZH — Pass
Age Calculator EN / ZH · Desktop / Mobile — Pass
Related Tools — Pass
Existing tools quick check — Pass
No blocking issues found
```

Primary specification:

```text
docs/tools/age-calculator/product-spec.md
docs/tools/age-calculator/README.md
```

Protected / no-go boundary:

```text
不得在未授權任務中改寫 Age Calculator 已驗收核心邏輯
不得修改 Header、Footer、BaseLayout、Mobile Sheet baseline、既有工具程式
```

Next step:

```text
Age Calculator 上線阻塞項已關閉
Days Between Dates 已接續完成並上線（見 §7.1）
```

---

## 7.1 Days Between Dates current status

**已正式上線 · V1.5 Search Foundation 第二個工具 · Timiva 第六個工具 · standalone + link integration 完成 · B7 Production Verification 通過 · No blocking issues found**

Production URL：`https://timiva.app`

Routes:

```text
/en/days-between-dates/
/zh/days-between-dates/
```

Category:

```text
Important Dates / 重要日子
```

Production / release:

```text
Standalone commit：69ba30b feat: add Days Between Dates standalone tool
Link Integration commit / Deployed HEAD：18a262c feat: integrate Days Between Dates links
Cloudflare Pages 自動部署成功
當次部署完成時：main 與 origin/main 同步
B5 Final pre-push QA：Pass
B6 push origin main：Pass
B7 Production Verification：PASS · No blocking issues found
```

Core shipped features:

```text
Smart Date Input（純數字 6/7/8、slash / dash、segment edit）
絕對日期差計算（順序無關）
Include both dates（預設 Off；結果 +1）
次結果：weeks and days / 週又 天
empty / incomplete / invalid → 結果歸零
Desktop range paste auto-split（例：2026/07/08-2026/09/17）
Mobile sheet six-state QA · landscape keyboard / accessory 不整片上抬
EN / ZH · About / How to / Common uses / FAQ / FAQ JSON-LD · Related Tools（3）
MVP 無 LocalStorage、無 URL sharing
ToolAdSlot is-disabled
```

站內連結整合：

```text
Home Featured Tools：維持 4 張（Date Range → Age Calculator → Event Countdown → Year Progress）
  Days Between Dates 不加入 Home Featured
All Tools EN / ZH：已加入 Days Between Dates
  dates-events 現行排序：Event Countdown → Date Range → Days Between Dates → Business Days Calculator → Age Calculator
Outbound Related（現行）：Date Range Calculator → Business Days Calculator → Age Calculator
Inbound Related（現行）：
  Date Range Calculator includes Days Between Dates（與 Business Days Calculator）
  Age Calculator includes Days Between Dates
  Event Countdown / Year Progress / Countdown Timer：未加入 DBD inbound
```

B7 Production QA（2026-07-11）：

```text
Home EN / ZH — Pass（4 張、不含 DBD）
All Tools EN / ZH — Pass（含 DBD、排序正確）
Days Between Dates EN / ZH · 計算 / Include / range paste / mobile — Pass
DRC / AC Related Tools — Pass
Footer language switch — Pass
SEO / sitemap / canonical / hreflang — Pass
No blocking issues found
```

Primary specification:

```text
docs/tools/days-between-dates/product-spec.md
docs/tools/days-between-dates/README.md
```

Protected / no-go boundary:

```text
不得在未授權任務中改寫 Days Between Dates 已驗收核心邏輯
不得修改 Header、Footer、BaseLayout、Mobile Sheet baseline、既有工具程式
```

Next step:

```text
Days Between Dates 上線阻塞項已關閉
Business Days Calculator 已接續完成並上線（見 §7.2）
```

---

## 7.2 Business Days Calculator current status

**已正式上線 · V1.5 Search Foundation 第三個工具 · Timiva 第七個工具 · standalone + link integration 完成 · Production QA 通過 · No blocking issues found**

Production URL：`https://timiva.app`

Routes:

```text
/en/business-days-calculator/
/zh/business-days-calculator/
```

Category:

```text
Important Dates / 重要日子
```

Production / release:

```text
Product spec commit：f963a12 docs: add Business Days Calculator product spec
Standalone commit：cc09f32 feat: add Business Days Calculator standalone
Link Integration commit / Deployed HEAD：8977fe5 feat: integrate Business Days Calculator links
Cloudflare Pages 自動部署成功
當次部署完成時：main 與 origin/main 同步
Production QA：PASS · No blocking issues found
```

Core shipped features:

```text
計算兩日期間工作日（星期一至星期五）
起訖皆計入
僅排除週六、週日；不扣除國定假日
日期範圍：1900-01-01～2100-12-31
Desktop：Smart Date Input + Shared DesktopCalendar（popover-compact）
Mobile：Smart Date Input Bottom Sheet（無 Mobile Calendar）
無 Clear／Calculate／LocalStorage／URL sharing
Calendar icon 開啟完整 range selection
Calendar 開啟後可切換只修改開始或結束日期
edit 模式修改後保持開啟，由使用者自行關閉
月份：3×4 grid；年份：1900–2100 固定高度可捲面板＋4 位輸入（shared baseline）
EN / ZH · About / How to / Common uses / FAQ / FAQ JSON-LD · Related Tools（3）
ToolAdSlot is-disabled
```

站內連結整合：

```text
Home Featured Tools：維持 4 張（Date Range → Age Calculator → Event Countdown → Year Progress）
  Business Days Calculator 不加入 Home Featured
All Tools EN / ZH：已加入 Business Days Calculator
  dates-events 排序：Event Countdown → Date Range → Days Between Dates → Business Days Calculator → Age Calculator
Outbound Related：Days Between Dates → Date Range Calculator → Event Countdown
Inbound Related：
  Days Between Dates：Date Range Calculator → Business Days Calculator → Age Calculator
  Date Range Calculator：Days Between Dates → Business Days Calculator → Event Countdown
```

Production QA（2026-07-19）：

```text
EN / ZH routes · All Tools · Related · SEO · Desktop / Mobile smoke — Pass
No blocking issues found
Known non-blocking：部署期間曾短暫 404，重試後恢復（CDN／部署延遲）
```

Canonical docs:

```text
docs/tools/business-days-calculator/product-spec.md
docs/tools/business-days-calculator/README.md
```

Protected / no-go boundary:

```text
視為已上線 stable tool
不得在未授權任務中改寫 Business Days Calculator 已驗收核心邏輯
不得修改 Header、Footer、BaseLayout、Mobile Sheet baseline、既有工具程式
```

Next step:

```text
Business Days Calculator 上線阻塞項已關閉
Date Calculator：已正式上線（Production HEAD：df2d82b）
下一支開發工具：Hours Calculator
```

---

## 8. Shared V2 tool baselines（2026-06-13 起）

### 7.1 Tool result baseline

```text
src/styles/tools/tool-result-v2-baseline.css
src/styles/tools/tool-drawer-v2-baseline.css
```

Rules: 48px stage→lower spacing · 8px desktop title→result gap · shared drawer hover（no translateY）

### 7.2 Tool overlay baseline

```text
src/styles/tools/tool-overlay-v2-baseline.css
body.tool-operation-open scroll lock
Event Countdown overlay teleported to document.body — CSS must support body-level selectors
```

### 7.3 Tool ad placeholder baseline

```text
ToolAdSlot main / sidebar · is-disabled in production
No live AdSense connected
```

共用互動基準長期規則：[互動控制規範](../standards/interactive-controls.md)

---

## 9. Legal pages completed

Six pages via Markdown + `LegalTextLayout`:

```text
/zh/privacy/ · /zh/terms/ · /zh/contact/
/en/privacy/ · /en/terms/ · /en/contact/
```

Legal pages do not contain ads. Chinese label: 使用條款.

Privacy Policy 與 Terms of Use（EN / ZH）已更新 GA4、Consent、LocalStorage 與未來可能廣告之說明（Batch C）。

### Legal mobile-landscape meta hotfix

Issue:

```text
Privacy / Terms / Contact 手機橫式下，
「最後更新」meta 列因 mx-auto + max-w-xl 產生左側縮排。
```

Fix:

```text
LegalTextLayout meta 使用 shared class（legal-text-layout__meta）
mobile landscape 覆寫 margin / max-width / width / text-align
portrait / landscape / desktop 均通過
```

Commit:

```text
40761d3 — fix: align legal meta on mobile landscape
```

Status:

```text
Committed：Yes
Pushed：Yes
Cloudflare Production deployed：Yes
Owner official-domain verification：PASS
```

### Safari cache QA note

```text
Safari 一般瀏覽模式曾出現異常舊版畫面，
但 Chrome mobile 與 Safari Private Browsing 均正常。
清除 timiva.app 的 Safari 網站資料後恢復正常，
確認為舊 cache / website data，
未新增 Safari-specific workaround 或 production code。
```

---

## 10. GA4 + Basic Consent current status

```text
Source implementation complete
Committed and pushed to main
Cloudflare Production env configured
Deployed to timiva.pages.dev and timiva.app
Online Consent / Network QA passed（pages.dev + timiva.app）
GA4 Realtime verification passed
```

Commit:

```text
87e718b — feat: add privacy-first GA4 consent
```

### Implementation summary

```text
GA4 Property / Web Data Stream 已建立（Owner 端）
使用 direct Google tag（gtag.js），不使用 Google Tag Manager
Measurement ID 僅由 build-time env PUBLIC_GA_MEASUREMENT_ID 提供
無 Measurement ID 時：不輸出 Consent UI、Footer 分析設定、analytics-consent.js 引用
使用 Google Basic Consent Mode
使用者明確允許（Allow analytics）前不載入 Google tag
unknown / rejected 不傳送 Analytics 資料
Consent 狀態儲存於 LocalStorage key：timiva.analytics.consent（v:1）
狀態：unknown / accepted / rejected
Footer 可重新開啟 Analytics settings / 分析設定
Google Signals：關閉
User-provided data collection：關閉
Google Ads / 廣告個人化：關閉（透過 analytics 設定）
GA4 user-level / event-level retention：14 個月
Privacy Policy 與 Terms（EN / ZH）已與實作同步
Batch A–D 與 Owner 實機 QA：已通過
```

### Cloudflare

```text
Production 已設定 PUBLIC_GA_MEASUREMENT_ID
Measurement ID 僅存在 Cloudflare environment variable
未寫入 Git 或 source code
設定 env 後已重新部署
timiva.pages.dev 已成功輸出 Consent UI 與 Footer Analytics settings
```

### Online Consent / Network QA（Owner 實測 · timiva.pages.dev）

```text
首次進站、尚未選擇 consent：
- Consent Banner 正常顯示
- 0 Google Analytics requests

選擇 Necessary only：
- consent 正常保存
- 重新整理後 Banner 不再出現
- Footer Analytics settings 正常顯示
- 0 googletagmanager requests
- 0 google-analytics / collect requests

選擇 Allow analytics：
- gtag.js 成功載入
- googletagmanager request：200
- GA collect requests：204
- Consent dialog 正常關閉
- 重新整理後 accepted 狀態保留

Allow analytics → Necessary only：
- consent 正常切換
- 重新整理及切換頁面後不再產生新的 GA requests
- Necessary only 狀態正確保留
```

### GA4 Realtime

```text
GA4 Realtime：PASS

Owner 測試時顯示：
- 1 active user
- 4 page views

確認頁面（pages.dev smoke test）：
- /en/
- /en/countdown-timer/
- /en/event-countdown/
- /en/privacy/
```

### Official-domain verification（timiva.app）

```text
Official-domain Consent / Network QA：PASS

unknown：
- Consent Banner 顯示
- 0 GA requests

Necessary only：
- consent 正常保存
- 0 googletagmanager requests
- 0 collect requests

Allow analytics：
- gtag.js 正常載入
- collect 正常送出
- consent 刷新後保留

Allow analytics → Necessary only：
- 停止後續 GA requests
- rejected 狀態保留

GA4 Realtime：
- 成功收到 timiva.app 頁面瀏覽資料（smoke-test 驗證；非正式流量統計）
```

Validator（`scripts/validate-analytics-consent.mjs`）：

```text
disabled build：179 pass / 0 fail
enabled placeholder build（G-LOCALTEST）：172 pass / 0 fail
runtime harness（local-docs/tests）：50 pass / 0 fail
tool link validator：176 pass / 0 fail
```

Implementation scope（`87e718b`）：

```text
public/scripts/analytics-consent.js
src/lib/analyticsConfig.ts
src/layouts/BaseLayout.astro（條件式接線）
src/components/AnalyticsConsent.astro
src/styles/analytics-consent.css
src/components/Footer.astro（Analytics settings 入口）
src/i18n/en.ts · src/i18n/zh.ts
src/content/legal/en|zh/privacy.md · terms.md
scripts/validate-analytics-consent.mjs
```

---

## 11. Production domain（timiva.app）

### 正式網域

```text
timiva.app 已連接 Cloudflare Pages
Cloudflare zone：Active
Pages custom domain：Active
HTTPS / SSL：PASS
正式主網域：https://timiva.app
```

### DNS 與 www

```text
Porkbun nameservers 已切換至 Cloudflare
DNS records 已遷移
timiva.app 指向 Timiva Cloudflare Pages
www.timiva.app 已設定 301 redirect 至 timiva.app
redirect 保留 path 與 query string
舊 www → pixie.porkbun.com 已移除
舊 wildcard *.timiva.app → pixie.porkbun.com 已移除
```

驗證範例：

```text
https://www.timiva.app/ → https://timiva.app/
https://www.timiva.app/zh/ → https://timiva.app/zh/
```

### Email

```text
Porkbun email forwarding 所需 MX / SPF records 已保留
hello@timiva.app 寄信測試成功
郵件轉寄正常
```

---

## 12. V1 production smoke test

Owner 已在正式 `timiva.app` 完成：

```text
網域與 HTTPS
EN / ZH
首頁與 Legal 頁
四個 V1 工具主要流程
全站導覽與語系切換
Desktop
Mobile portrait
Mobile landscape
Chrome mobile
Safari Private Browsing
Consent / GA4
```

狀態：

```text
V1 production smoke test：PASS
```

說明：此為 Owner 正式網域複測通過，**不代表**所有瀏覽器、所有裝置、所有 edge cases 均已完整覆蓋。

---

## 13. Current V1 launch status

```text
Timiva V1 已在正式網域 timiva.app 提供服務。
V1 SEO technical closeout 已完成（2026-07-04）。
```

Completed:

```text
四個 V1 工具（Event Countdown、Date Range Calculator、Countdown Timer、Year Progress）
EN / ZH
Legal
GA4 privacy-first Basic Consent
Cloudflare Pages production domain
HTTPS
www redirect
email forwarding
official-domain smoke test
Legal mobile-landscape meta hotfix（40761d3）
Google Search Console 驗證
Sitemap submission（18 formal URLs）
SEO Batch 1 — canonical / hreflang（9c10f39）
SEO Batch 2 — Preview noindex（f7629de）
SEO Batch 3 — localized custom 404（b5b150f）
```

Deferred / optional（不阻擋 V1 SEO technical closeout）:

```text
Open Graph / Twitter Card metadata
WebApplication schema
Root HTTP 301 decision
Preview legacy cleanup decision
Year Progress HTTPS Share verification（non-blocking）
AdSense / live ads（仍 disabled）
final launch report（若 Owner 另開文件任務）
```

### 12.1 V1 SEO Technical Closeout

```text
Batch 1 — canonical / hreflang
  Commit：9c10f39
  Production：PASS
  18 個正式頁 canonical / hreflang 正確

Batch 2 — Preview noindex
  Commit：f7629de
  Production：PASS
  6 個 Preview routes：noindex, nofollow；無 canonical / hreflang

Batch 3 — Localized custom 404
  Commit：b5b150f
  Production：PASS
  Unknown URLs → HTTP 404；不再 soft 404
```

Final SEO status:

```text
18 formal pages indexable
6 Preview routes noindex, nofollow
Unknown URLs return HTTP 404
Sitemap：18 URLs
robots.txt：normal
Search Console：verified
No open A / B technical SEO issue
```

詳細 audit 與 closeout baseline：[`docs/project/seo-technical-audit.md`](seo-technical-audit.md)

### 12.2 Custom 404 summary

```text
單一 src/pages/404.astro → dist/404.html
EN / ZH locale-aware content（pathname 決定語系；非 redirect）
robots：noindex, follow
無 canonical / hreflang / JSON-LD
無 Footer
BaseLayout 新增 optional showFooter prop（default true）；僅 404 使用 showFooter={false}
Desktop / Mobile portrait / Mobile landscape：Owner accepted
```

---

## 14. Footer language switch completed

Footer preserves corresponding page route on language switch.

Examples:

```text
/zh/event-countdown/ ↔ /en/event-countdown/
/zh/date-range-calculator/ ↔ /en/date-range-calculator/
/zh/countdown-timer/ ↔ /en/countdown-timer/
/zh/year-progress/ ↔ /en/year-progress/
```

---

## 15. Current locked / protected areas

Unless a task explicitly says otherwise, do not modify:

```text
Header · Footer visual layout · BaseLayout · Global background
Preview layout baseline · ToolCard · RelatedToolRow · Tool Drawer · LegalTextLayout spacing
EventCountdownV2 core / theme / share / quick templates
Date Range calculation / date selection core
Countdown Timer accepted implementation
Year Progress accepted implementation（after Owner sign-off）
Age Calculator accepted V1.5 implementation（standalone + link integration；已上線）
Days Between Dates accepted V1.5 implementation（standalone + link integration；已上線）
Business Days Calculator accepted V1.5 implementation（standalone + link integration；已上線）
ToolAdSlot visual style
```

---

## 16. Current no-go list

```text
Do not redesign EC V2 / DR V2 / Countdown Timer / Year Progress without new task
Do not rewrite Legal Pages layout
Do not add visible ads or live AdSense
Do not add ads to Legal / Text pages
Do not re-enable Home / All Tools animated glow overlay in V1
Do not modify Footer visual / BaseLayout / global background
Do not add backend, database, login, cloud sync, social, leaderboard
Do not generate large programmatic SEO pages yet
Do not push / deploy without Owner confirmation
```

---

## 17. Current active next step

```text
Timiva — live on timiva.app
Event Countdown V2 — Production
Date Range Calculator V2 — Production · ResultSummary variant=standard
Countdown Timer V2 — Production · site-integrated
Year Progress V2 — Production · site-integrated
Age Calculator V2 — Production · V1.5 standalone + link integration（f48df91）
Days Between Dates V2 — Production · V1.5 Search Foundation 第二個工具 · Timiva 第六個工具（18a262c）
Business Days Calculator V2 — Production · V1.5 Search Foundation 第三個工具 · Timiva 第七個工具（8977fe5）· ResultSummary variant=spacious
ResultSummary Phase A–I — Production（HEAD c1aea32）· Reuse Gate＋canonical validator 啟用
Shared Desktop Calendar Phase A–E — Production（HEAD 5c55672）· Reuse Gate＋canonical validator 啟用
Tool category display labels — Production（HEAD 0fe3e1f）· Owner Verification PASS · validator 65／0
GA4 + Basic Consent — deployed on timiva.app
V1 SEO technical closeout — complete（docs `c5c0a22`）
```

Next workflow:

```text
Business Days Calculator 上線完成（standalone cc09f32 + link integration 8977fe5）
ResultSummary Phase A–I 已 push／deploy（Production HEAD：c1aea32）
Shared Desktop Calendar Phase A–E 已正式部署（Deployed HEAD：5c55672）
  Owner Production QA Desktop／Mobile：Final PASS · No blocking issues found
  DRC Mobile legacy calendar：核准 transitional exception（仍保留）
四大分類顯示名稱已上線（Production HEAD：0fe3e1f）
  Owner Production Verification：PASS
  正式 All Tools 顯示三類；Daily Rhythm 空分類隱藏；internal IDs 保留
  Cloudflare Pages auto-deploy：成功；未 manual deploy
  當次 production checkpoint（0fe3e1f）：main＝origin/main；working tree clean
目前 local／production：main＝origin/main＝df2d82b
Date Calculator：已正式上線；Production HEAD：df2d82b；Owner Production QA＋Desktop Hotfix Verification＝PASS
Production baseline：origin/main＝df2d82b
Home Featured 維持 4 張（不含 BDC／DC）
下一個產品方向：V1.5 Search Foundation／搜尋鋪路期
下一支開發工具：Hours Calculator
（Lunar / Pet Age / Japanese Era 為 optional）
```

Optional follow-up:

```text
Year Progress HTTPS Share verification（non-blocking）
Ad placeholder strategy only; ads remain disabled
Open Graph / Twitter Card（deferred SEO growth）
WebApplication schema（deferred）
Root HTTP 301 decision（deferred）
```

Important:

```text
Task briefs and validation reports live in local-docs/ — not Git tracked paths
Phase A：重大變更、deploy 或 locked components 修改仍需 Owner 明確授權
```

---

## 18. Possible next project tasks

Recommended order:

```text
1. Product development：Hours Calculator（下一支）
   （Date Calculator：已正式上線 · Production HEAD：df2d82b）
2. Open Graph / Twitter Card（deferred SEO growth）
3. WebApplication schema（deferred）
4. Root HTTP 301 decision（deferred）
5. Preview legacy cleanup decision
```

Parallel / later:

```text
Year Progress HTTPS Share verification
Ad placeholder strategy only; ads remain disabled
```

---

## 19. Documentation map（canonical tracked paths）

### Core

```text
docs/core/project-brief.md
docs/core/product-principles.md
docs/core/product-architecture.md
docs/core/roadmap.md
```

### Standards

```text
docs/standards/design-system.md
docs/standards/layout-system.md
docs/standards/tailwind-guidelines.md
docs/standards/seo-guidelines.md
docs/standards/ad-layout-guidelines.md
docs/standards/wireframe-index.md
docs/standards/mobile-sheet.md
```

### Workflow

```text
docs/workflow/new-tool-development.md
docs/workflow/tool-page-qa.md
docs/workflow/tool-link-integration.md
docs/workflow/pre-deploy.md
docs/workflow/cursor-commands.md
```

### Project

```text
docs/project/current-status.md（本文件）
docs/project/decision-log.md
docs/project/seo-technical-audit.md
```

### Tools

```text
docs/tools/event-countdown/README.md
docs/tools/date-range-calculator/README.md
docs/tools/countdown-timer/README.md + product-spec.md
docs/tools/year-progress/README.md + product-spec.md
docs/tools/age-calculator/README.md + product-spec.md
docs/tools/days-between-dates/README.md + product-spec.md
```

### Local-only（不納入 Git tracked）

```text
local-docs/tasks/ — task briefs
local-docs/reports/ — validation reports
local-docs/plans/ — implementation plans
local-docs/templates/ — reusable templates
```

正式文件已遷移至 `docs/core/`、`docs/standards/`、`docs/workflow/`、`docs/project/`、`docs/tools/`。Task brief 與 validation report 請使用 `local-docs/`。

---

## 20. How to start a new Cursor task

```text
Read AGENTS.md,
docs/project/current-status.md,
docs/project/decision-log.md,
docs/core/project-brief.md,
docs/core/product-principles.md,
relevant docs/workflow/ and docs/tools/ files,
and the task brief in local-docs/tasks/ if applicable.
Create an implementation plan only. Do not edit files yet.
```

---

## 21. How to start a new ChatGPT discussion

```text
這是 Timiva 專案。請以 AGENTS.md、docs/project/current-status.md 與 docs/project/decision-log.md 為主要上下文。

Timiva V1 已在正式網域 https://timiva.app 提供服務。

已部署：Home、Event Countdown V2、Date Range Calculator V2、Countdown Timer V2、Year Progress V2、Age Calculator V2（V1.5 standalone + link integration）、Days Between Dates V2（V1.5 Search Foundation 第二個工具 · Timiva 第六個工具）、Business Days Calculator V2（V1.5 Search Foundation 第三個工具 · Timiva 第七個工具）、Date Calculator V2（V1.5 Search Foundation 第四個工具 · Timiva 第八個工具 · Production HEAD：`df2d82b`）。
GA4 privacy-first Basic Consent 已在 timiva.app 驗證通過。
V1 SEO technical closeout 已完成（Batch 1–3 production PASS；docs `c5c0a22`）。
Age Calculator 已正式上線；deployed HEAD（AC）：`f48df91`。
Days Between Dates 已正式上線；standalone `69ba30b`；Link Integration / deployed HEAD：`18a262c`；B7 Production Verification PASS；No blocking issues found。
Business Days Calculator 已正式上線；standalone `cc09f32`；Link Integration：`8977fe5`；Production QA PASS；No blocking issues found。
ResultSummary Phase A–I 已 push／deploy；Production HEAD：`c1aea32`；DRC `variant=standard`／BDC `variant=spacious`；正式網域 Owner visual QA PASS；無 blocking issue。
Shared Desktop Calendar Phase A–E 已正式部署至 timiva.app；Deployed HEAD：`5c55672`；Cloudflare Pages auto-deploy；未 manual deploy；Owner Production QA Desktop／Mobile Final PASS；canonical validator `scripts/validate-desktop-calendar.mjs`（63／0）；正式視為 production baseline。
Commit chain：`3c37d7a` → `6f7ab99` → `9ce6c35` → `f25d107` → `5c55672`。
BDC／Age：`popover-compact`；DRC Desktop：`inline-large`；DRC Mobile legacy transitional path 保留。
四大分類顯示名稱已上線（Production HEAD：`0fe3e1f`；Owner Production Verification PASS）：
  Important Dates／重要日子 · Timers & Focus／計時與專注 · Daily Rhythm／日常節奏 · Life Progress／人生進度
  正式 All Tools 只顯示有工具的三類；Daily Rhythm 空分類隱藏
  Internal IDs 保留：dates-events／productivity／body-flow／momentum
  Validator：`scripts/validate-tool-category-labels.mjs`（65／0）
  Home ZH chip「重要日期」未改（marketing chip）
  Cloudflare Pages auto-deploy：成功；未 manual deploy
  當次 production checkpoint（0fe3e1f）：main＝origin/main；working tree clean
目前 local／production：main＝origin/main＝fd2ed68
Date Calculator：已正式上線；當次 Production HEAD：`df2d82b`；Owner Production QA＋Desktop Hotfix Verification＝PASS。
Home Featured 維持 4 張（Date Range → Age Calculator → Event Countdown → Year Progress；不含 DBD／BDC／DC／Hours）。
Hours Calculator／時數計算：已正式上線；Production HEAD：`fd2ed68`；Owner Production QA＝PASS；Cloudflare Pages auto-deploy；未 manual deploy。
Date Calculator／日期加減計算：已部署（第八；Desktop Calendar＝`popover-compact`；hotfix `adf34be`＋`df2d82b`）。
下一個產品方向：V1.5 Search Foundation／搜尋鋪路期（高搜尋、低維護日期與時間工具；四大分類不變）。

規格與流程：docs/tools/、docs/workflow/
Task briefs 與 validation reports 在 local-docs/，不納入 Git tracked。

Phase A：不要 push / deploy / commit 除非 Owner 明確授權。不要修改 Header、Footer、BaseLayout、global background 或既有工具核心功能，除非任務明確指定。
```
