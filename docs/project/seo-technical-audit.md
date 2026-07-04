# Timiva V1 SEO Technical Audit

> 用途：記錄 2026-07-01 全站 SEO technical audit、問題分級、三批修正與 production closeout baseline。
> Audit / closeout date：2026-07-04
> 狀態：**Production PASS · Technical Closeout Complete**
> Production baseline：`b5b150f`
> Formal indexable routes：18
> Preview routes：6

---

## Executive summary

2026-07-01 原始 audit 找到 **3 個 B 級問題**（canonical/hreflang 缺失、soft 404、Preview 可索引）。三項已分批修正並通過 production 驗證：

| Batch | Issue | Commit | Production |
|---|---|---|---|
| Batch 1 | B1 — Missing canonical / hreflang | `9c10f39` | PASS |
| Batch 2 | B3 — Preview pages indexability | `f7629de` | PASS |
| Batch 3 | B2 — Soft 404 | `b5b150f` | PASS |

**目前沒有未解決的 A／B 級 SEO technical issue。** V1 SEO technical closeout 已完成。C 級項目（Open Graph、WebApplication schema、根路徑 HTTP 301 等）保留為後續非阻擋優化。

**Scope 區分（closeout 後）：**

```text
18 個正式頁：有 canonical / hreflang，可索引，在 Sitemap
6 個 Preview routes：robots = noindex, nofollow；無 canonical / hreflang；不在 Sitemap
Custom 404（dist/404.html）：robots = noindex, follow；無 canonical / hreflang；不在 Sitemap
Root /：locale stub，noindex，既有 JS redirect 行為，不在 Sitemap
```

**Evidence note：** Cloudflare Dashboard deployment record 未直接檢查；production deployment 由 production HTTP behavior 與新版 custom 404 證明。

---

## 1. Preflight（audit 時點 · 2026-07-01）

| Check | Result |
|---|---|
| `HEAD` / `origin/main` | `f130685` |
| `ahead / behind` | `0 / 0` |
| Working tree | clean |
| `npm run build` | PASS |

正式狀態（audit 時點）：

```text
Google Search Console Domain property：已驗證
sitemap-index.xml：LIVE
sitemap-0.xml：LIVE，18 URLs
Search Console Sitemap submission：成功
robots.txt：LIVE，包含正式 Sitemap 宣告
```

---

## 2. 18-page SEO matrix

| Route | Type | Build | `lang` | title | description | canonical | hreflang EN | hreflang ZH | x-default | robots | OG | Twitter | JSON-LD | H1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/en/` | home | PASS | `en` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS (none) | MISSING | N/A | WebSite, Organization, ItemList, FAQPage | PASS (1) |
| `/zh/` | home | PASS | `zh-Hant` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | 同上 | PASS (1) |
| `/en/tools/` | all-tools | PASS | `en` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/zh/tools/` | all-tools | PASS | `zh-Hant` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/en/event-countdown/` | tool | PASS | `en` PASS | PASS | PASS | **PASS** | `en` PASS | `zh-Hant` PASS | PASS → `/en/…` | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/zh/event-countdown/` | tool | PASS | `zh-Hant` PASS | PASS | PASS | **PASS** | PASS | PASS | PASS | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/en/date-range-calculator/` | tool | PASS | `en` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/zh/date-range-calculator/` | tool | PASS | `zh-Hant` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/en/countdown-timer/` | tool | PASS | `en` PASS | PASS | PASS | **PASS** | PASS | PASS | PASS | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/zh/countdown-timer/` | tool | PASS | `zh-Hant` PASS | PASS | PASS | **PASS** | PASS | PASS | PASS | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/en/year-progress/` | tool | PASS | `en` PASS | PASS | PASS | **PASS** | PASS | PASS | PASS | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/zh/year-progress/` | tool | PASS | `zh-Hant` PASS | PASS | PASS | **PASS** | PASS | PASS | PASS | PASS | MISSING | N/A | FAQPage | PASS (1) |
| `/en/privacy/` | legal | PASS | `en` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/zh/privacy/` | legal | PASS | `zh-Hant` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/en/terms/` | legal | PASS | `en` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/zh/terms/` | legal | PASS | `zh-Hant` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/en/contact/` | legal | PASS | `en` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |
| `/zh/contact/` | legal | PASS | `zh-Hant` PASS | PASS | PASS | **MISSING** | **MISSING** | **MISSING** | **MISSING** | PASS | MISSING | N/A | N/A | PASS (1) |

**Pattern：** 6 頁有完整 SEO head（3 工具 × EN/ZH）；12 頁缺 canonical／hreflang。

---

## 3. Canonical findings

### 有 canonical（6 頁，皆正確）

`event-countdown`、`countdown-timer`、`year-progress`（EN/ZH）

```text
單一 canonical
使用 https://timiva.app
trailing slash 正確
無 www / pages.dev / localhost
/tools/ 路徑正確（非 /all-tools/）
EN home 未誤指向 /
```

### 缺 canonical（12 頁）

| 群組 | Routes |
|---|---|
| Home | `/en/`, `/zh/` |
| All Tools | `/en/tools/`, `/zh/tools/` |
| Tool | `/en/date-range-calculator/`, `/zh/date-range-calculator/` |
| Legal | privacy, terms, contact（EN/ZH） |

### canonical 錯誤

無（有輸出的頁面皆正確）。

---

## 4. Hreflang findings

### HTML（有輸出的 6 頁）

每頁 3 條：`hreflang="en"`、`hreflang="zh-Hant"`、`hreflang="x-default"`（指向 EN URL）。

雙向配對正確，path 對稱，使用 `https://timiva.app`。

### HTML（缺 hreflang 的 12 頁）

同 canonical 缺失清單。

### HTML vs Sitemap locale codes

| 來源 | English | Chinese |
|---|---|---|
| HTML `<head>` | `en` | `zh-Hant` |
| Sitemap XML | `en-US` | `zh-TW` |
| `<html lang>` | `en` | `zh-Hant` |

**評估：** 兩套皆為 Google 可接受格式；`en` / `zh-Hant` 與 `<html lang>` 一致；Sitemap `en-US` / `zh-TW` 為常見慣例。**目前不需為字串差異強制統一**；若未來統一，建議 HTML 維持 `en` / `zh-Hant`（與現有 BaseLayout、`<html lang>` 一致），Sitemap 可維持 `en-US` / `zh-TW` 或一併對齊——屬 **C 級**命名一致性，非索引錯誤。

---

## 5. Indexability findings

### 18 個正式頁

| 檢查 | 結果 |
|---|---|
| `noindex` / `nofollow` | PASS — 皆無 |
| robots.txt 阻擋 | PASS — `Allow: /` |
| Sitemap 收錄 | PASS — 18 URLs |
| build HTML | PASS |

### Preview／非正式頁（僅記錄）

| Route | HTTP | noindex | 風險 |
|---|---|---|---|
| `/preview/event-countdown-v2` | 200 | 有 | 低 |
| `/preview/mobile-sheet-shared-style` | 200 | 有 | 低 |
| `/preview/home`, `/preview/tool`, `/preview/all-tools`, `/preview/text` | 200 | **無** | 可被索引 |

### 根路徑 `/`（不在 18 頁範圍）

```text
noindex + canonical → /en/ + JS redirect
不在 sitemap — PASS
```

---

## 6. Redirect findings

| URL | Chain | 結果 |
|---|---|---|
| `https://www.timiva.app/` | 301 → `https://timiva.app/` | PASS |
| `https://www.timiva.app/en/` | 301 → `https://timiva.app/en/` | PASS（path 保留） |
| `http://timiva.app/` | 301 → HTTPS | PASS |
| `https://timiva.app/en/` | 200 | PASS |
| `https://timiva.app/zh/` | 200 | PASS |
| `https://timiva.app/` | 200（非 301） | 注意 — client-side JS → `/en/` 或 `/zh/`；頁面有 `noindex` |

無 redirect loop。正式 EN/ZH route 未被錯誤導向首頁。

---

## 7. 404 findings

| URL | HTTP | Body title | 判定 |
|---|---|---|---|
| `/this-page-does-not-exist/` | **200** | `Timiva`（根頁 fallback） | 問題 — soft 404 |
| `/en/this-page-does-not-exist/` | **200** | `Timiva` | 問題 — soft 404 |
| `/zh/this-page-does-not-exist/` | **200** | `Timiva` | 問題 — soft 404 |

Cloudflare Pages 將未知路徑 fallback 至 `index.html`（200），非真正 404。404 不在 sitemap — PASS。

**嚴重度：B** — 不影響已列 18 頁，但可能造成 soft duplicate / 垃圾 URL 被索引。

---

## 8. Title / description findings

| 檢查 | 結果 |
|---|---|
| 18 頁皆有 title | PASS |
| 18 頁皆有 meta description | PASS |
| EN/ZH 語言正確 | PASS |
| 無 `/all-tools/` 舊命名 | PASS |
| 無 preview 文案混入正式頁 | PASS |
| title 重複 | PASS — 各頁不同 |

**C 級（可選）：** 部分工具 title 格式不完全一致（如 Year Progress 較長），非錯誤。

---

## 9. Open Graph findings

全站 18 頁：皆無 `og:*` 與 `twitter:card`。

**嚴重度：C** — 全站未實作 social metadata；屬既有設計缺口，非 sitemap regression。

---

## 10. Structured data findings

| 頁面類型 | JSON-LD | 評估 |
|---|---|---|
| Home（EN/ZH） | WebSite, Organization, ItemList, FAQPage | PASS — URL 用 `timiva.app`，`homeUrl` 為 `/en/` 或 `/zh/` |
| Tool（4 工具） | FAQPage only | PASS（FAQ 可解析） |
| Tool | 無 WebApplication / SoftwareApplication | C — guidelines 寫「可能包含」，非強制 |
| Legal / Contact | 無 JSON-LD | D — 不要求 |
| Legal / Contact | 無 BreadcrumbList | D |

FAQ JSON-LD 與頁面 FAQ 內容一致（抽查 event-countdown PASS）。無重複 schema、無 invalid JSON。

---

## 11. Semantic findings

| 檢查 | 18 頁結果 |
|---|---|
| 單一主要 H1 | PASS |
| `lang` 屬性 | PASS — `en` / `zh-Hant` |
| 導覽連結可解析 | PASS |
| Tool FAQ 在 HTML | PASS |

---

## 12. Sitemap / robots regression

### Local build

| Check | Result |
|---|---|
| `validate-sitemap` | 339 / 0 |
| `validate-tool-link-integration` | 176 / 0 |
| `dist/sitemap-index.xml` | 存在 |
| `dist/sitemap-0.xml` | 18 URLs |
| `dist/robots.txt` | 含 `Sitemap: https://timiva.app/sitemap-index.xml` |

### Production（線上抽查）

| URL | Result |
|---|---|
| `sitemap-index.xml` | LIVE — 有效 XML |
| `sitemap-0.xml` | LIVE — 18 URLs、`/tools/` 正確 |
| `robots.txt` | LIVE — Cloudflare Managed + Timiva `Sitemap:` 宣告 |

---

## 13. Findings severity summary

### A — Launch blocker

**無。** 18 個正式頁可索引、Sitemap 已提交、GSC 已驗證。

### B — Should fix before V1 SEO closeout

| # | Issue | Routes / Scope |
|---|---|---|
| B1 | 缺 canonical + hreflang | Home, All Tools, Date Range, Legal（12 頁） |
| B2 | Soft 404 — 未知 URL 回 200 + 首頁內容 | 全站未知 path |
| B3 | Preview 頁缺 noindex | `/preview/home`, `/preview/tool`, `/preview/all-tools`, `/preview/text` |

### C — Non-blocking

| # | Issue |
|---|---|
| C1 | 全站缺 Open Graph / Twitter card |
| C2 | Tool 頁無 WebApplication schema |
| C3 | HTML `en`/`zh-Hant` vs Sitemap `en-US`/`zh-TW` 命名差異 |
| C4 | 根路徑 `/` 為 JS redirect 非 HTTP 301（已有 noindex） |

### D — Keep as is

| # | Item |
|---|---|
| D1 | BaseLayout 條件式輸出 canonical/hreflang（設計正確） |
| D2 | 6 個工具頁既有 SEO flow |
| D3 | Sitemap filter + i18n alternate |
| D4 | Legal 頁不強制 JSON-LD |
| D5 | `/tools/` 為正式 All Tools route（非 `/all-tools/`） |

---

## 14. Canonical / hreflang root cause

### Props flow

```text
Page (.astro)
  → BaseLayout (canonicalUrl?, alternateUrls?)
    → <head> 條件渲染（僅 props 存在時輸出）
```

`BaseLayout` 不會自動產生 canonical；必須由 page 傳入。

### 現況對照

| Page group | 傳入 canonical/alternate? | Helper |
|---|---|---|
| event-countdown | 是 | `getEventCountdownRouteMeta` / inline `getCanonicalUrl` |
| countdown-timer | 是 | `getCountdownTimerRouteMeta` |
| year-progress | 是 | `getYearProgressRouteMeta` |
| date-range-calculator | 否 | 無 `*RouteMeta` helper |
| home | 否 | 有 `homeUrl` 但只給 JSON-LD |
| tools (all-tools) | 否 | — |
| legal (privacy/terms/contact) | 否 | — |

### 可重用基礎設施（已存在）

`src/i18n/config.ts`：

```text
getCanonicalUrl(pathname, locale) → https://timiva.app/en/.../
getAlternatePaths(pathname) → { en: "/en/...", zh: "/zh/..." }
routePaths 含 home, allTools: "/tools/", 各工具與 legal path
```

**結論：** 根因是 page 層未傳 props，非 BaseLayout bug，亦非 sitemap regression。

---

## 15. Proposed Implementation Plan

### 1. 修正目標

為 12 個缺 SEO head 的正式頁補上 canonical + hreflang（en / zh-Hant / x-default），沿用既有 `getCanonicalUrl` / `getAlternatePaths`。

### 2. Root cause

Page 層未傳 `canonicalUrl` / `alternateUrls`；僅 3 個工具已接 `*RouteMeta` helper。

### 3. 建議修改檔案

| 檔案 | 動作 |
|---|---|
| `src/lib/dateRangeRouteMeta.ts` | 新增（比照 `eventCountdownRouteMeta.ts`） |
| `src/lib/legalRouteMeta.ts` 或 `src/lib/pageRouteMeta.ts` | 新增 — 通用 helper（`routeKey` → meta） |
| `src/pages/en/date-range-calculator/index.astro` | 傳入 routeMeta |
| `src/pages/zh/date-range-calculator/index.astro` | 同上 |
| `src/pages/en/index.astro` | 傳入 `canonicalUrl` + `alternateUrls` |
| `src/pages/zh/index.astro` | 同上 |
| `src/pages/en/tools/index.astro` | 傳入（`routePaths.allTools`） |
| `src/pages/zh/tools/index.astro` | 同上 |
| `src/pages/en|zh/{privacy,terms,contact}/index.astro`（6 檔） | 傳入 legal meta |

### 4. 是否必須修改 locked BaseLayout？

**否。** 現有條件渲染已足夠；只需 page 傳 props。

### 5. 是否可只補 page/layout props？

**是。** 最小修正路徑。

### 6. Canonical 產生方式

```ts
getCanonicalUrl(routePaths.home, locale)        // → https://timiva.app/en/
getCanonicalUrl(routePaths.allTools, locale)    // → https://timiva.app/en/tools/
getCanonicalUrl(routePaths.privacy, locale)       // 等
```

### 7. Hreflang 產生方式

```ts
getAlternatePaths(routePaths.home)  // { en: "/en/", zh: "/zh/" }
```

傳入 `BaseLayout` `alternateUrls`；BaseLayout 以 `toAbsoluteUrl()` 轉絕對 URL。

### 8. x-default 決策

維持現行：**指向 EN URL**（與 event-countdown 等 6 頁一致，與 sitemap `defaultLocale: 'en'` 一致）。

### 9. HTML vs Sitemap locale code

```text
本批：不統一
HTML：維持 en / zh-Hant（BaseLayout 現況）
Sitemap：維持 en-US / zh-TW（@astrojs/sitemap i18n）
兩者皆有效；統一屬後續 C 級
```

### 10. 404 / redirect 另開任務

| 任務 | 範圍 | 備註 |
|---|---|---|
| 404 hardening | Cloudflare `_redirects` 或 `public/404.html` | 獨立任務；可能需 Cloudflare 設定 |
| Preview noindex | 4 個 preview 頁加 `robots="noindex, nofollow"` | 獨立小批 |
| 根路徑 HTTP 301 | 可選；目前 noindex + JS redirect 可接受 | C 級 |

### 11. Validator 擴充

新增 `scripts/validate-seo-head.mjs`（或在 `validate-sitemap.mjs` 加章節）：

```text
18 頁皆有且僅有一個 canonical
canonical URL 與預期一致
每頁 3 條 hreflang（en, zh-Hant, x-default）
EN/ZH 雙向配對
無 pages.dev / www
```

### 12. Targeted Agent Review

**Growth Strategist：** canonical/hreflang 補齊為 V1 SEO closeout 首要項；soft 404 與 preview noindex 次之；OG 可延後。

**Tech Architect：** 用統一 `pageRouteMeta` helper 避免 12 頁重複；不動 BaseLayout；validator 防回歸。

### 13. Owner 驗收

```text
1. npm run build
2. node scripts/validate-seo-head.mjs（新）
3. node scripts/validate-sitemap.mjs
4. 抽查 3 頁 dist HTML（home, tools, privacy）
5. 正式網域 curl 抽查 canonical（可選）
```

### 14. Commit / deploy 分批

| Batch | 內容 | 風險 |
|---|---|---|
| Batch 1 | canonical + hreflang（12 頁 + helpers + validator） | 低 — 僅 `<head>` props |
| Batch 2 | Preview noindex（4 頁） | 低 |
| Batch 3 | 404 handling（Cloudflare / Astro 404） | 中 — 需 Owner + infra |
| Batch 4（可選） | OG / WebApplication schema | 低優先 |

---

## 16. Growth Strategist review

```text
Agent: Growth Strategist
Result: Pass with minor notes

Findings:
- 18 頁已可透過 Sitemap 發現；GSC 提交成功
- 12 頁缺 canonical/hreflang 是 V1 SEO closeout 主要缺口
- Sitemap alternate (en-US/zh-TW) 與 HTML (en/zh-Hant) 皆有效，非 blocker
- Soft 404 與可索引 preview 頁應在 closeout 前處理
- OG/Twitter 全站缺失屬改善項，非 launch blocker

Required fixes:
- Batch 1: canonical + hreflang for 12 pages

Minor notes:
- Tool FAQPage schema 已足夠初期 SEO
- hreflang 統一可延後

Owner attention:
- 確認 Batch 1 優先於 Search Console 後續監控
- 404 任務需決定 Cloudflare vs Astro 方案
```

---

## 17. Tech Architect review

```text
Agent: Tech Architect
Result: Pass with minor notes

Findings:
- BaseLayout 設計正確；問題在 page props 覆蓋不全
- getCanonicalUrl / getAlternatePaths 可重用，無需第二套 SEO 系統
- date-range 缺 RouteMeta helper 是實作不一致，非架構缺陷
- Sitemap integration 穩定；validators 通過
- Soft 404 為 Cloudflare Pages SPA fallback 行為，需 infra 層處理

Required fixes:
- 新增統一 route meta helper + 補 12 頁 props
- 擴充 validate-seo-head.mjs

Minor notes:
- 不必修改 locked BaseLayout
- 避免 18 頁硬編碼完整 URL

Owner attention:
- Batch 1 可安全 deploy；不影響工具功能
```

---

## 18. Recommended task level

```text
Task：V1 SEO Head Completion — canonical + hreflang for 12 pages
Priority：High（V1 SEO closeout）
Estimated scope：~8–12 檔案、無 BaseLayout 變更
```

---

## 19. Suggested implementation batches

```text
1. Batch 1（立即）：SEO head completion + validate-seo-head.mjs
2. Batch 2（closeout）：Preview noindex
3. Batch 3（獨立）：Hard 404
4. Batch 4（延後）：OG / WebApplication schema / hreflang 命名統一
```

---

## 20. 最終結論（audit 時點 · 2026-07-01）

| 問題 | 答案（audit 時） |
|---|---|
| 是否存在 Launch blocker？ | **否** — 18 正式頁可索引，Sitemap/GSC 已就緒 |
| 是否可以維持目前網站正常上線？ | **是** |
| V1 SEO closeout 前應修正？ | B1 canonical/hreflang（12 頁）、B2 soft 404、B3 preview noindex |
| 可延後？ | OG/Twitter（C1）、WebApplication schema（C2）、hreflang 命名統一（C3）、根路徑 HTTP 301（C4） |

> **2026-07-04 更新：** 上述 B 級項目已全部 RESOLVED。見下方 §22–§27。

---

## 21. All Tools route 決策（Owner 核准）

```text
正式 All Tools 路徑：/en/tools/、/zh/tools/
任務規格中的 /en/all-tools/、/zh/all-tools/ 為錯誤假設
不修改正式路由、不新增 /all-tools/ route
Sitemap 與 validator 以 /tools/ 為準
```

---

## 22. V1 SEO Technical Closeout — Resolved B findings

### B1 — Missing canonical / hreflang

| Field | Value |
|---|---|
| **Original finding** | 12 個正式頁（Home、All Tools、Date Range、Legal）缺 canonical 與 hreflang |
| **Resolution** | 新增 `src/lib/pageRouteMeta.ts`、`scripts/validate-seo-head.mjs`；12 個正式 route 傳入 `canonicalUrl` / `alternateUrls` |
| **Batch** | Batch 1 |
| **Commit** | `9c10f39` |
| **Production status** | PASS |

Production verified：

```text
18 個正式頁皆有正確 self canonical
EN / ZH alternate（en、zh-Hant）正確
x-default 指向 EN URL
Sitemap 維持 18 formal URLs
```

### B2 — Soft 404

| Field | Value |
|---|---|
| **Original finding** | 未知 URL 回 HTTP 200 + root locale stub body |
| **Resolution** | 新增 `src/pages/404.astro` → `dist/404.html`；Cloudflare Pages 對 unknown path 回 HTTP 404 |
| **Batch** | Batch 3 |
| **Commit** | `b5b150f` |
| **Production status** | PASS |

Production verified：

```text
Unknown root / EN / ZH / nested / file-like paths → HTTP 404
不 redirect 回首頁
不再回 root locale stub 的 HTTP 200
404 robots = noindex, follow
404 無 canonical / hreflang / JSON-LD
404 不在 Sitemap
404 不顯示 Footer
```

Locale behavior（content switching，非 redirect）：

```text
/en/... unknown → 英文內容與連結
/zh/... unknown → 中文內容與連結
Root unknown → preferredLocale → navigator.language → EN fallback
語系判斷不改變 URL
無 JavaScript 時保留英文 fallback
```

Supporting change：`BaseLayout` 新增 optional `showFooter?: boolean`（default `true`）；僅 404 使用 `showFooter={false}`。

### B3 — Preview pages indexability

| Field | Value |
|---|---|
| **Original finding** | 4 個 Preview 頁缺 `noindex`（`/preview/home`、`/preview/tool`、`/preview/all-tools`、`/preview/text`） |
| **Resolution** | 6 個 Preview routes 加上 `robots="noindex, nofollow"`；新增 `scripts/validate-preview-indexability.mjs` |
| **Batch** | Batch 2 |
| **Commit** | `f7629de` |
| **Production status** | PASS |

六個 Preview routes：

```text
/preview/home/
/preview/all-tools/
/preview/tool/
/preview/text/
/preview/mobile-sheet-shared-style/
/preview/event-countdown-v2/
```

Production verified：

```text
HTTP 200
robots = noindex, nofollow
canonical = 0
hreflang = 0
不在 Sitemap
```

---

## 23. Final production matrix（2026-07-04）

| Scope | Count | HTTP | Robots | Canonical / hreflang | Sitemap |
|---|---|---|---|---|---|
| Formal pages | 18 | 200 | indexable（無 noindex/nofollow） | required and valid | included |
| Preview pages | 6 | 200 | noindex, nofollow | absent | excluded |
| Custom 404 | 1 static fallback | 404 | noindex, follow | absent | excluded |
| Root `/` | 1 locale stub | 200 | noindex | 既有行為（canonical → `/en/`） | excluded |

---

## 24. Deferred C items（non-blocking）

以下項目 **Deferred · Non-blocking**，不屬於 V1 SEO technical closeout blocker：

| # | Item | Status |
|---|---|---|
| C1 | Open Graph metadata | Deferred |
| C2 | Twitter Card metadata | Deferred |
| C3 | WebApplication / SoftwareApplication schema | Deferred |
| C4 | Root `/` 使用 JS locale redirect 而非 HTTP 301 | Deferred（已有 noindex） |
| C5 | HTML `en`/`zh-Hant` vs Sitemap `en-US`/`zh-TW` 命名差異 | Deferred（兩套皆有效） |
| C6 | Preview legacy cleanup decision | Deferred（另案決定是否刪除 Preview routes） |

---

## 25. Search Console and robots（closeout 狀態）

```text
Google Search Console Domain property：已驗證
Sitemap 已提交
Sitemap 仍為 18 formal URLs
本次 404 closeout 不需要重新提交 Sitemap
robots.txt：LIVE，含 Sitemap 宣告
Cloudflare Managed robots 與 Timiva Sitemap declaration：正常
```

---

## 26. Implementation batch record

| Batch | Scope | Commit | Key files |
|---|---|---|---|
| Batch 1 | canonical / hreflang | `9c10f39` | `pageRouteMeta.ts`, 12 route pages, `validate-seo-head.mjs` |
| Batch 2 | Preview noindex | `f7629de` | 4 preview pages, `validate-preview-indexability.mjs` |
| Batch 3 | Localized custom 404 | `b5b150f` | `404.astro`, `validate-404-behavior.mjs`, `BaseLayout` `showFooter` |

---

## 27. Closeout conclusion

| 問題 | 答案（2026-07-04） |
|---|---|
| 是否存在未解決 A／B 級 issue？ | **否** |
| V1 SEO technical closeout 是否完成？ | **是** |
| Production baseline | `b5b150f` |
| 下一步 | C 級非阻擋優化（OG、schema 等）另開任務；Preview legacy cleanup 另案決定 |
