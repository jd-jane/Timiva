# Japanese Era Converter / 日本年號換算 — README

> 建立日期：2026-08-16
> 更新日期：2026-08-16（Link Integration local complete）
> 狀態：**Link Integration local complete** · catalog `available:true` · `featured:false` · **尚未 push／deploy** · **尚未 Owner Browser Review／commit**
> Canonical product spec：`docs/tools/japanese-era-converter/product-spec.md`
> Standalone commit：`78903bc` feat: add Japanese Era Converter
> AME baseline：`c47bab0` chore: sync AME protected baseline

---

## 1. 工具名稱與定位

```text
EN：Japanese Era Converter
ZH：日本年號換算
```

在西元年份與日本近現代年號（明治、大正、昭和、平成、令和）之間做年份級雙向換算。
屬於 Important Dates／重要日子；純前端、即時計算。
不是歷史年號資料庫，也不處理舊曆／太陰太陽曆。

---

## 2. EN／ZH routes

```text
/en/japanese-era-converter/
/zh/japanese-era-converter/
```

---

## 3. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Catalog ID | `japanese-era-converter` |
| Catalog | `available:true` · `featured:false` |
| Home Featured | 不含 |
| All Tools 排序 | EC → DRC → DBD → BDC → DC → Hours → **JEC** → Age |
| Inbound links | 僅 Age Calculator（Date Range → Days Between Dates → Japanese Era Converter） |
| ToolAdSlot | disabled |
| Catalog icon | `calendar` |

Related Tools（頁內 outbound 顯示，2 個；不要求滿 3 個）：

```text
Date Calculator
→ Age Calculator
```

---

## 4. 已驗收行為摘要（Owner B2B／B2C／B3）

### Desktop

- Gregorian 複合輸入；4 digit cap；paste 走同一 cap
- Era 複合輸入 + tool-owned popover；2 digit cap
- 四個 transition year 雙年號 + support 日期範圍
- ZH 元年；EN Year 1
- invalid：inline range + 三角形 `!`；無紅框
- Reset → Gregorian empty + `?`

### Mobile（AME）

- lifecycle = live；Done 保留狀態並關閉；正常 close 不 rollback
- Reset → Gregorian empty，Editor 保持開啟
- Gregorian 1 numeric field；Era native select + year field
- shared Numeric Keypad；無 tool-local keypad
- invalid：欄位內 `!` + 欄位下方可見 range message；持續 invalid 時兩者都必須持續存在

### ResultSummary

```text
empty／incomplete／invalid → primary ?
一般有效 → 單一主結果
Gregorian transition → 雙年號 primary + support 日期範圍
Era partial-year → 西元年 + 該段日期範圍
未來令和 → 相同 ⓘ assumption note（tool-owned，RS 下方）
```

---

## 5. 主要檔案

```text
src/pages/en/japanese-era-converter/
src/pages/zh/japanese-era-converter/
src/components/tools/japanese-era-converter-v2/
src/styles/tools/japanese-era-converter-v2.css
src/scripts/japanese-era-converter.ts
src/scripts/japanese-era-converter-ame-adapter.ts
src/lib/japaneseEraConverterData.ts
src/lib/japaneseEraConverterEvaluate.ts
src/lib/japaneseEraConverterFormat.ts
src/lib/japaneseEraConverterDesktopState.ts
src/lib/japaneseEraConverterRouteMeta.ts
public/scripts/japanese-era-converter-layout-contract.js
scripts/validate-japanese-era-converter-math.mjs
scripts/validate-japanese-era-converter-desktop.mjs
scripts/validate-japanese-era-converter-adopter.mjs
```

---

## 6. Validators

```bash
npm run build
node scripts/validate-japanese-era-converter-math.mjs
node scripts/validate-japanese-era-converter-desktop.mjs
node scripts/validate-japanese-era-converter-adopter.mjs
node scripts/validate-adaptive-mobile-editor-contract.mjs
node scripts/validate-sitemap.mjs
node scripts/validate-seo-head.mjs
node scripts/validate-tool-category-labels.mjs
git diff --check
```

---

## 7. Release state

```text
Standalone：`78903bc` feat: add Japanese Era Converter
AME baseline：`c47bab0` chore: sync AME protected baseline
Link Integration：local complete（尚未 Owner Browser Review／commit）
Push／deploy：尚未
catalog available:true · featured:false
```
