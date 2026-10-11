# Taiwan Year & Age Reference / 台灣年歲對照 — README

> 建立日期：2026-09-19
> 更新日期：2026-10-11（Production Complete／Deployed）
> 狀態：**Production Complete／Deployed** · V1.6 第二支上線 · Owner Production QA＝PASS · HEAD：`47f3c3d`
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

## 3. Release status

```text
B0 → B1A → B1B → Independent Responsive Foundation → Desktop／Portrait visuals
→ B2A math → B2B Desktop → B2C Mobile／AME → Link Integration
Owner Production Smoke QA：PASS
Push：47f3c3d → origin/main
Deploy：Cloudflare Pages auto-deploy（無 manual deploy）
Production verified HEAD：47f3c3d
Link Integration commit：c84cc81
```

Key commits（摘要）：

```text
6bd3b57 feat: scaffold Taiwan Year & Age Reference
9652396 feat: add Taiwan Year & Age Reference lower content
58e93fd fix: make tool stage geometry fluid
33d1162 feat: establish Taiwan Year & Age Reference desktop visuals
77c0d13 feat: establish Taiwan Year & Age Reference mobile portrait
23aa911 feat: unify mobile bottom sheet visual baseline
51680c5 feat: finalize Taiwan Year & Age Reference static visuals
eced377 fix: localize adaptive mobile editor cancel
833f473 feat: add Taiwan Year & Age Reference calculation core
8c61c73 feat: wire Taiwan Year & Age Reference desktop interactions
80f17fd feat: wire Taiwan Year & Age Reference mobile interactions
c84cc81 feat: integrate Taiwan Year & Age Reference across site links
47f3c3d docs: mark Taiwan Year & Age Reference ready to push
```

---

## 4. Desktop

- Year lookup：西曆／民國／和曆（互斥）
- Reverse lookup：生肖＋大約年齡；前後同生肖年份可點
- Shared ResultSummary textual
- Reset
- Math SSOT：`taiwanYearAgeReferenceMath.ts`／`taiwanYearAgeReferenceState.ts`／`taiwanYearAgeReferenceFormat.ts`
- `?tyarFixture=`／`?tyarSheet=open` 僅 QA fixture

---

## 5. Mobile AME

- First-screen capsule「查詢年份／Look up a year」→ shared Adaptive Mobile Editor（`lifecycle: "live"`）
- Portrait Bottom Sheet／Landscape Full-screen
- `showCancel={false}`（landscape Cancel 關閉）
- Reverse chips：`pointer-events: auto`（對沖 Frame `.tpf-result-group { pointer-events: none }`）

Validators：

```bash
node scripts/validate-taiwan-year-age-reference-math.mjs
node scripts/validate-taiwan-year-age-reference-adopter.mjs
```

AME contract 既有 7 個 protected-hash known failures（Age／DBD／BDC／Countdown／DRC／Event Countdown／Year Progress）保留紀錄，不在本工具 closeout 處理。

---

## 6. 分類與站內連結

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Catalog | `toolsCatalog` · id／slug：`taiwan-year-age-reference` · `available: true` · `featured: false` · icon：`calendar` |
| Home Featured | **不加入**（維持 4 張） |
| All Tools | EN／ZH：… → JEC → Lunar → TALC → **TYAR** → Age |
| Outbound Related | Japanese Era Converter → Age Calculator → Lunar Date Converter（恰 3） |
| Inbound Related | JEC：TYAR → Age → Lunar；Lunar：JEC → Age → TYAR；Age／TALC **不變** |
| Related 原則 | 每頁最多 3 個，不要求湊滿 |
| SEO | canonical／hreflang／sitemap／FAQ JSON-LD |

---

## 7. 邊界

```text
Home Featured 不變
Age／TALC inbound Related 不變
V1.6：closed／Production Complete
下一步：Timiva Search／Index 全站總檢 → Search Strategy Decision Gate
Year Progress 2.0 排在 Decision Gate 之後（非立刻開始）
```
