# Business Days Calculator / 工作日計算 — README

> 建立日期：2026-07-19
> 最後更新：2026-07-19
> 狀態：Production complete / Deployed
> 適用工具：Timiva V1.5 Search Foundation 第三個工具 · Timiva 第七個工具
> Canonical spec：`docs/tools/business-days-calculator/product-spec.md`

---

## 1. 工具概述

Business Days Calculator / 工作日計算是 Timiva V1.5 Search Foundation 的工作日工具，已正式上線於 `https://timiva.app`。

它用於快速計算兩個日期之間共有多少個星期一至星期五。

核心體驗：

```text
快速輸入兩個日期
立即得到工作日天數
起訖皆計入
只排除週末，不處理國定假日
不需要按 Calculate
Desktop 可用 Calendar；Mobile 用 Smart Date Bottom Sheet
```

---

## 2. 基本資料

| 項目 | 內容 |
|---|---|
| EN name | Business Days Calculator |
| ZH name | 工作日計算 |
| Category | Important Dates / 重要日子 |
| EN route | `/en/business-days-calculator/` |
| ZH route | `/zh/business-days-calculator/` |
| Phase | V1.5 Search Foundation |
| Tool order | 7（Timiva 第七個工具 · V1.5 Search Foundation 第三個工具） |
| Status | **Production complete / Deployed** |
| Product spec commit | `f963a12` docs: add Business Days Calculator product spec |
| Standalone commit | `cc09f32` feat: add Business Days Calculator standalone |
| Link Integration / Deployed HEAD | `8977fe5` feat: integrate Business Days Calculator links |
| Production QA | PASS · No blocking issues found |
| Storage | MVP 不使用 LocalStorage |
| URL state | MVP 不使用 URL sharing |
| Backend | 不需要 |

### Core shipped features

```text
工作日計算（週一至週五；起訖皆計入）
僅排除週六、週日；不扣除國定假日
日期範圍：1900-01-01～2100-12-31
Desktop Smart Date Input + Calendar
Mobile Smart Date Input Bottom Sheet（無 Mobile Calendar）
無 Clear／Calculate 按鈕
Related Tools / FAQ / FAQ JSON-LD
```

### Link Integration

```text
All Tools：已加入 Business Days Calculator
  dates-events：EC → DRC → DBD → BDC → AC
Inbound Related：Days Between Dates + Date Range Calculator 含 BDC
Home：不加入 Featured（維持 4 張）
Outbound Related：Days Between Dates → Date Range Calculator → Event Countdown
```

---

## 3. 工具定位

### 主要用途

```text
計算兩日期間有多少工作日（平日）。
```

### 與 Date Range Calculator 的差異

```text
Date Range Calculator：
偏日期區間分析，提供 Total Days / Workdays / Weekends 等資訊。

Business Days Calculator：
偏快速答案，只回答兩個日期之間有多少工作日。
```

### 與 Days Between Dates 的差異

```text
Days Between Dates：
計算兩個日期相差幾天（含週末）。

Business Days Calculator：
計算兩個日期之間有多少工作日（排除週末）。
```

---

## 4. MVP 範圍

### Included

```text
EN / ZH
Desktop / Mobile portrait / Mobile landscape
主結果：X business days / X 個工作日
兩個日期輸入
Smart Date Input
Desktop Calendar（range + edit）
Mobile Bottom Sheet
FAQ / FAQ JSON-LD
Related Tools
```

### Explicitly out of scope

```text
國定假日資料庫／國家假日選擇
自訂工作週或自訂假日
Clear／Calculate 按鈕
LocalStorage／URL sharing
Mobile Calendar／原生 type=date
```

---

## 5. Desktop／Mobile interaction 摘要

```text
Desktop：日期欄 Smart Date 快速輸入 + Calendar icon 開啟日曆
Mobile：日期膠囊 + Smart Date Bottom Sheet；無 Mobile Calendar
無 Clear／Calculate；輸入即算
```

### Calendar 最終互動

```text
Calendar 關閉時：日期欄只做 Smart Date，不自動開日曆
Calendar icon：開啟完整 range selection
Calendar 已開啟：點開始／結束欄切換單端修改
range 完成後自動關閉
edit 模式選日後保持開啟，由使用者自行關閉
月份：3×4 grid
年份：1900–2100 固定高度可捲面板＋4 位輸入
不採用原生超長月份／年份 <select>
```

---

## 6. 計算規則與國定假日邊界

```text
計入開始日與結束日
只排除星期六、星期日
不扣除國定假日
日期範圍：1900-01-01～2100-12-31
empty / incomplete / invalid → 結果歸零
```

---

## 7. Commit timeline

```text
f963a12 — docs: add Business Days Calculator product spec
cc09f32 — feat: add Business Days Calculator standalone
8977fe5 — feat: integrate Business Days Calculator links（Deployed HEAD）
```

---

## 8. Production QA

```text
EN / ZH routes · All Tools · Related · SEO · Desktop / Mobile — Pass
No blocking issues found
```

### Known non-blocking

```text
Cloudflare 部署期間曾短暫 404，重試後恢復（部署／CDN 延遲）
Age Calculator 原生月份／年份 select 問題為獨立後續修正，不屬於 BDC 缺陷
```

---

## 9. Locked note

```text
視為已上線 stable tool。
未授權任務不得修改已驗收核心邏輯。
不得修改 Header、Footer、BaseLayout、既有工具核心。
```
