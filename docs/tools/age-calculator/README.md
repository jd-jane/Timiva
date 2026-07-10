# Age Calculator / 年齡計算

> 更新日期：2026-07-10
> 狀態：**Standalone 實作完成** · **B3D Final QA Re-check 通過** · **No blocking issues found** · **尚未 Post-tool Link Integration** · **尚未 push / deploy**

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

Timiva **第五個工具**。

## 目前狀態

```text
B1B / B2A / B2B / B2C / B3C bugfix 已完成
B3D Final QA Re-check：Pass
working tree clean（文件同步前）
尚未 push / deploy
尚未做 Post-tool Link Integration
```

## 已完成功能摘要

```text
Desktop birth date：單一智慧 input + calendar popover（month / year select）
Mobile birth date：Year / Month / Day 三欄 input + auto-advance
As-of 預設 today
Desktop As-of：calendar popover；非 today 時日期旁 back icon 可回到 today
Mobile As-of：原生 date picker；不顯示 back icon
invalid / empty / incomplete / valid 狀態完成
invalid birth 結果歸零（不保留上一個 valid 結果）
B3C 已排除 setMobileAsOfInvalidFields ReferenceError
EN / ZH · About / How to / Common uses / FAQ / FAQ JSON-LD · Related Tools（3）
```

## 計算規則摘要

```text
出生年份：1900 ～ today
1900 / 01 / 01 → valid
1899 / 12 / 31 → invalid
future birth → invalid
empty / incomplete → 結果 0，不顯示 invalid icon
complete invalid → 結果 0，顯示 invalid icon
as-of earlier than birth → 結果 0 + as-of invalid
leap day 2/29：閏年 2/29；非閏年週年 3/1
自然日曆完整年、月、日
total days lived：生日當天為 Day 0
```

## Commits

```text
cb09fc6 — feat: add Age Calculator B1B
72c3d58 — feat: add Age Calculator B2A
fb2d21f — feat: add Age Calculator B2B
cc31c79 — feat: add Age Calculator B2C
f5416b6 — fix: reset Age Calculator invalid birth state
```

## B3D QA 摘要

```text
npm run build — Pass
validate-seo-head — Pass（460）
validate-sitemap — Pass（375）
validate-age-calculator-math — Pass（130）
git diff --check — Pass
Desktop EN / ZH — Pass
Mobile portrait EN / ZH — Pass
Mobile landscape EN / ZH — Pass
Content / SEO / Related Tools — Pass
```

## 下一步

```text
Owner 授權後：Post-tool Link Integration
再經 Link QA / commit → push / deploy checkpoint
```

## Canonical spec

- [product-spec.md](./product-spec.md) — 產品規格與最終實作對齊說明

## 相關文件

- [產品架構](../../core/product-architecture.md)
- [Roadmap](../../core/roadmap.md)
- [專案現況](../../project/current-status.md)
- [決策紀錄](../../project/decision-log.md)
- [站內連結整合](../../workflow/tool-link-integration.md)
- Plan / validation report：`local-docs/`（local-only）
