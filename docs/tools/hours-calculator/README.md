# Hours Calculator / 時數計算 — README

> 建立日期：2026-08-09
> 更新日期：2026-08-09（B5 Link Integration local）
> 狀態：**standalone＋site integration complete（local）** · catalog `available:true` · `featured:false` · icon `calendar` · **尚未 B5 commit／push／deploy**
> Canonical product spec：`docs/tools/hours-calculator/product-spec.md`
> Standalone commit：`44289b7` feat: add Hours Calculator standalone tool

---

## 1. 工具名稱與定位

```text
EN：Hours Calculator
ZH：時數計算
```

計算一組開始時間與結束時間之間的時長，可選填休息時間並扣除。  
屬於 Important Dates／重要日子與 V1.5 Search Foundation；純前端、即時計算。  
不是工時表、排班系統，也不是跨日多日區間工具。

---

## 2. EN／ZH routes

```text
/en/hours-calculator/
/zh/hours-calculator/
```

---

## 3. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Catalog ID | `hours-calculator` |
| Catalog | `available:true` · `featured:false` |
| Catalog icon | `calendar` |
| Home Featured | 不含 |
| All Tools 排序 | EC → DRC → DBD → BDC → DC → **Hours** → Age |
| ToolAdSlot | disabled |

### Outbound Related Tools（Hours 頁）

```text
Days Between Dates
→ Business Days Calculator
→ Date Calculator
```

### Inbound Related Tools（B5）

```text
Business Days Calculator：
  Days Between Dates → Date Range → Hours Calculator
（DBD／Date Calculator Related graph 不變）
```

---

## 4. 已驗收行為摘要（Owner B2C／B3）

### Desktop

- 單一 range 輸入 `HH:MM–HH:MM`（parse／normalize／paste）
- 選填 break；`×`／`!` 互斥；`maxlength=5`
- same-day／overnight／`start===end`→0（非 24h）
- break blank／00:00 不扣；valid 扣除；`===gross`→net 0；`>gross`→保留 gross＋`!`

### Mobile（AME）

- 開啟：no active segment、Numeric Keypad hidden；點 HH／MM 才顯示 keypad
- Start／End＝clock：HH 必要；離開時間組時 MM 可省略→`00`、單碼前補 0；僅 MM（`__:30`）仍 incomplete
- Break＝duration：空白 segment 視為 0；支援 `__:30`／`1:__`／`1:30`
- digit gate 00–23／00–59；同組 HH→MM auto-advance；無 Mobile paste
- Clear／Done；Desktop↔Mobile 共用 calculation truth

### ResultSummary

```text
primary＝natural duration（EN hr／min · ZH 小時／分鐘）
support line 1＝decimal hours · total minutes · Next day／隔天
support line 2＝break deduction（僅 valid break > 0；與 line 1 同層級）
不使用 weekday；無 lighter-note
Landscape：line1 / line2 以「 / 」接在同一行
```

### Capsule

- empty／incomplete／invalid → `Start time — End time`／`開始時間 — 結束時間`
- valid → `09:00 — 18:00`；overnight 同列 next-day
- 不顯示 half-completed time

---

## 5. 主要檔案

```text
src/pages/en/hours-calculator/
src/pages/zh/hours-calculator/
src/components/tools/hours-calculator-v2/
src/styles/tools/hours-calculator-v2.css
src/scripts/hours-calculator.ts
src/scripts/hours-calculator-ame-adapter.ts
src/lib/hoursCalculatorTimeInput.ts
src/lib/hoursCalculatorEvaluate.ts
src/lib/hoursCalculatorSegmentInput.ts
src/lib/hoursCalculatorRouteMeta.ts
public/scripts/hours-calculator-layout-contract.js
scripts/validate-hours-calculator-math.mjs
scripts/validate-hours-calculator-adopter.mjs
```

---

## 6. Validators

```bash
npm run build
node scripts/validate-tool-link-integration.mjs
node scripts/validate-tool-category-labels.mjs
node scripts/validate-sitemap.mjs
node scripts/validate-seo-head.mjs
node scripts/validate-hours-calculator-math.mjs
node scripts/validate-hours-calculator-adopter.mjs
git diff --check
```

---

## 7. 下一步

```text
Owner Browser QA（B5 Link Integration）
→ B5 Link Integration commit（需 Owner 授權）
→ B6 — Release／push／deploy（需 Owner 授權）
```

本 README 描述 **site integration complete（local）** 狀態；**不代表已上線**。
