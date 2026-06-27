# Countdown Timer / 倒數計時器

> 更新日期：2026-06-27  
> 狀態：**實作完成，已部署** · **站內連結整合完成**

---

## 路由

```text
/en/countdown-timer/
/zh/countdown-timer/
```

## 分類

```text
Timers & Focus / 計時與專注
```

Timiva V1 第三個核心工具。

## 用途

快速設定秒、分、小時的倒數時間。不是 Pomodoro、不是 Stopwatch，也不是 Fullscreen Timer。核心體驗是「幾秒內開始倒數、第一屏可完成主要操作」。

## 主要功能

```text
Quick Start：Last / 30s / 1m / 5m / 10m / 25m / 1h
Target end timestamp 倒數
Desktop inline edit（兩步 Enter）
Mobile Custom time sheet（H / M / S 驗證）
Ring 互動（60 ticks、1 分鐘 snap）
Start / Pause / Resume / Cancel
Progress ring · Time's up / Done
Sound preference / completion sound
Last duration 存於 localStorage
EN / ZH 雙語 · FAQ / JSON-LD · Related Tools
```

## Commit 紀錄

```text
77c6aa8 — feat: add Countdown Timer V2（工具本體）
2c44484 — feat: wire Countdown Timer links across home and catalog pages（站內連結整合）
```

## 站內整合

Post-tool Link Integration 已完成：

```text
Home 既有 Countdown Timer 卡片已接正式 EN / ZH 路由
All Tools 已列入
Event Countdown / Date Range Calculator Related Tools 已包含
Locale-aware 路由與卡片視覺保留
```

## 完整規格

詳細互動、RWD 與驗收規格見：

- [product-spec.md](./product-spec.md)

## 相關文件

- [產品架構](../../core/product-architecture.md)
- [站內連結整合](../../workflow/tool-link-integration.md)
- [專案現況](../../project/current-status.md)
- 驗收報告：`local-docs/reports/`（local-only）
