# Timiva Mobile Sheet／Mobile Editor Spec

Date: 2026-06-14 (Created) · Last updated: 2026-08-02（B9.1：AME scoped canonical＋legacy MSB 邊界）
Owner: Jane / Timiva
Status: **Active** · AME＝適用範圍內的 canonical interactive Mobile Editor foundation · Legacy tool-local sheets＋`tool-mobile-sheet-v2-baseline.css`／`msb-*` 仍為 production dependency · Option D（刪除全部 D1／MSB）已否決

---

## 0. Canonical path（B9.1 · 必讀）

### 0.1 Adaptive Mobile Editor（AME）— 新工具預設評估

對**適合**的新工具多欄 mobile edit flow，canonical interactive foundation 是 **Adaptive Mobile Editor（AME）**：

```text
Shared：AdaptiveMobileEditor.astro · adaptive-mobile-editor-controller.ts · adaptive-mobile-editor.css
Reuse Gate：docs/workflow/shared-component-reuse-gate.md §8
New-tool workflow：docs/workflow/new-tool-development.md §22
第一正式 live adopter：Date Calculator
```

AME **不是**所有手機輸入的強制方案。不適合時（單一欄位、inline、自由文字核心、無 Editor shell 需求等）必須在 implementation plan 說明原因，並取得 Owner 核准。

### 0.2 Legacy Mobile Sheet style／tool-local sheets — 仍保留

下列仍是 **production dependency**，AME canonicalization **不等於**自動遷移或刪除：

```text
src/styles/tools/tool-mobile-sheet-v2-baseline.css
msb-* class contract（msb-sheet／msb-field／msb-input 等）
msb-scroll-lock／msb-sheet-open（Age／DBD／BDC 等 tool scripts）
Age／Days Between Dates／Business Days Calculator／Countdown Timer 的 tool-local sheets
```

既有工具只在確有問題或功能更新時個別評估 AME；**禁止全面遷移**。

### 0.3 舊 MSB Lab／D1 路線 — 非新工具採用路徑

```text
MobileBottomSheet.astro／mobile-bottom-sheet-controller.ts（含 Registry）
MSB Lab preview（/preview/tool-component-lab/mobile-bottom-sheet/）
Portal／multi-instance Registry／visualViewport 實驗路線
```

上述視為**歷史或已被 AME 取代的實驗路線**，不再作為新工具採用路徑。
**B9.1 不刪除、不移動、不封存**；後續僅能在獨立 B9.2 Gate＋exact allowlist 處理。
**Option D（全部刪除 D1／MSB）明確否決**——因 baseline CSS／`msb-*` 仍被正式工具使用。

### 0.4 本文件其餘章節

§1 起保留既有 Mobile Sheet **style／field／overlay** baseline（Countdown／Age 等參考語彙）。新工具若走 AME，互動架構以 **§13 AME** 為準；style 語彙可參考本文，但不得再採用 MSB Lab Portal／Registry／VV 路徑。

---

## 1. Purpose

This spec defines a shared mobile sheet / compact panel style for Timiva tool pages.

The goal is to prevent every tool from creating its own mobile sheet field, button, overlay, and responsive behavior. This shared style should be defined before implementing Countdown Timer, because Countdown Timer will introduce a Custom time sheet.

This is a design-system / preview-baseline task. It should not modify stable production tool behavior unless a later task explicitly applies the shared style to an existing tool.

---

## 2. Naming

```text
Mobile portrait: Bottom sheet
Mobile landscape: Compact panel
Shared system name: Mobile Sheet
```

Both portrait and landscape variants share the same overlay, backdrop, scroll lock, container language, field language, and action hierarchy. Layout density may change by orientation.

---

## 3. Scope of the shared style

Shared baseline should cover:

```text
- Backdrop / overlay
- Body scroll lock
- Sheet / panel container
- Safe-area handling
- Field surface
- Field label behavior
- Field focus state
- Action row
- Primary capsule button
- Secondary text button
- Portrait / landscape layout rules
- Accessibility and reduced motion
```

This spec does not define tool-specific business logic such as Countdown Timer auto-advance, Date Range date selection, Event Countdown theme choice, or validation rules.

---

## 4. Relationship to existing tools

Existing references:

```text
Event Countdown V2:
- Reference for current Timiva sheet visual language
- Reference for sheet primary capsule button size
- Reference for mobile landscape compact field behavior

Date Range Calculator V2:
- Reference for overlay / scroll lock behavior
- Reference for mobile landscape compact panel behavior
- Reference for sheet Clear text-button style
```

Important clarification:

```text
Date Range mobile portrait is primarily a calendar picker, so it should not be treated as the general example for input-field layout.
Date Range is still a valid reference for overlay, compact panel, and sheet Clear text-button style.
```

Existing Event Countdown and Date Range production pages are already verified. This task should not restyle them directly unless Owner explicitly approves a follow-up application task.

---

## 5. Overlay / backdrop baseline

Rules:

```text
- Opening a mobile sheet shows a semi-transparent dark backdrop.
- Background page scroll is locked while the sheet is open.
- Clicking / tapping the backdrop closes the sheet.
- Closing the sheet removes backdrop and scroll lock.
- Portrait bottom sheet and landscape compact panel use the same overlay visual language.
```

Implementation reference:

```text
Shared baseline file already exists: src/styles/tools/tool-overlay-v2-baseline.css
Shared scroll lock classes for Mobile Sheet baseline: msb-scroll-lock, msb-sheet-open (html + body)
Legacy ECV2 / DRV2 sheets may still use body.tool-operation-open; Countdown Timer Custom sheet does not add tool-operation-open
Action row stays outside scroll body so Cancel / Apply remain reachable when keyboard opens
visualViewport resize/scroll listeners must clean up inline sheet positioning on close
Focus return to trigger on sheet close; rotation / pageshow should close sheet and reset scroll lock
Real-device input focus is a required acceptance item, not optional polish
```

Do not break Event Countdown V2 overlay behavior. Event Countdown V2 overlay may be teleported to `document.body`, so body-level selectors may be required.

---

## 6. Sheet container

Shared container direction:

```text
- Dark glass-like surface
- Subtle border
- Soft shadow / depth
- Rounded corners
- Calm, low-contrast visual weight
- Safe-area aware bottom spacing
- Content should remain usable when the mobile keyboard is open
```

Portrait:

```text
- Bottom sheet anchored from the bottom
- Keeps enough safe-area bottom spacing
- Internal content may scroll if needed
- Background page must not scroll while open
```

Landscape:

```text
- Compact panel, shorter and denser than portrait
- Should avoid covering the entire tool stage when possible
- Prioritizes height efficiency
```

---

## 7. Sheet title rule

Mobile sheets should avoid titles by default.

Use a short title only when:

```text
- The sheet contains multiple option groups
- The function would be unclear without a title
- A future tool has a genuinely complex setting panel
```

Do not add:

```text
- Long subtitle text
- Instruction paragraphs
- Repeated labels that are already clear from the trigger and fields
```

Examples:

```text
No title needed:
- Countdown Timer custom time sheet opened by tapping the time
- A simple one-group input sheet

Title allowed only if needed:
- Choose theme
- Edit event
- Settings
```

---

## 8. Shared field style

Future shared mobile sheet fields should use compact inline fields in both portrait and landscape.

Field rule:

```text
[ Label    Input / Value ]
```

Shared field requirements:

```text
- Label appears on / inside the left side of the field.
- Label is always visible.
- Label does not float.
- Label does not disappear after input.
- Input / value appears on the right or main field area.
- Entire field should feel like one tap target where appropriate.
- Field surface uses the shared glass / border / radius language.
- Focus state should be visible but not loud.
```

This updates the future shared baseline so portrait and landscape use the same field language. Current older portrait sheets may still use label-above-input until a future cleanup task explicitly updates them.

---

## 9. Field layout by orientation

### 9.1 General tools

Portrait default:

```text
- One field per row
- Full-width or nearly full-width fields
- Compact inline field style: label on left, value on right
- Prioritizes readability and touch comfort
```

Landscape default:

```text
- 2-column or 3-column rows when useful
- Compact inline field style remains the same
- Prioritizes saving height and avoiding cramped panels
```

### 9.2 Natural grouped input exception

Some inputs are naturally grouped and may use side-by-side columns even in portrait.

Countdown Timer Custom time sheet:

```text
[ Hours ] [ Minutes ] [ Seconds ]
```

Reason:

```text
Hours / Minutes / Seconds are one natural time-entry group, so three columns are more intuitive than three stacked rows.
```

Rules still apply:

```text
- Labels remain visible.
- Field surface / border / radius / focus follow shared style.
- Sheet action row follows shared rules.
```

---

## 10. Action row

Shared action hierarchy:

```text
Left side: secondary text button
Right side: primary capsule button
```

Secondary text button:

```text
- Use plain text-button style.
- Reference: Date Range Calculator sheet Clear button.
- Used for Cancel / Clear / Reset style actions.
```

Primary capsule button:

```text
- Use current Timiva capsule button style.
- Size can reference Event Countdown sheet action button size.
- Used for Apply / Apply and start / Done style actions.
```

Countdown Timer Custom sheet example:

```text
Cancel: plain text button, referencing Date Range Calculator sheet Clear.
Apply and start: capsule button, referencing current Timiva / Event Countdown sheet button size.
```

The sheet Cancel style does not automatically apply to main tool-page Cancel controls.

---

## 11. Close and apply behavior

Shared close behavior:

```text
- Backdrop click closes the sheet.
- Backdrop close does not apply changes.
- Secondary Cancel closes without applying.
- Primary action applies the relevant tool action and closes when appropriate.
- Close removes scroll lock and backdrop.
```

Tool-specific actions may override only when explicitly documented.

---

## 12. Focus / keyboard / iOS Safari state rules

> Last reinforced: 2026-07-11 · Reference behavior: Age Calculator Owner-accepted landscape + keyboard state

These rules apply to **any Timiva tool** that uses a mobile bottom sheet with focusable inputs. They are shared product/QA rules, not optional polish.

### 12.1 Mobile portrait sheet-open

```text
- Sheet stays pinned to the visual viewport bottom.
- Input focus must not scroll the background page into lower content
  (Related Tools / You may also need / SEO blocks).
- Primary sheet controls (fields + secondary options such as Include) must remain
  fully visible, or scrollable inside the sheet panel.
- Safari bottom toolbar / safe-area must not cover controls into an unusable state.
- Background scroll lock must remain stable (msb-scroll-lock / msb-sheet-open).
```

### 12.2 Mobile portrait + keyboard

```text
- Focused input must stay visible and editable.
- Sheet content must not be covered into an unusable state by keyboard or Safari toolbar.
- Small internal sheet scroll is allowed.
- Whole-page background must not jump.
- Do not add Done / Apply / Calculate unless the tool product spec explicitly requires it.
- Portrait may lift sheet + result group together as one keyboard-open composition
  (shared inset / shift). Do not lift only the sheet while leaving the result group behind.
```

### 12.3 Mobile landscape sheet-open without keyboard

```text
- Content-driven compact panel.
- Do not reuse portrait fixed height.
- Do not show a large empty panel / purple backplane.
- Short-form tools should prefer compact sheet.
- Primary fields should be fully visible; secondary options should stay visible
  or lightly scrollable inside the panel.
```

### 12.4 Mobile landscape + keyboard + iOS input accessory bar

This is a **separate required QA state**. Landscape sheet-open without keyboard is not enough.

```text
- When iOS keyboard + input accessory bar (Previous / Next / Done) appear:
  do NOT force the entire bottom sheet panel above the keyboard.
- Do NOT expose a large sheet backplane / purple panel between page content
  and the accessory bar.
- Keep page background stable (no jump to lower content).
- Focused input must remain visible and editable.
- iOS accessory bar may own Previous / Next / Done.
- The full sheet does not need to remain fully visible in this state.
  Priority: usable focused input + no broken layout.
- If space is tight, avoid strange panel exposure; protect the focused input first.
- Do not apply portrait keyboard-lift behavior to landscape.
```

Reference implementation pattern (Age Calculator, Owner-accepted):

```text
- Tool-local script: on landscape matchMedia, clear keyboard sync / do not set
  sheet.style.bottom / height / max-height from visualViewport inset.
- Tool-local CSS: landscape compact height:auto / fit-content + max-height cap
  (override shared MSB fixed landscape height without editing shared MSB code).
- stabilizePageScroll while sheet is open to prevent iOS focus scroll jump.
```

### 12.5 New-tool QA gate (sheet + input)

Any new tool with mobile bottom sheet + input focus must pass these states before B2B:

```text
a. mobile portrait closed
b. mobile portrait sheet-open
c. mobile portrait sheet-open + keyboard
d. mobile landscape closed
e. mobile landscape sheet-open without keyboard
f. mobile landscape sheet-open + keyboard + iOS accessory bar
```

B2B must not start until mobile sheet states above are Owner-accepted.

---

## 13. Accessibility / motion

Accessibility rules:

```text
- Treat the sheet as a dialog / modal interaction.
- Keep focus inside the sheet while open when practical.
- Return focus to the trigger after close.
- Close button / secondary action should be keyboard accessible.
- Ensure labels are programmatically associated with inputs when real inputs are used.
```

Motion rules:

```text
- Use a short, calm open / close transition.
- Respect prefers-reduced-motion.
- With reduced motion, avoid sliding or heavy animation.
```

---

## 14. Preview / testing strategy

Because existing Event Countdown V2 and Date Range Calculator V2 are stable and should not be modified first, the shared style should be tested through an isolated preview sandbox.

Recommended preview-only route:

```text
/preview/mobile-sheet-shared-style/
```

Preview should demonstrate:

```text
- Portrait bottom sheet
- Landscape compact panel
- Compact inline field, one field per row
- Compact inline fields in 2-column / 3-column layout
- Countdown Timer H / M / S three-column example
- Secondary text button + primary capsule button action row
- Backdrop open / close
- Body scroll lock
- Reduced-motion-safe behavior
```

The preview route is only for verification. It should not be linked from production navigation.

---

## 15. Do / Don’t

Do:

```text
- Keep sheet visuals calm and low-noise.
- Keep labels visible.
- Use shared overlay / scroll lock language.
- Use existing Timiva capsule button style for primary sheet actions.
- Use Date Range sheet Clear as reference for secondary text actions.
- Use Event Countdown sheet button size as reference for primary capsule actions.
- Test portrait and landscape separately.
```

Do not:

```text
- Do not add titles to every sheet by default.
- Do not use floating labels.
- Do not let labels disappear after input.
- Do not create a new button style if existing Timiva capsule buttons work.
- Do not modify stable Event Countdown V2 or Date Range V2 production behavior in this task.
- Do not connect ads or modify ad slots.
- Do not modify Header, Footer, BaseLayout, or global background.
```

---

## 16. Countdown Timer application note

Countdown Timer should use this shared sheet style when it is implemented.

Countdown Timer Custom time sheet expected behavior:

```text
- Opened by tapping the central time on mobile.
- No title by default.
- Hours / Minutes / Seconds appear as three side-by-side fields.
- No default autofocus.
- User taps a field to start input.
- Auto-advances after each field is complete.
- Cancel uses text-button style referencing Date Range sheet Clear.
- Apply and start uses Timiva capsule style referencing Event Countdown sheet button size.
```

---

## 17. Adaptive Mobile Editor（AME）canonical contract（B9.1）

本節為 **新工具適用範圍內** 的 interactive Mobile Editor 契約。Legacy tool-local sheets（§0.2）不受本節強制改寫。

### 17.1 Lifecycle

僅兩個核准模式（`adapter.lifecycle`；預設 `submit`）：

| Mode | 行為 |
|---|---|
| **`submit`** | Draft 至 Done；Cancel／Escape／underlay rollback；Done＝validate → commit → dismiss |
| **`live`** | 有效／可同步的 draft 變更即時寫入 page state；Done 只關閉；Escape／underlay／API close 不 rollback；Reset 立即同步且 Editor 保持開啟；不顯示暗示 rollback 的 Cancel |

第一正式 `live` adopter：**Date Calculator**。不得新增其他 mode，除非另有 Owner Plan／Decision Gate。

### 17.2 Portrait

```text
Content-driven Bottom Sheet
背景結果內容 target（[data-ame-background-scale-target]）使用 shared contract：
  scale(0.92) translateY(-1.25rem)
Header、trigger、AME root 與非 target 內容不縮放
關閉後完整恢復
不使用 blur、Aurora 或大型陰影
Underlay 可點擊關閉；實際語意依 lifecycle（submit＝rollback dismiss；live＝只關閉）
```

### 17.3 Landscape

```text
Full-screen Editor（同一 AME surface；非 Aurora／tool-page bg）
不套背景縮放
topbar＋左右 pane
左表單與右 Keypad 可獨立捲動
reduced-height browser chrome 下最後一列 Keypad 必須可操作
```

### 17.4 Field error

```text
Shared triangle＋! SVG（AmeFieldError）
icon 位於欄位值右側固定 slot
不使用圓圈、紅框、底色或 layout shift
field-level error 不使用底部 banner
form-level error 才使用 shared error region
保留 aria-invalid、aria-describedby 與 sr-only message
```

### 17.5 Focus

```text
Shell／underlay 可作為 programmatic focus sink（tabindex=-1）
不顯示 whole-shell focus ring
真正可操作元件保留 focus-visible
關閉後 focus 回到原 trigger
不以全域 CSS（例如 *:focus { outline: none }）移除 focus outline
開啟時不得自動 focus native date 以致彈出系統 picker（除非產品明確要求）
```

### 17.6 Hard limits（重申）

```text
每頁最多一個 AME
sibling mount；無 Portal／Registry／multi-instance／visualViewport
Numeric Field＝button＋Timiva Numeric Keypad（非 native numeric keyboard／inputmode／contenteditable 取代）
工具擁有 content／math／validation／reset／composition；AME 擁有 shell／focus／scroll／keypad／shared visual／lifecycle framework
```
