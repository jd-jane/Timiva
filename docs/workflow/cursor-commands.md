# Timiva Cursor Command Patterns V1

## 文件目的

本文件提供 Timiva 專案中常用的 Cursor 指令模板。

這些模板用來確保 Cursor 每次只處理指定範圍，遵守 Timiva 文件規範，避免重寫整站、破壞共用元件或造成樣式漂移。

---

## 1. 使用方式

每次給 Cursor 指令時，建議包含：

```text
1. 任務目標
2. 範圍限制
3. 實作要求
4. 不可修改項目
5. 完成後驗證報告
6. Owner Final Approval 要求
```

---

## 2. 通用開頭模板

```text
請依照 Timiva CEO Workflow 執行。

本次任務只處理我指定的單一範圍，不要擴大修改。

請遵守：
1. 不要重寫整站。
2. 不要重寫 Header、Footer、Base Layout，除非我明確要求。
3. 優先使用既有 Astro components。
4. 使用 Tailwind CSS，但保持語意化 HTML。
5. 每個主要段落都要有中文註解。
6. RWD 請以元件為單位分段書寫：Header desktop → Header mobile、Tool desktop → Tool mobile、Footer desktop → Footer mobile。
7. 不使用 inline style。
8. 不使用 !important。
9. 不使用 CSS id selector。
10. 完成後請依 docs/ 規範輸出驗證報告。
11. Phase A 期間，完成後等待 Owner 確認，不要自行 commit / deploy。
```

---

## 3. 新增頁面骨架指令模板

適用於：

```text
Home Page
Tool Page
All Tools Page
Legal / Text Page
```

模板：

```text
請新增 [頁面名稱] 頁面骨架。

請遵守：
- 使用既有 Base Layout。
- 使用既有 Header 與 Footer component。
- 不修改 Header、Footer、全站背景與共用容器。
- 只建立頁面主內容區，不實作細節功能。
- 使用語意化 HTML。
- 每個主要段落加入中文註解。
- RWD 寫法請以區塊為單位：該區塊桌機版後面緊接手機版，不要把所有手機版集中在最後。

完成後請回報：
1. 新增了哪些檔案
2. 是否修改共用元件
3. 是否符合 docs/standards/layout-system.md
4. 是否需要 Owner 確認
```

---

## 4. 新增 Atomic Component 指令模板

適用於：

```text
Tool Result Card
Date Input Panel
Ad Container
Related Tools
FAQ Section
Bottom Control
Bottom Sheet
```

模板：

```text
請新增一個 Atomic Component：[元件名稱]。

此任務只處理這個元件，不要修改其他區塊。

請遵守：
- 使用 Tailwind CSS。
- 保持 HTML 語意化。
- 每個主要段落加入中文註解。
- 若有桌機與手機差異，請先寫桌機版，後面緊接手機版。
- 不修改 Header、Footer、Base Layout。
- 不新增全域樣式，除非必要。
- 若需要 @apply，請放在正確的 Tailwind layer，並使用語意化 class 名稱。

完成後請回報：
1. 元件用途
2. props 或資料需求
3. 桌機版行為
4. 手機版行為
5. 是否影響既有頁面
```

---

## 5. 套用既有 Layout 指令模板

適用於：

```text
新頁面套用 Base Layout
工具頁套用 Header / Footer
All Tools Page 套用共用版型
Legal Page 套用共用版型
```

模板：

```text
請將既有共用元件套用到 [頁面名稱]。

請遵守：
- 不重新撰寫 Header。
- 不重新撰寫 Footer。
- 不改 Base Layout。
- 只在 main 裡組裝指定內容。
- 使用既有 component，不複製貼上重做。
- 若現有 component 不足，請先回報缺少什麼，不要自行大改。

完成後請檢查：
1. Header 是否仍使用共用元件
2. Footer 是否仍使用共用元件
3. main 結構是否符合 layout 規範
4. 手機直式是否正常
5. 手機橫式是否沒有明顯跑版
```

---

## 6. Locked Components 指令模板

適用於 Header、Footer、Base Layout 已完成後。

模板：

```text
Header、Footer、Base Layout 已定案，視為 locked components。

本次任務不得修改 locked components。

若你認為必須修改，請先停止實作並回報：
1. 為什麼需要修改
2. 會影響哪些頁面
3. 是否有替代方案
4. 是否需要重新跑回歸測試
5. 是否需要 Owner 確認

未經 Owner 確認，不得修改 locked components。
```

---

## 7. Tailwind 實作指令模板

模板：

```text
請依照 docs/standards/tailwind-guidelines.md 實作。

要求：
- 使用 Tailwind CSS。
- 保持 HTML 語意化。
- 每個主要段落加入中文註解。
- 常用重複樣式可使用 @apply 整理成語意化 component class。
- 不使用 inline style。
- 不使用 !important。
- 不使用 CSS id selector。
- 避免大量 arbitrary values。
- 若需要新增 token，請先說明原因。
```

---

## 8. RWD 分段書寫指令模板

模板：

```text
請依照 Timiva RWD 分段規則撰寫。

不要先寫完全部 desktop，再把全部 mobile 集中放到最後。

請以元件為單位分段：

Header：
1. Header desktop
2. Header mobile

Tool：
1. Tool desktop
2. Tool mobile

Footer：
1. Footer desktop
2. Footer mobile

本次只處理 [指定元件]，請先寫該元件桌機版，再緊接手機版。
```

---

## 9. 新增工具主體指令模板

模板：

```text
請依照 Timiva CEO Workflow，新增 [工具名稱] 的工具主體區塊。

範圍限制：
- 只處理工具主體，不處理 Header、Footer、SEO、FAQ、Related Tools。
- 不修改 Base Layout。
- 不新增廣告。
- 不處理其他工具。

實作要求：
- 使用 Tailwind CSS。
- 保持語意化 HTML。
- 每個主要段落加入中文註解。
- 桌機版工具主體後面緊接手機版工具主體。
- 主結果必須清楚可讀。
- 手機直式可操作。
- 手機橫式不可明顯跑版。

完成後請輸出驗證報告。
```

---

## 10. SEO / FAQ 補強指令模板

模板：

```text
請為 [工具名稱] 補強 SEO / AEO / FAQ。

範圍限制：
- 不修改工具主體互動。
- 不修改 Header、Footer、Base Layout。
- 不新增廣告。
- 只處理 Meta、FAQ、FAQ Schema、Related Tools 與必要說明文字。

請完成：
1. H1 檢查
2. Meta title
3. Meta description
4. FAQ 3 到 6 題
5. FAQ Schema / JSON-LD
6. Related Tools 2 到 4 個
7. 語意化 HTML 檢查

SEO 內容必須放在工具體驗之後，不可壓過主工具。

完成後請輸出 SEO 驗證報告。
```

---

## 11. 廣告版位檢查指令模板

模板：

```text
請依照 docs/standards/ad-layout-guidelines.md 檢查這個廣告版位。

請確認：
1. 是否在使用者完成主要任務之後
2. 是否不在主結果上方
3. 是否不在輸入區中間
4. 是否不在 Bottom Sheet 內
5. 是否不靠近 Bottom Control
6. 是否不造成誤觸
7. 手機直式是否合理
8. 手機橫式是否合理
9. 桌機版是否不壓縮主工具
10. 是否需要 Owner 確認
```

---

## 12. 完成後驗證報告指令模板

模板：

```text
完成後請執行一次 Timiva 驗證報告。

請檢查：
1. 是否符合 docs/ 內相關規範
2. 是否有修改 Header / Footer / Base Layout
3. 是否有 inline style
4. 是否有 !important
5. 是否有 CSS id selector
6. Tailwind class 是否過度混亂
7. HTML 是否保持語意化
8. 是否有中文註解
9. RWD 是否依元件分段
10. 手機直式是否可用
11. 手機橫式是否需要額外處理
12. 是否影響既有工具或頁面
13. 是否需要 Owner Final Approval

請用表格回報：
- 檢查項目
- 結果
- 發現問題
- 建議修正
```

---

## 13. Owner Final Approval 指令模板

模板：

```text
請整理 Owner Final Approval Summary。

請包含：
1. 本次完成項目
2. 修改檔案
3. 是否修改 locked components
4. 4 個 Agents 驗證結果
5. 是否有 Block
6. 是否有 minor notes
7. 是否符合 Timiva 產品原則
8. 是否符合線稿
9. 是否符合手機直式 / 橫式
10. 是否符合 SEO / 內容策略
11. 是否可以進入下一步
12. 需要 Owner 確認的問題

在 Owner 明確確認前，不要 commit / deploy。
```

---

## 14. 最推薦的日常指令格式

之後最常用的指令可以是：

```text
請依照 Timiva CEO Workflow，新增 / 修改 [元件或區塊名稱]。

範圍限制：
- 只處理 [指定範圍]
- 不修改 Header、Footer、Base Layout
- 不新增其他功能
- 不處理 SEO / FAQ，除非我要求

實作要求：
- 使用 Tailwind CSS
- 保持語意化 HTML
- 每個主要段落加中文註解
- RWD 以元件為單位分段：先桌機版，後手機版
- 優先使用既有 component

完成後：
- 檢查 docs/ 規範
- 回報修改檔案
- 回報是否影響共用元件
- 輸出驗證報告
- 等待 Owner 確認
```

---

## 15. 結論

Timiva 的 Cursor 指令應該遵守：

```text
小任務
明確範圍
鎖定共用元件
Tailwind + semantic HTML
中文註解
RWD 分段
完成後驗證
Owner 前期確認
```

這樣可以降低 Cursor 亂改、樣式漂移與一次改壞多頁的風險。
