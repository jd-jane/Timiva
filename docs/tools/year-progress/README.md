# Year Progress / 今年進度

> 更新日期：2026-06-27  
> 狀態：**實作完成** · **站內連結整合完成（rebuild/main 本地 commit）** · **尚未 push / deploy**

---

## 路由

```text
/en/year-progress/
/zh/year-progress/
```

## 分類

```text
Life Progress / 人生進度
```

Timiva V1 第四個核心工具，Life Progress 類別代表。

## 用途

Zero-input、full-bleed 的年度進度工具。打開頁面即可看見今年已走到哪裡、讀一句當月提醒，並以 12 段月份膠囊感受年度節奏。

## 主要功能

```text
當年整數百分比
Days passed / days remaining
12 monthly pill segments
每月一句提醒（Markdown 遷移完成）
Theme（含 Mist / 霧光、Forest / 森光及既有 Timiva themes）
Share（含 theme URL 分享）
Tool Theme Layer（不修改 BaseLayout / global background）
EN / ZH · About / How to / FAQ / JSON-LD · Related Tools
B0–B3 standalone QA 完成
```

## Commit 紀錄（rebuild/main）

```text
f39f8bc — feat: add Year Progress V2（工具本體）
20c379d — feat: integrate Year Progress links（站內連結整合）
```

## 站內整合（本地已完成，待 push）

```text
toolsCatalog：year-progress available:true
Home 第四張卡片：year-progress
All Tools：Life Progress 分類下可見
四個正式工具 Related Tools 互連
Countdown Timer 已改為 shared catalog getRelatedTools()
自動化驗證：node scripts/validate-tool-link-integration.mjs
```

## 待辦（非 blocking）

```text
Owner 授權後 push / deploy
HTTPS 環境下 Share 成功驗證
```

## 相關文件

- [product-spec.md](./product-spec.md) — 完整產品規格與產品流程
- [產品架構](../../core/product-architecture.md)
- [站內連結整合](../../workflow/tool-link-integration.md)
- [專案現況](../../project/current-status.md)
- 計畫與驗收報告：`local-docs/plans/year-progress/`、`local-docs/reports/year-progress/`（local-only）
