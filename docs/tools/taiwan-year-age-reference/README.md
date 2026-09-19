# Taiwan Year & Age Reference / 台灣年歲對照 — README

> 建立日期：2026-09-19
> 狀態：**B0 scaffold** · Owner Plan Review APPROVE WITH 2 MINOR REVISIONS · Not Link Integrated · Not deployed
> Canonical product spec：`docs/tools/taiwan-year-age-reference/product-spec.md`
> Phase：V1.6 Taiwan Local Tools · 第二支

---

## 1. 工具名稱與定位

```text
EN：Taiwan Year & Age Reference
ZH：台灣年歲對照
```

把一個年份翻譯成今天的人比較容易理解的年代、年歲與少量時代感。  
屬於 Important Dates／重要日子；V1.6 Taiwan Local Tools 第二支。  
不是單純的民國／西元 Converter，也不是政府年歲表的數位化版本。

---

## 2. EN／ZH routes

```text
/en/taiwan-year-age-reference/
/zh/taiwan-year-age-reference/
```

---

## 3. 分類與站內連結（B0）

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Suggested catalog ID | `taiwan-year-age-reference`（**B0 未寫入** `toolsCatalog`） |
| Catalog | 未註冊 · `available` 未設定 |
| Home Featured | 不含（B0） |
| All Tools | 未加入（B0；Link Integration 另批） |
| ToolAdSlot | disabled |
| Related Tools | 容器結構 only；正式內容 → B1A |
| Sitemap whitelist | **N/A for B0** · Deferred to Link Integration / public integration |

---

## 4. 目前批次狀態

### B0 — V2 Tool Page Scaffold（本輪）

```text
EN／ZH routes
ToolPageFrame production shell
first-screen／stage 基礎結構（H1；無 short description）
result 結構 placeholder「?」（非正式結果視覺）
mobile primary capsule：disabled baseline（非 enabled no-op）
lower content 容器（空）
drawer／Related 容器（空）
ToolAdSlot disabled
Header／Footer via BaseLayout
docs README＋canonical product-spec.md
```

### 尚未開始

```text
B1A — About／How to／FAQ／Related 正式內容／drawer 基礎互動補強
B1B — 上方工具靜態畫面
B2+ — 西曆／民國／和曆查詢、年歲、生肖、反查、Reset、Bottom Sheet
Link Integration
```

---

## 5. Protected boundary

```text
不修改 Header／Footer／BaseLayout／global background／preview baseline
不修改 ToolPageFrame 或 shared Frame CSS
不修改 toolsCatalog（B0）
不修改 validate-sitemap.mjs（B0 N/A）
不修改既有工具
不做年份換算／生肖／年歲邏輯
不 commit／push／deploy 除非 Owner 明示
```
