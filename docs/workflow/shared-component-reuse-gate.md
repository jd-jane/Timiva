# Shared Component Reuse Gate

> Canonical source：Timiva 共用 UI pattern 的 **Reuse Gate** 規則只以本文件為準。
> 最後更新：2026-08-17（Tool Page Frame productionize）

## 文件目的

當同一 UI pattern 第二次出現時，本文件規定如何強制 **reuse shared component**，禁止複製後改名，並劃清 tool CSS 與 shared 的 ownership 邊界。

相關引用（僅短述，不重複完整規則）：

- 任務入口：[`AGENTS.md`](../../AGENTS.md)
- 新工具流程：[`new-tool-development.md`](new-tool-development.md)
- 文件索引：[`docs/README.md`](../README.md)
- 案例：`ResultSummary`（§6）、`DesktopCalendar`（§7）、`AdaptiveMobileEditor`（§8）、`ToolPageFrame`（§9）

---

## 1. 何時觸發 Reuse Gate

```text
第二次出現相同 UI pattern 時：
Implementation Plan 必須先做 Reuse Review，再進入實作。
```

「相同 UI pattern」包含但不限於：結果摘要、日期輸入殼、**Mobile Editor／多欄 Bottom Sheet 編輯流**、Related drawer、數字 digit ladder、工具主結果區、**Tool Page page-type chrome**。

---

## 2. 強制規則（非協商）

1. **Reuse Review 前置**：第二次出現相同 pattern，Plan 必須先完成 Reuse Review。
2. **禁止複製改名**：不得複製既有 component／CSS／controller 後改名當作新實作。
3. **優先 shared**：新工具必須優先使用現有 shared component。新工具頁 chrome 必須使用 `ToolPageFrame`（§9）。
4. **Tool CSS 只做 tool-local composition**：
   - desktop input cluster
   - result UI／公開 tokens
   - capsule 內容／語意
   - AME 內容
   - tool-specific controls／sheet internals
   不得重建 first-screen／stage／capsule geometry／drawer chrome，也不得覆寫 `.tpf-*`。
5. **Shared 擁有內部**：
   - DOM
   - typography
   - grid／gap
   - digit behavior
   - accessibility
   - controller hooks
   - Tool Page Frame 的頁面骨架與 geometry（§9）
6. **禁止內部覆寫**：Tool 不得直接選 shared 內部 class（例如 `.rs-*`、`.tpf-*`）覆寫。
7. **差異只能走公開契約**：僅能透過確認過的 semantic `variant`／公開 token 表達差異；不得 tool-local 硬改內部尺寸。
8. **兩套實作不算 reusable**：即使另寫 validator「對齊」兩套 UI，也不算 reusable architecture。
9. **無法 reuse 時**：
   - Plan 必須記錄產品／技術原因
   - 列出共用失敗點
   - **取得 Owner 確認**後才可另建實作
10. **Plan Review 必列**：
    - reusable pattern inventory
    - ownership boundary
    - shared API
    - cleanup plan
    - validator／rollback
11. **遷移完成後不得殘留**：temporary adapter、legacy hooks、重複 digit ladder、工具內第二套結果 DOM。
12. **ResultSummary 為正式案例**（§6）。
13. **DesktopCalendar 為正式案例**（§7）。第二次以上相同 Desktop Calendar pattern 必須優先重用 Shared DesktopCalendar；不得複製 calendar DOM／controller／CSS。
14. **Adaptive Mobile Editor（AME）為適用範圍內的正式 Mobile Editor foundation**（§8）。新工具多欄 mobile edit 必須先做 AME fit review；在第二個相似 pattern 出現前，不得另建平行 Mobile Editor foundation。
15. **ToolPageFrame 為正式 Tool Page page-type chrome**（§9）。這是 productionize 已驗證 baseline，不是因為 DC／Hours／JEC 重複才新抽 pattern。新工具不得從既有工具複製 first-screen RWD。

---

## 3. Ownership 邊界速查

| 層級 | 擁有 | 不得做 |
|---|---|---|
| Shared component | DOM、typography、grid／gap、digits、a11y、`rs:update`／controller | 讀 viewport／orientation 自行判斷 layout |
| ToolPageFrame | first-screen／stage／capsule geometry／drawer chrome／640px gate／lower-content 寬度 | 擁有 Header／Footer；擁有 result UI 或 desktop 輸入內容 |
| Tool layout contract | `data-rs-layout`（或同等）首次 paint＋正式 gate | 寫 `data-rs-digits`、更新 live status、dispatch 結果更新 |
| Tool CSS | desktop 輸入、result tokens、capsule 內容、AME 內容、tool-specific controls | 選內部 class（`.rs-*`／`.sdc-*`／`.tpf-*`）；重建 Frame 骨架 |
| Tool script | 計算完成後 dispatch 正式事件／呼叫正式 `update()` | temporary adapter、本地 digit bucket |

---

## 4. Plan 中的 Reuse Review 最小模板

```text
## Reuse Review
- Pattern：…
- Existing shared：…（路徑）
- 採用／不採用：採用 shared ／ 不採用（需 Owner 核准）
- Ownership：shared 內部＝…；tool 外部＝…
- Shared API：props／events／tokens
- Cleanup：刪除 legacy DOM／CSS／adapter
- Validator：scripts/validate-….mjs
- Rollback：…
```

L 級任務的 Agent Routing 中，Tech Architect 應檢查本 Gate；Experience／Brand 檢查視覺是否仍走 shared variant，而非 tool 覆寫。

---

## 5. 通過標準（摘要）

```text
[ ] 無複製改名的第二套實作
[ ] 工具頁只有一份 shared 結果（或同等）DOM
[ ] Tool CSS 無 shared 內部 class override（含 `.tpf-*`）
[ ] 新工具頁使用 ToolPageFrame，未複製 first-screen RWD
[ ] Tool 不寫 shared 內部 state attrs（如 data-rs-digits）
[ ] Layout bootstrap 與正式 gate 共用同一 contract
[ ] 遷移後無 temporary adapter／legacy hooks
[ ] Canonical validator PASS
```

---

## 6. 正式案例：ResultSummary

| 項目 | 位置／規則 |
|---|---|
| Shared DOM | `src/components/tools/shared/ResultSummary.astro` |
| Controller | `src/scripts/result-summary-controller.ts`（`rs:update`、`computeRsDigits`） |
| Shared CSS | `src/styles/tools/result-summary.css`（三 layout；Desktop `standard`／`spacious`） |
| Tool 外部 composition | 各工具 CSS 僅 placement／stage／sheet；不得選 `.rs-*` |
| Layout contract | 工具專屬 `*-layout-contract.js`；只寫 `data-rs-layout` |
| 已遷移工具 | Date Range Calculator（`standard`）、Business Days Calculator（`spacious`） |
| Canonical validator | `node scripts/validate-result-summary.mjs` |
| Compile harness | `node scripts/compile-check-result-summary.mjs`（獨立，不混入 canonical） |

**Reuse Gate 通過標準（ResultSummary）：**

```text
每工具一份 data-result-summary
variant 僅 standard／spacious
無 legacy result DOM／digit ladder／adapter
Landscape grid／gap 僅由 shared 定義
Desktop／Portrait secondary gap 由 shared 定義
Initial bootstrap 與 layout gate 共用 contract
```

---

## 7. 正式案例：DesktopCalendar

| 項目 | 位置／規則 |
|---|---|
| Shared DOM | `src/components/tools/shared/DesktopCalendar.astro` |
| Controller | `src/scripts/desktop-calendar-controller.ts`（`createDesktopCalendar`、`DesktopCalendarRegistry`） |
| Shared CSS | `src/styles/tools/desktop-calendar.css`（`.sdc-*`；僅 `inline-large`／`popover-compact` tokens） |
| Naming | `DesktopCalendar`、`data-desktop-calendar`、`data-sdc-*`、`.sdc-*` |
| Tool 外部 composition | trigger／input shell／anchor／host／root stacking（`z-index`）；不得選 `.sdc-*` |
| Shared ownership | day grid、month 3×4、year input＋scroll list、Esc／outside click／focus、popover／inline chrome |
| Adapter ownership | selection、min／max、selectable、close policy、input／結果同步、placement／nudge／avoidRects |
| Variant（僅兩種） | `inline-large`（DRC Desktop）；`popover-compact`（BDC、Age、未來 Date Calculator） |
| yearList | `full`｜`nearby` 為**資料策略**，不是第三 variant |
| 已遷移工具 | BDC（`popover-compact`）；DRC Desktop（`inline-large`）；Age Birth／As-of（各一 `popover-compact`） |
| Canonical validator | `node scripts/validate-desktop-calendar.mjs` |
| Compile harness | `node scripts/compile-check-desktop-calendar.mjs`（獨立，不混入 canonical） |

**Reuse Gate 通過標準（DesktopCalendar）：**

```text
第二次以上相同 Desktop Calendar pattern → 必須優先重用 Shared DesktopCalendar
架構：Astro component＋base controller＋shared CSS＋thin adapters
僅兩個 variant：inline-large｜popover-compact
工具 CSS 不得覆寫 .sdc-*／[data-desktop-calendar] internals
新工具不得複製 calendar DOM／controller／CSS 後改名
未來 Date Calculator 必須使用 popover-compact；
  需要新 variant → 另開 L 層 Plan＋Owner 核准（預設拒絕）
Canonical validator PASS：scripts/validate-desktop-calendar.mjs
```

**DRC Mobile transitional exception（核准例外）：**

```text
DRC Mobile／Intermediate／Landscape Bottom Sheet 可暫時保留 legacy data-drv2-* calendar。
此例外不代表可新增第二套 Desktop Calendar。
Desktop 必須使用 Shared DesktopCalendar（inline-large）。
未來 Mobile Calendar 共用化須另立任務，不得在 Desktop migration 順便重構。
```

---

## 8. 正式案例：Adaptive Mobile Editor（AME）

| 項目 | 位置／規則 |
|---|---|
| Shared DOM | `src/components/tools/shared/AdaptiveMobileEditor.astro` |
| Field-error primitive | `src/components/tools/shared/AmeFieldError.astro` |
| Controller | `src/scripts/adaptive-mobile-editor-controller.ts` |
| Numeric helpers | `src/lib/ameNumericDraft.ts` |
| Shared CSS | `src/styles/tools/adaptive-mobile-editor.css`（`.ame-*`／`[data-ame-*]`／`--ame-*`） |
| Naming | `AdaptiveMobileEditor`、`data-ame-*`、`.ame-*` |
| Lab（非 catalog） | `/preview/tool-component-lab/adaptive-mobile-editor/` |
| 第一正式 adopter | Date Calculator（`lifecycle: "live"`） |
| Validators（實作批次維護） | `scripts/validate-adaptive-mobile-editor-lab.mjs` · `scripts/validate-adaptive-mobile-editor-contract.mjs` |

### 8.1 Scoped canonical（不是強制所有手機輸入）

```text
AME 是「適用範圍內」的新工具 Mobile Editor foundation。
AME 不是所有手機輸入介面的強制方案。
```

**適合 AME（新工具應優先 fit review）：**

```text
多欄位 mobile edit flow
原生 date／select 與 Numeric Field 混合
需要 Timiva Numeric Keypad
Portrait Bottom Sheet＋Landscape Full-screen 同一 shell
需要共用 focus、scroll lock、field error、Portrait background scale、Reset／Done lifecycle
```

**不適合 AME（plan 必須寫明原因）：**

```text
單一簡單欄位，inline interaction 更合理
不需要 Editor shell
自由文字或原生鍵盤輸入是核心
工具已有更適合的產品專屬互動
單次切換或簡單操作不需要 Bottom Sheet
```

### 8.2 既有工具策略

```text
不做全面遷移。
已上線工具維持現況（含 tool-local sheets＋tool-mobile-sheet-v2-baseline.css／msb-*）。
只有在現有 mobile input 確有問題，或該工具進行功能更新且 AME 明顯合適時，才個別評估。
每個 adopter＝獨立 plan／allowlist／validators／production build preview／Owner Device Gate。
不得與 D1／MSB cleanup 或其他工具 migration 合併。
```

### 8.3 Reuse Gate 通過標準（AME）

```text
新工具多欄 mobile edit → 先做 AME fit review（§8.1）
採用 AME：sibling mount；每頁最多一個 instance；無 Portal／Registry／multi-instance／visualViewport
不採用 AME：implementation plan 記錄產品／技術原因，並取得 Owner 核准
第二個相似 Mobile Editor pattern 出現前，不得另建平行 foundation
舊 MSB Lab／D1 Portal／Registry／visualViewport 路線不是新工具採用路徑
Tool CSS 只做外部 composition；不得另造衝突的平行 Editor shell
```

正式互動／lifecycle／視覺契約見 [`docs/standards/mobile-sheet.md`](../standards/mobile-sheet.md)（AME 章節）與 [`new-tool-development.md`](new-tool-development.md)。

---

## 9. 正式案例：Tool Page Frame

| 項目 | 位置／規則 |
|---|---|
| Shared DOM | `src/components/tools/shared/ToolPageFrame.astro` |
| Shared CSS | `src/styles/tools/tool-page-frame.css`（scoped `[data-tool-page-frame]`／`.tpf-*`） |
| Naming | `ToolPageFrame`、`data-tool-page-frame`、`data-tpf-*`、`.tpf-*` |
| 歷史視覺來源 | `/preview/tool`（已驗證 page-type baseline；**不是** production implementation） |
| Production Frame 主要來源 | Hours Calculator + rebuilt Japanese Era Converter |
| Regression comparator | Date Calculator（不當 Frame 來源、本次不遷移） |
| 第一正式 adopter | Lunar Date Converter（尚未開始；F0–F2 只建立 Frame） |
| Validator | `scripts/validate-tool-page-frame.mjs` |

### 9.1 定位（不是抽重複 pattern）

```text
ToolPageFrame 是把 Timiva 重做時已定義、且 Owner 已驗證的 Tool Page page-type baseline，正式 productionize 成可重用 shared chrome。
原 /preview/tool 已完成版型與實機驗證；本次不是重新設計 Tool Page，而是補完當初缺少的 production reusable implementation。
不是「因為 DC／Hours／JEC 重複，所以新抽一個 shared pattern」。
```

### 9.2 Ownership

**Frame 擁有：**

```text
first-screen outer composition
stage placement / responsive width
result-group 外殼
portrait 1fr / auto composition
mobile primary-control placement
capsule geometry（Frame 包一層保證）
landscape compact composition
desktop 640px gate
lower-content max-w-3xl
first-screen → lower-content spacing
drawer placement / chrome
disabled ToolAdSlot placement
```

**Tool 擁有：**

```text
result UI
desktop input composition
capsule 內容／語意
AME 內容
calculation / validation
FAQ / About
tool-specific interaction
```

Frame 不擁有 Header／Footer，只遵守既有 stacking contract。不提供通用 `exceptionFirstScreen`。不得 import preview CSS 作 production implementation。工具不得覆寫 `.tpf-*`。

### 9.3 既有工具策略

```text
本次不遷移 DC／Hours／JEC 或其他已上線工具。
它們維持現況，作為來源或 regression comparator。
新工具預設使用 ToolPageFrame。
特殊 Page Frame 必須在 product spec 或任務提詞明確指定，並取得 Owner 確認。
```

### 9.4 Reuse Gate 通過標準（Tool Page Frame）

```text
新工具 B0 → 使用 ToolPageFrame
validate-tool-page-frame.mjs PASS
無 .tpf-* override、無 preview CSS import、無 exceptionFirstScreen
stage 寬度與 lower-content max-w-3xl 未混用
不得從 Hours／JEC／DC 複製 first-screen RWD 當作新實作
```

Validated shared baseline 的目的，是消除重複 Owner QA。Baseline 經 Lunar first adopter 完整 Frame QA 成立後，一般新工具只要使用 Frame、validator PASS、且無 Frame override，就不必重測 768px／20rem／56px／640px gate／portrait 沉底等固定事項。

---

## 10. 與其他文件的關係

| 文件 | 關係 |
|---|---|
| `docs/standards/date-input.md` | Smart Date Input 與 DesktopCalendar 分層；Desktop Calendar 規範見該文件 §12 |
| `docs/standards/mobile-sheet.md` | Legacy Mobile Sheet style baseline＋**AME canonical interactive Editor**；工具不得另造衝突規則 |
| `docs/standards/interactive-controls.md` | Control motion／shadow 由 shared baseline 擁有 |
| `docs/workflow/new-tool-development.md` | 新工具流程引用本 Gate，不重複全文 |
| `docs/workflow/tool-page-qa.md` | B0 Frame gate（§11.0）與兩階段 QA |
| `docs/standards/layout-system.md` | Production Tool Page chrome 指向 ToolPageFrame |
