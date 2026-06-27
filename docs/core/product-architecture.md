# Timiva Product Architecture V4

> Updated: 2026-06-21
> Replaces the planning assumptions in V3 where Life Progress Bar was the V1 fourth tool.

## 文件目的

本文件定義 Timiva 的產品功能架構、工具分類、優先順序與功能邊界。

---

## 1. 產品定位

Timiva 是一個簡單、舒服、手機好用的時間與生活節奏工具網站。

核心原則：

```text
少工具，但每個都超舒服。
```

English:

```text
Simple tools for important dates, focus, daily rhythm, and life progress.
```

中文：

```text
簡單、舒服、手機好用的時間與生活節奏工具。
```

---

## 2. 四大分類

```text
1. Important Dates / 重要日子
2. Timers & Focus / 計時與專注
3. Daily Rhythm / 日常節奏
4. Life Progress / 人生進度
```

分類名稱不因工具調整而更改。

---

## 3. 架構總覽

```mermaid
flowchart TD
    A[Timiva] --> B[Simple tools for important dates, focus, daily rhythm, and life progress]

    B --> C[Important Dates<br/>重要日子]
    B --> D[Timers & Focus<br/>計時與專注]
    B --> E[Daily Rhythm<br/>日常節奏]
    B --> F[Life Progress<br/>人生進度]

    C --> C1[Event Countdown]
    C --> C2[Date Range Calculator]
    C --> C3[Days Between Dates]
    C --> C4[Add / Subtract Days]
    C --> C5[Age Calculator]
    C --> C6[Birthday Countdown]

    D --> D1[Countdown Timer]
    D --> D2[Stopwatch]
    D --> D3[Fullscreen Timer]
    D --> D4[Pomodoro Timer]
    D --> D5[Focus Timer]

    E --> E1[Breathing Timer]
    E --> E2[Fasting / Recovery Timer]
    E --> E3[Circadian Energy Planner]
    E --> E4[Break Timer]
    E --> E5[Focus Flow Timer]

    F --> F1[Year Progress]
    F --> F2[Month Progress]
    F --> F3[Milestone Progress<br/>working name]
    F --> F4[Goal Countdown]
    F --> F5[Life Timeline]

    C1 --> G[Single Tool Page]
    C2 --> G
    D1 --> G
    F1 --> G

    G --> H[Astro + Tailwind + Semantic HTML]
    H --> I[LocalStorage / URL Sharing when needed]
    I --> J[SEO / AEO / FAQ]
    J --> K[Search Traffic + Future AdSense]
```

---

## 4. V1 core tools

| Order | Tool | Category | Status / purpose |
|---:|---|---|---|
| 1 | Event Countdown | Important Dates | Completed baseline |
| 2 | Date Range Calculator | Important Dates | Completed baseline |
| 3 | Countdown Timer | Timers & Focus | Completed and site-integrated |
| 4 | Year Progress | Life Progress | Product spec confirmed; next implementation |

V1 no longer uses a multi-mode Life Progress Bar as the fourth tool.

---

## 5. Important Dates

定位：

```text
處理重要日期、事件倒數與日期計算。
```

| Priority | Tool | 中文 | Core use | Maintenance |
|---|---|---|---|---|
| P0 | Event Countdown | 事件倒數 | 建立重要事件倒數 | Low |
| P0 | Date Range Calculator | 日期區間計算 | 計算日期區間 | Low |
| P1 | Days Between Dates | 日期差計算 | 聚焦相差天數 | Low |
| P1 | Add / Subtract Days | 日期加減 | 計算 N 天前後 | Low |
| P1 | Age Calculator | 年齡計算 | 年齡與生日日期差 | Low |
| P2 | Birthday Countdown | 生日倒數 | 生日情境倒數 | Low |
| P3 | Holiday Countdown | 節日倒數 | 長尾節日情境 | Medium |
| P3 | Anniversary Countdown | 週年倒數 | 紀念日情境 | Low |

Holiday data must not become a high-maintenance global database in early phases.

---

## 6. Timers & Focus

定位：

```text
處理現在開始的一段時間。
```

| Priority | Tool | 中文 | Core use | Maintenance |
|---|---|---|---|---|
| P0 | Countdown Timer | 一般倒數計時器 | 快速設定並倒數 | Low |
| P1 | Stopwatch | 碼表 | 計算實際經過時間 | Low |
| P1 | Fullscreen Timer | 全螢幕計時器 | 大畫面低干擾計時 | Low |
| P2 | Pomodoro Timer | 番茄鐘 | 專注 / 休息週期 | Low |
| P2 | Focus Timer | 專注計時 | 輕量專注計時 | Low |
| P3 | Interval Timer | 間歇計時器 | 循環間歇 | Medium |
| P3 | Meeting Timer | 會議計時器 | 會議 / 簡報時間 | Low |

Avoid early background systems, complex notifications, history reports, and sync.

---

## 7. Daily Rhythm

定位：

```text
處理每天的節奏、休息、能量與恢復。
```

| Priority | Tool | 中文 | Core use | Maintenance |
|---|---|---|---|---|
| P1 | Breathing Timer | 呼吸節奏計時 | 呼吸與短暫休息節奏 | Low |
| P1 | Fasting / Recovery Timer | 斷食 / 恢復計時器 | 時間追蹤，不做健康建議 | Low |
| P2 | Circadian Energy Planner | 生理能量排程器 | 起床後時間區間提示 | Medium |
| P2 | Break Timer | 休息提醒 | 工作 / 休息節奏 | Low |
| P2 | Focus Flow Timer | 專注流計時 | 專注與休息節奏 | Low |
| P3 | Energy Reset Timer | 能量重置計時 | 短時間狀態重置 | Low |
| P3 | Stretch Timer | 伸展計時 | 伸展節奏 | Low |

Boundary:

```text
時間追蹤與節奏提示，不提供醫療、健康診斷、營養或療效承諾。
```

---

## 8. Life Progress

定位：

```text
讓使用者看見自己在年度、月份、目標期限或長期時間中的位置。
```

Architecture decision:

```text
Life Progress 不採一個大型多模式工具。
每一種時間尺度應優先成為清楚、低維護的獨立工具。
```

| Priority | Tool | 中文 / working name | Core use | Maintenance |
|---|---|---|---|---|
| P0 | Year Progress | 今年進度 | 顯示今年已過與剩餘比例 | Low |
| P1 | Milestone Progress | 里程碑進度（暫名） | 單一里程碑期限 / 進度 | Medium |
| P2 | Month Progress | 本月進度 | 顯示本月已過與剩餘比例 | Low |
| P2 | Goal Countdown | 目標倒數 | 距離目標期限多久 | Low |
| P3 | Life Timeline | 人生時間軸（暫名） | 長期時間視覺化 | Medium |
| P3 | Habit Streak Counter | 習慣連續天數 | 簡單連續日數 | Medium |

### Year Progress V1 boundary

Included:

```text
Current-year percentage
Days passed / remaining
12 monthly segments
One monthly note
Theme
Share
```

Excluded:

```text
Life mode
Custom timeline
Milestones
Goal tracking
Habit tracking
Multi-mode switch
Backend / account / sync
```

---

## 9. Development priority

### Phase 1 — V1 core

```text
1. Event Countdown
2. Date Range Calculator
3. Countdown Timer
4. Year Progress
```

### Phase 2 — V1.5 differentiation and search expansion

```text
5. Breathing Timer
6. Fasting / Recovery Timer
7. Days Between Dates
8. Add / Subtract Days
9. Age Calculator
```

### Phase 3 — V2 expansion

```text
10. Stopwatch
11. Fullscreen Timer
12. Milestone Progress（working name）
13. Month Progress
14. Circadian Energy Planner
15. Pomodoro Timer
```

### Phase 4 — Later extensions

```text
Birthday Countdown
Holiday Countdown
Anniversary Countdown
Goal Countdown
Break Timer
Focus Flow Timer
Habit Streak Counter
Interval Timer
Meeting Timer
Life Timeline
```

---

## 10. Low-maintenance boundary

Can do:

```text
Time calculation
Countdown
Timer
Progress visualization
Rhythm prompts
LocalStorage for low-risk preferences
URL sharing
Native share
Simple themes
PWA later
```

Avoid:

```text
Membership
Cloud sync
Large goal-management system
Daily task backend
AI coach
Health diagnosis
Nutrition advice
Sleep analysis
Social check-ins
Leaderboard
Complex reports
Push backend
```

---

## 11. New-tool workflow

```text
Product decision
→ Plan-first
→ B0 V2 scaffold
→ B1A lower content
→ B1B static visual
→ B2 interaction / calculation
→ QA and Agent Reviews
→ Owner acceptance
→ standalone-tool commit
→ Post-tool Link Integration Gate
→ link QA / commit
→ push / deploy readiness
```

A tool is not fully integrated until the Post-tool Link Integration Gate is complete.

---

## 12. Conclusion

Timiva remains:

```text
Mobile-first
Widget-like
Pure frontend first
Low maintenance
Few tools
High comfort
```

V1 fourth tool:

```text
Year Progress / 今年進度
```

The earlier multi-mode Life Progress Bar concept is retired from the V1 public tool plan.
