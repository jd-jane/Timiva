# Timiva Tool Page QA Checklist V2

## 文件目的

本文件定義 Timiva 工具頁完成後的正式 QA 檢查清單。

本文件適用於：

```text
新增工具頁
修改工具頁
修改 Bottom Sheet
修改工具主體
修改 FAQ / SEO
修改 Header / Footer / Base Layout
commit 前
deploy 前
```

本文件是 `agents/skills/tool-page-qa-skill.md` 的正式規範來源。

---

## 1. QA 核心原則

Timiva 工具頁 QA 的目的不是只確認「功能能不能跑」，而是確認：

```text
手機是否舒服
工具是否直覺
視覺是否一致
技術是否穩定
SEO 是否完整
是否沒有改壞既有頁面
```

---

## 2. QA 總流程圖

```mermaid
flowchart TD
    A[工具頁完成或修改完成] --> B[基本功能測試]
    B --> C[手機直式測試]
    C --> D[手機橫式測試]
    D --> E[桌機版測試]
    E --> F[Bottom Sheet / Control 測試]
    F --> G[LocalStorage / URL Sharing 測試]
    G --> H[Related Tools 測試]
    H --> I[FAQ / SEO 測試]
    I --> J[Header / Footer 測試]
    J --> K[回歸測試既有頁面]
    K --> L[npm run build]
    L --> M{是否全部通過?}
    M -->|否| N[修正後重跑相關項目]
    N --> B
    M -->|是| O[整理 QA Report / Owner Final Approval]
```

---

## 3. 基本功能測試

每個工具頁都必須檢查：

```text
主要輸入可操作
主要結果計算正確
預設狀態正常
空狀態正常
錯誤輸入不 crash
重設功能正常
重新整理後頁面正常
工具不依賴後端即可使用
```

---

## 4. 手機直式測試

手機直式是 Timiva 的核心體驗，必須優先測試。

檢查：

```text
主結果一眼看懂
主要 CTA 清楚
觸控目標足夠
輸入欄位不擠壓
頁面可以自然滑動
Bottom Control 不遮住必要內容
Bottom Sheet 可正常開關
點擊背景可關閉 Bottom Sheet
Footer 不突兀
```

Block 條件：

```text
手機直式無法完成主要任務
主結果被遮住
主要 CTA 不清楚
Bottom Sheet 無法關閉
輸入欄位超出畫面
```

---

## 5. 手機橫式測試

手機橫式必須獨立測試。

不能假設手機直式正常就代表手機橫式正常。

檢查：

```text
主結果仍可見
標題不必要省略
輸入欄位不超出
長文字輸入不跑版
Bottom Sheet 不過高
Bottom Control 不貼 Footer
轉回直式後 layout 恢復正常
廣告不壓縮主工具
```

Block 條件：

```text
主結果不可見
主要任務無法完成
輸入欄位超出畫面
Bottom Sheet 過高且不可操作
轉回直式後 layout 壞掉
```

---

## 6. 桌機版測試

檢查：

```text
主工具仍是焦點
內容寬度合理
Header 對齊正常
Footer 對齊正常
Related Tools 不搶主工具
FAQ / SEO 在工具體驗之後
廣告不壓縮主工具
```

---

## 7. Bottom Control / Bottom Sheet 測試

若工具頁使用 Bottom Control / Bottom Sheet，必須檢查：

```text
Bottom Control 可點擊
Bottom Sheet 可開啟
Bottom Sheet 可關閉
點擊背景可關閉
內容過多時可捲動
鍵盤開啟時不嚴重跑版
Bottom Sheet 內不放廣告
轉向後狀態正常
主要操作按鈕不是 viewport fixed
主要操作按鈕會跟頁面一起滑動
bottom sheet 開啟時，背景結果內容區整組縮放
bottom sheet 開啟時，底部主要按鈕不納入背景縮放群組
sheet-open 時，結果區縮放後在 Header 與 sheet 頂部之間保持視覺平衡
sheet-open 時，結果區沒有過度貼近 header
sheet-open 時，sheet 上方沒有不自然大空白
手機直式 sheet 為上下排列；手機橫式 sheet 為一列兩欄 compact 版面
手機橫式 sheet / panel 高度為內容驅動 compact layout
手機橫式 sheet 沒有直接沿用直式 sheet 高度
手機橫式 sheet 沒有大面積空白 panel
```

Block 條件：

```text
Bottom Sheet 無法關閉
Bottom Sheet 過高不可操作
Bottom Control 與 Footer 重疊
Bottom Sheet 內出現廣告
主要操作按鈕做成 viewport fixed 或 fixed bottom action bar
主要操作按鈕樣式偏離 Event Countdown Edit / Theme / Share 基準
手機橫式誤用桌機 inline input（且 product spec 未明確指定）
bottom sheet 開啟時縮放對象錯誤或背景縮放不完整
sheet-open 時結果區過度貼近 header 或 sheet 上方出現不自然大空白
手機橫式 sheet 直接沿用直式高度或撐出大面積空白 panel
```

---

## 8. LocalStorage 測試

如工具使用 LocalStorage，必須檢查：

```text
初次進入不 crash
輸入後可保存
重新整理後可恢復
資料格式錯誤時有 fallback
重設後可清除資料
不同工具 key 不互相衝突
```

不要保存：

```text
敏感個資
健康診斷資料
帳號密碼
付款資訊
大量歷史紀錄
```

---

## 9. URL Sharing 測試

如工具使用 URL sharing，必須檢查：

```text
分享 URL 可開啟
URL 缺參數時不 crash
URL 參數錯誤時有 fallback
不在 URL 放敏感資料
中英文路由下 URL 正常
```

---

## 10. Related Tools 測試

檢查：

```text
Related Tools 最多 3 個（除非 Owner 明確核准更多）
優先推薦最接近使用者意圖的工具，而非單純依新工具順序
優先同分類工具
再推薦互補情境
連結正確
不放在主工具上方
手機版不過度密集
Coming Soon 狀態清楚
```

---

## 11. FAQ / SEO 測試

每個工具頁至少檢查：

```text
H1 存在
Meta title 存在
Meta description 存在
FAQ 3 到 6 題
FAQ 標題使用 {Tool Name} FAQ，不得使用 generic「Frequently asked questions」或僅「常見問題」
FAQ 解答真問題
FAQ Schema / JSON-LD 正確
FAQ 與頁面顯示內容一致
SEO 內容不壓過主工具
中英文內容不混雜
```

Block 條件：

```text
H1 缺失
Meta 缺失
FAQ Schema 錯誤
FAQ 與工具功能不一致
FAQ 標題不符合工具頁命名規則
SEO 區塊放到主工具前面
```

---

## 11A. B1A lower content and sidebar QA

B1A（lower content + SEO）完成後、進入 B1B 前，Owner browser review 必須至少對照 **一個已核准的 production 工具頁** 檢查：

```text
[ ] Lower content 結構與順序對齊既有正式工具（About → How to use → Common uses/tags → {Tool Name} FAQ）
[ ] About 使用工具專屬標題（非 generic About the…）
[ ] How to use 使用工具專屬標題（非僅 How to use / 使用方式）
[ ] FAQ 標題為 {Tool Name} FAQ，非 generic Frequently asked questions / 常見問題
[ ] Common uses / tags 區塊存在，除非 product spec 明確排除
[ ] Tags / chips 為資訊標籤、非互動，除非 product spec 明確要求
[ ] Related Tools 最多 3 個
[ ] Related Tools 依最接近使用者意圖排序，非單純新工具順序
[ ] Desktop 右側 sidebar related cards 不得 hover-lift 或向上 translate
[ ] Sidebar cards 不得重用首頁 ToolCard hover 行為
[ ] Desktop drawer collapse / expand 控制項可見
[ ] Desktop drawer collapse / expand 行為正常
[ ] Drawer aria-expanded 與 accessible label 正確
[ ] Sidebar hover 不造成 layout shift
[ ] Desktop drawer 修正不造成手機破版或水平捲軸
```

若 Owner browser review 發現以上任一項失敗，**必須回到 B1A regression fix**，不得進入 B1B。

---

## 11B. B1B / B2 前：手機第一屏控制區 QA gate

新工具在 **B1B / B2 前**，Owner browser review 必須至少檢查以下四種狀態：

```text
[ ] mobile portrait closed state（手機直式、sheet 關閉）
[ ] mobile portrait sheet-open state（手機直式、sheet 開啟）
[ ] mobile landscape closed state（手機橫式、sheet 關閉）
[ ] mobile landscape sheet-open state（手機橫式、sheet 開啟）
```

QA 必須確認：

```text
[ ] 主要按鈕不是 viewport fixed
[ ] 主要按鈕會跟頁面一起滑動
[ ] 主要按鈕位置高度與其他一般工具頁一致
[ ] 主要按鈕與下方第一個內容標題（例如 You may also need / 相關工具）距離一致
[ ] 按鈕樣式符合 Event Countdown Edit / Theme / Share 那套（Date Range 手機日期按鈕同型，可含 icon）
[ ] 沒有新增另一套滿版大 CTA 或 fixed bottom action bar
[ ] 手機橫式沒有套用桌機 inline input（除非 product spec 明確指定）
[ ] 手機橫式結果區與按鈕可完整呈現在第一屏內
[ ] 手機橫式按鈕尺寸與樣式未因單一工具任意縮小或變形
[ ] 手機直式 bottom sheet 內容為上下排列
[ ] 手機橫式 bottom sheet 內容為一列兩欄 compact 版面（非直式 sheet 直接壓扁）
[ ] bottom sheet 開啟時，背景結果內容區整組縮放
[ ] bottom sheet 開啟時，底部主要按鈕不被納入背景縮放群組
[ ] sheet-open 時，結果區縮放後沒有過度貼近 header
[ ] sheet-open 時，結果區在 sheet 上方可視空間中保持視覺平衡
[ ] sheet-open 時，sheet 上方沒有不自然大空白
[ ] landscape sheet 高度為內容驅動 compact layout
[ ] landscape sheet 沒有直接套用直式 sheet 高度
[ ] landscape sheet 沒有大面積空白 panel
```

適用範圍：

```text
以上規則適用於一般工具。
特殊互動工具（例如 Countdown Timer）可例外，但例外必須在 product spec 或任務提詞中明確指定。
Cursor 不得自行判斷某工具是否為例外。
沒有明確例外時，一律套用標準 mobile first-screen baseline。
```

規範來源：`docs/standards/layout-system.md` §6.7。

若 Owner browser review 發現以上任一項失敗，**必須回到 B1B regression fix**，不得進入 B2。

---

## 12. Header / Footer 測試

Header / Footer 是 locked components。

檢查：

```text
Header 是否仍使用共用元件
Footer 是否仍使用共用元件
Header / Footer 是否全站一致
語系切換是否正常
Footer 連結是否正確
Footer 在手機直式正常
Footer 在手機橫式不突兀
```

未經 Owner 確認，不得修改：

```text
Header
Footer
Base Layout
全站背景
共用容器
```

---

## 13. Tailwind / HTML 測試

檢查：

```text
使用 Tailwind CSS
HTML 保持語意化
主要區塊有中文註解
RWD 以元件為單位分段
沒有 inline style
沒有 !important
沒有 CSS id selector
沒有大量無原因 arbitrary values
```

---

## 13.0 Global Interactive Cursor

```text
Enabled controls → pointer
Disabled controls → default
aria-disabled controls → default
Text inputs → text cursor
Special controls → correct special cursor
Non-interactive content → default
No redundant local cursor:pointer
No redundant cursor-pointer on semantic controls
Utility Capsule hover lift remains separate from cursor behavior
```

Automated check:

```bash
node scripts/validate-global-interactive-cursor-baseline.mjs
```

---

## 13.1 V2 Utility Capsule Control

Utility Capsule Control 互動驗收：

```text
Correct controls use .tool-utility-control
Incorrect roles do not use it
Fine-pointer hover lifts by 2px
Pointer exit returns smoothly
Active resets movement
Touch has no sticky hover
Reduced motion has no movement
Focus-visible remains clear
No tool-local transition duplication
No primary/text/navigation/sheet control contamination
```

Automated check:

```bash
node scripts/validate-tool-utility-control-baseline.mjs
```

---

## 14. 回歸測試

修改任何工具頁後，至少檢查：

```text
Home Page
All Tools Page
已完成工具頁
Privacy Policy
Terms of Use
Contact
Header
Footer
手機直式
手機橫式
桌機版
```

修改共用元件後，必須擴大回歸測試。

---

## 15. Commit 前最小檢查

commit 前至少確認：

```text
npm run build 成功
沒有明顯 console error
手機直式可完成主要任務
手機橫式不嚴重跑版
桌機版正常
Header / Footer 沒有壞
FAQ / SEO 沒有明顯錯誤
沒有未經確認修改 locked components
```

---

## 16. QA Report 格式

```text
# Timiva Tool Page QA Report

Tool:
Date:
Reviewer:

## Summary
Result: Pass / Pass with minor notes / Block

## Checks
| Item | Result | Notes |
|---|---|---|
| Main function | Pass / Block | |
| Mobile portrait | Pass / Block | |
| Mobile landscape | Pass / Block | |
| Desktop | Pass / Block | |
| Bottom Sheet / Control | Pass / N/A / Block | |
| LocalStorage | Pass / N/A / Block | |
| URL Sharing | Pass / N/A / Block | |
| Related Tools | Pass / Block | |
| FAQ / SEO | Pass / Block | |
| Header / Footer | Pass / Block | |
| Build | Pass / Block | |

## Required fixes
- ...

## Minor notes
- ...

## Owner attention
- ...
```

---

## 17. 結論

Timiva 工具頁 QA 必須同時確認：

```text
功能正確
手機舒服
橫式穩定
視覺一致
SEO 完整
共用元件沒壞
build 成功
Owner 前期確認
```

工具能跑不代表完成。

工具要符合 Timiva 的體驗、品牌、技術與搜尋策略，才算完成。
