# Timiva Task — Home Content & Home / All Tools Animation

## Task status

```text
Ready for Cursor planning
```

## Task type

```text
Home content update
Home page SEO / AEO content
Home / All Tools page animation
Structured Data preparation
```

## Required context

Before starting, read:

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-product-principles-v2.md
docs/timiva-layout-system-v2.md
docs/timiva-design-system-v2.md
docs/timiva-tailwind-css-guidelines-v2.md
docs/timiva-seo-aeo-ai-search-guidelines-v2.md
docs/timiva-ad-layout-guidelines-v1.md
```

Important current-status constraints:

```text
Use docs/timiva-current-status.md as the source of truth.
Do not redesign or rewrite completed / verified pages.
Do not modify locked / protected components unless Owner explicitly approves.
```

Protected areas:

```text
Header
Footer visual layout
BaseLayout
Global background
Preview layout baseline
ToolCard baseline
RelatedToolRow baseline
Tool Drawer baseline
LegalTextLayout spacing
EventCountdownV2 core logic
Date Range Calculator core logic
```

---

## 1. Objective

Update the Timiva Home Page content and add light, low-maintenance animation for Home Page and All Tools Page.

The goal is to make the homepage feel:

```text
clean
calm
mobile-first
Widget-like
easy to understand
SEO / AEO friendly
not like a traditional tool directory
```

The homepage should remain a simple entry point with four main tools.

---

## 2. Scope

This task may modify:

```text
Home Page content
Home Page FAQ / Help content
Home Page JSON-LD structured data
Home Page page-level animation overlay
All Tools Page page-level animation overlay
Page-level CSS for Home / All Tools animation
```

This task must not modify:

```text
Header
Footer visual layout
BaseLayout
Global background
ToolCard baseline
RelatedToolRow baseline
Tool Drawer baseline
EventCountdownV2 core logic
Date Range Calculator core logic
Legal pages
LegalTextLayout
```

If implementation appears to require touching any protected area, stop and report:

```text
Component:
Reason:
Impact:
Alternative:
Owner approval required:
```

---

## 3. Final Home Page structure

Home Page should follow this structure:

```text
Hero title
Hero subtitle
Hero lightweight chips
4 main tool cards
View all tools
Ad Container reserved area
FAQ & Help
Footer
```

Do not add:

```text
Hero CTA buttons
Tool section title above the 4 cards
Separate About Timiva section
Long SEO article section
Extra homepage tool list
```

---

## 4. Hero content

### 4.1 Chinese Home Hero

```text
讓時間被看見，也更好計算。

簡單、舒服、手機好用的時間與生活節奏工具。
```

### 4.2 English Home Hero

```text
Make time visible, simple, and easier to use.

Simple, calm, mobile-friendly tools for important dates, focus, daily rhythm, and life progress.
```

---

## 5. Hero CTA decision

Remove or do not render Hero CTA buttons.

Reason:

```text
The homepage already shows the four main tool cards near the hero.
The tool cards are the primary entry points.
Hero buttons would duplicate the same navigation intent.
The homepage should stay calm and low-noise.
```

Do not replace the CTA buttons with new buttons.

---

## 6. Hero chips

Add lightweight chips below the Hero subtitle.

### 6.1 Chinese chips

```text
重要日子
日期計算
倒數計時
人生進度
```

### 6.2 English chips

```text
Important Dates
Date Calculations
Countdown Timer
Life Progress
```

### 6.3 Chips behavior

Chips are visual / semantic hints only.

They must not be:

```text
links
buttons
filters
tabs
active states
category navigation
```

They should not have strong hover behavior.

### 6.4 Chips accessibility rule

Do not use aria-label to hide SEO text inside chips.

Do not do this:

```html
<span aria-label="Timiva 提供重要日子與倒數計算功能">重要日子</span>
```

Allowed:

```html
<ul aria-label="Timiva tool categories">
  <li>重要日子</li>
  <li>日期計算</li>
  <li>倒數計時</li>
  <li>人生進度</li>
</ul>
```

The aria-label may describe the group, but each chip should rely on visible text.

---

## 7. Home tool cards

Homepage should show exactly four main tools.

### 7.1 Tool order

```text
1. Event Countdown
2. Date Range Calculator
3. Countdown Timer
4. Life Progress Bar
```

### 7.2 Chinese tool card copy

```text
事件倒數
為生日、旅行、節日或重要日子建立清楚好看的倒數。

日期區間計算機
快速計算兩個日期之間相差幾天、工作日與週末。

倒數計時器
為專注、料理、運動或休息設定一段清楚的倒數時間。

人生進度條
把年份、月份或人生時間變成一條看得見的進度。
```

### 7.3 English tool card copy

```text
Event Countdown
Create a clean countdown for birthdays, trips, holidays, and important dates.

Date Range Calculator
Calculate the days, workdays, and weekends between two dates.

Countdown Timer
Set a simple timer for focus, cooking, workouts, breaks, or everyday tasks.

Life Progress Bar
Turn years, months, life, or personal timelines into a visible progress bar.
```

### 7.4 Mobile tool cards

Mobile cards may keep the existing rule:

```text
show icon
show tool name
show arrow
hide description
```

Do not use hidden aria-label or structured data to replace hidden mobile descriptions.

Tool descriptions must remain visible somewhere else on the page or on the tool page.

---

## 8. View all tools

Keep View all tools after the four tool cards.

### Chinese

```text
查看全部工具
```

URL:

```text
/zh/tools/
```

### English

```text
View all tools
```

URL:

```text
/en/tools/
```

---

## 9. Ad Container reserved area

Add or prepare a reserved Ad Container position after View all tools and before FAQ & Help.

Final order:

```text
4 main tool cards
View all tools
Ad Container reserved area
FAQ & Help
Footer
```

### 9.1 Ad size

Reserved desktop / wide layout size:

```text
728 × 90
```

CSS direction:

```text
max-width: 728px
min-height: 90px
```

### 9.2 Initial status

V1 must not load live ads.

Default state:

```text
is-disabled
```

Possible states:

```text
is-disabled: not visible and does not occupy height
is-reserved: reserves 728 × 90 space but does not load live ads
is-active: live ad display, future only
```

### 9.3 Ad rules

Do not place ads:

```text
above Hero
between Hero and tool cards
inside the four tool cards
between tool cards
above View all tools
inside FAQ questions
inside Footer
on Legal / Text pages
```

Do not load AdSense in this task.

---

## 10. FAQ & Help section

Homepage bottom FAQ section should be named:

Chinese:

```text
常見問題與協助
```

English:

```text
FAQ & Help
```

This section replaces any separate About Timiva block.

Timiva’s product description, brand promise, mobile-first positioning, four-tool homepage strategy, privacy / local storage note, and free-use note should be naturally integrated into FAQ answers.

---

## 11. Chinese FAQ content

### 常見問題與協助

#### Timiva 可以用來做什麼？

Timiva 提供簡單、舒服、手機好用的時間工具，可以用來建立事件倒數、計算日期區間、設定倒數計時，也能看見年份、月份或人生進度。首頁目前固定提供四個主要工具，讓你快速選擇最常用的時間功能。

#### Timiva 有哪些工具？

目前首頁包含事件倒數、日期區間計算機、倒數計時器與人生進度條。這些工具分別對應重要日子、日期計算、計時與專注，以及長期時間進度。

#### 如何開始使用 Timiva 的工具？

直接從首頁選擇一張工具卡片即可開始使用。每個工具都以手機優先設計，盡量減少輸入欄位與設定步驟，讓你打開後就能快速完成主要操作。

#### Timiva 可以在手機上使用嗎？

可以。Timiva 的工具卡片、輸入欄位、按鈕與結果畫面都優先考慮手機操作，讓你在手機直式或橫式瀏覽時都能清楚使用。

#### Timiva 會儲存我的資料嗎？

Timiva 主要在你的瀏覽器中運作。部分工具可能會使用本機儲存記住你上次輸入的內容，但不需要註冊或登入，也不會建立帳號資料庫。

#### 為什麼 Timiva 不放很多工具在首頁？

Timiva 的理念是少工具，但每個都要簡單、清楚、舒服。首頁固定保留四個主要工具，是為了避免變成傳統工具大全，讓使用者可以更快找到真正需要的入口。

#### Timiva 是免費使用的嗎？

是的，Timiva 目前可以免費使用，不需要註冊帳號。

---

## 12. English FAQ content

### FAQ & Help

#### What can I use Timiva for?

Timiva provides simple, calm, mobile-friendly time tools for creating event countdowns, calculating date ranges, setting countdown timers, and seeing progress across years, months, or life. The homepage highlights four main tools so the most useful time features stay easy to find.

#### What tools are available on Timiva?

The homepage currently includes Event Countdown, Date Range Calculator, Countdown Timer, and Life Progress Bar. These tools cover important dates, date calculations, timers and focus, and long-term time progress.

#### How do I start using a Timiva tool?

Choose a tool card from the homepage and open the tool you need. Each tool is designed mobile-first, with fewer input fields and simple controls so you can complete the main task quickly.

#### Can I use Timiva on mobile?

Yes. Timiva is designed for mobile use first, so tool cards, inputs, buttons, and result screens are optimized for both portrait and landscape phone browsing.

#### Does Timiva save my data?

Timiva mainly runs in your browser. Some tools may use local storage to remember your last input, but Timiva does not require sign-in or create an account database.

#### Why does Timiva keep only a few tools on the homepage?

Timiva is built around a simple idea: fewer tools, but each one should feel clear, useful, and comfortable. The homepage keeps four main tools so Timiva does not become a noisy tool directory.

#### Is Timiva free to use?

Yes. Timiva is currently free to use and does not require an account.

---

## 13. Home Structured Data

Add or update Home Page JSON-LD structured data.

Recommended schemas:

```text
WebSite
Organization
ItemList
FAQPage
```

Rules:

```text
Use JSON-LD.
Chinese and English pages must use their own language and URLs.
ItemList should include only the four visible homepage tools.
FAQPage must match the visible FAQ & Help content.
Do not use structured data to add invisible SEO copy.
Do not add rating, review, download count, user count, or unsupported claims.
```

Do not add:

```text
aggregateRating
review
ratingValue
reviewCount
downloadCount
userInteractionCount
```

---

## 14. Tool page WebApplication Schema

If this task includes tool page schema preparation, use WebApplication Schema for formal tool pages.

Allowed target tool pages:

```text
Event Countdown
Date Range Calculator
Countdown Timer
Life Progress Bar
```

Do not modify tool logic.

Recommended fields:

```text
@context
@type: WebApplication
name
url
applicationCategory
operatingSystem
description
featureList
isAccessibleForFree
offers
```

Rules:

```text
description must match visible page content.
featureList must match visible page features.
Use JSON-LD.
Use language-specific URL and content.
Do not add rating, review, download count, user count, or unsupported claims.
```

Note:

```text
Event Countdown and Date Range Calculator already exist / are treated as verified.
Do not redesign or rewrite their tool logic.
```

---

## 15. Animation scope

This task may add light animation for:

```text
Home Page
All Tools Page
```

Do not add this animation to:

```text
Tool pages
Legal / Text pages
Contact / Privacy / Terms pages
```

---

## 16. Page-level animated glow overlay

Add a Home / All Tools page-level animated glow overlay.

Rules:

```text
Use pure CSS only.
Do not use JavaScript.
Do not use canvas.
Do not use particle libraries.
Do not use mouse tracking.
Do not modify Global Background.
Do not modify BaseLayout.
Do not affect Header or Footer.
Do not affect ToolCard baseline.
```

Visual direction:

```text
subtle
low opacity
low saturation
slow drift
soft glow
not neon
not flashy
not distracting
```

Suggested timing:

```text
24–40 seconds per loop
small drift only
no flicker
no bounce
```

Accessibility:

```text
Respect prefers-reduced-motion.
When reduced motion is enabled, disable animation or use static glow.
```

---

## 17. Hero / content entrance animation

Home Page may keep or add lightweight entrance animation.

Allowed:

```text
Hero title fade in + small rise
Hero subtitle delayed fade in
Hero chips stagger fade in
Four tool cards initial stagger fade in
FAQ open / close animation
```

Do not change:

```text
existing ToolCard hover behavior
ToolCard baseline
Header animation
Footer animation
Global background
```

ToolCard hover note:

```text
Existing ToolCard hover behavior should remain unchanged.
Do not redesign or reduce the hover movement.
```

Animation feel:

```text
calm
soft
subtle
not bouncy
not flashy
not like a landing-page effect
```

All entrance animation must respect:

```text
prefers-reduced-motion
```

---

## 18. SEO / AEO rules

Content and structured data must follow these rules:

```text
Visible content first.
Structured data mirrors visible content.
FAQ answers real questions.
Do not keyword-stuff.
Do not hide SEO copy in aria-label.
Do not hide SEO copy in JSON-LD.
Do not make the homepage feel like a traditional SEO article.
```

---

## 19. Required validation

After implementation, run:

```bash
npm run build
```

Also check:

```text
/en/
/zh/
/en/tools/
/zh/tools/
Mobile portrait
Mobile landscape
Desktop
Console errors
FAQ rendering
FAQ JSON-LD consistency
ItemList JSON-LD consistency
Ad Container disabled state
prefers-reduced-motion behavior
```

---

## 20. Validation report format

Cursor must return:

```text
# Timiva Validation Report — Home Content & Animation

## 1. Completed scope
- ...

## 2. Modified files
- ...

## 3. Locked / protected components
- Modified: Yes / No
- Notes:

## 4. Home content checks
| Item | Result | Notes |
|---|---|---|
| Hero title / subtitle | Pass / Block | |
| Hero CTA removed | Pass / Block | |
| Hero chips | Pass / Block | |
| Four tool cards | Pass / Block | |
| View all tools | Pass / Block | |
| FAQ & Help | Pass / Block | |
| Ad Container position | Pass / Block / N/A | |

## 5. Animation checks
| Item | Result | Notes |
|---|---|---|
| Home animated glow overlay | Pass / Block / N/A | |
| All Tools animated glow overlay | Pass / Block / N/A | |
| Pure CSS only | Pass / Block | |
| No JS / canvas / particles | Pass / Block | |
| Existing ToolCard hover unchanged | Pass / Block | |
| prefers-reduced-motion | Pass / Block | |

## 6. SEO / structured data checks
| Item | Result | Notes |
|---|---|---|
| WebSite | Pass / Block / N/A | |
| Organization | Pass / Block / N/A | |
| ItemList | Pass / Block / N/A | |
| FAQPage | Pass / Block / N/A | |
| WebApplication | Pass / Block / N/A | |
| No hidden SEO copy | Pass / Block | |
| No ratings / reviews | Pass / Block | |

## 7. Build
- npm run build: Pass / Block

## 8. Device checks
- Mobile portrait:
- Mobile landscape:
- Desktop:

## 9. Required fixes
- ...

## 10. Owner confirmation needed
- ...
```

---

## 21. Owner approval rule

Do not commit or deploy after completing this task.

Owner must confirm:

```text
Home content is correct
English and Chinese content are acceptable
Animation feels calm and not distracting
No locked components were modified
npm run build passes
Mobile portrait / landscape are acceptable
```
