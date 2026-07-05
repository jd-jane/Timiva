# Age Calculator / 年齡計算

> 更新日期：2026-07-05  
> 狀態：**Product specification complete** · **Ready for repository-aware Plan-first** · **Implementation not started** · **Not committed** · **Not pushed** · **Not deployed**

---

## 路由

```text
/en/age-calculator/
/zh/age-calculator/
```

## 分類

```text
Important Dates / 重要日子
```

Timiva **第五個工具**（接續四個 V1 正式工具之後的下一個產品開發項目）。

## 核心 MVP 摘要

```text
出生日期智慧輸入（8 位連續數字、貼上、日期選擇器）
計算日期預設今天；Desktop 原位置修改；Mobile 使用既有 Mobile Sheet
主結果：完整歲數、精準年／月／日、已走過總天數
初始狀態顯示 0 歲；2 月 29 日非閏年週年規則
自然日曆算法；出生當天為 Day 0
EN / ZH · About / How to / FAQ / JSON-LD · Related Tools
```

## 不做範圍（MVP）

```text
LocalStorage
分享
距離下次生日、星座、生肖、生命統計
會員 / 雲端同步 / 歷史紀錄
```

## Canonical spec

- [product-spec.md](./product-spec.md) — 完整產品、互動、計算、RWD、文案、FAQ、SEO、QA 與 Definition of Done

## 下一步

```text
等待 Owner 確認文件同步結果後，建立 Age Calculator repository-aware Plan-first task。
Plan-first 階段僅輸出實作計劃，不開始 implementation。
```

## 相關文件

- [產品架構](../../core/product-architecture.md)
- [Roadmap](../../core/roadmap.md)
- [專案現況](../../project/current-status.md)
- [決策紀錄](../../project/decision-log.md)
- Plan / validation report（未來）：`local-docs/`（local-only）
