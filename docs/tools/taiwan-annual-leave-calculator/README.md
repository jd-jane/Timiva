# Taiwan Annual Leave Calculator / 特休天數試算 — README

> 建立日期：2026-09-11
> 更新日期：2026-09-13（Production Complete／Deployed）
> 狀態：**Production Complete／Deployed** · V1.6 第一支上線 · Owner Production QA＝PASS · HEAD：`e1d0634`
> Canonical product spec：`docs/tools/taiwan-annual-leave-calculator/product-spec.md`
> Phase：V1.6 Taiwan Local Tools · 第一支

---

## 1. 工具名稱與定位

```text
EN：Taiwan Annual Leave Calculator
ZH：特休天數試算
```

依到職日期與週年制／曆年制，試算目前法定特休天數。  
屬於 Important Dates／重要日子；V1.6 Taiwan Local Tools 第一支。

核心問題：**「我現在有幾天特休？」**

---

## 2. EN／ZH routes

```text
/en/taiwan-annual-leave-calculator/
/zh/taiwan-annual-leave-calculator/
```

---

## 3. Release status

```text
B0 → B1A → B1B → B2A → B2B Desktop → B2C Mobile → B2D Catalog／Links
Final Release：PASS · Ready to Ship YES
Push：e1d0634 → origin/main
Deploy：Cloudflare Pages auto-deploy（Retry 後成功）
Owner Production QA：PASS
Production HEAD：e1d0634
```

Deploy note：

```text
首次 Cloudflare auto-deploy 於 initialize 暫時失敗（未進 clone／build）。
Retry 同一 commit e1d0634 後部署成功。
判定為 deployment-side transient failure，非程式 build regression。
```

Key commits（摘要）：

```text
8fadeb4 feat: scaffold Taiwan Annual Leave Calculator
9976e62 feat: add annual leave calculator content
62e1371 feat: add annual leave calculator static UI
5905afa feat: add annual leave calculation engine
77e51d4 feat: complete annual leave desktop interactions
99857b1 feat: complete annual leave mobile interactions
0751f42 feat: integrate taiwan annual leave catalog links
2bca51b fix: emit annual leave FAQ JSON-LD
e1d0634 docs: close annual leave calculator release
```

---

## 4. Desktop

- Smart Date Input（tool-local；`date-input.md`）
- Shared DesktopCalendar（`popover-compact`）
- 週年制／曆年制 live、Reset、info inline formula（含 1/1 說明／比例公式）
- LocalStorage key：`timiva:talc:v1`（EN／ZH 共用；只存 valid hireDate + leaveSystem）
- Math SSOT：`taiwanAnnualLeaveMath.ts`（主結果 `primaryDisplay`；禁用 `rawDays`）
- `?talcFixture=` **不再**影響 production live

---

## 5. Mobile AME

- First-screen capsule → shared Adaptive Mobile Editor（`lifecycle: "live"`）
- Tool-local AME content：三格橫向 Y／M／D（persistent label｜value）＋shared Numeric Keypad、leave segmented
- Reset／Done 使用 shared AME chrome（不在 content 自放 Reset）
- Focus owner＝單格 field button；active 高亮整格
- **禁止** native `<input>`／`inputmode`／browser keyboard 取代 Numeric Keypad
- Done／Escape／underlay → dismiss only；**不 rollback**、無 Cancel、無 restore-draft
- Reopen 保留目前 segments（empty／valid／incomplete／invalid）
- incomplete／invalid **不寫** LocalStorage
- Landscape first screen（AME closed）：Age 式 `100dvh`＋stage grid（結果 `1fr`／capsule `auto`）；`hover: none`
- Mobile 曆年制 ⓘ：`.talc-info { pointer-events: auto }`（對沖 Frame `.tpf-result-group { pointer-events: none }`）

Validators：

```bash
node --experimental-strip-types scripts/validate-taiwan-annual-leave-math.mjs
node --experimental-strip-types scripts/validate-taiwan-annual-leave-desktop.mjs
node --experimental-strip-types scripts/validate-taiwan-annual-leave-mobile.mjs
```

---

## 6. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Catalog | `toolsCatalog` · `available: true` · `featured: false` |
| Home Featured | **不加入**（維持 4 卡） |
| All Tools | EN／ZH：… → Lunar → **TALC** → Age |
| Outbound Related | `date-range` → `business-days-calculator`（恰 2） |
| Inbound Related | `business-days-calculator` 以 TALC 替換 `hours-calculator` |
| `date-range` Related | **不變** |
| SEO | canonical／hreflang／sitemap／FAQ JSON-LD |

---

## 7. 邊界

```text
Home Featured 不變
date-range inbound Related 不變
下一支 V1.6 工具（民國西元／年歲對照）— 尚未開始
Year Progress 2.0 順位不變（V1.6 後）
```
