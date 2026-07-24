# Shared Component Reuse Gate

> Canonical source：Timiva 共用 UI pattern 的 **Reuse Gate** 規則只以本文件為準。
> 最後更新：2026-07-24

## 文件目的

當同一 UI pattern 第二次出現時，本文件規定如何強制 **reuse shared component**，禁止複製後改名，並劃清 tool CSS 與 shared 的 ownership 邊界。

相關引用（僅短述，不重複完整規則）：

- 任務入口：[`AGENTS.md`](../../AGENTS.md)
- 新工具流程：[`new-tool-development.md`](new-tool-development.md)
- 文件索引：[`docs/README.md`](../README.md)
- 案例：`ResultSummary`（§6）、`DesktopCalendar`（§7）

---

## 1. 何時觸發 Reuse Gate

```text
第二次出現相同 UI pattern 時：
Implementation Plan 必須先做 Reuse Review，再進入實作。
```

「相同 UI pattern」包含但不限於：結果摘要、日期輸入殼、Mobile Sheet、Related drawer、數字 digit ladder、工具主結果區。

---

## 2. 強制規則（非協商）

1. **Reuse Review 前置**：第二次出現相同 pattern，Plan 必須先完成 Reuse Review。
2. **禁止複製改名**：不得複製既有 component／CSS／controller 後改名當作新實作。
3. **優先 shared**：新工具必須優先使用現有 shared component。
4. **Tool CSS 只做外部 composition**：
   - stage
   - placement
   - margin／width
   - controls／sheet／panel
5. **Shared 擁有內部**：
   - DOM
   - typography
   - grid／gap
   - digit behavior
   - accessibility
   - controller hooks
6. **禁止內部覆寫**：Tool 不得直接選 shared 內部 class（例如 `.rs-*`）覆寫。
7. **差異只能走公開契約**：僅能透過核准的 semantic `variant`／公開 token 表達差異；不得 tool-local 硬改內部尺寸。
8. **兩套實作不算 reusable**：即使另寫 validator「對齊」兩套 UI，也不算 reusable architecture。
9. **無法 reuse 時**：
   - Plan 必須記錄產品／技術原因
   - 列出共用失敗點
   - **取得 Owner 核准**後才可另建實作
10. **Plan Review 必列**：
    - reusable pattern inventory
    - ownership boundary
    - shared API
    - cleanup plan
    - validator／rollback
11. **遷移完成後不得殘留**：temporary adapter、legacy hooks、重複 digit ladder、工具內第二套結果 DOM。
12. **ResultSummary 為正式案例**（§6）。
13. **DesktopCalendar 為正式案例**（§7）。第二次以上相同 Desktop Calendar pattern 必須優先重用 Shared DesktopCalendar；不得複製 calendar DOM／controller／CSS。

---

## 3. Ownership 邊界速查

| 層級 | 擁有 | 不得做 |
|---|---|---|
| Shared component | DOM、typography、grid／gap、digits、a11y、`rs:update`／controller | 讀 viewport／orientation 自行判斷 layout |
| Tool layout contract | `data-rs-layout`（或同等）首次 paint＋正式 gate | 寫 `data-rs-digits`、更新 live status、dispatch 結果更新 |
| Tool CSS | stage、placement、margin／width、controls／sheet／root stacking | 選內部 class（`.rs-*`／`.sdc-*`）；接管 ResultSummary／DesktopCalendar 內部 grid／gap／字級／尺寸 |
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
[ ] Tool CSS 無 shared 內部 class override
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

## 8. 與其他文件的關係

| 文件 | 關係 |
|---|---|
| `docs/standards/date-input.md` | Smart Date Input 與 DesktopCalendar 分層；Desktop Calendar 規範見該文件 §12 |
| `docs/standards/mobile-sheet.md` | Sheet shared baseline；工具不得另造衝突規則 |
| `docs/standards/interactive-controls.md` | Control motion／shadow 由 shared baseline 擁有 |
| `docs/workflow/new-tool-development.md` | 新工具流程引用本 Gate，不重複全文 |
