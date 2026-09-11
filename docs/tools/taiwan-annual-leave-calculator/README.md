# Taiwan Annual Leave Calculator / 特休天數試算 — README

> 建立日期：2026-09-11
> 狀態：**B0 scaffold** · Owner Product Review PASS · Not Link Integrated · Not deployed
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

## 3. 分類與站內連結（B0）

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Suggested catalog ID | `taiwan-annual-leave-calculator`（**B0 未寫入** `toolsCatalog`） |
| Catalog | 未註冊 · `available` 未設定 |
| Home Featured | 不含（B0） |
| All Tools | 未加入（B0；Link Integration 另批） |
| ToolAdSlot | disabled |
| Related Tools | 容器結構 only；正式內容 → B1A |

暫定 Related（B1A 再落地；B0 不實作）：

```text
Date Range Calculator
→ Business Days Calculator
```

---

## 4. 目前批次狀態

### B0 — V2 Tool Page Scaffold（本輪）

```text
EN／ZH routes
ToolPageFrame production shell
first-screen／stage 基礎結構（H1；無 short description）
result 結構 placeholder（非正式結果視覺）
mobile primary capsule：disabled baseline（非 enabled no-op）
lower content 容器（空）
drawer／Related 容器（空）
ToolAdSlot disabled
Header／Footer via BaseLayout
docs README＋product-spec scaffold
```

### 尚未開始

```text
B1A — About／How to／FAQ／Related 正式內容／drawer 基礎互動補強
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
不修改 toolsCatalog（B0）
不修改既有工具
不做特休計算／曆年制演算法假設
不 commit／push／deploy 除非 Owner 明示
```
