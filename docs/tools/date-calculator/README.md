# Date Calculator / 日期加減計算 — README

> 建立日期：2026-07-24
> 更新日期：2026-08-04（release readiness · local complete）
> 狀態：**implementation＋site integration COMPLETE（local）** · catalog `available:true` · **尚未 push／deploy**
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

## 3. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Tool order | Timiva 第八個工具 · V1.5 Search Foundation 第四個工具 |
| Level | L — New Tool MVP |
| Catalog | `available:true` · `featured:false` |
| Home Featured | 不含 DC（維持 4 卡） |

All Tools `dates-events` 順序：

```text
Event Countdown
→ Date Range Calculator
→ Days Between Dates
→ Business Days Calculator
→ Date Calculator
→ Age Calculator
```

Outbound Related：Days Between Dates → Business Days Calculator → Date Range。
Inbound：DRC／DBD／BDC 各含 Date Calculator（仍各 3 卡）。

---

## 4. Canonical product spec

```text
docs/tools/date-calculator/product-spec.md
```

---

## 5. MVP 範圍摘要

包含：起始日期、全域加／減、年／月／週／日（可混合）、即時計算、完整結果日期＋星期＋摘要、初始／無效 `?`、錯誤 icon、Reset、Desktop／Mobile portrait／landscape、EN／ZH、About／How to／FAQ／FAQ JSON-LD／Related／Meta。

不做：Today／常用期間快捷、Calculate／Apply／Done（live Done＝只關閉）、Copy／URL share／Native Share、LocalStorage、多組計算、工作日／假日排除、時區切換、帳號／後端／資料庫。

---

## 6. Checkpoint commits（local · 尚未 push）

```text
3d9600e feat: add Date Calculator standalone tool
ae1c751 feat: integrate Date Calculator across site links
d09dce2 test: add Date Calculator adopter validator
6d1ce1c test: align validators for Date Calculator release
```

相關 AME／MSB：

```text
5f244af chore: archive legacy mobile sheet lab（Option B；Option C 未授權）
2e096e0 feat: add Adaptive Mobile Editor foundation
d1e3ebd test: normalize Adaptive Mobile Editor validators
```

---

## 7. Mobile／Desktop

```text
Mobile：Adaptive Mobile Editor（lifecycle＝live；sibling mount；非 MSB Portal）
Desktop：Smart Date Input／calendar／live result（非 AME）
```

舊「Mobile Sheet」歷史敘述以 AME 為準；不得解讀為仍走 MSB Lab／D1 新採用路徑。

---

## 8. Locked（除非任務明確授權）

```text
Header
Footer visual layout
BaseLayout
Global background
Shared containers
既有已驗證工具核心邏輯
Preview baseline layout
```

不 commit／push／deploy，除非 Owner 明確授權。

---

## 9. 目前狀態

```text
B8 Date Calculator First Adopter＝COMPLETE
Mobile＝AME live · Desktop live 維持
Catalog：available:true · featured:false
Standalone＋Link Integration＝COMPLETE（local）
Owner Link Integration QA＝PASS
Canonical adopter validator＝PASS（d09dce2）
Release validators（SEO／sitemap／category）＝PASS（6d1ce1c）
Pushed：No
Deployed：No
  （不得表述為已上線／production deployed）
下一支產品工具：Hours Calculator
B9.2A MSB Archive-in-Place＝COMPLETE；Option C／B9.3 未授權
```
