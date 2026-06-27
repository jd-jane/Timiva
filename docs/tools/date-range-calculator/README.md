# Date Range Calculator / 日期區間計算

> 更新日期：2026-06-27  
> 狀態：**實作完成，已部署**

---

## 路由

```text
/en/date-range-calculator/
/zh/date-range-calculator/
```

## 分類

```text
Important Dates / 重要日子
```

Timiva V1 第二個核心工具。

## 用途

計算兩個日期之間的天數，並區分工作日與週末。適合規劃期間、估算專案長度或快速確認日期差距。

## 主要功能

```text
Start date — End date 選擇
Total Days / Workdays / Weekends 結果
Desktop inline calendar
Mobile portrait bottom sheet / landscape panel
Drawer / sidebar V2 工具頁布局
EN / ZH 雙語
FAQ / JSON-LD
Related Tools
計算邏輯未重寫；舊版元件保留供 rollback
Mobile portrait / landscape / Desktop 已驗收
```

## 主要 commit

```text
2b496b4 — Migrate Date Range Calculator to V2 layout
```

## 廣告狀態

```text
ToolAdSlot main / sidebar：is-disabled
正式環境不顯示可見廣告占位
```

## 保護邊界

除非任務明確指定，否則不得修改 Date Range 計算邏輯與 start / end date 選擇核心行為。

## 相關文件

- [產品架構](../../core/product-architecture.md) — V1 工具分類與優先順序
- [專案現況](../../project/current-status.md) — 全站部署與驗收狀態
- [Mobile Sheet 共用樣式](../../standards/mobile-sheet.md)
- 驗收報告與 task brief：`local-docs/reports/`、`local-docs/tasks/`（local-only）
