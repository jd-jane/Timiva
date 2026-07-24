# Timiva Date Input Interaction Standard

> 更新日期：2026-07-11
> 定位：日期輸入互動標準與 Age Calculator 實機測試沉澱
> 這不是要求所有日期欄位都使用同一種 input。
> 這份文件特別用於「採用快速日期輸入作為主要互動」的工具。若工具特性是快速計算，且 Owner 決定不以 calendar picker 作為主要輸入，就應優先沿用本文件的 Smart Date Input 規則。

---

## 1. 文件目的

本文件記錄 Timiva 日期輸入工具的：

```text
互動模式選擇
狀態處理（empty / incomplete / valid / invalid）
Desktop / Mobile 差異
Calendar / native picker 行為
Mobile sheet / keyboard 注意事項
QA checklist
```

用途：

```text
判斷什麼情境適合 Smart Date Input、Mobile segmented input、native date picker
沿用 Age Calculator 已驗證細節，避免未來相同模式工具重新試錯
讓 Days Between Dates 等快速日期計算工具可直接沿用同一套輸入行為
```

---

## 2. 適用範圍

### 適用

```text
Age Calculator
Days Between Dates
Date Calculator / Add or Subtract Days
Business Days Calculator
未來出生日期、遠年份日期、日期區間、as-of date 相關工具
```

### 不適用

```text
Countdown Timer 的 H / M / S 時長輸入
非日期型文字輸入
不需要日期計算的設定欄位
```

---

## 3. 快速日期輸入型工具

### 適合工具

```text
Days Between Dates
Date Calculator / Add or Subtract Days
Business Days Calculator
其他以快速輸入日期、快速得到結果為主的日期計算工具
```

### 原則

```text
主要互動是 keyboard-first / fast input
使用者可以直接輸入日期，不必先開 calendar
支援純數字 6 / 7 / 8 碼推斷
支援 slash / dash 輸入
輸入過程不過度干擾 caret
修改既有日期時，不可吃掉其他 segment
empty / incomplete 不過早顯示錯誤
valid → invalid 必須歸零，不可保留上一個 valid 結果
若有兩個日期欄位，兩者必須使用一致的解析、invalid、empty、incomplete、正規化規則
```

### Days Between Dates 初步適用方向

```text
主操作以快速輸入為主
不以 calendar picker 作為主要輸入方式
若未來需要 calendar，可作為輔助入口，不應取代快速輸入
Start date 與 End date 應共用同一套 Smart Date Input 規則
不要因為有兩個日期欄位，就重新發明另一套輸入邏輯
```

---

## 4. Age Calculator 已驗證模式

### Desktop birth date

```text
單一 Smart Date Input
支援直接輸入
支援 slash / dash
支援 6 / 7 / 8 碼純數字推斷
搭配 calendar popover
calendar popover 支援 month / year select
```

### Mobile birth date

```text
Year / Month / Day 三欄 segmented input
適合出生日期、遠年份日期
比 mobile native date picker 更適合快速輸入幾十年前日期
支援 auto-advance
支援多欄 invalid icon
```

### Desktop As-of date

```text
使用 calendar popover
as-of 不是 today 時，日期旁顯示輕量 back icon
點 back icon 回到 today
點 back icon 不可同時開 calendar
```

### Mobile As-of date

```text
使用 native date picker
不顯示 back icon
原因：手機 back icon 太小不好點；使用 native picker 內建清除 / 重置即可
```

---

## 5. 純數字輸入推斷規則

只有在 input **不含** `/` 或 `-` 時套用。

### 6 碼：`YYYY / M / D`

```text
199011 → 1990 / 1 / 1
```

### 7 碼：依月份可能性推斷

判斷原則：

```text
1. 先嘗試 YYYY / MM / D
2. 若 MM 不是有效月份（01–12），改為 YYYY / M / DD
3. 若仍不是有效日期，視為 complete invalid
```

例子：

```text
1950820 → 1950 / 8 / 20
1950102 → 1950 / 10 / 2
1950131 → 1950 / 1 / 31
```

補充（Age Calculator 實作沉澱）：

```text
首位 0 → 視為 MM / D（例如 1950012 → 1950 / 01 / 2）
首位 2–9 → 視為 M / DD
首位 1 → 優先嘗試 10–12 的 MM / D；不可行再退回 M / DD
```

### 8 碼：`YYYY / MM / DD`

```text
19900101 → 1990 / 01 / 01
19901101 → 1990 / 11 / 01
```

### 逐鍵 continuous input（實作約束）

純數字逐鍵輸入與 paste 同一串，最終結果必須一致。

```text
逐鍵輸入時先保留 raw digit stream，不要在第 5 / 6 碼就過早 commit 成固定 segment
6 / 7 碼推斷可在顯示上預覽，但逐鍵過程中不可因此切到 segment-append，也不可視為輸入完成
8 碼達成且 valid 時，可格式化為 YYYY / MM / DD
6 / 7 碼可在 blur / Enter / paste complete / 明確完成輸入時再格式化
```

錯誤行為（不可接受）：

```text
逐鍵 19991122 → 變成 1999 / 01 / 12（第 6 碼過早用 6 碼規則鎖死）
Desktop From 逐鍵到 199911 就 auto-focus 到 To
```

正確行為：

```text
逐鍵 19991122 與 paste 19991122 → 皆為 1999 / 11 / 22
Desktop From 逐鍵 continuous：僅 8 碼 valid 後才可 From → To auto-focus
blur / Enter / paste complete 後，valid 日期可視為完成
```

---

## 6. Slash / dash 輸入規則

若使用者輸入包含 `/` 或 `-`：

```text
優先尊重使用者分段
不再套用純數字 6 / 7 / 8 碼推斷
月 / 日可允許 1–2 位
blur 或完成後可正規化為 YYYY / MM / DD
鍵盤直接輸入 / 或 - 應可行，不應只支援 paste
```

---

## 7. Segment-based 編輯狀態

Smart Date Input **不應**只把日期當成一條字串處理。
應以 `year` / `month` / `day` 三段 segment 管理狀態。

### 規則

```text
修改 year 不可清空 month / day
修改 month 不可清空 year / day
修改 day 不可清空 year / month
回頭修改中間數字時，不可讓後方數字往前遞補
Backspace / Delete 只影響目前 segment
全選刪除才回到 empty
三段都刪空才是 empty
其中一段空白是 incomplete
```

### 例子

```text
1990 / 04 / 04
刪掉 year →  / 04 / 04，狀態 incomplete

1990 / 04 / 04
刪掉 month → 1990 /  / 04，狀態 incomplete

1990 / 04 / 04
刪掉 day → 1990 / 04 / ，狀態 incomplete
```

### 錯誤行為（不可接受）

```text
1990 / 04 / 04
修改 month 時變成 1990 / 10 / 4
→ day 被吃掉或錯位，不可接受

2000 / 1 / 23
不可把 segmented value 重合併成 2000123 再跑 7 碼推斷
→ 必須得到 2000 / 01 / 23
```

---

## 8. Mobile segmented input auto-advance

當手機使用 Year / Month / Day 三欄時：

### Year

```text
輸入滿 4 位，跳到 Month
```

### Month

```text
第一位是 2–9 → 視為一位數月份，跳到 Day
第一位是 0 或 1 → 等待第二位
01 / 10 / 12 等完成後跳到 Day
```

### Day

```text
單一日期輸入時，Day 是最後一欄，不自動跳其他欄
若工具是雙日期欄位（例如 Days Between Dates），是否從 Start day 跳到 End year 必須由該工具規格明確指定
預設不要自動跨日期欄位跳動，避免使用者回頭修改時被干擾
```

### 不可 auto-advance 的情境

```text
Backspace / Delete
使用者回頭修改既有值
caret 不在欄位結尾
貼上整段日期時
```

### auto-advance 觸發條件

```text
欄位值變長
caret 在欄位結尾
欄位已達可判斷完成狀態
使用者不是按 Backspace / Delete
```

---

## 9. 狀態規則

| 狀態 | 結果 | invalid icon |
|---|---|---|
| empty | 歸零 | 不顯示 |
| incomplete | 歸零 | 不顯示 |
| complete valid | 更新結果 | 不顯示 |
| complete invalid | 歸零 | 顯示 |

其他規則：

```text
valid → invalid：必須歸零，不可保留上一個 valid 結果
future date：invalid
低於 min date 或高於 max date：invalid
```

Age Calculator birth 參考邊界：

```text
min：1900 / 01 / 01
max：today
```

---

## 10. 雙日期欄位規則

適用於：

```text
Days Between Dates
Date Range / Business Days 類工具
```

規則：

```text
Start date 與 End date 應共用同一套 Smart Date Input 行為
兩欄的格式化、解析、invalid 判斷與正規化不可不一致
任一欄 empty / incomplete 時，主要結果應回到預設或 0 狀態，且不顯示 invalid icon
任一欄 complete invalid 時，主要結果應歸零，並在對應欄位顯示 invalid icon
valid → invalid 不可保留上一組有效日期的結果
不要讓 Start date 的輸入狀態影響 End date 的 segment，反之亦然
兩個日期欄位都應可獨立刪除、修改、全選清空
是否允許 end date 早於 start date，應由工具規格決定；不要在本標準硬寫所有工具共用結論
```

---

## 11. invalid icon 規則

Age Calculator 已驗證方向：

### Desktop

```text
invalid icon 低調顯示
不使用紅框
不顯示長錯誤文字
icon 可接在日期文字附近
```

### Mobile segmented input

```text
Year invalid → Year 欄位顯示 icon
Month invalid → Month 欄位顯示 icon
Day invalid / 日期不存在 / future date → Day 欄位顯示 icon
多欄 invalid 可同時顯示
icon 固定在欄位右側，不要讓版面跳動
```

---

## 12. Calendar / picker 行為

### DesktopCalendar（Shared）與 Smart Date Input 分層

```text
Smart Date Input：文字輸入／解析／segment 行為（見本文件前述章節）
DesktopCalendar：視覺選日 UI（shared component）

兩者可並存於同一工具，但 ownership 不同：
  Smart Date Input ≠ DesktopCalendar
  不得把 calendar DOM／controller 當日期解析層
```

正式 shared 契約見：[`shared-component-reuse-gate.md`](../workflow/shared-component-reuse-gate.md) §7。

### Shared DesktopCalendar variants（僅兩種）

| Variant | 用途 |
|---|---|
| `inline-large` | Date Range Calculator Desktop inline |
| `popover-compact` | Business Days Calculator、Age Calculator、未來 Date Calculator |

```text
禁止第三種 variant／尺寸別名／工具專屬皮膚。
需要新 variant → L 層 Plan＋Owner 核准（預設拒絕）。
yearList.mode = full｜nearby 是資料策略，不是 variant。
  DRC Desktop：nearby ±10
  BDC／Age：full（各自 min／max）
```

### Shared vs adapter ownership

```text
Shared 管理：
  day grid、month 3×4、year input＋scroll list
  previous／next、Esc 分層、outside click、focus return
  popover／inline chrome、variant tokens（.sdc-*）

Adapter 管理：
  selection（single／range）
  min／max、isDateSelectable
  close policy、input／結果同步
  placement／nudge／avoidRects／anchor
  工具外層 Clear／triggers／sheet shell
```

### Desktop calendar 行為（核准基準）

```text
不應壓住主結果（可用 avoidRects／adapter positioning）
同頁多 popover：Shared Registry 互斥（如 Age Birth／As-of）
點外部／Esc 可關閉（popover）；Esc 先關 month／year panel
選日期後依 adapter close policy 更新結果
month／year 只切換 view，不代表已選定日期
定位差異由 adapter 提供；不得 tool CSS 覆寫 .sdc-* 硬推位置
```

### Mobile 不屬於 Shared DesktopCalendar contract

```text
Mobile segmented input
native date picker
Bottom Sheet calendar（含 DRC Mobile legacy data-drv2-* 過渡例外）
→ 不納入 DesktopCalendar shared contract
→ DRC Mobile legacy 不得當作可新增第二套 Desktop Calendar 的先例
```

### As-of reset

```text
Desktop：可使用日期旁 back icon
Mobile：不使用 back icon
Mobile：使用 native picker 內建清除 / 重置
點 back-to-today 不得同時開啟 Calendar
```

---

## 13. Mobile sheet / keyboard 注意事項

```text
bottom sheet 開啟時需 scroll lock
keyboard open 時不可讓背景捲到 lower content
sheet 與 keyboard 中間不可露出 You may also need / Related Tools
mobile landscape sheet 應 compact，不直接套 portrait 高度
keyboard-open composition 需真機驗證，emulation 不足以單獨定案
```

相關文件：[`mobile-sheet.md`](./mobile-sheet.md)

---

## 14. QA checklist

```text
[ ] Desktop EN / ZH
[ ] Mobile portrait EN / ZH
[ ] Mobile landscape EN / ZH
[ ] empty
[ ] incomplete
[ ] complete valid
[ ] complete invalid
[ ] valid → invalid 是否歸零
[ ] future date
[ ] min date
[ ] max date
[ ] leap day
[ ] slash / dash input
[ ] 6 / 7 / 8 碼純數字
[ ] 回頭修改 year / month / day
[ ] Backspace / Delete
[ ] 全選刪除
[ ] mobile auto-advance
[ ] mobile backspace 不跳欄
[ ] calendar open / close
[ ] native picker
[ ] keyboard open
[ ] 無 horizontal overflow
[ ] console 無 error
[ ] 快速日期輸入工具是否不依賴 calendar 作為主要輸入
[ ] 兩個日期欄位是否共用一致 Smart Date Input 規則
[ ] Start date valid → invalid 是否歸零
[ ] End date valid → invalid 是否歸零
[ ] Start date / End date 是否可獨立刪除與修改
[ ] 雙日期欄位不會互相吃掉 segment
[ ] 若有跨欄 auto-advance，是否由工具規格明確定義
[ ] Days Between Dates 類工具是否可直接引用本文件作為 input behavior baseline
```

---

## 15. 未來使用規則

```text
新工具若採用相同日期輸入模式，應先閱讀本文件。
Days Between Dates 可直接以本文件作為快速日期輸入 baseline。
若下一個日期工具採用 fast input，task brief 應明確引用 docs/standards/date-input.md。
Calendar / native picker 是否加入，應由工具特性決定，不應自動成為所有日期工具的主互動。
本文件先作為互動標準，不代表現在就要抽 shared component。
不要一開始就抽共用 component。
先依工具情境採用已驗證模式。
等 2–3 個工具穩定採用同一套規則後，再評估 date input utility 或 shared component。
不得在未授權任務中改寫已驗收工具的日期輸入 core logic。
```

---

## 相關文件

```text
docs/tools/age-calculator/product-spec.md
docs/tools/age-calculator/README.md
docs/standards/mobile-sheet.md
docs/standards/interactive-controls.md
docs/workflow/tool-page-qa.md
```
