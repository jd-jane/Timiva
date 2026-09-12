# Taiwan Annual Leave Calculator / 特休天數試算 — README

> 建立日期：2026-09-11
> 更新日期：2026-09-11（B2B Desktop interaction）
> 狀態：**B2B Desktop live（local）** · B0 `8fadeb4` · B1A `9976e62` · B1B `62e1371` · B2A `5905afa` · Not Link Integrated · Not deployed
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

## 3. B2B Desktop（本輪）

- Smart Date Input（tool-local；`date-input.md`）
- Shared DesktopCalendar（`popover-compact`）
- 週年制／曆年制 live、Reset、info inline formula
- LocalStorage key：`timiva:talc:v1`（EN／ZH 共用；只存 hireDate + leaveSystem）
- Math SSOT：`taiwanAnnualLeaveMath.ts`（主結果 `primaryDisplay`；禁用 `rawDays`）
- `?talcFixture=` **不再**影響 production live

Mobile capsule／AME：**仍 disabled**（B2C）

Validators：

```bash
node --experimental-strip-types scripts/validate-taiwan-annual-leave-math.mjs
node --experimental-strip-types scripts/validate-taiwan-annual-leave-desktop.mjs
```

---

## 4. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子 |
| Catalog | **尚未寫入** `toolsCatalog` |
| Link Integration | **尚未** |
| Related（tool-local） | Date Range、Business Days |

---

## 5. 不做（本輪）

```text
Mobile AME / Bottom Sheet / YMD live
toolsCatalog / Home / inbound Related
Link Integration
shared / locked baseline 修改
commit / push / deploy（需 Owner）
```
