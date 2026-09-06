# Timiva Lunar Date Converter 產品規格

建立日期：2026-09-06
修訂：2026-09-06（Production Complete · V1.5 closure docs）
狀態：Owner accepted · **Production Complete** · latest corrective `35dadef`
適用工具：Lunar Date Converter / 國曆農曆轉換
分類：Important Dates / 重要日子
正式路由：`/en/lunar-date-converter/`、`/zh/lunar-date-converter/`

---

## 1. 工具定位

### 工具名稱

```text
EN：Lunar Date Converter
ZH：國曆農曆轉換
```

### 工具目的

在西曆（國曆）與農曆日期之間做雙向換算。預設顯示今天結果；可指定公開範圍內日期（含閏月），並顯示星期；結果可含歲次（年干支）。

### Canonical product boundary

```text
換日期，不解讀日期。
```

不做：

```text
農民曆內容
宜忌／吉日／沖煞
生肖解讀
干支月／日
命理／運勢
二十四節氣解讀
```

---

## 2. 範圍與分類

| 項目 | 內容 |
|---|---|
| Category | Important Dates／重要日子（`dates-events`） |
| Catalog | `available:true` · `featured:false` |
| Home Featured | 不含 |
| All Tools 順序 | … → Japanese Era Converter → Lunar Date Converter → Age Calculator |
| Outbound Related | Japanese Era Converter → Age Calculator（exactly 2） |
| Inbound | Japanese Era Converter 含 Lunar（JEC Related exactly 3）；Age Related 不變 |

---

## 3. 核心互動決策（Owner confirmed）

### 雙向與 lifecycle

```text
Gregorian ↔ Lunar 雙向
Desktop Gregorian／Lunar direct numeric input：一致 editing lifecycle
editing → Result ?
incomplete → Result ?、no error
complete valid → immediate Result
Lunar：blur 後才切 semantic committed display
refocus → 回到 numeric editing representation
```

### 閏月規則

```text
閏／潤：輸入皆接受；committed display／Result 統一輸出「閏」
無明確 leap marker → regular month（不得從 compact digits 發明閏月）
compact leap 支援：例如 1963閏415／1963潤415
```

### Result composition

```text
Mobile Portrait Lunar Result：維持 semantic 2-line composition
leap 長行不得 soft-wrap 成第三行；必要時 Lunar-local Portrait font-size fit
不修改 shared ResultSummary baseline
Mobile：Adaptive Mobile Editor structured picker
```

詳細 UI／validators／browser QA 證據以 local-docs 與 production smoke 為準；本檔只鎖定產品邊界與 Owner 決策。

---

## 4. Production status

```text
Production Complete
Link Integration Complete
EN／ZH production smoke PASS
Latest production corrective：35dadef
  fix: keep lunar leap results on two lines
```

---

## 5. 非目標

```text
不擴成農民曆／擇日產品
不把 Pet Age 或 Year Progress 2.0 綁進本工具 scope
不因 SEO 把解讀型內容放到工具體驗之前
```
