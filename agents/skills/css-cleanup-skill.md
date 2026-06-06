# Timiva Skill: Tailwind CSS Cleanup

## 文件目的

本 Skill 用於檢查與清理 Timiva 的 Tailwind CSS、HTML 語意、中文註解與 RWD 寫法。

主要由 Tech Architect 使用。

---

## 1. 適用情境

使用於：

```text
完成元件後
完成頁面後
修改 Tailwind 後
抽出 component class 後
發現樣式漂移後
commit 前
```

---

## 2. Skill 流程圖

```mermaid
flowchart TD
    A[開始 Tailwind CSS Cleanup] --> B[檢查 inline style]
    B --> C{是否有 inline style?}
    C -->|有| D[移除並改用 Tailwind / class]
    C -->|沒有| E[檢查 !important]

    D --> B
    E --> F{是否有 !important?}
    F -->|有| G[移除並修正優先權]
    F -->|沒有| H[檢查 CSS id selector]

    G --> E
    H --> I{是否有 CSS id selector?}
    I -->|有| J[改成 semantic class]
    I -->|沒有| K[檢查語意化 HTML]

    J --> H
    K --> L{HTML 是否語意化?}
    L -->|否| M[改用 header / main / section / footer]
    L -->|是| N[檢查中文註解]

    M --> K
    N --> O{主要區塊是否有中文註解?}
    O -->|否| P[補中文註解]
    O -->|是| Q[檢查 RWD 分段]

    P --> N
    Q --> R{RWD 是否以元件分段?}
    R -->|否| S[重整為 desktop 後接 mobile]
    R -->|是| T[輸出結果]
```

---

## 3. 檢查項目

```text
是否有 inline style
是否有 !important
是否有 CSS id selector
HTML 是否語意化
主要區塊是否有中文註解
Tailwind class 是否過度混亂
是否大量使用 arbitrary values
是否可抽成 @apply component class
RWD 是否依元件分段
是否修改 locked components
```

---

## 4. Block 條件

```text
build 失敗
使用 inline style
使用 !important
使用 CSS id selector
主要區塊沒有語意化 HTML
RWD 全部集中在最後且難以維護
修改 locked components 未經 Owner 確認
```

---

## 5. 輸出格式

```text
Skill: Tailwind CSS Cleanup
Result: Pass / Pass with minor notes / Block

Files checked:
- ...

Findings:
- ...

Required fixes:
- ...

Minor notes:
- ...
```
