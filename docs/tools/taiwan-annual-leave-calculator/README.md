# Taiwan Annual Leave Calculator / 特休天數試算 — README

> 建立日期：2026-09-11
> 更新日期：2026-09-13（B2C Landscape first-screen＋Mobile ⓘ）
> 狀態：**B2C Mobile live（local）** · B0 `8fadeb4` · B1A `9976e62` · B1B `62e1371` · B2A `5905afa` · B2B Desktop · Not Link Integrated · Not deployed
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

## 3. B2B Desktop

- Smart Date Input（tool-local；`date-input.md`）
- Shared DesktopCalendar（`popover-compact`）
- 週年制／曆年制 live、Reset、info inline formula
- LocalStorage key：`timiva:talc:v1`（EN／ZH 共用；只存 valid hireDate + leaveSystem）
- Math SSOT：`taiwanAnnualLeaveMath.ts`（主結果 `primaryDisplay`；禁用 `rawDays`）
- `?talcFixture=` **不再**影響 production live

---

## 4. B2C Mobile AME（本輪）

- First-screen capsule → shared Adaptive Mobile Editor（`lifecycle: "live"`）
- Tool-local AME content：三格橫向 Y／M／D（persistent label｜value）＋shared Numeric Keypad、leave segmented
- Reset／Done 使用 shared AME chrome（不在 content 自放 Reset）
- Focus owner＝單格 field button；active 高亮整格
- **禁止** native `<input>`／`inputmode`／browser keyboard 取代 Numeric Keypad
- Done／Escape／underlay → dismiss only；**不 rollback**、無 Cancel、無 restore-draft
- Reopen 保留目前 segments（empty／valid／incomplete／invalid）
- incomplete／invalid **不寫** LocalStorage
- Landscape first screen（AME closed）：Age 式 `100dvh`＋stage grid（結果 `1fr`／capsule `auto`）；`hover: none`；capsule 須在初始 viewport 完整可見可點（實機 iPhone Safari 為準）
- Mobile 曆年制 ⓘ：`.talc-info { pointer-events: auto }`（對沖 Frame `.tpf-result-group { pointer-events: none }`）
- 不改 shared AME／ToolPageFrame／DesktopCalendar／math SSOT／Desktop Smart Date

Validators：

```bash
node --experimental-strip-types scripts/validate-taiwan-annual-leave-math.mjs
node --experimental-strip-types scripts/validate-taiwan-annual-leave-desktop.mjs
node --experimental-strip-types scripts/validate-taiwan-annual-leave-mobile.mjs
```

---

## 5. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子 |
| Catalog | **尚未寫入** `toolsCatalog` |
| Link Integration | **尚未** |
| Related（tool-local） | Date Range、Business Days |

---

## 6. 不做（本輪）

```text
toolsCatalog / Home / inbound Related
Link Integration
shared / locked baseline 修改
其他 V1.6 工具
commit / push / deploy（需 Owner）
```
