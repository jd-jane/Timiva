# Timiva Decision Log

> 用途：記錄已確認的產品、設計、技術、SEO、法務與工作流決策。  
> 原則：只記錄「之後會影響判斷」的決策，不記錄每個小修改細節。

---

## 2026-06-10 — Project workflow becomes file-driven

Decision:

```text
Timiva 後續不再依賴每次複製長 prompt。
改成 AGENTS.md + current-status + task brief + validation report 的文件驅動工作流。
```

Reason:

```text
降低 ChatGPT / Cursor 之間貼來貼去的負擔。
讓 Cursor 每次讀固定規則與任務檔。
讓新討論串可以快速接續狀態。
```

Implementation:

```text
AGENTS.md
docs/timiva-current-status.md
docs/timiva-decision-log.md
docs/tasks/
docs/reports/
```

---

## 2026-06-10 — Current recommended next task

Decision:

```text
Event Countdown V2 中文版、Legal Pages、Footer 語系切換完成後，下一步優先做 Pre Deploy Final Check。
```

Reason:

```text
目前可視為收尾的範圍已包含：
1. Event Countdown V2 中文正式切換
2. Legal Pages 正式內容與 Markdown 架構
3. Footer 語系切換體驗補強
```

---

## 2026-06-10 — Legal pages architecture

Decision:

```text
Legal / Text Pages 正式採用獨立 Markdown 內容檔 + Astro route entry + LegalTextLayout。
```

Rules:

```text
正式長文放在 src/content/legal/{locale}/*.md。
Route 只負責載入 Markdown、套用 LegalTextLayout、設定 metadata。
不把正式長文直接寫死在 .astro。
不使用 MDX。
不新增新的 LegalLayout。
純文字頁不放廣告。
```

---

## 2026-06-10 — Legal naming

Decision:

```text
中文正式命名使用「使用條款」，不使用「使用規範」。
英文 Footer 使用 Terms；英文頁面正式標題使用 Terms of Use。
```

English naming:

```text
Footer: Terms
Page H1: Terms of Use
Meta title: Terms of Use | Timiva
Route: /en/terms/
File: terms.md
```

---

## 2026-06-10 — Footer language switch behavior

Decision:

```text
Footer language switch should preserve the corresponding route instead of sending users back to language home.
```

Examples:

```text
/zh/privacy/ → /en/privacy/
/en/terms/ → /zh/terms/
/zh/contact/ → /en/contact/
/zh/event-countdown/ → /en/event-countdown/
```

---

## 2026-06-10 — Event Countdown V2 Chinese production route

Decision:

```text
/zh/event-countdown/ uses EventCountdownV2 in production mode.
```

Protected scope:

```text
Do not modify /en/event-countdown/ unless explicitly asked.
Do not modify /preview/event-countdown-v2 unless explicitly asked.
Do not go back to V1 unless a critical rollback is requested.
```

---

## Standing decision — Product direction

Decision:

```text
Timiva is a mobile-first, Widget-like time and daily rhythm tool site.
```

Core principle:

```text
少工具，但每個都超舒服。
```

Avoid:

```text
Traditional tool site
Dense SEO portal
Large productivity app
Feature-heavy dashboard
Backend/database-heavy service
```

---

## Standing decision — Owner approval

Decision:

```text
Timiva is currently in Phase A: Owner-led confirmation.
```

Rules:

```text
Agents passing does not mean automatic launch.
Cursor finishing does not mean commit is allowed.
Build passing does not mean deploy is allowed.
Owner must explicitly approve next step, commit, or deploy.
```
