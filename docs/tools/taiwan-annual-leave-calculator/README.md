# Taiwan Annual Leave Calculator / 特休天數試算 — README

> 建立日期：2026-09-11
> 更新日期：2026-09-11（B1A lower content）
> 狀態：**B1A complete（local）** · B0 checkpoint `8fadeb4` · Not Link Integrated · Not deployed
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
不是 HR 系統（不做剩餘特休、離職結算、URL Sharing 等）。

核心問題：**「我現在有幾天特休？」**

---

## 2. EN／ZH routes

```text
/en/taiwan-annual-leave-calculator/
/zh/taiwan-annual-leave-calculator/
```

---

## 3. 分類與站內連結（B1A）

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Suggested catalog ID | `taiwan-annual-leave-calculator`（**尚未寫入** `toolsCatalog`） |
| Catalog | 未註冊 · `available` 未設定 |
| Home Featured | 不含 |
| All Tools | 未加入（Link Integration 另批） |
| ToolAdSlot | disabled |

### Outbound Related Tools（tool-local declared · exactly 2）

```text
Date Range Calculator
→ Business Days Calculator
```

不改既有工具 inbound Related graph（Post-tool Link Integration）。

---

## 4. 目前批次狀態

### B0 — V2 Tool Page Scaffold

```text
PASS · checkpoint commit 8fadeb4
```

### B1A — Lower Content / SEO Content（本輪）

```text
About／How to use／Common uses／FAQ（5）
FAQ JSON-LD
Related Tools（DRC → BDC）
Legal／official sources（FAQ 後；RestDays + mol.gov.tw …/81173/…）
EN／ZH meta 確認
LocalStorage：文案描述最終 MVP 行為；本輪未實作
```

### 尚未開始

```text
B1B — 上方工具靜態畫面
B2+ — 到職日輸入、週年制／曆年制、Reset、live 計算、LocalStorage
MOL calculation verification fixtures（B2 前必做）
Link Integration
```

---

## 5. Protected boundary

```text
不修改 Header／Footer／BaseLayout／global background／preview baseline
不修改 ToolPageFrame 或 shared Frame CSS
不修改 toolsCatalog（B0／B1A）
不修改既有工具 inbound Related
不做特休計算／曆年制演算法假設
不 commit／push／deploy 除非 Owner 明示
```
