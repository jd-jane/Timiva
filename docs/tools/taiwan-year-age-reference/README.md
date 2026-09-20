# Taiwan Year & Age Reference / 台灣年歲對照 — README

> 建立日期：2026-09-19
> 更新日期：2026-09-19（B1A）
> 狀態：**B1A lower content** · Not Link Integrated · Not deployed
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

## 3. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Suggested catalog ID | `taiwan-year-age-reference`（**未寫入** `toolsCatalog`） |
| Catalog | 未註冊 · `available` 未設定 |
| Home Featured | 不含 |
| All Tools | 未加入（Link Integration 另批） |
| ToolAdSlot | disabled |
| Outbound Related（頁內 tool-local） | Japanese Era Converter → Age Calculator → Lunar Date Converter |
| Inbound Related | 未做（Link Integration 另批） |
| Sitemap whitelist | **N/A** · Deferred to Link Integration / public integration |

---

## 4. 目前批次狀態

### B0 — V2 Tool Page Scaffold

完成（checkpoint `6bd3b57`）。

### B1A — Lower content（本輪）

```text
About／How to use／Common uses／FAQ
FAQ JSON-LD（與可見 FAQ 同一資料）
Related Tools：drawer + mobile lower rows（exactly 3）
正式 meta title／description
「那時的台灣」content baseline（tool-local data；不 render）
```

### 尚未開始

```text
B1B — 上方工具靜態畫面
B2+ — 西曆／民國／和曆查詢、年歲、生肖、反查、Reset、Bottom Sheet、「那時的台灣」結果顯示
Link Integration
```

---

## 5. Protected boundary

```text
不修改 Header／Footer／BaseLayout／global background／preview baseline
不修改 ToolPageFrame 或 shared Frame CSS
不修改 toolsCatalog
不修改 validate-sitemap.mjs
不修改既有工具 inbound Related
不做年份換算／生肖／年歲 lookup／結果渲染
不 commit／push／deploy 除非 Owner 明示
```
