# Taiwan Annual Leave Calculator / 特休天數試算 — README

> 建立日期：2026-09-11
> 更新日期：2026-09-11（B1B static visual）
> 狀態：**B1B static visual（local）** · B0 `8fadeb4` · B1A `9976e62` · Not Link Integrated · Not deployed
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

## 3. B1B Owner visual fixtures

Production default：**initial**（主結果 `?`）。
用 query 切 static 態（無計算／無互動）：

| Fixture | URL |
|---|---|
| initial（default） | `/…/taiwan-annual-leave-calculator/` |
| anniversary（14 天＋下一階段） | `?talcFixture=anniversary` |
| calendar-year（6.5 天＋tip；formula 收合） | `?talcFixture=calendar-year` |
| calendar-year-formula | `?talcFixture=calendar-year-formula` |
| max（30 天；已達最高；無下一階段） | `?talcFixture=max` |
| mobile-ymd（Bottom Sheet 內 YMD 預覽） | `?talcFixture=mobile-ymd` |

Mobile 正式結構：first-screen **capsule** → 未來 Bottom Sheet／AME → sheet 內 YMD。
`mobile-ymd` **不是** first-screen 常駐三欄。

Controls（segmented／Reset／info／capsule／date）：**disabled static**；非 enabled no-op。

---

## 4. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子 |
| Catalog | **尚未寫入** `toolsCatalog` |
| Related（tool-local · exactly 2） | Date Range → Business Days |
| ToolAdSlot | disabled |

---

## 5. 批次狀態

```text
B0 PASS · 8fadeb4
B1A PASS · 9976e62
B1B static visual · local（待 Owner visual gate）
B2+／MOL fixtures／Link Integration · 尚未開始
```

---

## 6. Protected boundary

```text
不修改 Header／Footer／BaseLayout／ToolPageFrame／shared ResultSummary baseline
不修改 toolsCatalog／既有工具
不做計算／parsing／切換／LocalStorage
不 commit／push／deploy 除非 Owner 明示
```
