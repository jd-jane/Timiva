# Lunar Date Converter / 國曆農曆轉換 — README

> 建立日期：2026-09-06
> 更新日期：2026-09-06（Production Complete · docs closure）
> 狀態：**Production Complete** · Owner Production QA＝PASS · Link Integration＝PASS · Mobile Portrait Leap Result Corrective＝PASS
> Canonical product spec：`docs/tools/lunar-date-converter/product-spec.md`
> Link Integration：`bcf9281` feat: integrate lunar date converter links
> Fixture refresh：`e12eb23` test: refresh lunar link integration fixtures
> Latest production corrective：`35dadef` fix: keep lunar leap results on two lines
> Production HEAD（repo）：`35dadef`

---

## 1. 工具名稱與定位

```text
EN：Lunar Date Converter
ZH：國曆農曆轉換
```

在西曆（國曆）與農曆日期之間做雙向換算，支援閏月與歲次（年干支）。
屬於 Important Dates／重要日子；純前端、即時計算。

Canonical product boundary：

```text
換日期，不解讀日期。
不做農民曆、宜忌、吉日、沖煞、生肖解讀、干支月／日、命理／運勢或二十四節氣。
```

---

## 2. EN／ZH routes

```text
/en/lunar-date-converter/
/zh/lunar-date-converter/
```

Production live on `https://timiva.app`（Cloudflare Pages auto-deploy；未 manual deploy）。

---

## 3. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Catalog ID | `lunar-date-converter` |
| Catalog | `available:true` · `featured:false` |
| Catalog icon | `calendar` |
| Home Featured | 不含 Lunar |
| Home ItemList | 不含 Lunar |
| All Tools 排序 | EC → DRC → DBD → BDC → DC → Hours → JEC → **Lunar** → Age |
| ToolAdSlot | disabled |
| Latest production corrective | `35dadef` |

Related Tools 原則：最多 3 個，不要求一定滿 3 個；Related graph 不要求完全對稱。

### Outbound Related Tools（Lunar 頁）

```text
Japanese Era Converter
→ Age Calculator
```

（exactly 2；無 Date Calculator；無 featured padding。）

### Inbound Related Tools

```text
Japanese Era Converter：
  Date Calculator → Age Calculator → Lunar Date Converter
（exactly 3）

Age Calculator Related：不變
  Date Range → Days Between Dates → Japanese Era Converter
```

---

## 4. 已驗收行為摘要（Owner Visual QA · Production smoke）

### 雙向與 Result

- Gregorian ↔ Lunar 雙向換算
- Desktop Gregorian／Lunar direct numeric input 採一致 editing lifecycle
- editing → Result `?`
- incomplete → Result `?`、no error
- complete valid → immediate Result
- Lunar blur 後才切 semantic committed display；refocus 回 numeric editing
- `閏`／`潤` 輸入皆接受；output 統一 `閏`
- 無明確 leap marker＝regular month（不發明閏月）
- compact leap 支援（例：`1963閏415`／`1963潤415`）

### Mobile／Desktop composition

- Mobile：Adaptive Mobile Editor structured picker
- Mobile Portrait Lunar Result：維持 semantic 2-line composition
  - ZH 例：`農曆乙巳年`／`閏六月十三日`
  - EN 例：`Leap Lunar 6/13`／`Yi-si`
- leap 長行以 Lunar-local Portrait fit 維持兩行；不改 shared ResultSummary baseline

### Link／SEO

- Link Integration PASS
- EN／ZH production smoke PASS（含 All Tools 順序、Related、canonical／hreflang／sitemap）

詳細規則與邊界見 `product-spec.md`。

---

## 5. Production checkpoint

```text
V1.5 Search Foundation：closed／complete（含 Lunar）
Latest production HEAD：35dadef
main = origin/main（推送當下）
Cloudflare Pages：main push auto-deploy
Manual deploy：No
```
