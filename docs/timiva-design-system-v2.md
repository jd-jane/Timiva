# Timiva Design System V2

## 文件目的

本文件定義 Timiva 的視覺方向、品牌感、元件樣式與 UI 設計原則。

本文件不定義完整 Tailwind 實作細節。Tailwind 實作規則應由 `timiva-tailwind-css-guidelines-v2.md` 定義。

---

## 1. 設計核心

Timiva 的設計核心是：

```text
Mobile-first
Widget-like
Calm UI
Soft card
Clear hierarchy
Large number
Low-friction input
Screenshot-friendly result
```

Timiva 不應該像：

```text
傳統工具站
表格型網站
資訊密集頁面
大型 productivity app
廣告入口站
```

---

## 2. 視覺感受

Timiva 應帶給使用者的感覺：

```text
安靜
乾淨
柔和
舒服
專注
現代
有生活感
像手機小 App
```

避免：

```text
科技感過重
霓虹過多
對比太硬
資訊太滿
按鈕太多
卡片太雜
背景太搶戲
```

---

## 3. 設計語言

Timiva 的設計語言可以描述為：

```text
一組高質感、安靜、手機優先的時間 Widget。
```

每個工具都應像：

```text
一張可互動的生活卡片
一個可截圖的結果畫面
一個打開就能用的小 App
```

---

## 4. 色彩方向

色彩應保持：

```text
深色基底
柔和光感
低飽和
不刺眼
少量品牌色點綴
結果數字清楚
CTA 清楚但不吵
```

避免：

```text
大量亮色
太多漸層
每頁不同主色
廣告感很重的色塊
硬切色塊
```

---

## 5. 背景原則

背景應支撐工具，而不是搶走注意力。

可以使用：

```text
深色背景
柔和漸層
少量光暈
細微層次
```

避免：

```text
大面積刺眼光圈
過度動態背景
背景比工具更搶眼
每個頁面背景完全不同
```

---

## 6. Bento Grid / Card-based Layout

Timiva 可以使用 Bento Grid / card-based layout，但要保持安靜與清楚。

適合使用於：

```text
首頁工具卡片
全部工具頁
Related Tools
工具輔助資訊
結果輔助卡片
```

原則：

```text
卡片數量不要太多
卡片層級要清楚
主工具卡片優先
輔助卡片不要搶主結果
手機版避免過度密集
```

---

## 7. 卡片樣式

卡片應保持：

```text
圓角柔和
邊框細
背景半透明或低對比
陰影克制
內容留白足夠
```

卡片不應：

```text
太像廣告
太像傳統表格
文字塞太滿
每張卡片風格不同
```

---

## 8. 按鈕樣式

按鈕應清楚分層：

```text
Primary Action
Secondary Action
Ghost / Text Action
Danger / Reset Action
```

Primary Action 用於：

```text
開始
確認
建立
計算
套用
```

Secondary Action 用於：

```text
清除
重設
切換
查看更多
```

按鈕原則：

```text
觸控面積足夠
文字簡短
層級清楚
不要同時出現太多 primary buttons
```

---

## 9. Icon 規則

Icon 應：

```text
使用一致風格
大小使用 4px 倍數
搭配 currentColor
不搶文字焦點
與文字垂直對齊
```

避免：

```text
不同套 icon 混用
icon 過大
icon 顏色過亮
icon 和文字風格不一致
```

---

## 10. 工具結果數字

工具結果是 Tool Page 的視覺核心。

結果數字應：

```text
大
清楚
好讀
留白足夠
能截圖
手機上一眼看懂
```

結果數字不應：

```text
被輸入欄位擠壓
被廣告壓過
被 FAQ 搶走焦點
在手機橫式被壓扁
```

---

## 11. 表單與輸入

輸入欄位應：

```text
低摩擦
少欄位
好點擊
手機友善
使用原生 picker 優先
清楚顯示目前狀態
```

避免：

```text
過多欄位
過小 input
難點擊的 dropdown
複雜自訂 picker
手機鍵盤遮住主結果
```

---

## 12. Bottom Control / Bottom Sheet

手機工具頁可以使用 Bottom Control / Bottom Sheet。

設計原則：

```text
Bottom Control 像手機 App 操作列
Bottom Sheet 放設定與輸入
開啟後主畫面仍可理解
關閉後畫面恢復正常
點擊背景可以關閉
```

Bottom Sheet 不應放：

```text
廣告
長篇 SEO 文字
過多選項
容易誤觸的固定底部區塊
```

---

## 13. Related Tools

Related Tools 應像自然推薦，而不是工具列表堆疊。

原則：

```text
2 到 4 個
卡片式
文字簡短
優先同分類
再推薦互補情境
不要放在主工具上方
```

---

## 14. FAQ / SEO 區塊

FAQ / SEO 區塊應保持乾淨。

原則：

```text
放在工具體驗之後
不壓過主工具
問題自然
答案簡短
支援 AI Search 理解
不要寫成長篇行銷文
```

---

## 15. 廣告容器視覺規則

廣告容器應低干擾，不應破壞 App 感。

原則：

```text
清楚標示廣告
不要偽裝成工具內容
不要使用太突兀的視覺
不要放在主結果上方
不要放在 Bottom Sheet
不要靠近固定底部操作列
```

廣告可以靠近：

```text
結果區下方
Related Tools 附近
FAQ / SEO 區塊前後
頁面底部內容區
```

---

## 16. 桌機版視覺原則

桌機版可以更寬，但仍應保持：

```text
主工具聚焦
留白足夠
不過度表格化
右側欄不壓縮主工具
FAQ 不過度分散
Footer 對齊一致
```

---

## 17. 手機直式視覺原則

手機直式是 Timiva 最重要的體驗。

手機直式應保持：

```text
一眼看懂
單手可操作
主要數字清楚
按鈕容易點
輸入不擠
頁面可以自然滑動
```

---

## 18. 手機橫式視覺原則

手機橫式應獨立處理。

注意：

```text
主結果不能被壓扁
標題不要不必要省略
輸入欄位不能超出
Bottom Sheet 不能過高
轉回直式後 layout 要恢復
```

---

## 19. 中文註解與可維護性

因為 Timiva 會使用 Cursor、Agents 與 Skills 協作，主要區塊都應有中文註解。

建議格式：

```astro
<!-- Header｜桌機版主導覽 -->
<!-- Header｜手機版主導覽 -->
<!-- Tool｜桌機版工具主體 -->
<!-- Tool｜手機版工具主體 -->
<!-- Footer｜桌機版頁尾 -->
<!-- Footer｜手機版頁尾 -->
```

註解應清楚說明區塊用途，不要只寫：

```astro
<!-- section -->
<!-- div -->
<!-- layout -->
```

---

## 20. 結論

Timiva 的視覺設計應保持：

```text
安靜
乾淨
柔和
App-like
Widget-like
Mobile-first
主結果清楚
工具體驗優先
```

每個工具都應讓使用者覺得：

```text
這是一個舒服、清楚、值得放到手機桌面上的小工具。
```
