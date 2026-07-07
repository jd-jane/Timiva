# Timiva 站內連結整合（Post-tool Link Integration Gate）

> 建立日期：2026-06-21  
> 最後更新：2026-06-27  
> Owner：Jane / Timiva  
> 狀態：Canonical workflow · 長期有效規則  
> 適用時機：新工具完成實作、Owner 實機驗收通過、工具本體完成 commit 後

---

## 1. 文件目的

本文件定義 Timiva 新工具完成後，如何把工具正式接入網站其他入口。

工具功能完成，不等於網站整合完成。新工具只有在以下入口與站內連結完成後，才可視為正式收尾：

```text
工具本體完成
→ Owner 全尺寸／全語系驗收
→ 工具本體 commit
→ Post-tool Link Integration
→ Link Integration QA
→ Link Integration commit
→ Push / Deploy Readiness
```

這個流程避免以下問題：

```text
工具頁已完成，但首頁卡片仍無連結
All Tools 沒有新工具
既有工具的 Related Tools 找不到新工具
英文頁連到中文路由
不同頁面各自維護不同工具資料
工具已部署，但站內沒有入口
```

相關文件：

- [新工具開發規則](./new-tool-development.md)
- [工具頁 QA](./tool-page-qa.md)
- [Pre-deploy 檢查](./pre-deploy.md)
- [專案現況](../project/current-status.md)

---

## 2. Gate 名稱

正式流程名稱：

```text
Post-tool Link Integration Gate
```

通過此 Gate 後，工具狀態才可從：

```text
Implementation complete
```

更新為：

```text
Implementation complete
Site integration complete
Commit complete
Ready to push
```

---

## 3. 觸發條件

只有符合以下條件時，才開始 Link Integration：

```text
[ ] 工具 EN / ZH 正式路由已完成
[ ] Desktop 已通過 Owner 實機驗收
[ ] Mobile portrait 已通過 Owner 實機驗收
[ ] Mobile landscape 已通過 Owner 實機驗收
[ ] Final QA 已完成
[ ] 工具本體已 commit
[ ] Working tree 狀態已確認
[ ] Owner 明確批准進入網站連結整合
```

若工具本體尚未 commit，優先完成工具本體收尾，不要把網站整合混進未穩定的功能 batch。

Task brief 與驗收報告模板：`local-docs/templates/_tool-link-integration-task-template.md`、`local-docs/reports/_validation-report-template.md`（local-only，不納入 Git tracked）。

---

## 4. 核心原則

### 4.1 優先更新 canonical data source

先確認工具資料的正式來源，例如：

```text
src/data/toolsCatalog.ts
src/data/homeTools.ts
featured tools data
related tool IDs
getRelatedTools()
src/i18n/en.ts / src/i18n/zh.ts
route helpers
```

規則：

```text
優先修改共用資料源
不要在 Home、All Tools、Related Tools 各自硬寫不同資料
不要新增重複 catalog entry
不要為單一頁面複製卡片 markup
不要為正式工具建立 fake navigation
```

### 4.2 保留既有視覺

Link Integration 是資料與連結任務，不是設計重做任務。

禁止：

```text
重做 ToolCard
更改卡片尺寸
更改 hover
更改首頁動畫
更改 All Tools 欄數
更改 Related Tools drawer
更改 Header / Footer / BaseLayout
更改工具核心功能
```

### 4.3 語系必須保留

所有入口都必須維持目前頁面語系：

```text
/en/... → /en/[tool-slug]/
/zh/... → /zh/[tool-slug]/
```

不可：

```text
英文頁連到中文工具
中文頁連到英文工具
連到 /[tool-slug]/
連到 preview route
使用 #
使用 JavaScript fake navigation
```

---

## 5. Canonical Tool Data Checklist

每個新工具至少要有一份一致的正式資料：

```text
[ ] tool ID
[ ] slug
[ ] EN title
[ ] ZH title
[ ] EN description
[ ] ZH description
[ ] category
[ ] EN route
[ ] ZH route
[ ] published / available state
[ ] icon / visual key（若 catalog 需要）
[ ] related tool IDs
[ ] display order
```

建議資料概念：

```text
id: countdown-timer
slug: countdown-timer
category: timers-focus
routes:
  en: /en/countdown-timer/
  zh: /zh/countdown-timer/
```

不要讓不同頁面出現不同 slug、名稱或描述。

---

## 6. Home Integration

Home 是精選區，不是所有工具的完整清單。

### 6.1 必做判斷

```text
[ ] Home 是否已預留該工具卡？
[ ] 該工具是否被 Owner 選為 featured tool？
[ ] Home ItemList 是否由 featured tools 自動產生？
```

### 6.2 已預留工具卡

若 Home 已有卡片：

```text
只接上正式 route
不新增第二張卡
不新增 Coming Soon
不新增 disabled 狀態
不改排序
不改視覺
```

### 6.3 尚未有工具卡

若 Home 沒有卡片：

```text
不要自動加入
先由 Owner 決定是否成為 featured tool
```

### 6.4 Home 驗收

```text
[ ] EN 卡片連到 EN route
[ ] ZH 卡片連到 ZH route
[ ] 卡片數量正確
[ ] 無重複工具
[ ] 既有排序不變
[ ] Hover / animation 不變
[ ] 其他工具卡連結未退步
```

---

## 7. All Tools Integration

All Tools 是正式工具總覽。每個已發布工具都必須出現。

### 7.1 必做

```text
[ ] 新工具加入 EN All Tools
[ ] 新工具加入 ZH All Tools
[ ] 使用正式 ToolCard
[ ] 使用 canonical catalog data
[ ] 排序符合產品架構
[ ] category 正確
[ ] route 正確
```

### 7.2 禁止

```text
不可建立 All Tools 專用重複工具資料
不可為新工具建立特殊卡片
不可改既有卡片視覺
不可加入未確認的 Coming Soon 邏輯
```

### 7.3 All Tools 驗收

```text
[ ] EN 工具數量正確
[ ] ZH 工具數量正確
[ ] 排序正確
[ ] 新工具可點擊
[ ] 無 broken link
[ ] Mobile / Desktop 排版未改壞
```

---

## 8. Related Tools Inbound Integration

新工具完成後，不只新工具要推薦舊工具；既有工具也需要有入口連回新工具。

### 8.1 必做判斷

```text
[ ] 哪些既有工具與新工具最相關？
[ ] 哪些既有工具目前 Related Tools 數量不足？
[ ] 是否需要把新工具加到 1–3 個既有工具？
[ ] EN / ZH related IDs 是否共用？
```

### 8.2 建議原則

```text
Related Tools 每個工具頁上限為 3 個，除非 Owner 明確核准更多
優先同分類工具與最接近的使用者意圖
其次是互補使用情境
不要為了湊數加入低相關工具
新工具上線不代表既有工具都必須 inbound 連回新工具
Post-tool Link Integration 不得把所有工具互連（all-to-all）
```

### 8.2.1 Related Tools 選擇與上限

```text
每個工具頁最多 3 個 Related Tools（sidebar 與 lower related 區皆適用）
若某工具已有 3 個 related tools，要加入新工具時必須替換較弱關聯，不得直接變成第 4 個
選擇依據：使用者意圖 > 新工具順序 > 站內工具總數
不因站內工具變多就自動擴充 Related Tools
Home / All Tools / Related Tools inbound 為獨立決策，不得混為一體
```

Standalone 階段：新工具可在 **自己頁面** 實作 outbound Related Tools（例如 B1A），無需等待 inbound。
站內 **inbound** Related Tools（其他工具指向新工具）屬於 **Post-tool Link Integration**，與 standalone tool commit 分開。

### 8.3 Inbound Link 規則

```text
[ ] 保留原有 Related Tool
[ ] 新工具加入正確排序
[ ] EN 連到 EN route
[ ] ZH 連到 ZH route
[ ] 使用既有 drawer / card component
[ ] 不硬寫重複 markup
```

### 8.4 Related Tools 驗收

```text
[ ] 卡片數量符合預期（最多 3 個，除非 Owner 核准更多）
[ ] 新卡片標題 / 描述正確
[ ] Hover 不上移（sidebar 須符合 layout-system §6.6）
[ ] Drawer open / close 正常
[ ] Arrow / icon / spacing 正常
[ ] 主工具功能未受影響
[ ] 未因新工具而自動 all-to-all 連結
```

---

## 9. 新工具本身的 Outbound Related Tools

新工具頁也必須確認：

```text
[ ] Related Tools 最多 3 個（除非 Owner 明確核准更多）
[ ] Related IDs 指向 available 工具，不產生 broken link
[ ] 排序依最接近使用者意圖，非單純新工具優先
[ ] 尚未發布工具不會產生 broken link
[ ] Coming Soon 規則若存在，需由正式 catalog 控制
[ ] EN / ZH 內容一致
[ ] Outbound 可在 standalone B1A 完成；inbound 留待 Post-tool Link Integration
```

---

## 10. Route / Locale / Alternate Path QA

必查：

```text
[ ] /en/[tool-slug]/ 可正常開啟
[ ] /zh/[tool-slug]/ 可正常開啟
[ ] Footer language switch 保留同頁對應路由
[ ] getAlternatePaths() 或等效 mapping 已包含新 route
[ ] canonical 正確
[ ] hreflang 正確
[ ] sitemap 自動包含正式 route
[ ] 不包含 preview route
```

---

## 11. SEO / Structured Data Integration

依目前資料架構檢查：

```text
[ ] Home ItemList 是否需同步
[ ] All Tools ItemList 是否需同步
[ ] 新工具 metadata 已存在
[ ] FAQ JSON-LD 已存在
[ ] 站內連結已建立
[ ] 新 route 可被 sitemap / crawler 發現
```

本 Gate 不重寫工具頁 SEO 文案，只確認網站入口與結構化資料是否同步。

---

## 12. Ads / Analytics Boundary

Link Integration 不包含廣告上線。

規則：

```text
ToolAdSlot 維持 is-disabled
不新增 live AdSense
不新增 publisher ID
不新增 ad slot ID
不因新增卡片改變廣告位置
```

分析工具若已存在，只確認新 route 可正常載入，不在本 Gate 重構 tracking。

---

## 13. Protected Areas

除非 Task Brief 明確批准，不得修改：

```text
Header
Footer visual layout
BaseLayout
Global background
ToolCard visual baseline
Related Tools visual baseline
Tool Drawer baseline
既有工具核心功能
新工具核心功能
Live ads / AdSense
```

若 Link Integration 看似需要修改上述區域，Cursor 必須停止並回報 Owner。

---

## 14. Plan-first Report

在修改前，Cursor 必須先回覆：

```text
1. Home 實際資料來源
2. All Tools 實際資料來源
3. Related Tools 實際資料來源
4. Canonical catalog 是否已存在新工具
5. 原本缺少的資料
6. 預計修改檔案
7. 不會修改的 protected files
8. EN / ZH route mapping
9. Inbound Related Tools 建議
10. Risks
11. 驗收方式
```

Owner 批准後才可實作。

---

## 15. 自動化驗證

Link Integration 完成後，在 `npm run build` 之後執行：

```bash
node scripts/validate-tool-link-integration.mjs
```

此腳本檢查：

```text
toolsCatalog 與 homeTools 一致性
featured tools 路由與 catalog 對應
All Tools 頁面是否包含正式工具
Related Tools ID 是否符合 approved mapping
build 產物 dist/ 中 href 是否正確
```

腳本位置：`scripts/validate-tool-link-integration.mjs`

驗收報告存放：`local-docs/reports/[tool-name]/`（local-only，Owner 驗收後決定是否 commit 摘要）。

---

## 16. Validation Checklist

### Home

```text
[ ] EN Home
[ ] ZH Home
[ ] 既有卡片數量正確
[ ] 新工具沒有重複
[ ] 正式 route 正確
[ ] 視覺 / animation 未改
```

### All Tools

```text
[ ] EN All Tools
[ ] ZH All Tools
[ ] 新工具已加入
[ ] 排序正確
[ ] ToolCard 視覺未改
```

### Related Tools

```text
[ ] 所有新增 inbound links
[ ] 新工具 outbound links
[ ] EN / ZH route 正確
[ ] Drawer / hover / spacing 正常
```

### Routes / SEO

```text
[ ] EN route
[ ] ZH route
[ ] Footer language switch
[ ] canonical
[ ] hreflang
[ ] sitemap
[ ] ItemList（若適用）
```

### Regression

```text
[ ] 既有 Home links
[ ] 既有 All Tools cards
[ ] 既有工具核心功能
[ ] 新工具核心功能
[ ] Header / Footer
[ ] Mobile portrait
[ ] Mobile landscape
[ ] Desktop
```

### Engineering

```text
[ ] Console 無 error
[ ] 無 duplicate catalog entry
[ ] 無 broken link
[ ] npm run build PASS
[ ] node scripts/validate-tool-link-integration.mjs PASS
[ ] git diff --check PASS
[ ] git status --short 已檢查
[ ] 未 push（除非 Owner 授權）
[ ] 未 deploy（除非 Owner 授權）
```

---

## 17. Completion Report Format

完成後請輸出（存放於 `local-docs/reports/`）：

```text
# [Tool Name] Link Integration Completion Report

## 1. Root Cause / Existing Data Flow
- Home data source
- All Tools data source
- Related Tools data source
- Missing data

## 2. Modified Files

## 3. Home Result
- EN
- ZH
- Card count
- Route

## 4. All Tools Result
- EN
- ZH
- Card count
- Order
- Route

## 5. Related Tools Inbound Result
- Modified tool pages
- Before / after count
- EN / ZH route

## 6. New Tool Outbound Result

## 7. Locale / SEO Result
- alternate paths
- canonical
- hreflang
- sitemap / ItemList

## 8. Regression

## 9. Checks
- npm run build
- node scripts/validate-tool-link-integration.mjs
- git diff --check
- git status --short

## 10. Release State
Committed: Yes / No
Pushed: No
Deployed: No
```

Owner 驗收後，才能進入 Link Integration commit。

---

## 18. Commit Strategy

建議把 Link Integration 與工具本體分開 commit。

```text
工具本體 commit
→ Link Integration task
→ Owner QA
→ Link Integration commit
```

原因：

```text
工具功能已凍結
網站入口變更可獨立回退
Git 歷史更清楚
Deploy 問題較容易定位
```

建議 commit message：

```text
feat: integrate [Tool Name] across site links
```

已完成的範例：

```text
2c44484 — feat: wire Countdown Timer links across home and catalog pages
20c379d — feat: integrate Year Progress links
```

---

## 19. Definition of Done

只有以下全部完成，工具才算真正完成：

```text
[ ] Tool implementation complete
[ ] Owner real-device confirmed
[ ] Tool commit complete
[ ] Home decision completed
[ ] All Tools integrated
[ ] Related Tools inbound links integrated
[ ] New tool outbound links verified
[ ] EN / ZH routes verified
[ ] Language switch verified
[ ] Internal-link QA passed
[ ] Build passed
[ ] validate-tool-link-integration.mjs passed
[ ] Link Integration committed
[ ] Ready for push / deploy checkpoint（需 Owner 授權）
```
