# Timiva 台灣年歲對照 產品規格草案

建立日期：2026-09-18\
修訂：2026-10-11（Production Complete／Deployed）\
狀態：Production Complete／Deployed · Owner Production QA＝PASS · HEAD：`47f3c3d`\
階段：V1.6 Taiwan Local Tools 第二支（完成）

---

## 1. 工具名稱

### 中文

**台灣年歲對照**

### 英文

**Taiwan Year & Age Reference**

### 建議路由

```text
/zh/taiwan-year-age-reference/
/en/taiwan-year-age-reference/
```

### 分類

```text
Important Dates / 重要日子
```

---

## 2. 工具定位

「台灣年歲對照」不是單純的民國西元 Converter。

核心目的是：

> 把一個年份，翻譯成今天的人容易理解的年代、年歲與一點點時代感。

使用者可以從：

```text
西曆
民國
和曆
```

其中一種年份表示方式開始查詢，快速看到其他相關年份資訊。

若不確定出生年份，也可以利用：

```text
生肖 + 大約年齡
```

反查最接近的可能出生年份。

---

## 3. 核心產品原則

```text
年份是查詢入口
年歲負責建立人的時間感
歲次生肖提供年份線索
「那時的台灣」只提供一點年代感
不把工具做成歷史資料庫
不做命理延伸
不做精確生日／年齡計算
```

歷史相關文案採：

```text
中性
描述性
可核對
生活感優先
不替使用者下歷史評價
不採單一政治或身份認同敘事
```

---

## 4. 支援範圍

### 4.1 整體年份範圍

```text
最早：1862 年
最晚：今年
```

不支援未來年份。

### 4.2 西曆

```text
1862 ～ 今年
```

### 4.3 民國

輸入：

```text
民國 1 年 ～ 今年
```

不提供「民國前」輸入模式。

但查詢 1912 年以前的西曆／和曆年份時，結果可以顯示：

```text
民國前 1 年
民國前 12 年
民國前 50 年
```

等對照資訊。

### 4.4 和曆

支援近現代年號：

```text
明治
大正
昭和
平成
令和
```

整體可輸入範圍從：

```text
明治元年（1868）～今年
```

各年號仍依其本身有效年份驗證。

和曆的 UI、年號選擇方式與 transition-year 基本邏輯優先沿用既有 Japanese Era Converter，不重新設計另一套年號系統。

---

## 5. 初始狀態

第一屏初始狀態：

```text
工具名稱

？

分隔線

從一個年份開始，看看年歲與那時的台灣（支援 1862 年至今年）。
```

### 初始輸入狀態

```text
預設 query mode：Year lookup
預設曆法：西曆
年份：空白
結果：？
```

不預設今天／今年作為查詢年份。

但年歲計算基準自動使用今年。

---

## 6. Desktop 主要輸入

### 6.1 模式切換

沿用 Japanese Era Converter 類似的 segmented capsule：

```text
西曆｜民國｜和曆
```

預設：

```text
西曆
```

### 6.2 西曆輸入

```text
西曆 [ 1930 ] 年
```

### 6.3 民國輸入

```text
民國 [ 19 ] 年
```

### 6.4 和曆輸入

沿用既有年號複合輸入形式：

```text
[ 昭和 ▾ ] [ 5 ] 年
```

---

## 7. 模式切換行為

當目前年份有效時，切換：

```text
西曆 ⇄ 民國 ⇄ 和曆
```

應維持「同一年」，並自動轉換成新的年份表示方式。

例如：

```text
1930
→ 民國 19
→ 昭和 5
```

若目前輸入為：

```text
空白
incomplete
invalid
```

切換模式後維持空白，不猜測、不自動補值。

---

## 8. 查詢模式

兩個互斥 query modes，一次只顯示一套輸入。

### 8.1 Year lookup mode（default）

顯示：

```text
西元｜民國｜和曆
對應年份 input
切換為生肖反查
```

不顯示生肖、大約幾歲。

### 8.2 Zodiac lookup mode

顯示：

```text
生肖
大約幾歲
切換為年份查詢
```

不顯示西元／民國／和曆 segmented control、年份 input。

Switch copy：

```text
ZH：切換為生肖反查／切換為年份查詢
EN：Switch to zodiac lookup／Switch to year lookup
```

視覺沿用國曆農曆轉換「切換為……輸入」Conversion／Mode Switch recipe。

生肖下拉固定十二生肖：

```text
鼠
牛
虎
兔
龍
蛇
馬
羊
猴
雞
狗
豬
```

不使用 emoji。

### 大約年齡有效範圍

```text
0 ～ 120
```

---

## 9. Mobile 輸入

Mobile 不把完整輸入表單直接放在第一屏。

第一屏使用工具語意按鈕：

```text
查詢年份
```

點擊後開啟 Bottom Sheet。一次只顯示一套輸入。

### 9.1 Year lookup mode（default）

```text
西元｜民國｜和曆
對應年份輸入
切換為生肖反查
```

### 9.2 Zodiac lookup mode

```text
生肖          大約幾歲
切換為年份查詢
```

### 9.3 Sheet 底部

```text
重設　　Done
```

輸入有效時，背景結果即時預覽更新。

`Done` 的作用是完成本次輸入並關閉 sheet，不是「開始計算」。

---

## 10. 結果更新規則

### Desktop

有效輸入完成後即時更新。

### Mobile

Bottom Sheet 開啟期間也即時更新背景結果。

### 狀態

```text
empty       → ?
incomplete  → ?
valid       → 顯示正式結果
invalid     → ?
```

valid → invalid 時：

```text
不得保留上一筆有效結果
```

---

## 11. Invalid 呈現

錯誤狀態保持輕量。

```text
欄位顯示 invalid icon
結果回到 ?
```

不另外顯示長篇錯誤訊息。

支援範圍已在初始說明中提前告知：

```text
支援 1862 年至今年
```

---

## 12. 一般查詢結果

結果不重複使用者剛剛輸入的年份表示方式。

### 範例 A：輸入西曆 1930

主結果：

```text
民國 19 年｜昭和 5 年
```

次要資訊：

```text
庚午・馬年・今年約 96 歲
```

第三層：

```text
那時的台灣
[一句簡短年代背景]
```

### 範例 B：輸入民國 19

主結果：

```text
1930 年｜昭和 5 年
```

### 範例 C：輸入昭和 5

主結果：

```text
1930 年｜民國 19 年
```

### 範例 D：輸入西曆 1986

主結果：

```text
民國 75 年
```

次要資訊：

```text
丙寅・虎年・今年約 40 歲
```

不因為版面需要而硬補：

```text
昭和 61 年
```

---

## 13. 和曆在結果中的顯示規則

和曆可以作為任何有效年代的「輸入方式」。

但當使用者從：

```text
西曆
民國
```

查詢時，和曆只在與台灣歷史脈絡相關的年份主動出現在主結果。

不是所有年份都固定顯示日本年號。

### 歷史交界年份

年份對照採：

```text
整年簡化
```

不細分月份與日期。

FAQ 補充：

> 年份對照以整年為單位，歷史交界年份不細分月份與日期。

---

## 14. 年歲計算

只做年份層級估算：

```text
今年年份 − 出生年份 = 約幾歲
```

例如：

```text
2026 − 1930 = 約 96 歲
```

顯示：

```text
今年約 96 歲
```

不處理：

```text
生日是否已過
精確周歲
虛歲
```

這支工具不是 Age Calculator。

---

## 15. 歲次與生肖

次要結果格式：

```text
庚午・馬年・今年約 96 歲
```

不另外加：

```text
歲次：
生肖：
```

等 label。

生肖代表：

```text
該年份的生肖／歲次對照
```

不是在精確判斷某一位具體出生者的個人生肖。

必要說明放 FAQ：

> 生肖依年份歲次顯示；實際個人生肖仍可能與出生日期有關。

不做：

```text
命理
八字
星座
流年
宜忌
```

---

## 16. 「那時的台灣」

功能目的：

```text
讓較遙遠的年份多一點時代感
```

不是：

```text
歷史課
事件年表
政治評論
完整年代資料庫
```

### 呈現形式

固定最多：

```text
一句
```

內容偏向：

```text
生活環境
交通
教育
產業
都市發展
媒體與社會生活
```

### 用詞原則

```text
中性
描述性
避免帶有立場暗示的詞彙
避免因果過度簡化
避免一句話替複雜年代下結論
```

### 資料結構

使用少量年代區間共用文案，例如：

```text
startYear
endYear
zhText
enText
```

不為每一年寫獨立內容。

### 顯示範圍

```text
1862–2009：有對應 content bucket 時可顯示「那時的台灣」。
2010–current year：不顯示。
```

Mobile Landscape 未來仍不顯示此句（B2 再實作 hide／show）。

正式年代 content buckets（生活感分桶，不是學術分期）：

```text
1862–1884
ZH：清治後期、開港貿易連結世界。
EN：Late Qing rule, when treaty ports tied Taiwan more closely to world trade.

1885–1894
ZH：建省推動新政，鐵路與新建設讓台灣近代樣貌逐漸成形。
EN：Taiwan became a province, and new reforms, railways, and construction gradually gave the island a more modern shape.

1895–1919
ZH：政權更替後，新的制度、學校與公共設施逐步走進日常。
EN：After a change of government, new systems, schools, and public facilities slowly entered everyday life.

1920–1936
ZH：喫茶店、戲院與新文化活動興起，城市生活有了更多新的交流方式。
EN：Teahouses, theaters, and new cultural activities took hold, and city life found more ways to mix and meet.

1937–1945
ZH：二戰戰火波及台灣，物資短缺與空襲改變了生活。
EN：World War II reached Taiwan; shortages and air raids changed daily life.

1946–1959
ZH：戰後生活重新起步，社會在重建中進入長期戒嚴。
EN：Postwar life started over, and amid rebuilding Taiwan entered a long period of martial law.

1960–1979
ZH：工廠與外銷快速成長，工作機會與城市生活也跟著改變。
EN：Factories and exports grew quickly, and jobs and city life changed with them.

1980–1990
ZH：經濟快速起飛，股市與消費熱潮讓「台灣錢淹腳目」成為時代印象。
EN：The economy took off quickly, and a boom in stocks and spending left the impression that Taiwan was awash in money.

1991–1999
ZH：社會逐步開放，從國會改選到總統直選，民主慢慢走進日常。
EN：Society opened up step by step, from full legislative elections to the first direct presidential election, and democracy slowly entered everyday life.

2000–2009
ZH：網路、手機與高鐵走進日常，生活的距離和節奏都開始改變。
EN：The internet, mobile phones, and high-speed rail entered daily life, and both distance and pace began to change.
```

SSOT：`src/lib/taiwanYearAgeReferenceThenTaiwan.ts`（B1A 只建資料；B2 再接結果顯示）。

---

## 17. 生肖＋大約年齡反查

當：

```text
生肖
大約年齡
```

兩個條件都有效後，自動找出最接近的大致出生年份。

例如：

```text
鼠
約 90 歲
```

系統找到最接近的符合生肖年份後，直接使用正式結果版型呈現。

不另外顯示三筆候選清單。

---

## 18. 反查候選年份瀏覽

因生肖每隔一輪會再次出現，反查模式提供：

```text
前一個符合年份
下一個符合年份
```

只有反查模式顯示。

一般年份查詢不提供上一年／下一年功能。

### Desktop / Mobile Portrait

正式結果下方先出一句輕提示，例如：

```text
如果不是這一年，也可以看看前後一輪的年份。
```

再接兩顆小年份膠囊：

```text
← 1924       1948 →
```

按下後整組正式結果切換。

### Mobile Landscape

為節省高度：

```text
前一個年份控制 ← 主結果 → 下一個年份控制
```

像 carousel / banner slider 的左右導覽。

不再另外佔用下方一整列。

---

## 19. Mobile Portrait / Desktop 結果版型

Desktop 與 Mobile Portrait 可以維持相同資訊層級：

```text
主結果
次要資訊
那時的台灣
反查導覽（僅反查模式）
```

不必為直式手機重新設計另一套結果內容。

---

## 20. Mobile Landscape

傳統 Mobile Landscape 優先保留核心資訊。

### 顯示

```text
主結果
次要資訊
必要操作
```

### 隱藏

```text
那時的台灣
```

若為反查模式：

```text
前後候選年份控制移到主結果左右
```

原則：

> 刪除背景補充資訊，不刪除核心結果與完成任務所需操作。

---

## 21. Reset

只保留一個：

```text
Reset / 重設
```

不另外增加 Clear。

Reset 後：

```text
模式 → 西曆
年份 → 空白
生肖 → 未選
大約年齡 → 空白
Desktop 反查 → 收合
結果 → ?
```

Mobile sheet 內 Reset 清除所有資料，仍由 `Done` 控制關閉 sheet。

---

## 22. 資料儲存

不使用 LocalStorage 儲存查詢。

Reload / 再次進入頁面時：

```text
?
西曆
空白年份
生肖未選
大約年齡空白
```

---

## 23. 分享與歷史紀錄

V1 不做：

```text
分享結果
複製結果
URL sharing
最近查詢
查詢歷史
收藏
```

---

## 24. 第一屏 Desktop 結構

由上至下：

```text
工具名稱

？

分隔線

預設說明文字

西曆｜民國｜和曆

對應年份輸入框

不確定年份？用生肖與大約年齡找找看 ＋

（展開後）
生肖 [下拉]　大約幾歲 [數字輸入]

Reset
```

輸入有效後，大 `？` 區域切換成正式結果。

---

## 25. 第一屏 Mobile 結構

```text
工具名稱

主結果 / ?

分隔線

短說明

查詢年份
```

完整輸入集中於 Bottom Sheet。

---

## 26. About

### ZH

台灣年歲對照把一個年份轉成更容易理解的時間線索。你可以查西曆、民國與和曆的對照，並看到約略年歲、歲次生肖，以及較早年份的一句台灣時代背景。若只記得生肖和大約年齡，也可以反查最接近的可能出生年份。

### EN

Taiwan Year & Age Reference turns a year into time cues that are easier to grasp. You can look up Gregorian, Minguo, and Japanese era years together, see an approximate age and the year’s zodiac, and—for earlier years—a short line about Taiwan then. If you only remember a zodiac and an approximate age, you can also find the closest likely birth year.

標題：關於台灣年歲對照／About Taiwan Year & Age Reference

---

## 27. How to use

### ZH

選擇西曆、民國或和曆並輸入年份，即可查看對應的年代、約略年歲與歲次生肖。若不確定年份，也可以用生肖和大約年齡找出最接近的可能年份。

### EN

Choose Gregorian, Minguo, or Japanese era and enter a year to see the matching era, approximate age, and zodiac. If you are not sure of the year, you can also use a zodiac and an approximate age to find the closest likely year.

標題：如何使用台灣年歲對照／How to use Taiwan Year & Age Reference

---

## 28. Common Uses

正式 4 個（不增加「台灣歷史」）：

```text
ZH：民國西元對照 · 和曆年份查詢 · 長輩年歲估算 · 生肖出生年反查
EN：Minguo–Gregorian lookup · Japanese era year lookup · Estimate an elder’s age · Birth year from zodiac
```

---

## 29. FAQ

標題：台灣年歲對照 FAQ／Taiwan Year & Age Reference FAQ

正式 5 題（不增加第六題）。JSON-LD 與頁面 FAQ 同一資料。

### Q1 台灣年歲對照可以查什麼？

ZH：可以用西曆、民國或和曆查詢年份，查看其他年份表示、約略年歲與歲次生肖；較早年份還會補上一句「那時的台灣」。如果不確定年份，也可以用生肖與大約年齡反查可能的出生年份。

EN：You can look up a year in Gregorian, Minguo, or Japanese era terms to see the other year forms, an approximate age, and the year’s zodiac. Earlier years also include a short line about Taiwan then. If you are not sure of the year, you can also use a zodiac and an approximate age to find a likely birth year.

### Q2 為什麼年歲會顯示「約」幾歲？

ZH：工具只以今年減去查詢年份估算，不判斷生日是否已過，因此顯示「約 X 歲」。若要計算精確年齡，可以使用 Age Calculator。

EN：The tool only subtracts the looked-up year from the current year. It does not check whether a birthday has passed, so it shows “about X years old.” For an exact age, you can use Age Calculator.

### Q3 生肖是怎麼對應年份的？

ZH：生肖依該年份的歲次顯示，作為年份層級的參考。實際個人的生肖可能因出生日期與農曆新年交界而不同。

EN：The zodiac is shown as a year-level reference based on that year’s traditional zodiac cycle. A person’s actual zodiac can differ around Lunar New Year, depending on their date of birth.

### Q4 為什麼有些年份會顯示和曆，有些不會？

ZH：和曆可以作為查詢方式，但從西曆或民國查詢時，只有與台灣歷史脈絡相關的年份會主動顯示和曆。年份對照以整年為單位，歷史交界年份不細分月份與日期。

EN：Japanese era can be used to look a year up. When you start from Gregorian or Minguo, the Japanese era appears in the result only for years that sit in Taiwan’s historical context. Year lookup is by whole year; transition years are not split by month or day.

### Q5 可以用生肖和大約年齡反查出生年份嗎？

ZH：可以。輸入生肖與大約年齡後，工具會在支援範圍內找出最接近的可能年份，並可查看前後一輪同生肖的年份。這是估算結果，不代表確切出生年份。

EN：Yes. After you enter a zodiac and an approximate age, the tool finds the closest likely year in range and lets you check the previous and next same-zodiac years. This is an estimate, not an exact birth year.

---

## 30. Related Tools

Outbound Related（B1A 頁內 tool-local；不寫入 toolsCatalog）：

```text
1. Japanese Era Converter / 日本年號換算
2. Age Calculator / 年齡計算
3. Lunar Date Converter / 國曆農曆轉換
```

理由：

```text
Japanese Era Converter → 完整日本年號換算
Age Calculator → 精確出生日期與年齡
Lunar Date Converter → 完整國曆／農曆日期轉換
```

Inbound Related 留到 Post-tool Link Integration Gate 再決定。

---

## 31. SEO / Search 語意

產品名稱不需要硬塞所有搜尋關鍵字。

### H1

```text
台灣年歲對照
Taiwan Year & Age Reference
```

### Meta

```text
ZH title：台灣年歲對照｜Timiva
EN title：Taiwan Year & Age Reference | Timiva
ZH description：查詢西曆、民國與和曆年份對照，快速了解約略年歲、歲次生肖與那時的台灣；也可用生肖與大約年齡反查可能出生年份。
EN description：Look up Gregorian, Minguo, and Japanese era years to see approximate age, the year’s zodiac, and a glimpse of Taiwan then. You can also estimate a likely birth year from zodiac and approximate age.
```

搜尋相關字詞可自然出現在 Meta、About、How to use、FAQ。
---

## 32. 不做項目

V1 明確不做：

```text
未來年份
民國前輸入模式
精確生日計算
精確周歲
虛歲
一般模式上一年／下一年
完整歷史事件年表
每一年獨立歷史資料
政治／身份認同解讀
大型日本歷史年號資料庫
生肖命理
八字
星座
流年
宜忌
分享結果
複製結果
URL sharing
LocalStorage
查詢歷史
收藏
帳號
後端
資料庫
```

---

## 33. B1A content status

B1A 已確認並落地：

```text
「那時的台灣」10 個 range + 2010+ 不顯示
About / How to use 正式 EN／ZH
FAQ 5 題正式答案 + JSON-LD
Common Uses 4 tags
正式 meta title / description
Outbound Related 三列（頁內 tool-local）
```

歷史文案 SSOT：`src/lib/taiwanYearAgeReferenceThenTaiwan.ts`。B2 再接結果顯示與 landscape hide。

---

## 34. B1B 待確認項目

B1B static visual 已落地，交 Owner Visual Review。年代背景在 Desktop／Portrait **只顯示一句文案，不加「那時的台灣」標題**；Mobile Landscape 整段隱藏。下列項目仍不鎖死：

以下屬靜態視覺階段：

```text
1. 主結果實際字級
2. 主結果兩個年份的 spacing
3. 分隔線尺寸
4. secondary info 字級與 opacity
5. Desktop input width
6. disclosure 展開節奏
7. 反查年份膠囊尺寸
8. Mobile result composition
9. Mobile landscape carousel-like controls
10. Bottom Sheet 實際高度與 spacing
```

不得在 product spec 階段提前鎖死。

---

## 35. 核心體驗摘要

### 精確查詢

```text
知道一種年份
→ 選擇西曆 / 民國 / 和曆
→ 輸入
→ 看見其他年份表示
→ 看見約略年歲與歲次生肖
→ 視年代看到一句「那時的台灣」
```

### 模糊反查

```text
不確定年份
→ 輸入生肖 + 大約年齡
→ 系統找出最接近年份
→ 用正式結果呈現
→ 可切換前一輪 / 後一輪候選年份
```

---

## 36. Product Boundary

這支工具的核心不是：

```text
建立一份更完整的政府年歲表
```

而是：

> **讓使用者從一個年份或一些模糊線索開始，快速理解「這是哪一年、那時出生的人現在大約幾歲，以及那大概是什麼樣的年代」。**

維持：

```text
簡單
舒服
Mobile-first
低維護
年份是入口
人的時間感是特色
歷史背景只點到為止
```
