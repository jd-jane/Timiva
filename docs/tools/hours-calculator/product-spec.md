# Timiva Hours Calculator／時數計算產品規格

> 建立日期：2026-08-04
> 正式化：2026-08-05（Owner accepted · Plan-first）
> 修訂：2026-08-09（Result support hierarchy＝1–2 行同層級輔助文字；撤回 lighter-note／第三層假設；Compatibility Gate＝support-region multiline assessment）
> 修訂：2026-08-09（B4 standalone · 同步 Mobile open／Start·End completion／Break duration 實際驗收行為）
> 狀態：**Owner accepted product spec · standalone complete（local）· catalog `available:false` · 尚未 Link Integration／push／deploy**
> 適用工具：Hours Calculator／時數計算
> 分類：Important Dates／重要日子
> 開發階段：V1.5 Search Foundation 低維護時間計算工具
> Implementation Plan（local-only）：`local-docs/plans/hours-calculator/2026-08-05-hours-calculator-implementation-plan.md`

---

## 1. 工具定位

### 1.1 工具名稱

```text
EN：Hours Calculator
ZH：時數計算
```

中文名稱沿用 Timiva Calculator 類工具統一命名規則，使用「○○計算」，不加「器」或「計算機」。

### 1.2 正式路由

```text
/en/hours-calculator/
/zh/hours-calculator/
```

Catalog ID（實作時核對）：`hours-calculator` · slug `hours-calculator`

### 1.3 第一屏短描述

```text
EN：Calculate the hours and minutes between two times.
ZH：計算兩個時間之間相隔的時數與分鐘。
```

### 1.4 核心目的

Hours Calculator 用於計算一組開始時間與結束時間之間的經過時長，並可選填一段休息時間，查看扣除休息後的實際時數。

核心體驗：

```text
輸入開始時間與結束時間
→ 自動判斷同日或跨午夜
→ 視需要扣除休息時間
→ 即時顯示人類可讀時長、小數時數與總分鐘數
```

它不是工時表、排班系統、薪資計算器，也不是跨日期的多日時間計算工具。

---

## 2. MVP 範圍

### 2.1 MVP 包含

```text
一組開始時間
一組結束時間
一段選填的休息時間
24 小時制
同日時間差
跨午夜時間差
人類可讀時長
小數時數
總分鐘數
即時計算
EN／ZH
Desktop／Mobile portrait／Mobile landscape
About／How to use／Common uses／FAQ／Related Tools
```

### 2.2 MVP 不做

```text
12 小時制／AM／PM
12／24 小時制切換
日期輸入
超過 24 小時的跨多日時段
多段工作時段相加
多段休息時間
休息開始／結束時間
工時表／timesheet
排班管理
薪資／加班費計算
歷史紀錄
LocalStorage
URL sharing
Copy result／匯出
時區換算
日光節約時間換算
Calculate 按鈕
Apply 按鈕
會員／後端／資料庫
```

核心邊界：

```text
一組開始與結束時間
＋ 一段選填休息時間
＝ 24 小時內的單一時段結果
```

---

## 3. 計算規則

### 3.1 原始時長

```text
開始時間 < 結束時間
→ 視為同一天

開始時間 > 結束時間
→ 自動將結束時間視為隔天

開始時間 = 結束時間
→ 結果為 0 小時 0 分鐘
```

範例：

```text
09:00 → 18:00 = 9 小時
22:00 → 06:00 = 8 小時 · 隔天
09:00 → 09:00 = 0 小時 0 分鐘
```

### 3.2 跨午夜

- 不另外提供「隔天」開關。
- 結束時間早於開始時間時，自動視為隔天。
- 最長可計算 23 小時 59 分鐘。
- 不支援第二天以後或超過 24 小時的區間。

### 3.3 休息時間

- 休息時間為選填。
- 空白或 `00:00` 視為不扣除。
- 有效休息時間從原始時長中扣除。
- 休息時間等於原始時長時，淨結果為 `0 小時 0 分鐘`。
- 休息時間大於原始時長時，休息時間無效。
- 無效的休息時間只影響休息扣除，不破壞已有效的開始／結束時間與原始時長。

計算概念：

```text
原始時長 = 開始時間至結束時間的分鐘數
淨時長 = 原始時長 − 有效休息分鐘數
```

### 3.4 即時更新

- 不設 Calculate 或 Apply。
- 開始與結束時間都完整有效後，立即顯示原始時長。
- 休息時間完整有效後，立即更新為淨時長。
- 關閉 Mobile Sheet／Panel 只是關閉輸入介面，不取消或清空目前輸入。

---

## 4. 結果區

### 4.1 主結果

主結果使用人類可讀的時長，不使用 `00:00`，避免被誤認為午夜或某個時刻。

顯示規則：

```text
0 分鐘            → 0 小時 0 分鐘
30 分鐘           → 30 分鐘
8 小時            → 8 小時
8 小時 20 分鐘    → 8 小時 20 分鐘
```

原則：

- 有小時但分鐘為 0：省略 `0 分鐘`。
- 小於 1 小時：省略 `0 小時`。
- 只有零時長保留完整 `0 小時 0 分鐘`。

### 4.2 次要結果（support region · 1–2 行同層級輔助文字）

次要結果位於 **ResultSummary support region**，不是 weekday 層級。

support region 可有 **1–2 行同層級輔助文字**：

```text
line 1 → decimal hours · total minutes · next-day marker
line 2 → break deduction（僅有效休息時間 > 0 時顯示）
```

兩行都是輔助文字；**視覺層級相同**（相同字級／字重／顏色／行高語意）。差別只在內容與是否顯示。
**沒有**第三層 hierarchy，**沒有** `lighter note` 語意。

視覺 hierarchy（Owner 2026-08-09 確認）：

```text
primary
→ natural duration（自然時長）

────────  （沿用 ResultSummary 既有 divider／spacing 語意）

support region · line 1
→ decimal hours · total minutes · next-day marker
→ 視覺語意對齊 Date Calculator 的
  「Add 22 days to Aug 3, 2026.」這一層
→ 不採 Date Calculator「Tuesday」那一層（weekday）

support region · line 2（如適用）
→ break deduction
→ 與 line 1 同層級；非較淡／較輕量第三層
```

`weekday` 維持真正的星期資訊語意；Hours **不使用** weekday，也**不得**把 support 文字放在 weekday 視覺位置。
不預設需要新的 shared `detail` API；是否需 support-region multiline extension 由獨立 Compatibility Gate 評估（見 §15.1.3）。

範例：

```text
8 小時 · 480 分鐘
8.33 小時 · 500 分鐘
8.33 小時 · 500 分鐘 · 隔天
```

英文：

```text
8 hours · 480 minutes
8.33 hours · 500 minutes
8.33 hours · 500 minutes · Next day
```

### 4.3 小數時數格式

- 以淨分鐘數 ÷ 60 計算。
- 最多顯示小數點後 2 位。
- 移除無意義的尾端 `0`。

```text
8 小時       → 8 小時
8 小時 30 分 → 8.5 小時
8 小時 20 分 → 8.33 小時
```

### 4.4 跨午夜標記

- 只在系統自動將結束時間視為隔天時顯示。
- 顯示在次要結果同一行最後一段。
- ZH：`隔天`
- EN：`Next day`

### 4.5 休息時間說明（support region · line 2）

有效休息時間大於 0 時，在 support region 顯示 **line 2**（與 line 1 同層級輔助文字）：

```text
已扣除 30 分鐘休息時間
已扣除 1 小時休息時間
已扣除 1 小時 30 分鐘休息時間
```

英文依單複數自然顯示：

```text
30 minutes of break time deducted
1 hour of break time deducted
1 hour 30 minutes of break time deducted
```

休息時間空白、`00:00`、incomplete 或 invalid 時不顯示 line 2。不另建 lighter／第三層視覺語意。

### 4.6 結果範例

同日、無休息：

```text
8 小時 20 分鐘

────────

8.33 小時 · 500 分鐘
```

跨午夜、有休息：

```text
8 小時 20 分鐘

────────

8.33 小時 · 500 分鐘 · 隔天
已扣除 30 分鐘休息時間
```

EN 同樣遵循此 hierarchy（primary → divider → support line 1 → support line 2 如適用；兩行同層級）。

---

## 5. 初始、清空與重新整理

### 5.1 初始狀態

```text
開始時間：空白
結束時間：空白
休息時間：空白

0 小時 0 分鐘

────────

0 小時 · 0 分鐘

跨午夜標記：不顯示
support line 2：不顯示
錯誤 icon：不顯示
weekday：不使用
```

### 5.2 Mobile 清除時間

Mobile Sheet／Panel 保留輕量的「清除時間／Clear times」資料操作。

點擊後：

```text
清空開始時間
清空結束時間
清空休息時間
移除隔天標記
清除所有 ! icon
結果回到 0 小時 0 分鐘
Sheet／Panel 保持開啟
```

### 5.3 Desktop 清除

- Desktop 不提供「清除時間」按鈕。
- 使用者可直接清空主時間輸入框。
- 休息時間使用右側 `×` 移除。

### 5.4 重新整理

- 不使用 LocalStorage。
- 重新整理後回到初始空白狀態。
- 不保存開始、結束、休息或跨午夜狀態。

---

## 6. Desktop 版

### 6.1 基本排列

初始：

```text
[ 輸入時間 HH:MM–HH:MM ]

        ＋ 加入休息時間
```

展開休息時間後：

```text
[ 輸入時間 HH:MM–HH:MM ]

[ 輸入休息時間 HH:MM                           × ]
```

規則：

- 主時間使用一個完整輸入框。
- 「＋ 加入休息時間」置中，使用輕量文字連結。
- 休息時間展開後顯示第二個完整輸入框。
- 不設 Desktop 清除按鈕。
- Desktop 也即時計算。
- 精確寬度、欄高、間距與結果比例留到 B1B 靜態畫面確認。

### 6.2 主時間 placeholder

```text
ZH：輸入時間 HH:MM–HH:MM
EN：Enter time HH:MM–HH:MM
```

### 6.3 主時間接受格式

接受：

```text
09:00-18:00
9:00-18:00
09:00 - 18:00
09:00 – 18:00
0900-1800
900-1800
```

不接受：

```text
09001800
09.00-18.00
9am-6pm
上午九點到下午六點
```

完成輸入、失焦或按 Enter 後，統一正規化為：

```text
09:00 – 18:00
```

輸入途中不主動改寫內容，避免干擾 caret 與快速輸入。

### 6.4 Desktop 主時間驗證

- 開始與結束時間各自須落在 `00:00–23:59`。
- 只允許必要字元：數字、冒號、空格、區間連字號／en dash。
- empty／incomplete：結果歸零，不顯示 `!`。
- complete invalid：輸入框右側顯示一個 `!`，結果歸零。
- complete valid：正規化並更新結果。
- valid → invalid：不得保留上一個有效結果。

### 6.5 Desktop 休息時間接受格式

接受：

```text
00:30
0:30
30
130
0130
1:30
```

解讀：

```text
30   → 00:30
130  → 01:30
0130 → 01:30
1:30 → 01:30
```

失焦或按 Enter 後，統一正規化為 `HH:MM`。

範圍：

```text
HH：00–23
MM：00–59
```

### 6.6 Desktop 休息時間 `×`／`!` icon

- 點「＋ 加入休息時間」展開後，輸入框右側立即顯示 `×`。
- 空白或 incomplete 時維持 `×`。
- complete invalid 或休息時間大於原始時長時，同一位置改為 `!`。
- `×` 與 `!` 永不同時出現。
- 修正有效或清空內容後，`!` 恢復為 `×`。
- 點 `×`：清空休息時間、收起輸入框、回到「＋ 加入休息時間」，結果恢復為原始時長。
- `!` 為錯誤狀態提示；錯誤期間使用者可直接修改或清空輸入內容。

---

## 7. Mobile 第一屏

### 7.1 第一屏層級

```text
工具名稱
主結果
次要結果
休息時間說明（如適用）
時間區間膠囊
```

主要結果仍是視覺主角。時間區間膠囊屬於主要輸入入口。

### 7.2 時間區間膠囊

初始／任一主要時間未完成或無效：

```text
開始時間 — 結束時間
Start time — End time
```

開始與結束都有效：

```text
09:00 — 18:00
```

跨午夜：

```text
22:00 — 06:00 隔天
22:00 — 06:00 next day
```

規則：

- 只有開始與結束都有效時才顯示實際時間。
- 不在第一屏顯示半完成內容。
- `隔天／next day` 與結束時間同一行，較小、較淡，不換行。
- 點擊膠囊開啟共用 Mobile Sheet／Panel。

---

## 8. Mobile 輸入介面

### 8.1 外殼

- Mobile portrait：沿用 Timiva 共用 Bottom Sheet（Adaptive Mobile Editor · AME）。
- Mobile landscape：採用共用的全頁覆蓋式 Mobile Panel（AME landscape full-screen）。
- Landscape 為本工具明確核准例外：內容仍維持三列上下排列，不改成左右兩欄。
- 開啟、關閉、overlay、scroll lock、focus、keyboard-open composition 與轉向行為全部沿用現有共用 baseline。
- **開啟 editor 時：no active segment、Numeric Keypad hidden**；使用者點任一 HH／MM 後才顯示 keypad。
- 不新增 Hours Calculator 專屬關閉手勢或關閉按鈕。
- 不設工具專屬 Apply／Cancel action。

### 8.2 三列完整輸入框

Mobile portrait 與 landscape 使用相同內容順序：

```text
[ 開始時間                         HH：MM ]
[ 結束時間                         HH：MM ]
[ 休息時間                         HH：MM ]
```

規則：

- 每一列是一個完整的圓角輸入框。
- 左側為固定欄位名稱。
- 右側為同一輸入框內的 `HH：MM` segmented input。
- 三列寬度、高度、左右對齊一致。
- 開始時間一列、結束時間一列、休息時間一列。
- Mobile 休息時間固定顯示，不做展開／收合。
- **休息時間為 duration（非 clock）**；空白 segment 視為 0（見 §9.5）。
- 開始／結束為 clock；完成規則見 §9.5。

### 8.3 Mobile 即時更新

- 開始與結束皆有效（含離開時間組後的 completion）後，立即更新原始時長。
- 休息時間有效後，立即更新淨時長。
- 休息時間 invalid（含 break > gross）時，結果維持原始時長，不要求使用者重新輸入開始／結束時間。
- Break duration 允許 partial pair（如 `__:30`）即時進入計算；與 Start／End clock completion 為不同 contract。

---

## 9. Mobile segmented input 規則

### 9.1 基本範圍

開始、結束、休息三列共用 digit gate：

```text
HH：00–23
MM：00–59
每段最多 2 位
只接受數字
```

**完成語意不同：**

- Start／End＝clock completion（§9.5）
- Break＝duration partial-pair（§9.5）

### 9.2 即時輸入限制

- 不可能成立的下一位數字不輸入。
- 正常逐字輸入時，盡量避免產生 `25`、`60` 等 complete invalid 值。

HH：

```text
第一位 3–9 → 視為 03–09，完成 HH 並前進至 MM
第一位 0–2 → 等待可能的第二位
兩位數 00–23 → 有效並前進至 MM
第二位造成 >23 → 不接受該數字
```

MM：

```text
第一位 6–9 → 視為 06–09
第一位 0–5 → 等待可能的第二位
兩位數 00–59 → 有效
第二位造成 >59 → 不接受該數字
```

### 9.3 Auto-advance

只在同一組時間內前進：

```text
開始 HH → 開始 MM
結束 HH → 結束 MM
休息 HH → 休息 MM
```

不自動跨組：

```text
開始 MM 不跳到結束 HH
結束 MM 不跳到休息 HH
```

以下情況不得 auto-advance：

```text
Backspace／Delete
回頭修改既有值
caret 不在欄位結尾
```

### 9.4 Mobile 輸入來源（MVP）

```text
Mobile 只接受 AME shared Numeric Keypad 的數字輸入。
MVP 不支援 clipboard paste。
不得為 Mobile paste 新增 hidden input、Clipboard API、contenteditable 或其他 workaround。
```

Desktop 的自由文字輸入、parse、normalize 與 paste 能力維持 §6，不受本節影響。

### 9.5 Start／End completion 與 Break duration（Owner 驗收）

**Start／End（clock）**

- HH 為必要資訊。
- MM 可省略；離開該時間組後補成 `00`。
- 單碼 HH／MM 在離開該時間組時前補 0（不在仍編輯同一 segment 時提前補值，以免阻礙 `18`／`15`）。
- 只有 MM、無 HH（如 `__:30`）→ incomplete，不猜測 HH。
- 兩欄皆空 → empty。
- 「離開時間組」含：切到另一組（Start／End／Break）、按 Done。

例：

```text
9:__ → 離開後 09:00
9:5 → 離開後 09:05
18:__ → 離開後 18:00
__:30 → incomplete
__:__ → empty
```

**Break（duration）**

- 空白 HH 或 MM 在 evaluation 中視為 0。
- 支援 partial pair 即時計算，例如：

```text
__:30 → 30 分鐘
1:__ → 1 小時
1:30 → 1 小時 30 分鐘
00:00／皆空 → 0，不扣除
```

- digit gate／auto-advance 仍適用；與 Start／End clock completion 為不同 contract。

---

## 10. 狀態與錯誤規則

### 10.1 開始／結束時間

| 狀態 | 結果 | `!` icon |
|---|---|---|
| empty | `0 小時 0 分鐘` | 不顯示 |
| incomplete | `0 小時 0 分鐘` | 不顯示 |
| complete valid | 更新原始／淨時長 | 不顯示 |
| complete invalid | `0 小時 0 分鐘` | 顯示於有問題的欄位 |

規則：

- 只完成開始或結束其中一組時，不過早顯示錯誤。
- 完整但超出範圍或無法解析時，對應欄位顯示 `!`。
- valid → invalid：結果歸零，不保留舊結果。
- 修正有效後，`!` 立即消失並重新計算。

### 10.2 休息時間

| 狀態 | 結果 | `!` icon |
|---|---|---|
| empty | 保留原始時長 | 不顯示 |
| incomplete | 保留原始時長 | 不顯示 |
| complete valid | 顯示扣除後淨時長 | 不顯示 |
| complete invalid | 保留原始時長 | 顯示 |
| 大於原始時長 | 保留原始時長 | 顯示 |

範例：

```text
01：__  → incomplete，不扣除、不顯示 !
__：30  → incomplete，不扣除、不顯示 !
25：00  → invalid，顯示 !
01：60  → invalid，顯示 !
休息 09:00、原始時長 08:00 → invalid，顯示 !
```

### 10.3 icon 原則

- `!` 顯示在實際有問題的欄位最右側。
- Desktop 主時間為單一輸入框，因此只顯示一個 `!`。
- Mobile segmented input 應盡量標示實際出錯的 HH 或 MM segment。
- 休息時間各 segment 都合法、但總休息超過原始時長時，標示整列休息時間。
- 不使用紅框或長篇錯誤文字。
- icon 位置固定，不造成 layout shift。
- icon 必須有無障礙名稱，例如：

```text
時間格式不正確
小時須介於 00 至 23
分鐘須介於 00 至 59
休息時間不能超過總時段
```

---

## 11. Desktop 與 Mobile 差異摘要

| 項目 | Desktop | Mobile |
|---|---|---|
| 開始／結束 | 單一文字輸入框 `HH:MM–HH:MM` | 兩列完整輸入框，右側 segmented `HH:MM` |
| 休息時間 | 預設收合，點文字連結展開 | 固定第三列，選填 |
| 休息移除 | 輸入框右側 `×` | 清空該列或使用 Mobile「清除時間」 |
| 驗證時機 | 完成／blur／Enter 後解析 | 逐段限制＋完整後驗證 |
| 清除時間 | 不提供獨立按鈕 | 提供輕量「清除時間」 |
| Apply／Calculate | 無 | 無 |
| 關閉方式 | N/A | 沿用共用 Sheet／Panel baseline |

---

## 12. Lower content

### 12.1 About 內容方向

工具說明區應簡潔涵蓋：

```text
計算兩個時間之間相隔多久
支援跨午夜，自動將較早的結束時間視為隔天
可選填休息時間並從結果扣除
提供一般時長、小數時數與總分鐘數
適合工時、班次、活動或任何單一時段
只處理 24 小時內的一段時間，不處理跨多日區間
```

建議標題：

```text
EN：About the Hours Calculator
ZH：關於時數計算
```

### 12.2 How to use

```text
1. 輸入開始時間與結束時間。
2. 視需要輸入休息時間。
3. 直接查看即時更新的結果。
```

英文：

```text
1. Enter the start and end times.
2. Add a break duration if needed.
3. View the updated result instantly.
```

### 12.3 Common uses

資訊標籤，不可互動：

```text
ZH：工時／班次／休息扣除／跨午夜時段
EN：Work hours／Shifts／Break deduction／Overnight time
```

---

## 13. FAQ 草稿

### 13.1 時數計算怎麼使用？

輸入開始時間與結束時間後，工具會立即計算兩者相隔的時數與分鐘。需要扣除休息時，可再輸入一段休息時間。

### 13.2 結束時間比開始時間早，會怎麼計算？

工具會自動將結束時間視為隔天。例如 `22:00–06:00` 會計算為 8 小時，並在結果中顯示「隔天」。

### 13.3 可以扣除休息時間嗎？

可以。休息時間為選填，輸入有效時會從原始時長中扣除；空白或 `00:00` 不會扣除。

### 13.4 可以計算超過 24 小時的時間嗎？

不可以。Hours Calculator 只處理 24 小時內的一段時間。跨多日的區間需要搭配日期類工具計算。

### 13.5 這個工具會儲存我輸入的時間嗎？

不會。本工具不使用 LocalStorage；重新整理頁面後會回到空白狀態。

英文 FAQ 於 B1A 依上述語意自然翻譯，不逐字直譯。

---

## 14. Related Tools

建議順序：

```text
1. Days Between Dates／日期差計算
2. Business Days Calculator／工作日計算
3. Date Calculator／日期加減計算
```

選擇原因：

- Days Between Dates：同樣處理兩個時間點之間的差距。
- Business Days Calculator：與工時、班次等工作情境互補。
- Date Calculator：同屬日期與時間計算工具。

不優先推薦 Countdown Timer，因為它處理「從現在開始倒數」，主要意圖不同。

實作時 Related IDs、正式上線狀態與排序需依 canonical catalog／Post-tool Link Integration Gate 核對。Date Calculator 已 production deployed（`origin/main` @ `d6e7893`），三張 Related 皆可指向 available 工具。

---

## 15. 共用元件與實作邊界

### 15.1 必須沿用

```text
V2 tool page scaffold
Adaptive Mobile Editor（AME）— Mobile Sheet／Mobile full-screen Panel 外殼
共用 overlay／scroll lock／keyboard-open composition
AME 共用 Numeric Keypad（禁止改走 native keyboard）
Tool Utility Capsule Control V2 Baseline（.tool-utility-control）
共用 ResultSummary（須先完成獨立 ResultSummary Compatibility Gate · support-region multiline assessment）
Tool Drawer／Related Tools baseline
ToolAdSlot disabled baseline
```

### 15.1.1 AME 責任邊界（共用外殼＋工具自有內容）

```text
AME 負責：
- Portrait Bottom Sheet
- Landscape full-screen Panel
- open／close
- live／submit lifecycle
- Done
- Reset slot
- focus／scroll lock
- 共用 Numeric Keypad
- 共用錯誤區（AmeFieldError primitive）

工具負責：
- 欄位內容與順序（三列開始／結束／休息）
- HH／MM segment 呈現與 active segment
- 初始值
- digit validation
- auto-advance（僅同組 HH→MM）
- validation 與錯誤文案
- Reset／Clear times 語意與預設值
```

Mobile 三列 `HH：MM` 為產品已核准介面；數位輸入透過 AME shared Numeric Keypad 與 tool-owned adapter 完成。MVP 不支援 Mobile paste；不得改用 native keyboard 或 legacy MSB sheet。

### 15.1.2 ResultSummary 責任邊界

```text
Hours Calculator 必須沿用 shared ResultSummary。
不得使用 tool-local result block。
不得把 weekday slot 當成通用次要結果。
不得把 support 文字放在 weekday 視覺位置。
不得使用 rs:update 後 DOM patch／CSS hack 假造第二層或 lighter-note 層。

Hours 結果映射（產品語意 · 不預先指定新 shared API identifier）：
primary
→ natural duration（自然時長）

support region · line 1
→ decimal hours · total minutes · next-day marker
→ 視覺語意＝Date Calculator support 主文（「Add 22 days…」層）
→ 不是 weekday（「Tuesday」）層

support region · line 2
→ break deduction（僅有效休息 > 0 時顯示）
→ 與 line 1 同層級輔助文字；非 lighter note

weekday
→ 維持真正的星期資訊語意；Hours 不使用
```

### 15.1.3 ResultSummary Compatibility Gate（support-region multiline assessment）

Hours Calculator **B1B／B2 前**必須先完成獨立 **ResultSummary Compatibility Gate**（L 層 shared task）。
Gate **不是**「必須新增 neutral `detail` API」；改為 **support-region multiline compatibility assessment**。

Gate 必須先檢查目前 ResultSummary 是否能安全支援：

```text
1 行 support
或
2 行同層級 support
```

```text
1. 現有 support API／DOM／CSS 是否已能乾淨承載：
   - line 1：decimal · minutes · next-day
   - line 2：break deduction（與 line 1 同層級；需要時才顯示）

2. Outcome A — 現有能力已足夠：
   - shared code 不修改
   - 不新增 API
   - 證明 Hours 可沿用 existing ResultSummary
   - 留下 assessment／validation 結論，交 Owner 確認

3. Outcome B — 現有能力只能安全處理單行 support：
   - 才考慮最小 support-region extension
   - 目的只為支援第二行同層級 support
   - 不建立 lighter-note semantics
   - 不建立 weekday-level `detail`
   - API／DOM 形式由 Gate 依現有 conventions 決定

4. 必須保持：
   - Date Calculator weekday semantics
   - Date Calculator 現有 ResultSummary layout
   - 其他 adopter compatibility

5. 不得使用：
   - tool-local ResultSummary replacement
   - DOM patch
   - CSS hack 假造第二層／lighter note
   - 把 support 文字塞入 weekday
```

Gate 仍為獨立 shared task；完成並經 Owner 確認前：

```text
不得開始 B1B
不得開始 B2
```

不得在 Hours 工具 batch 內順便修改 ResultSummary shared internals。若 Gate 判定需 shared 變更（Outcome B），僅能在獨立 Gate task、Owner 核准後修改。

### 15.2 不得自行修改

```text
Header
Footer visual layout
BaseLayout
Global background
Shared containers
Adaptive Mobile Editor shared baseline
ResultSummary shared internals（僅 Outcome B 且獨立 Compatibility Gate 經 Owner 核准後可改）
ToolCard／Related Tools visual baseline
既有工具核心邏輯
Live ads／AdSense
tool-mobile-sheet-v2-baseline.css（legacy MSB baseline；Hours 不採 legacy MSB sheet）
```

---

## 16. RWD 與視覺原則

### 16.1 共通

- 主結果必須一眼看懂。
- 輸入時刻與輸出時長使用不同視覺語言。
- 輔助休息時間不可搶走開始／結束時間的主層級。
- 避免像工時後台、timesheet 或傳統表單工具。
- 精確字級、欄寬、gap、icon 尺寸留到 B1B 靜態畫面核准。

### 16.2 Mobile portrait

- 第一屏需完整看到主結果與時間區間膠囊。
- Sheet open 時背景結果群組依共用規則縮放與重新定位。
- Keyboard open 時 result group 與 sheet 必須形成同一 composition。
- Sheet 與鍵盤間不得露出 lower content。

### 16.3 Mobile landscape

- 使用全頁覆蓋式 Mobile Panel。
- 三列時間欄位上下排列。
- 不套用 Desktop 單一 inline input。
- 不因橫式而改成兩欄或三欄。
- 鍵盤開啟時維持共用 landscape full-screen composition，不套 portrait lift。

### 16.4 Desktop

- 主輸入框維持單一、乾淨、可快速鍵盤輸入。
- 休息時間預設隱藏，降低輔助選項干擾。
- 「＋ 加入休息時間」置中且輕量。

---

## 17. QA 重點

### 17.1 計算

```text
[ ] 09:00–18:00 = 9 小時
[ ] 09:00–18:20 = 9 小時 20 分鐘
[ ] 22:00–06:00 = 8 小時 · 隔天
[ ] 09:00–09:00 = 0 小時 0 分鐘
[ ] 23:50–00:10 = 20 分鐘 · 隔天
[ ] 休息 00:30 正確扣除
[ ] 休息等於原始時長 → 0 小時 0 分鐘
[ ] 休息大於原始時長 → 原始結果保留、休息欄顯示 !
[ ] 小數時數最多 2 位並移除尾端 0
[ ] 總分鐘數正確
```

### 17.2 Desktop input

```text
[ ] 09:00-18:00
[ ] 9:00-18:00
[ ] 09:00 - 18:00
[ ] 09:00 – 18:00
[ ] 0900-1800
[ ] 900-1800
[ ] 不接受 09001800
[ ] blur／Enter 後正規化
[ ] 輸入途中不干擾 caret
[ ] 主時間 invalid 顯示 ! 並歸零
[ ] 休息展開立即顯示 ×
[ ] 休息 invalid 時 × 變成 !
[ ] 點 × 清空、收起並恢復原始結果
[ ] Desktop 無清除時間按鈕
```

### 17.3 Mobile input

```text
[ ] 三列皆為同一輸入框內 label＋HH:MM
[ ] HH 限制 00–23
[ ] MM 限制 00–59
[ ] 3–9 小時第一位正規化
[ ] 6–9 分鐘第一位正規化
[ ] auto-advance 只在同一組內
[ ] Backspace／Delete 不誤跳
[ ] 回頭修改不誤跳
[ ] 僅透過 AME Numeric Keypad 輸入（無 Mobile paste）
[ ] incomplete 不過早顯示 !
[ ] 主要時間 invalid 結果歸零
[ ] 休息 invalid 保留原始結果
[ ] Clear times 清除全部且 Panel 保持開啟
```

### 17.4 第一屏與 Panel

```text
[ ] 初始膠囊顯示開始時間 — 結束時間
[ ] 只有兩組都有效才顯示實際時間
[ ] 跨午夜膠囊同列顯示隔天／next day
[ ] Mobile portrait closed／sheet-open
[ ] Mobile portrait keyboard-open
[ ] Mobile landscape closed／full-screen panel open
[ ] Mobile landscape keyboard-open
[ ] 轉向後狀態正常
[ ] 共用關閉方式正常
[ ] overlay／scroll lock 正常
[ ] 無 horizontal overflow
```

### 17.5 內容與工程

```text
[ ] EN／ZH UI 文案完整
[ ] About／How to use／Common uses／FAQ
[ ] FAQ 3–6 題且 JSON-LD 一致
[ ] Related Tools 最多 3 個
[ ] ToolAdSlot disabled
[ ] accessibility labels
[ ] npm run build PASS
[ ] 相關 validator PASS
[ ] git diff --check PASS
[ ] 未修改 locked components
[ ] 未 commit／push／deploy，除非 Owner 明示
```

---

## 18. 建議實作批次

Hours Calculator 為新工具 MVP，依 Owner Workflow 屬 L 層任務；先 Plan-first，不直接實作。

```text
B0：V2 工具頁 scaffold＋sitemap validator 同步更新
B1A：Lower content／SEO／FAQ／Related Tools
ResultSummary Compatibility Gate（獨立 L shared task · support-region multiline assessment · B1B 前必過）
B1B：上方工具靜態畫面（Desktop／Portrait／Landscape）
B2A：Desktop 主時間與休息輸入解析
B2B：Mobile segmented input＋AME Numeric Keypad＋Sheet／Panel
B2C：計算、結果、錯誤與清除狀態
B3：QA／regression／polish
B4：Standalone commit checkpoint
B5：Post-tool Link Integration Gate
B6：Release／production verification
```

每個批次完成後先回報與驗收，不混做整支工具。ResultSummary Compatibility Gate 與 Hours standalone code 不得混在同一實作 batch。Gate Owner 確認前不得開始 B1B／B2。

---

## 19. B1B／實作前待確認

以下不是產品邏輯缺口，可在 B1B 或 Implementation Plan 中定案：

```text
1. Desktop 主輸入框與休息輸入框的精確寬度、高度與間距
2. 主結果與次要結果的精確字級與行距
3. `×`／`!` 的正式 icon、尺寸與 hit area
4. Mobile「清除時間」在共用 AME Panel 中的精確位置／label
5. 次要結果中「隔天」是否需要獨立 visual treatment
6. EN／ZH meta title、meta description 最終文案
7. Catalog icon 選擇（standalone B0–B4 可先用 placeholder；B5 前定案）
8. Mobile 膠囊內「隔天／next day」inline 字級是否需 tool-local composition token
```

已決定、不再重開：

```text
ResultSummary hierarchy：
  primary＝natural duration
  support region line 1＝decimal · minutes · next-day（DC support 主文層，非 weekday）
  support region line 2＝break deduction（與 line 1 同層級；需要時顯示）
  無 lighter note／無第三層 hierarchy
  Hours 不使用 weekday；不預設需要 detail API
ResultSummary Compatibility Gate＝support-region multiline assessment（Outcome A／B）；B1B／B2 前必過
Mobile paste：MVP 不做；僅 AME Numeric Keypad
Sitemap validator：B0 建立 routes 時同步更新並 PASS
```

---

## 20. 規格結論

Hours Calculator／時數計算的 MVP 鎖定為：

```text
24 小時制
一組開始與結束時間
自動判斷跨午夜
一段選填休息時間
即時計算
主結果使用自然時長
support region 1–2 行同層級輔助文字：
  line 1＝小數時數 · 總分鐘 · 隔天
  line 2＝休息扣除（需要時）
無效休息不破壞原始結果
Desktop 快速單框輸入（含 parse／normalize／paste）
Mobile 三列完整 segmented 輸入框＋AME Numeric Keypad（無 Mobile paste）
Mobile portrait 共用 Bottom Sheet（AME）
Mobile landscape 共用全頁覆蓋 Panel（AME）
不保存、不分享、不做多日與工時系統
```

B0＋B1A＋ResultSummary Compatibility Gate＋B1B＋B2A＋B2B＋B2C＋B3 已完成並經 Owner 確認。
B4＝standalone commit checkpoint（本狀態）。下一步為 **B5 Link Integration**（catalog `available:true`、inbound links）；Owner 核准前不得自行開始。
