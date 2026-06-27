# Timiva Wireframes README

## 文件目的

本文件說明 `docs/wireframes/` 內的線稿檔案命名、對應頁面、裝置、變體與使用規則。

Cursor、Agents、Skills 在實作 Header、Footer、Layout、工具頁、全部工具頁與純文字頁時，必須先閱讀本文件，再依照對應線稿實作。

---

## 1. 線稿資料夾位置

所有線稿圖片放在：

```text
docs/wireframes/
```

---

## 2. 命名規則

線稿檔名採用編號命名：

```text
[編號]-[頁型]-[裝置]-[狀態或變體].jpg
```

目前使用：

```text
approved-01-home-mobile-portrait.jpg
approved-02-home-desktop.jpg

approved-03-all-tools-mobile-portrait.jpg
approved-04-all-tools-desktop.jpg

approved-05-text-page-mobile-portrait.jpg
approved-06-text-page-desktop.jpg

approved-07-tool-date-range-mobile-portrait.jpg
approved-08-tool-date-range-mobile-landscape.jpg
approved-09-tool-date-range-desktop.jpg

approved-10-tool-event-mobile-portrait.jpg
approved-11-tool-event-mobile-landscape.jpg

approved-12-tool-desktop-sidebar.jpg
approved-13-tool-desktop-no-sidebar.jpg
```

---

## 3. 線稿總覽

| 編號 | 檔名 | Page | Viewport | 主要用途 |
|---|---|---|---|---|
| 01 | `approved-01-home-mobile-portrait.jpg` | Home | Mobile Portrait 390 | 首頁手機直式 |
| 02 | `approved-02-home-desktop.jpg` | Home | Desktop 1440 | 首頁桌機版 |
| 03 | `approved-03-all-tools-mobile-portrait.jpg` | All Tools | Mobile Portrait 390 | 全部工具頁手機直式 |
| 04 | `approved-04-all-tools-desktop.jpg` | All Tools | Desktop 1440 | 全部工具頁桌機版 |
| 05 | `approved-05-text-page-mobile-portrait.jpg` | Text Page | Mobile Portrait 390 | 純文字頁手機直式，代表 Privacy / Terms / Contact |
| 06 | `approved-06-text-page-desktop.jpg` | Text Page | Desktop | 純文字頁桌機版，代表 Privacy / Terms / Contact |
| 07 | `approved-07-tool-date-range-mobile-portrait.jpg` | Tool Page | Mobile Portrait 390 | Date Range Calculator 手機直式 |
| 08 | `approved-08-tool-date-range-mobile-landscape.jpg` | Tool Page | Mobile Landscape | Date Range Calculator 手機橫式第一屏 compact layout |
| 09 | `approved-09-tool-date-range-desktop.jpg` | Tool Page | Desktop | Date Range Calculator 桌機版 |
| 10 | `approved-10-tool-event-mobile-portrait.jpg` | Tool Page | Mobile Portrait 390 | Event Countdown / 通用工具頁手機直式 |
| 11 | `approved-11-tool-event-mobile-landscape.jpg` | Tool Page | Mobile Landscape | Event Countdown / 通用工具頁手機橫式 |
| 12 | `approved-12-tool-desktop-sidebar.jpg` | Tool Page | Desktop Large | 工具頁桌機大螢幕，有右側 sidebar |
| 13 | `approved-13-tool-desktop-no-sidebar.jpg` | Tool Page | Desktop Small / Tablet | 工具頁桌機小螢幕或平板，無 sidebar |

---

## 4. Header 規則

Header 必須依照線稿，不得自行設計成傳統網站導覽列。

### 4.1 Home Page Header

適用線稿：

```text
approved-01-home-mobile-portrait.jpg
approved-02-home-desktop.jpg
```

規則：

```text
首頁 Header 只顯示左上角 Timiva wordmark。
不要在首頁 Header 放 All Tools。
不要在首頁 Header 放 Language。
不要做一般網站導覽列。
不要做漢堡選單。
```

首頁導覽與語言切換主要放在 Footer 或頁面內容中的適當位置，不放在 Header。

---

### 4.2 Inner Page Header

適用線稿：

```text
approved-03-all-tools-mobile-portrait.jpg
approved-04-all-tools-desktop.jpg
approved-05-text-page-mobile-portrait.jpg
approved-06-text-page-desktop.jpg
approved-07-tool-date-range-mobile-portrait.jpg
approved-08-tool-date-range-mobile-landscape.jpg
approved-09-tool-date-range-desktop.jpg
approved-10-tool-event-mobile-portrait.jpg
approved-11-tool-event-mobile-landscape.jpg
approved-12-tool-desktop-sidebar.jpg
approved-13-tool-desktop-no-sidebar.jpg
```

規則：

```text
工具頁、全部工具頁、純文字頁使用左上角膠囊樣式。
內容為小 icon / square + Timiva。
這個 Header 行為上代表返回 Timiva / Home。
不要在右側加導覽。
不要放廣告。
不要加入複雜 dropdown。
```

---

## 5. Footer 規則

Footer 是全站共用元件。

Footer 應包含：

```text
Timiva
品牌簡短說明
全部工具
隱私權政策
使用條款
聯絡我們
語言切換
© 2026 Timiva
```

Footer 對應所有線稿：

```text
Home Page
All Tools Page
Tool Page
Text Page
```

Footer 在工具頁、全部工具頁、純文字頁中都應保持一致。

---

## 6. Home Page 線稿規則

適用線稿：

```text
approved-01-home-mobile-portrait.jpg
approved-02-home-desktop.jpg
```

### Layout

No ad：

```text
Header → Hero → Featured Tools Section → Footer
```

Ad enabled：

```text
Header → Hero → Featured Tools Section → Ad → Footer
```

### Key Rules

```text
Featured Tools Section = 4 tool cards + View All.
Mobile uses 2×2 tool cards.
Desktop uses 4 tool cards in one row.
If ad is enabled, ad appears below Featured Tools Section.
If ad is disabled, no ad space is reserved.
```

### Header

```text
首頁 Header = 左上角 Timiva wordmark。
不要放右側導覽。
```

---

## 7. All Tools Page 線稿規則

適用線稿：

```text
approved-03-all-tools-mobile-portrait.jpg
approved-04-all-tools-desktop.jpg
```

### Layout

No ad：

```text
Header → Page Hero → Category Sections → Footer
```

Ad enabled：

```text
Header → Page Hero → Category Sections → Ad → Footer
```

### Key Rules

```text
Category Sections contain grouped tool cards.
Mobile tool cards use 2 columns.
Desktop tool cards use 2 columns.
Ad appears after all Category Sections.
If ad is disabled, no ad space is reserved.
```

### Header

```text
All Tools Page 使用 inner page pill Header。
左上角為小 icon / square + Timiva。
```

---

## 8. Text Page 線稿規則

適用線稿：

```text
approved-05-text-page-mobile-portrait.jpg
approved-06-text-page-desktop.jpg
```

代表頁面：

```text
Privacy Policy
Terms of Use
Contact
```

### Layout

```text
Header → Page Title → Text Content → Footer
```

### Key Rules

```text
Text pages do not show ads.
Use a clean mobile reading layout.
Footer follows the global footer layout.
```

### Header

```text
Text Page 使用 inner page pill Header。
左上角為小 icon / square + Timiva。
```

---

## 9. Tool Page：Date Range Calculator 線稿規則

適用線稿：

```text
approved-07-tool-date-range-mobile-portrait.jpg
approved-08-tool-date-range-mobile-landscape.jpg
approved-09-tool-date-range-desktop.jpg
```

### Mobile Portrait Layout

```text
Header → Main Tool → Date Range Input → Related Tools → SEO → FAQ → Footer
```

### Mobile Landscape Layout

```text
Header → Compact Main Tool
Then follows shared Tool Page content:
Related Tools → SEO → FAQ → Footer
```

### Desktop Layout

```text
Header → Main Tool → Related Tools → SEO → FAQ → Footer
```

### Key Rules

```text
Mobile portrait keeps the result numbers as the main visual focus.
Default state shows 0 values and a date selection CTA.
Selected state shows calculated results and the selected date range.
Mobile landscape only defines the first-screen compact tool layout.
Below-the-fold content uses the shared Tool Page layout.
No sidebar on mobile.
No horizontal scroll.
Ad variant is not shown here.
Use the shared Tool Page ad placement rule.
```

---

## 10. Tool Page：Event Countdown / 通用工具頁規則

適用線稿：

```text
approved-10-tool-event-mobile-portrait.jpg
approved-11-tool-event-mobile-landscape.jpg
approved-12-tool-desktop-sidebar.jpg
approved-13-tool-desktop-no-sidebar.jpg
```

### Mobile Portrait Layout

No ad：

```text
Header → Main Tool → Related Tools → SEO → FAQ → Footer
```

Ad enabled：

```text
Header → Main Tool → Ad → Related Tools → SEO → FAQ → Footer
```

### Mobile Landscape Layout

```text
Header → Compact Main Tool → Related Tools → SEO → FAQ → Footer
```

### Desktop Large with Sidebar

No ad：

```text
Header → Main Tool + Sidebar → SEO → FAQ → Footer
```

Ad enabled：

```text
Header → Main Tool + Sidebar → Ad → SEO → FAQ → Footer
```

### Desktop Small / Tablet No Sidebar

No ad：

```text
Header → Main Tool → Related Tools → SEO → FAQ → Footer
```

Ad enabled：

```text
Header → Main Tool → Related Tools → Ad → SEO → FAQ → Footer
```

### Key Rules

```text
Main result stays visually dominant.
Mobile portrait uses the large result number.
Mobile landscape uses compact layout.
No sidebar on mobile.
No ads in mobile landscape.
Desktop sidebar appears only on wide desktop.
Sidebar contains Related Tools.
If ad is disabled, no ad space is reserved.
```

---

## 11. Sidebar 規則

Sidebar 只適用於：

```text
approved-12-tool-desktop-sidebar.jpg
```

規則：

```text
Sidebar appears only on wide desktop.
Sidebar contains Related Tools.
Sidebar must not appear on mobile.
Sidebar must not appear on desktop small / tablet.
Sidebar must not compress or weaken the main result.
```

不適用於：

```text
Mobile Portrait
Mobile Landscape
Desktop Small / Tablet
Text Page
Home Page
All Tools Page
```

---

## 12. Ad Placement 規則

廣告版位依線稿與 `docs/docs/standards/ad-layout-guidelines.md`。

通用規則：

```text
If ad is enabled, ad appears after the relevant main content section.
If ad is disabled, no ad space is reserved.
Do not place ads above the main result.
Do not place ads inside Bottom Sheet.
Do not place ads near Bottom Control.
Do not show ads on Text Pages.
Do not show ads in mobile landscape.
```

### Home

```text
Ad appears below Featured Tools Section.
```

### All Tools

```text
Ad appears after all Category Sections.
```

### Tool Page Mobile Portrait

```text
Ad appears below the main tool area.
```

### Tool Page Desktop Small / Tablet

```text
Ad appears after Related Tools.
```

### Tool Page Desktop Large Sidebar

```text
Ad appears below the main tool area.
Sidebar contains Related Tools.
```

---

## 13. Cursor 使用線稿規則

Cursor 使用線稿時必須遵守：

```text
1. 不要自由重新設計 layout。
2. 不要把 Header 做成一般網站導覽列。
3. 不要把首頁 Header 和內頁 Header 混用。
4. 不要把桌機線稿套到手機版。
5. 不要把手機直式線稿當成手機橫式。
6. 不要自行新增廣告位置。
7. 不要在 Text Page 放廣告。
8. 若線稿不清楚，先回報不確定處，不要自行推測。
```

---

## 14. Header 實作前檢查

做 Header 前，Cursor 必須確認：

```text
[ ] 首頁 Header = Timiva wordmark
[ ] 內頁 Header = pill button with icon / square + Timiva
[ ] Header 不放 All Tools
[ ] Header 不放 Language
[ ] Header 不放廣告
[ ] Header 不做漢堡選單
[ ] Footer 才放主要連結與語言切換
```

---

## 15. Footer 實作前檢查

做 Footer 前，Cursor 必須確認：

```text
[ ] Footer 全站一致
[ ] Footer 包含 Timiva
[ ] Footer 包含品牌簡短說明
[ ] Footer 包含全部工具
[ ] Footer 包含隱私權政策
[ ] Footer 包含使用條款
[ ] Footer 包含聯絡我們
[ ] Footer 包含語言切換
[ ] Footer 包含 © 2026 Timiva
[ ] Text Page 也使用相同 Footer
```

---

## 16. 結論

本 wireframes README 是 Timiva layout 實作的依據。

開發順序應為：

```text
1. 先確認線稿
2. 再建立 Header / Footer / Layout
3. 再建立頁面骨架
4. 再建立工具主體
5. 最後補 SEO / FAQ / Ad
```

Cursor 不得在未確認線稿的情況下自行設計 Header、Footer 或主要版型。
