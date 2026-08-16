# Timiva Japanese Era Converter 產品規格

建立日期：2026-08-10
修訂：2026-08-16（B4 standalone · 同步 Mobile invalid：欄位內 `!` + 欄位下方可見 range message）
狀態：Owner accepted product spec · standalone complete（local）· catalog `available:false` · 尚未 Link Integration／push／deploy
適用工具：Japanese Era Converter / 日本年號換算
分類：Important Dates / 重要日子
預計路由：`/en/japanese-era-converter/`、`/zh/japanese-era-converter/`

---

## 1. 工具定位

### 工具名稱

```text
EN：Japanese Era Converter
ZH：日本年號換算
```

支援描述／SEO 可使用：

```text
和曆西元換算
和曆與西元雙向換算
Gregorian year and Japanese era conversion
```

### 工具目的

Japanese Era Converter 用來快速在西元年份與日本近現代年號之間進行雙向換算。

MVP 聚焦「年份」：

```text
西元年份 → 日本年號
日本年號 + 年份 → 西元年份
```

工具不要求使用者輸入完整月日。

當一個西元年份跨越兩個年號時，工具不擅自選擇其中一個，而是同時顯示該年的兩個年號與各自有效日期範圍。

### 核心體驗

```text
輸入少
即時換算
主結果一眼看懂
遇到改元年時提供必要日期資訊
手機操作簡單
不擴張成歷史年號資料庫
```

---

## 2. MVP 範圍

### 2.1 支援年號

```text
明治
大正
昭和
平成
令和
```

英文版：

```text
Meiji
Taisho
Showa
Heisei
Reiwa
```

> EN 年號統一使用 `Meiji`／`Taisho`／`Showa`／`Heisei`／`Reiwa`（不用 macron）；同一語系內必須一致。

### 2.2 西元有效範圍

```text
1873～2100
```

起點理由：

```text
1873 = 明治6年
```

日本自明治6年（1873年）開始採用太陽曆；更早日期涉及舊曆／新曆轉換，因此不納入本工具 MVP。

### 2.3 年號有效範圍

```text
明治：6～45
大正：1～15
昭和：1～64
平成：1～31
令和：1～對應西元2100年的年份
```

令和未來年份允許換算，但必須使用「假設令和持續使用」提示。

---

## 3. V1 / MVP 不做範圍

```text
不輸入完整月日
不做完整日期換算
不支援明治6年以前
不支援慶應或更早的歷史年號
不做大型歷史年號資料庫
不處理日本舊曆／太陰太陽曆換算
不處理南北朝並存年號
不做農曆、農民曆、宜忌等內容
不預測令和之後的新年號
不使用 LocalStorage 保存上次輸入
不做 URL sharing
不做會員、後端或資料庫
```

「允許未來令和換算」不代表預測未來年號；它只是以令和持續使用為條件進行算術換算。

---

## 4. 預設狀態

### 預設模式

```text
Gregorian → Japanese era
西元 → 和曆
```

### 預設畫面

```text
Input mode：Gregorian
Input：empty
Main result：?
Secondary info：none
Invalid icon：none
Future assumption note：none
```

若之後切換到 Japanese era mode 且沒有可自動帶入的有效單一結果：

```text
Era default：令和 / Reiwa
Year：empty
Main result：?
```

---

## 5. Desktop 主要輸入

### 5.1 Gregorian mode

使用單一複合輸入框：

```text
[ 西元 │ 這裡填寫西元年份，例如 2026 ]
```

英文概念：

```text
[ Gregorian │ Enter a year, e.g. 2026 ]
```

規則：

```text
左側為固定 prefix
右側為年份數字 input
prefix 與 input 中間使用全高度淡色 divider
不在輸入值後方自動加「年」
使用者輸入的數字維持原輸入顯示
placeholder 的示例年份使用動態目前年份
```

### 5.2 Japanese era mode

使用同尺寸、同位置的複合輸入框：

```text
[ 令和⌄ │ 這裡填寫和曆年份，例如 8 ]
```

英文概念：

```text
[ Reiwa⌄ │ Enter an era year, e.g. 8 ]
```

規則：

```text
左側 prefix 改為年號 selector
右側為年份數字 input
divider 保留
不在 input 內加「年」
Japanese era mode 的預設 era 為令和 / Reiwa
placeholder 示例年份依目前令和年份動態產生
```

---

## 6. Desktop 年號選擇器

Desktop 使用 anchored compact popover。

年號順序：

```text
明治
大正
昭和
平成
令和
```

英文：

```text
Meiji
Taisho
Showa
Heisei
Reiwa
```

行為：

```text
anchored 在年號 selector
五個年號垂直排列
目前選擇低調 highlighted / checked
選擇後立即關閉
點外部關閉
Esc 關閉
支援 keyboard navigation / focus
空間不足時可向上翻轉
```

視覺可借用 Timiva Desktop Calendar popover 的語言，但：

```text
不得重用或濫用 DesktopCalendar 元件
不得把 era menu 實作成 calendar variant
```

---

## 7. 模式切換

### 7.1 Switch control

結果在上、輸入在下。

兩者之間／附近使用：

```text
垂直雙向箭頭
⇅
```

不使用左右箭頭，因為此控制代表「交換上方結果與下方輸入所使用的曆法」。

Desktop 以 icon 為主。

Mobile AME 使用 icon + action text：

```text
⇅ 改用和曆輸入
⇅ 改用西元輸入
```

英文：

```text
⇅ Switch to Japanese era input
⇅ Switch to Gregorian year input
```

文字描述「切換後要做的動作」，不是目前模式。

---

## 8. 切換與自動帶入規則

### 8.1 Gregorian → Japanese era

若目前 Gregorian year 只有一個有效年號結果：

```text
2026
→ result：令和8年
→ switch
→ Japanese input：令和 | 8
→ result：2026年
```

可自動帶入等值的 era + year。

### 8.2 Gregorian transition year → Japanese era

若目前 Gregorian year 對應兩個年號：

```text
2019
→ 平成31年｜令和元年
```

切換到 Japanese era input 時：

```text
不得替使用者自動選平成或令和
Era：預設令和
Year：empty
Result：?
```

因為沒有月日資訊，工具不能推斷使用者想要哪一段。

### 8.3 Japanese era → Gregorian

若 Japanese era + year 有唯一 Gregorian year：

```text
令和 8 → 2026
```

切換到 Gregorian mode 時可自動帶入：

```text
Gregorian input：2026
```

若該 Gregorian year 是 transition year，切換完成後 Gregorian → Japanese era 結果依正常規則顯示雙年號。

### 8.4 Empty / invalid 切換

```text
新模式 input 保持 empty
Result：?
不攜帶 invalid 狀態到不相關欄位
```

---

## 9. 計算規則

### 9.1 一般換算公式

Era → Gregorian：

```text
Meiji：era year + 1867
Taisho：era year + 1911
Showa：era year + 1925
Heisei：era year + 1988
Reiwa：era year + 2018
```

Gregorian → Era 在非 transition year 時使用相反換算。

### 9.2 Transition year

以下西元年份必須顯示雙年號：

| 西元 | 主結果 | 前段日期 | 後段日期 |
|---:|---|---|---|
| 1912 | 明治45年｜大正元年 | 明治45年 1月1日－7月29日 | 大正元年 7月30日－12月31日 |
| 1926 | 大正15年｜昭和元年 | 大正15年 1月1日－12月24日 | 昭和元年 12月25日－12月31日 |
| 1989 | 昭和64年｜平成元年 | 昭和64年 1月1日－1月7日 | 平成元年 1月8日－12月31日 |
| 2019 | 平成31年｜令和元年 | 平成31年 1月1日－4月30日 | 令和元年 5月1日－12月31日 |

英文對應示例：

```text
2019
Main：Heisei 31 | Reiwa 1
Detail：Heisei 31: Jan 1–Apr 30 / Reiwa 1: May 1–Dec 31
```

### 9.3 Japanese era 輸入 transition boundary year

例如：

```text
平成 31
→ 2019年
→ secondary：1月1日－4月30日

令和 1
→ 2019年
→ secondary：5月1日－12月31日
```

同理：

```text
明治45
大正1 / 15
昭和1 / 64
平成1 / 31
令和1
```

若該 era-year 只覆蓋該 Gregorian year 的部分日期，需要顯示其有效日期範圍。

---

## 10. 元年顯示

輸入欄仍使用數字：

```text
1
```

中文結果顯示：

```text
元年
```

例如：

```text
Input：令和 | 1
Result：2019年
```

Gregorian → Japanese era：

```text
2019 → 平成31年｜令和元年
```

英文不使用 `Gannen`，採一般英文使用者容易理解的：

```text
Reiwa 1
Taisho 1
Showa 1
Heisei 1
```

---

## 11. Result display

### 11.1 Empty / incomplete

```text
Main result：?
Secondary：none
Invalid icon：none
```

不增加「請輸入年份」等 empty-state 說明。

### 11.2 一般有效結果

Gregorian → Japanese era：

```text
2026 → 令和8年
```

Japanese era → Gregorian：

```text
令和8 → 2026年
```

一般有效結果：

```text
只顯示 main result
不顯示一般 secondary description
```

### 11.3 Transition year

主結果：

```text
平成31年｜令和元年
```

次要資訊：

```text
平成31年 1月1日－4月30日 / 令和元年 5月1日－12月31日
```

Desktop / Mobile landscape：

```text
優先單行
```

Mobile portrait：

```text
固定從 / 的語意邊界拆為兩行
不允許 browser 任意拆在 era + date group 中間
```

例如：

```text
平成31年 1月1日－4月30日
令和元年 5月1日－12月31日
```

### 11.4 Future Reiwa assumption

只要換算涉及「目前年份之後的令和」：

```text
無論 Gregorian → Japanese era
或 Japanese era → Gregorian
都顯示相同 assumption note
```

中文：

```text
ⓘ 此結果假設令和年號持續使用
```

英文：

```text
ⓘ Assuming the Reiwa era remains in use.
```

規則：

```text
目前年份不顯示
過去年份不顯示
未來年份顯示
icon 使用線條圓形 i
不得使用實心 warning icon
使用 secondary gray / info styling
```

---

## 12. Invalid behavior

### 12.1 Invalid examples

```text
Gregorian < 1873
Gregorian > 2100

明治 1～5
明治 > 45
大正 > 15
昭和 > 64
平成 > 31

Era year = 0
負數
小數
非數字
超出目前定義上限
```

### 12.2 Invalid UI

```text
Main result：?
Input 右側：!
不使用紅色 input border
不顯示長篇 error message
valid 後 ! 立即消失
```

### 12.3 Desktop invalid tooltip

Desktop `!`：

```text
hover 可顯示 tooltip
keyboard focus 也可讀取／顯示
```

文案範例：

```text
明治：支援6年至45年
平成：僅至31年
請輸入1以上的年份
西元年份請輸入1873至2100
```

### 12.4 Mobile invalid

Mobile invalid 同時使用欄位內 icon 與欄位下方可見 range message。

欄位內：

```text
[ 西元 1753                         ⚠ ]
```

欄位下方：

```text
西元年份請輸入 1873 至 2100
```

和曆例：

```text
[ 平成 32                           ⚠ ]
平成年份請輸入 1 至 31
```

EN 使用簡短自然文案，例如：

```text
Gregorian year: 1873–2100
Heisei year: 1–31
```

規則：

```text
欄位內右側持續顯示三角形 ! error icon
欄位正下方顯示可見的 range error message
invalid 持續存在時，icon + message 都必須持續存在
直到 valid／Clear／Reset／mode switch 到 empty 或 valid 才一起消失
era change 時 range message 隨目前年號更新
不使用紅色 border
不使用 tooltip
不套 Desktop inline error layout
empty／incomplete 不顯示 range error
不要求使用者 tap icon
```

可見 message 與 accessibility message 不重複朗讀：

```text
可見 range message 對輔助科技隱藏
screen-reader 仍走既有 AmeFieldError 語意
合理 aria-invalid / describedby
```

range／invalid reason 仍來自正式 evaluate／`formatInvalidHint`，不在 Mobile adapter 重寫年份規則。

---

## 13. Reset

Desktop：

```text
沿用 Date Calculator 文字型 Reset 視覺
不做 primary capsule
```

Mobile：

```text
使用 Shared Adaptive Mobile Editor 的 Reset slot
```

Reset 後：

```text
mode → Gregorian
Gregorian input → empty
Main result → ?
Secondary → clear
Invalid icon → clear
Mobile visible range message → clear
Future assumption note → clear
Era default → Reiwa
Era popover / picker → close
Mobile keyboard → dismiss
```

Mobile AME Reset 後：

```text
AME 保持開啟
讓使用者可直接重新輸入
```

---

## 14. Local state / persistence

### 14.1 同一次頁面 session

Mobile AME：

```text
關閉後重新打開
保留目前已提交的 input / mode
```

### 14.2 Refresh / future visit

```text
不使用 LocalStorage
重新整理 → 回到預設 Gregorian empty state
下次造訪 → 不恢復上次年份
```

理由：

```text
此工具多為臨時查詢
舊年份沒有長期保存價值
保留舊值反而可能像預設內容
低維護優先
```

---

## 15. Mobile architecture

Japanese Era Converter 適合採 Shared Adaptive Mobile Editor（AME）。

Shared shell owns：

```text
portrait Bottom Sheet
landscape Full-screen / shared mobile layout behavior
open / close
draft lifecycle
Done / Reset（shared chrome；本工具採 live 契約，不顯示 rollback Cancel）
focus
scroll lock
error region
Reset slot
shared keypad / keyboard integration when applicable
```

Tool owns：

```text
欄位內容
模式切換
初始值
validation
計算
錯誤語意
Reset defaults
result mapping
```

不得為本工具另造一套 mobile sheet shell。

---

## 16. Mobile AME fields

### 16.1 Gregorian mode

一個欄位：

```text
Label：西元
Value：Gregorian numeric year
```

英文：

```text
Label：Gregorian year
```

下方 secondary switch：

```text
⇅ 改用和曆輸入
```

### 16.2 Japanese era mode

兩個欄位：

```text
1. 年號
   selector：令和

2. 年
   numeric input：8
```

英文：

```text
1. Era
2. Year
```

下方：

```text
⇅ 改用西元輸入
```

Mobile 不需要模仿 Desktop composite input；以兩個清楚欄位為主。

---

## 17. Mobile 年號 picker

MVP 暫定：

```text
使用系統原生 select / picker
```

理由：

```text
低維護
使用者熟悉
iOS / Android 使用系統原生體驗
避免 MVP 先製作 custom wheel picker
```

此項為「實機驗證後定案」：

```text
若 iPhone / Android 真機體驗足夠舒服 → 保留 native
若明顯不符合 Timiva → 另立 UI / interaction task 評估 custom picker
```

不得在 MVP implementation plan 未經 Owner 核准時自行改成自製 wheel。

---

## 18. Mobile lifecycle

採：

```text
AME lifecycle = live
```

### Live behavior

在 AME 內修改：

```text
Gregorian year
Era
Era year
```

背景主結果同步更新。

不另外提供：

```text
Calculate
Apply
套用
```

### Done

```text
保留目前 valid / current draft
關閉 AME
```

### Close（對齊 AME live canonical）

Japanese Era Converter 對齊 Timiva 現行 **AME live** 契約（Date Calculator／Hours Calculator）：

```text
在 AME 內修改 Gregorian year／Era／Era year 時，背景主結果即時同步更新
Done = 保留目前 live 狀態並關閉 Editor
Reset = 回到 Gregorian empty；Editor 保持開啟
正常 close（Done／underlay／Escape）不做 rollback
不顯示具有 rollback 語意的 Cancel
關閉 AME 後再開，保留上次 committed input／mode
不得為本工具修改 AME shared lifecycle
```

### Live invalid / incomplete

輸入變成 incomplete / invalid 時：

```text
背景 result → ?
invalid 時欄位顯示 !，並依 §12.4 在欄位下方顯示可見 range message
incomplete 時不過早顯示 ! 或 range message
```

---

## 19. Mobile 主畫面

Closed state 第一屏：

```text
Tool title
Main result
必要時 secondary / assumption
主要操作按鈕：輸入換算年份
```

英文按鈕可用：

```text
Enter year to convert
```

或在 B1A/B1B 文案 polish 時依既有工具語氣調整。

規則：

```text
按鈕位於 shared first-screen control area
不是 viewport fixed
位置、尺寸、spacing 對齊現行一般工具 baseline
```

其餘：

```text
sheet-open scale
portrait keyboard composition
landscape compact behavior
scroll lock
button baseline
```

全部繼承當時最新 shared layout / AME canonical，不在本產品規格重複定義另一套數值。

---

## 20. Desktop / Mobile 共通狀態表

| State | Input | Main result | Secondary | ! | ⓘ |
|---|---|---|---|---|---|
| Initial | empty | `?` | none | no | no |
| Incomplete | incomplete | `?` | none | no | no |
| Valid normal | valid | single result | none | no | future only |
| Valid transition Gregorian | valid | dual era | date ranges | no | no |
| Valid boundary era-year | valid | Gregorian year | valid date range | no | future only if applicable |
| Invalid | invalid | `?` | none | yes | no |
| Reset | empty Gregorian | `?` | none | no | no |

---

## 21. English localization rules

EN 與 ZH：

```text
功能
計算
validation
transition year
future assumption
RWD behavior
```

完全一致。

英文不可逐字硬譯中文 UI。

建議用語：

```text
西元 → Gregorian year
和曆 → Japanese era
年號 → Era
年 → Year
明治 → Meiji
大正 → Taisho
昭和 → Showa
平成 → Heisei
令和 → Reiwa
```

主結果：

```text
2026 → Reiwa 8
2019 → Heisei 31 | Reiwa 1
```

不以日文漢字作為英文主結果的唯一內容。

MVP 不需要：

```text
Reiwa 8 (令和8年)
```

這類雙寫，以維持結果乾淨。

---

## 22. Lower content — ZH

### 22.1 關於日本年號換算

日本年號換算可以快速在西元與日本近現代年號之間進行雙向換算。

工具支援明治、大正、昭和、平成與令和，換算範圍從明治6年（1873年）至西元2100年。遇到年號交替的年份時，會同時顯示該年可能對應的兩個年號與日期範圍。

### 22.2 如何使用日本年號換算

輸入西元年份，即可查看對應的日本年號。

也可以切換輸入方式，選擇日本年號並輸入年份，換算成對應的西元年份。

例如：

```text
西元 2026 年 → 令和8年
令和8年 → 西元 2026 年
西元 2019 年 → 平成31年／令和元年
```

若輸入的是未來的令和年份，工具會以令和持續使用為前提進行換算，並顯示提示說明。

### 22.3 常見使用情境

```text
閱讀日本文件或資料時換算年號
查找日本歷史事件的西元年份
閱讀小說、漫畫或觀看影劇時理解故事年代
查看昭和、平成、令和等年份與西元的對照
在填寫或閱讀日本年份資料時快速確認西元年份
```

---

## 23. FAQ — ZH

### Q1. 為什麼日本年號換算從明治6年開始？

日本在明治6年（1873年）開始採用現在使用的太陽曆（Gregorian calendar）。在此之前，日本使用的是太陰太陽曆，因此若要精確處理更早的日期，會涉及舊曆與新曆的轉換。Timiva 將換算範圍從明治6年開始，專注於近現代日本年號與西元之間的簡單換算。

### Q2. 為什麼同一個西元年份會出現兩個日本年號？

日本年號可能在一年中的某一天更換，因此同一個西元年份可能跨越兩個年號。例如 2019 年的 1 月 1 日至 4 月 30 日屬於平成31年，5 月 1 日起則為令和元年。因為這個工具只輸入年份、沒有輸入月日，所以遇到年號交替年份時，會同時顯示該年可能對應的兩個年號與日期範圍。

### Q3. 日本年號中的「元年」是什麼意思？

「元年」就是一個新年號開始後的第一年。例如令和自 2019 年開始，因此 2019 年對應令和的部分稱為「令和元年」，下一年才是「令和2年」。

### Q4. 可以換算未來的令和年份嗎？

可以。Timiva 支援換算至西元 2100 年。若換算超過目前年份的令和年份，結果會以「令和持續使用」為前提計算，並顯示提示說明。未來若日本啟用新的年號，實際年號可能與換算結果不同。

### Q5. 這個工具支援更早的日本年號嗎？

目前不支援。Timiva 的日本年號換算從明治6年（1873年）開始，支援明治、大正、昭和、平成與令和。更早的日本年號不在這個工具的換算範圍內，讓工具保持簡單，專注於近現代年號與西元之間的快速換算。

---

## 24. Lower content / FAQ — EN 原則

英文版與中文版：

```text
資訊內容一致
FAQ 題目一致
不逐句直譯
使用自然英文
```

B1A 正式撰寫時需產出：

```text
About the Japanese Era Converter
How to use the Japanese Era Converter
Common uses
Japanese Era Converter FAQ
```

英文 FAQ 必須涵蓋：

```text
Why does conversion start at Meiji 6 / 1873?
Why can one Gregorian year have two Japanese eras?
What does Year 1 mean in a Japanese era?
Can future Reiwa years be converted?
Are earlier Japanese eras supported?
```

---

## 25. SEO / metadata 最小需求

正式頁面需包含：

```text
H1
short description
meta title
meta description
FAQ
FAQ JSON-LD
canonical
hreflang
EN / ZH alternate paths
Related Tools
semantic HTML
```

SEO 重點可以自然涵蓋：

```text
Japanese era converter
Japanese year converter
Reiwa year converter
Heisei to Gregorian
Japanese era to Gregorian year

日本年號換算
和曆西元換算
令和西元換算
平成西元換算
```

不得為了 SEO 在第一屏增加大量說明文字。

---

## 26. Related Tools

Product spec 階段不鎖定最終 Related graph。

處理時機：

```text
Standalone tool complete
→ Owner QA
→ standalone commit
→ Post-tool Link Integration Gate
```

Link Integration 時再依當時正式 catalog：

```text
選 2～3 個最相關工具
決定 inbound Related
確認 EN / ZH routes
確認 All Tools 排序
確認是否 featured
```

不得在 product implementation batch 順便自行修改站內 Related graph。

---

## 27. Data / maintenance

核心換算使用固定規則與固定 transition table。

不依賴：

```text
external API
backend
database
daily data update
```

唯一需要注意的動態條件：

```text
目前西元年份
目前令和年份
未來 assumption 判斷
```

應以程式動態計算，不每年手動更新。

若未來日本正式啟用新年號：

```text
另立產品／資料更新 task
更新 era table
重新確認 future assumption behavior
不得讓目前的「令和持續」假設被誤認為永久資料
```

---

## 28. Historical transition baseline

實作 calculation table 時以以下正式邊界為準：

```text
1873-01-01：明治6年，Timiva 支援起點
1912-07-30：大正元年開始
1926-12-25：昭和元年開始
1989-01-08：平成元年開始
2019-05-01：令和元年開始
```

本規格整理時已重新以日本國立公文書館、國立國會圖書館與日本內閣府公開資料核對。

---

## 29. QA 核心案例

### 29.1 Gregorian → Japanese era

```text
1873 → 明治6年
1911 → 明治44年
1912 → 明治45年｜大正元年
1913 → 大正2年
1926 → 大正15年｜昭和元年
1927 → 昭和2年
1989 → 昭和64年｜平成元年
1990 → 平成2年
2019 → 平成31年｜令和元年
2020 → 令和2年
current year → current Reiwa year
future year <= 2100 → Reiwa result + ⓘ
1872 → invalid
2101 → invalid
```

### 29.2 Japanese era → Gregorian

```text
明治6 → 1873
明治45 → 1912 + partial-year detail
明治5 → invalid

大正1 → 1912 + partial-year detail
大正15 → 1926 + partial-year detail
大正16 → invalid

昭和1 → 1926 + partial-year detail
昭和64 → 1989 + partial-year detail
昭和65 → invalid

平成1 → 1989 + partial-year detail
平成31 → 2019 + partial-year detail
平成32 → invalid

令和1 → 2019 + partial-year detail
令和 current → current Gregorian
令和 future → future Gregorian + ⓘ
```

### 29.3 Input / state

```text
empty
incomplete
0
negative
decimal
letters
paste
valid → invalid
invalid → valid
Reset
mode switch
mode switch with transition year
mode switch with normal year
mode switch while empty
mode switch while invalid
```

### 29.4 RWD / locale

```text
EN Desktop
ZH Desktop
EN Mobile portrait
ZH Mobile portrait
EN Mobile landscape
ZH Mobile landscape
AME closed
AME open
keyboard open
native era picker
Done / Reset（無 Cancel rollback）
future assumption note
future assumption note
transition result wrapping
```

---

## 30. Implementation boundary

Japanese Era Converter 是新工具 MVP，依 Timiva Owner Workflow 屬 L 層任務。

正式實作前：

```text
Cursor 先輸出完整 Implementation Plan + Agent Routing
Owner 核准後才開始
```

建議沿用新工具流程：

```text
B0：V2 tool page scaffold
B1A：lower content / FAQ / metadata
B1B：static visual
B2：calculation / interaction / AME
QA / targeted Agent Review
Owner Final Approval
standalone commit
Post-tool Link Integration Gate
link QA / integration commit
Owner 授權後 push / deploy
```

不得因既有 shared baseline 已完成，就跳過 Owner QA。

---

## 31. Protected / shared baseline

優先 reuse：

```text
current tool page shell
ResultSummary（若 fit review 通過）
Adaptive Mobile Editor
現行 first-screen mobile control baseline
Global Interactive Cursor
Utility Capsule Control（適用角色才使用）
現行 FAQ / Related Tools / drawer pattern
```

若需要修改：

```text
Header
Footer
BaseLayout
shared AME
shared ResultSummary
shared layout baseline
其他 locked/shared components
```

Cursor 必須停止並回報，不得為 Japanese Era Converter 順手改共用 baseline。

Desktop era popover 是 tool-owned selector，不得為此建立 DesktopCalendar 新 variant。

---

## 32. Product acceptance summary

Japanese Era Converter MVP 應讓使用者：

```text
幾秒內理解用途
直接輸入一個年份就得到結果
在西元與和曆間快速切換
遇到改元年時知道為什麼有兩個答案
不需要理解複雜日本曆法
在手機上以少量輸入完成換算
```

最終產品邊界：

```text
Modern Japanese era conversion
Year-level only
1873–2100
Meiji / Taisho / Showa / Heisei / Reiwa
EN + ZH
Pure frontend
No persistence
No historical-era database
```
