# Timiva Year Progress Product Spec V1

Date: 2026-06-21  
Last updated: 2026-06-27  
Owner: Jane / Timiva  
Status: Implementation complete · Link integration complete（rebuild/main local commits `f39f8bc`, `20c379d`）· Not pushed · Not deployed

Related docs:

```text
docs/tools/year-progress/README.md
docs/core/product-architecture.md
docs/workflow/tool-link-integration.md
docs/project/current-status.md
```

---

## 1. Tool overview

### Public name

```text
English: Year Progress
繁體中文：今年進度
```

### Internal concept

```text
Year Progress Card
今年進度卡
```

「Card」只代表結果具有可截圖、可分享的完整感，不代表主畫面要放在實體卡片容器裡。

### Routes

```text
/en/year-progress/
/zh/year-progress/
```

### Category

```text
Life Progress / 人生進度
```

Timiva 四大分類名稱維持不變：

```text
Important Dates / 重要日子
Timers & Focus / 計時與專注
Daily Rhythm / 日常節奏
Life Progress / 人生進度
```

---

## 2. Product positioning

Year Progress 是 Timiva V1 第四個核心工具，也是 Life Progress 類別在 V1 的代表工具。

核心體驗：

```text
打開頁面。
看見今年已經走到哪裡。
讀到一句當月提醒。
用 12 段柔和膠囊感受年度節奏。
切換心情。
分享當下。
```

產品特性：

```text
Zero-input
Mobile-first
Full-bleed
Calm
Low-maintenance
Widget-like
Pure frontend first
```

它不是：

```text
Life countdown
Goal management
Milestone tracker
Habit tracker
Productivity dashboard
Multi-mode progress calculator
```

---

## 3. MVP scope

### Included

```text
1. Current year
2. Integer year-progress percentage
3. Days passed / days remaining
4. One monthly note
5. 12-segment monthly pill progress
6. Theme switching
7. Share behavior aligned with Event Countdown
8. EN / ZH
9. About / How to use / capsule tags
10. FAQ / FAQ JSON-LD / metadata
11. Related Tools
12. ToolAdSlot in disabled state
```

### Explicitly excluded

```text
Life mode
Custom timeline
Birth date input
Goal date input
Milestone input
Multi-mode switch
Goal tracking
Task tracking
Daily notes
AI-generated notes
User-uploaded notes
Backend
CMS
Database
Image export
Account / cloud sync
```

Future extensions should be separate small tools:

```text
Month Progress
Milestone Progress（working name）
Life Timeline
Goal Countdown
```

---

## 4. Main visual direction

The first-screen tool experience should be:

```text
Full-bleed
Fullscreen-like
Immersive
Large centered percentage
Soft themed background
No visible card shell
No obvious bordered panel
```

Do not change the protected global background or BaseLayout.
The themed visual belongs to the tool’s own first-screen visual layer.

---

## 5. Main result copy

### Traditional Chinese

```text
2026 年已經走過

46%
```

### English

```text
2026 has unfolded

46%
```

The year is dynamic.
The large percentage is the primary result.

Tone:

```text
Calm
Observational
Not judgmental
Not productivity pressure
Not a completion score
```

---

## 6. First-screen hierarchy

### Mobile portrait and desktop

```text
1. Tool name / year context
2. “2026 年已經走過” / “2026 has unfolded”
3. Large percentage
4. Days passed / days remaining
5. Monthly note
6. 12-segment pill progress
7. Theme / Share
```

Information roles:

```text
Percentage = primary visual result
Days = rational supporting information
Monthly note = emotional layer
12 segments = annual rhythm
Theme / Share = secondary controls
```

### Desktop intent

```text
Keep the main visual centered within the first-screen stage.
The exact vertical offset, max width, type scale, and control spacing are implementation-level decisions.
Cursor must propose them during Plan-first by comparing existing V2 tools.
```

---

## 7. Date and progress rules

### Time basis

```text
Use the user device’s local date and local time.
Do not require a timezone input.
```

### Year length

```text
Normal year: 365 days
Leap year: 366 days
Leap-year February: 29 days
```

### Days passed / remaining

Recommended semantic baseline:

```text
daysPassed = fully elapsed calendar days before today
daysRemaining = total days in year - daysPassed
```

Examples:

```text
Jan 1:
0 days passed
365 or 366 days remaining

Dec 31 in a normal year:
364 days passed
1 day remaining
```

The current day is included in “days remaining.”

### Percentage

```text
Calculate progress from the start of the local year to the start of the next local year.
Display an integer percentage.
Do not show 100% early on Dec 31.
```

Required edge behavior:

```text
The active year should remain below 100% until the year is effectively complete.
At year rollover, the page should switch to the new year rather than keep showing the previous year at 100%.
```

The exact rounding / clamping formula is an implementation-level rule.
Cursor must propose one testable formula during Plan-first and include Jan 1, leap day, Dec 31, and year-rollover tests.

### Refresh and update behavior

```text
Recalculate on page load.
Recalculate when the page becomes visible again.
Update when the local calendar day changes.
No second-by-second countdown animation is required.
```

---

## 8. 12-segment pill progress

### Structure

```text
12 segments
1 segment = 1 calendar month
January to December, left to right
Pill-shaped
No dots
No circular progress as the primary year visualization
```

### States

```text
Completed months: fully filled
Current month: partially filled
Future months: low contrast / unfilled
```

### Current-month fill

```text
Use actual progress within the current calendar month.
Use the actual number of days in that month.
Leap-year February uses 29 days.
```

The current-month partial fill should remain visually consistent with the annual percentage.

Mobile does not need visible month labels unless a later QA task proves they are necessary.

---

## 9. Monthly notes

### Recommended content path

```text
src/content/year-progress/monthly-notes.json
```

Rules:

```text
EN and ZH in the same data file
One note per month
Internal project content only
No CMS
No backend
No daily randomization
No AI generation
No user customization
Easy annual review by editing one file
```

### Confirmed monthly notes V1

| Month | 繁體中文 | English |
|---:|---|---|
| 1 | 讓這一年，從一小步開始。 | Let the year begin with one small step. |
| 2 | 小小的前進，也算數。 | Small steps still count. |
| 3 | 留意那些正在慢慢長出來的事。 | Notice what is beginning to grow. |
| 4 | 調整一下節奏，也是一種前進。 | A small adjustment is still progress. |
| 5 | 把注意力留給真正重要的事。 | Keep your attention on what matters. |
| 6 | 這一年走到一半，還有一半可以慢慢使用。 | Half the year has passed, and half is still yours to use. |
| 7 | 重新開始，不一定要等到明年。 | You can begin again before a new year arrives. |
| 8 | 慢慢維持，也是一種力量。 | Keeping a gentle rhythm is its own strength. |
| 9 | 收斂一些，讓重點變清楚。 | Narrow the noise. Let the focus become clear. |
| 10 | 看看已經完成的，也看看還想留下的。 | Notice what is done, and what still matters. |
| 11 | 放慢一點，把剩下的時間用得剛好。 | Slow down a little. Use what remains gently. |
| 12 | 慢慢收尾，也記得看看自己走過的路。 | Close the year gently, and notice how far you came. |

---

## 10. Theme direction

Theme should extend Timiva’s existing Event Countdown visual language.

### Year Progress additions

```text
Mist / 霧光
Forest / 森光
```

### Mist / 霧光

```text
Recommended default feeling
Blue-gray / soft purple-gray
Mist-like
Low contrast
Soft glow
```

### Forest / 森光

```text
Natural forest feeling
Deep green / gray green
Low saturation
Soft forest-like glow
No literal forest image
No leaf pattern
No bright or neon green
```

### Theme affects

```text
Tool-specific background gradient
Soft glow
Pill active color
Button / chip accent detail
```

### Theme does not affect

```text
Typography
Layout
Button dimensions
Calculation
Monthly note
Content order
```

---

## 11. Reusable Tool Theme Layer

Create a reusable:

```text
Tool Theme Layer
工具主視覺主題層
```

It is for tool-specific hero / first-screen visual themes.
It is not the global site background.

It may govern:

```text
Theme tokens
Tool visual gradients
Glow tokens
Progress active colors
Control accent details
```

It must not govern or modify:

```text
Global background
BaseLayout
Header
Footer
Whole-site page shell
```

Implementation boundary:

```text
Year Progress should be the first new tool to use this shared layer.
Event Countdown themes are the visual source and architecture reference.
Do not refactor the accepted Event Countdown implementation in the same task.
Any later Event Countdown migration needs a separate Owner-approved task.
```

Possible files are not product decisions:

```text
src/styles/tool-themes.css
src/lib/toolThemes.ts
```

Cursor must inspect the repository and propose the actual file structure during Plan-first.

---

## 12. Responsive behavior

### Mobile portrait

Keep:

```text
Tool name / year
Main copy
Large percentage
Days passed / remaining
Monthly note
12-segment pill progress
Theme / Share
```

Goals:

```text
Main result is immediately understandable.
Controls are comfortably reachable.
No unnecessary first-screen density.
```

### Mobile landscape

Intentionally reduce content.

Keep:

```text
Tool name / year context
Main percentage
Compact days information if it remains visually comfortable
Theme / Share controls
```

Remove from the first screen:

```text
Monthly note
12-segment pill progress
```

Rules:

```text
Primary number remains dominant.
Controls stay near the bottom of the first screen.
Do not reuse the full portrait stack.
Do not force hidden content into a cramped landscape layout.
```

### Desktop

```text
Centered immersive main visual
No literal card container
Monthly note and 12-segment progress remain visible
Theme / Share remain secondary
```

Exact dimensions belong to the B1B static-visual task.

---

## 13. Controls and persistence

### Controls

```text
Theme / 主題
Share / 分享
```

### Theme preference

Product requirement:

```text
Default theme: Mist / 霧光
```

Repository-alignment rule:

```text
During Plan-first, Cursor must inspect Event Countdown’s actual theme persistence pattern.
It must recommend whether Year Progress should reuse that same local persistence behavior.
Do not invent an unrelated theme-storage system.
```

### Share

```text
Reuse Event Countdown’s established share pattern.
Do not build a separate sharing system.
No image download / generated share card in MVP.
```

Exact share copy and fallback behavior must be proposed after repository inspection.

---

## 14. Lower content

### Capsule tags

Suggested:

```text
Yearly reflection / 年度回顧
Time awareness / 時間感
Gentle reminder / 輕量提醒
```

### About draft

#### 繁體中文

```text
今年進度讓你快速看見今年已經走過多少、還剩多少。頁面會依照裝置的本地時間自動更新，不需要輸入日期或設定目標。
```

#### English

```text
Year Progress gives you a quiet glance at how much of the current year has passed and how much remains. It updates from your device’s local time with no setup required.
```

### How to use draft

#### 繁體中文

```text
打開頁面即可查看今年進度、已過天數與剩餘天數。當月提醒和 12 段月份進度會自動更新。你也可以切換主題，或分享目前的年度進度。
```

#### English

```text
Open the page to see the current year percentage, days passed, and days remaining. The monthly note and 12-month progress update automatically. You can also change the theme or share the current progress.
```

### FAQ draft

#### 1. 今年進度是怎麼計算的？

```text
工具會依照你裝置的本地日期與時間，計算從今年開始到明年開始之間已經經過的比例。
```

```text
The tool uses your device’s local date and time to calculate the elapsed portion between the start of this year and the start of the next year.
```

#### 2. 閏年會怎麼計算？

```text
閏年會以 366 天計算，2 月使用 29 天。畫面仍維持 12 段月份進度，不會增加第 13 段。
```

```text
Leap years use 366 days and February uses 29 days. The visual still keeps 12 monthly segments.
```

#### 3. 為什麼 12 月 31 日不會太早顯示 100%？

```text
為了避免在一年真正結束前就顯示完成，工具會讓進度在年末持續接近 100%，並在跨年後切換到新年度。
```

```text
To avoid showing completion before the year has actually ended, progress stays below 100% through the active year and switches to the new year at rollover.
```

#### 4. 需要輸入個人資料嗎？

```text
不需要。工具會直接使用裝置的本地時間計算，不需要生日、帳號或其他個人資料。
```

```text
No. The tool calculates from your device’s local time and does not require a birthday, account, or other personal information.
```

#### 5. 可以在手機上使用嗎？

```text
可以。手機直式會顯示完整年度資訊；手機橫式會保留主要數字與控制，減少畫面擁擠。
```

```text
Yes. Mobile portrait shows the full year view, while mobile landscape keeps the primary result and controls compact.
```

### Related Tools

Initial:

```text
Event Countdown
Date Range Calculator
Countdown Timer
```

Future replacement candidates:

```text
Month Progress
Milestone Progress
Goal Countdown
```

---

## 15. SEO baseline

### English

```text
H1: Year Progress
Meta title: Year Progress — See How Much of the Year Has Passed | Timiva
Meta description: See the current year’s progress, days passed, days remaining, monthly rhythm, and a calm reminder—automatically based on your local time.
```

### Traditional Chinese

```text
H1：今年進度
Meta title：今年進度－查看今年已過與剩餘比例 | Timiva
Meta description：快速查看今年已經走過多少、還剩多少天，以及 12 個月份的年度節奏。依照你的本地時間自動更新。
```

SEO content must remain below the primary tool experience.
Do not turn the page into a long-form SEO article.

---

## 16. Product function flow

```mermaid
flowchart TD
    A[Open Year Progress] --> B[Read device local date and time]
    B --> C[Determine current year and leap-year length]
    C --> D[Calculate elapsed year position]
    D --> E[Generate integer percentage]
    D --> F[Calculate days passed and remaining]

    B --> G[Determine current month]
    G --> H[Load EN or ZH monthly note]
    G --> I[Build 12 monthly segments]
    I --> I1[Past months full]
    I --> I2[Current month partial]
    I --> I3[Future months low contrast]

    A --> J[Load Tool Theme Layer]
    J --> J1[Mist default]
    J --> J2[Forest]
    J --> J3[Eligible existing Timiva themes]

    E --> K[Render first-screen result]
    F --> K
    H --> K
    I --> K
    J --> K

    K --> L{Viewport mode}
    L -->|Mobile portrait| M[Full result + note + 12 segments + controls]
    L -->|Mobile landscape| N[Compact result + controls]
    L -->|Desktop| O[Centered immersive full result]

    M --> P[Theme]
    N --> P
    O --> P
    P --> Q[Apply theme tokens]

    M --> R[Share]
    N --> R
    O --> R
    R --> S[Reuse Event Countdown share pattern]

    K --> T[Render lower content]
    T --> T1[About / How to]
    T --> T2[Capsule tags]
    T --> T3[FAQ / JSON-LD]
    T --> T4[Related Tools]

    K --> U[Visibility change or local day rollover]
    U --> B
```

---

## 17. Development sequence

Use Timiva’s layout-first workflow:

```text
Plan-first: repository audit and batch proposal

B0:
V2 tool page scaffold

B1A:
Lower content
About / How to / capsule tags / FAQ / JSON-LD / Related Tools / EN / ZH

B1B:
Upper static visual
Percentage / days / note / 12 segments / Theme and Share controls
Mobile portrait / mobile landscape / desktop

B2A:
Date calculation and automatic update behavior

B2B:
Tool Theme Layer / theme switching / persistence alignment / share behavior

B3:
Cross-device QA / regression / docs / validation report

Post-tool Link Integration:
Run only after the standalone tool is accepted and committed
```

Each batch requires a completion report and Owner approval before the next batch.

---

## 18. Locked and protected scope

Do not modify without explicit Owner approval:

```text
Header
Footer visual layout
BaseLayout
Global background
ToolCard baseline
RelatedToolRow baseline
Tool Drawer baseline
LegalTextLayout
Event Countdown core logic
Event Countdown theme / share behavior
Date Range calculation core
Countdown Timer accepted implementation
ToolAdSlot visual style
```

ToolAdSlot remains disabled.
No live AdSense integration.

---

## 19. Ready-for-plan conclusion

Product decisions are complete enough to enter Plan-first.

The following are repository / implementation decisions, not unresolved product questions:

```text
Exact shared theme file names
Exact component hierarchy
Exact CSS class and token names
Whether existing theme persistence can be reused directly
Exact Event Countdown share helper reuse
Exact desktop measurements
```

Cursor must inspect the repository and propose these before editing files.

---

## 產品流程

> 本章節整合自原 `timiva-year-progress-product-flow-v1.md`，作為實作與 QA 的流程參考。  
> 狀態：產品流程已確認 · B0–B3 與 Link Integration 已於 rebuild/main 完成本地 commit。

### 主要使用流程

```mermaid
flowchart TD
    A[使用者開啟 Year Progress] --> B[讀取裝置本地日期時間]
    B --> C[判定當年]
    C --> D{閏年?}
    D -->|否| E[365 天]
    D -->|是| F[366 天]

    E --> G[計算年度已過位置]
    F --> G
    G --> H[產生整數年度百分比]
    G --> I[計算已過天數]
    G --> J[計算剩餘天數]

    B --> K[判定當月]
    K --> L[載入語系月度提醒]
    K --> M[產生 12 段月份膠囊]
    M --> M1[已過月份填滿]
    M --> M2[當月部分填滿]
    M --> M3[未來月份低對比]

    A --> N[載入 Tool Theme Layer]
    N --> N1[Mist / 霧光 預設]
    N --> N2[Forest / 森光]
    N --> N3[符合條件的既有 Timiva themes]

    H --> O[組合主結果]
    I --> O
    J --> O
    L --> O
    M --> O
    N --> O

    O --> P{Viewport}
    P -->|Mobile portrait| Q[完整層級]
    P -->|Mobile landscape| R[精簡層級]
    P -->|Desktop| S[居中沉浸層級]

    Q --> Q1[百分比]
    Q --> Q2[天數]
    Q --> Q3[月度提醒]
    Q --> Q4[12 段膠囊]
    Q --> Q5[Theme / Share]

    R --> R1[百分比]
    R --> R2[天數（空間允許時）]
    R --> R3[Theme / Share]
    R --> R4[隱藏提醒與 12 段]

    S --> S1[百分比]
    S --> S2[天數]
    S --> S3[月度提醒]
    S --> S4[12 段膠囊]
    S --> S5[Theme / Share]

    Q5 --> T{使用者操作}
    R3 --> T
    S5 --> T
    T -->|Theme| U[套用 shared theme tokens]
    T -->|Share| V[沿用 Event Countdown share 模式]

    O --> W[Lower content]
    W --> W1[About]
    W --> W2[How to use]
    W --> W3[Capsule tags]
    W --> W4[FAQ / JSON-LD]
    W --> W5[Related Tools]

    O --> X{頁面回到前景或本地日期變更}
    X --> B
```

### 計算流程

```mermaid
flowchart TD
    A[本地 now] --> B[當年本地起始]
    A --> C[下一年本地起始]
    B --> D[年度總時長]
    C --> D
    A --> E[已過年度時長]
    B --> E

    D --> F[原始進度]
    E --> F
    F --> G[整數顯示規則]
    G --> H[避免過早 100%]
    H --> I[顯示百分比]

    A --> J[本地 day-of-year]
    J --> K[今日之前已完成天數]
    K --> L[已過天數]
    D --> M[365 或 366 曆日]
    L --> N[剩餘天數 = 總天數 - 已過天數]
    M --> N
```

實作必須測試：

```text
Jan 1
Feb 28
Feb 29（閏年）
Mar 1（閏年後）
Dec 31
本地跨年
跨午夜開啟
背景化後恢復
```

### Theme 流程

```mermaid
flowchart TD
    A[開啟工具] --> B[解析預設 / 既有偏好]
    B --> C[Tool Theme Layer]
    C --> D[Mist]
    C --> E[Forest]
    C --> F[符合條件的既有 themes]

    D --> G[背景漸層]
    E --> G
    F --> G

    D --> H[柔和光暈]
    E --> H
    F --> H

    D --> I[膠囊 active 色]
    E --> I
    F --> I

    D --> J[控制項 accent]
    E --> J
    F --> J

    G --> K[渲染 Year Progress]
    H --> K
    I --> K
    J --> K
```

Tool Theme Layer **不得**修改：

```text
BaseLayout
Global background
Header
Footer
Whole-site page shell
```

Theme 持久化與 URL share 參數見 B2B2 / B2B3 驗收報告（`local-docs/reports/year-progress/`）。

### 開發 Gate 流程

```mermaid
flowchart TD
    A[產品規格確認] --> B[Plan-first repository audit]
    B --> C{Owner 批准 plan?}
    C -->|否| B
    C -->|是| D[B0 V2 scaffold]

    D --> E[Validation report]
    E --> F{Owner 批准?}
    F -->|否| D
    F -->|是| G[B1A lower content]

    G --> H[Validation report]
    H --> I{Owner 批准?}
    I -->|否| G
    I -->|是| J[B1B static visual]

    J --> K[Mobile portrait / landscape / desktop review]
    K --> L{Owner 批准?}
    L -->|否| J
    L -->|是| M[B2A calculation]

    M --> N[B2B theme and share]
    N --> O[Full QA and Agent Reviews]
    O --> P{Owner 接受 standalone?}
    P -->|否| M
    P -->|是| Q[Tool implementation commit]

    Q --> R[Post-tool Link Integration Gate]
    R --> S[Link QA and separate commit]
    S --> T[Push / deploy readiness]
```

目前進度（2026-06-27）：

```text
B0–B3 standalone：完成（commit f39f8bc）
Post-tool Link Integration：完成（commit 20c379d）
Automated validation：node scripts/validate-tool-link-integration.mjs — passed
Push / deploy：待 Owner 授權
HTTPS Share 成功驗證：deploy 後 non-blocking follow-up
```

Link Integration 規則與 checklist：`docs/workflow/tool-link-integration.md`
