# Date Calculator / 日期加減計算 — README

> 建立日期：2026-07-24  
> 更新日期：2026-08-02（B8 AME First Adopter COMPLETE · B9.1 docs reference）  
> 狀態：**B8 Date Calculator First Adopter COMPLETE** · standalone 尚未 commit · catalog `available:false`  
> Canonical product spec：`docs/tools/date-calculator/product-spec.md`

---

## 1. 工具名稱與定位

```text
EN：Date Calculator
ZH：日期加減計算
```

從一個起始日期，加上或減去年／月／週／日，得到新的目標日期。  
屬於 Important Dates／重要日子與 V1.5 Search Foundation／搜尋鋪路期；純前端、即時計算。  
不是日期區間計算，也不是工作日計算。

---

## 2. EN／ZH routes

```text
/en/date-calculator/
/zh/date-calculator/
```

---

## 3. 分類與開發順序

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Tool order | Timiva 第八個工具 · V1.5 Search Foundation 第四個工具 |
| Level | L — New Tool MVP |

未來 Link Integration（另行授權；本階段不實作）時，All Tools `dates-events` 順序記錄為：

```text
Event Countdown
→ Date Range Calculator
→ Days Between Dates
→ Business Days Calculator
→ Date Calculator
→ Age Calculator
```

Standalone 期間 catalog：`available:false`（不進 All Tools／inbound Related／Home Featured）。

---

## 4. Canonical product spec

```text
docs/tools/date-calculator/product-spec.md
```

Implementation Plan（local-only）：

```text
local-docs/plans/date-calculator/2026-07-24-date-calculator-implementation-plan.md
```

---

## 5. MVP 範圍摘要

包含：起始日期、全域加／減、年／月／週／日（可混合）、即時計算、完整結果日期＋星期＋摘要、初始／無效 `?`、錯誤 icon、Reset、Desktop／Mobile portrait／landscape、EN／ZH、About／How to／FAQ／FAQ JSON-LD／Related／Meta。

不做：Today／常用期間快捷、Calculate／Apply／Done、Copy／URL share／Native Share、LocalStorage、多組計算、工作日／假日排除、時區切換、帳號／後端／資料庫。

Outbound Related（已確認）：Days Between Dates → Date Range Calculator → Business Days Calculator。

---

## 6. 開發批次

```text
D0 — Docs Canonicalization
B0 — V2 scaffold
B1A — Lower content
Shared ResultSummary Compatibility／Owner Gate
B1B — 上方靜態視覺
B2+ — Atomic functionality
→ Standalone Final → commit 授權 → Link Integration（另行授權）
```

B1B 硬依賴 Shared ResultSummary Compatibility Owner Gate。

---

## 7. Shared baseline

```text
ResultSummary
DesktopCalendar · variant=popover-compact（Desktop）
Smart Date Input（Desktop）
Adaptive Mobile Editor（Mobile · lifecycle＝live）
```

### 7.1 Mobile AME reference（B8 COMPLETE · 精簡）

```text
Mobile 編輯殼：Adaptive Mobile Editor（sibling mount；非 MSB Portal）
lifecycle：live（輸入即時更新結果；Done＝關閉；Escape／underlay 不 rollback）
Desktop：維持 Smart Date Input／calendar／live result（非 AME）
工具自有：Direction、2×2 duration、candidate digit guard、dateCalculatorMath、validation／formatting
Shared 契約：field-error、Portrait background scale、shell focus outline、Numeric Keypad
Canonical：docs/workflow/shared-component-reuse-gate.md §8 · docs/standards/mobile-sheet.md §17
```

舊「Mobile Sheet」字樣若出現在歷史批次敘述中，以本節 AME 為準；不得解讀為仍走 MSB Lab／D1 新採用路徑。

---

## 8. Protected scope

除非任務明確授權，否則不修改：

```text
Header
Footer visual layout
BaseLayout
Global background
Shared containers
既有已驗證工具核心邏輯
Preview baseline layout
ResultSummary／DesktopCalendar（Date Calculator 主線外之獨立 shared task 另授權）
Home Featured／All Tools／他工具 Related（Link Integration 另授權）
```

不 commit／push／deploy，除非 Owner 明確授權。

---

## 9. 目前狀態

```text
B8 Date Calculator First Adopter＝COMPLETE（含 B8.1／B8.2／Focus Outline Gates PASS）
Mobile＝AME live · Desktop live 維持
Catalog：available:false
Standalone：尚未 commit／push／deploy
未開始 Link Integration
B9.1 Canonical Docs：COMPLETE（Owner Docs Gate PASS）
B9.2／B9.3：未授權

歷史錨點：B1B Visual QA PASS（2026-07-25）仍為早期視覺 baseline 證據；
後續功能／AME 批次以 B8 COMPLETE 與 product-spec／local reports 為準。
```
