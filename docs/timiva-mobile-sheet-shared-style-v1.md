# Timiva Mobile Sheet Shared Style Spec V1

Date: 2026-06-14 (Created) · Last updated: 2026-06-21
Owner: Jane / Timiva
Status: Accepted baseline · Validated on Countdown Timer Custom sheet (Owner real-device, 2026-06-21) · ECV2 / DRV2 production unchanged

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

## 12. Focus / keyboard rules

Shared rules:

```text
- Sheet open should not force autofocus by default.
- User taps a field to focus it.
- Numeric fields should use a numeric keyboard where appropriate.
- Keyboard opening must not hide the active input or primary action.
- The primary action must remain reachable with safe-area / keyboard constraints.
```

Tool-specific behavior:

```text
Countdown Timer may auto-advance from Hours → Minutes → Seconds after each field is complete.
This is Countdown Timer-specific and not a shared sheet requirement.
```

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
