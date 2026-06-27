# Year Progress — Monthly Notes

These Markdown files control the **monthly sentence** shown in the Year Progress result stage (below the year percentage and day counts).

Each year has two files: one for English and one for Traditional Chinese.

## Annual workflow

When a new calendar year begins:

1. Duplicate the previous year folder (for example, copy `2026/`).
2. Rename the folder to the new four-digit year (for example, `2027/`).
3. Edit `en.md` with twelve new English sentences.
4. Edit `zh.md` with twelve new Chinese sentences.
5. Keep the month headings exactly as `## 01` through `## 12`.
6. Keep **one plain-text paragraph** under each month heading.
7. Run validation:

   ```bash
   node scripts/validate-year-progress-monthly-notes.mjs
   ```

8. Run a build and preview both `/en/year-progress/` and `/zh/year-progress/`.
9. Deploy for the changes to appear online.

## Important rules

- Every year folder must contain **both** `en.md` and `zh.md`.
- Do not remove a month or change heading numbers.
- Do not add lists, links, images, HTML, code blocks, or extra headings.
- Use plain text only under each month heading.
- Old year folders may remain for history; you do not need to delete them.
- If the current calendar year is missing, the site uses the closest available **earlier** year, then the **earliest later** year.
- Content changes require a **build and deploy** — editing these files alone does not update the live site.

## File format

```md
# Human-readable document title

## 01

One plain-text sentence for January.

## 02

One plain-text sentence for February.

…

## 12

One plain-text sentence for December.
```

The `#` title is for your readability. The app reads only the `## 01` … `## 12` headings and the text below each one.

## Where this appears

- English route: `/en/year-progress/`
- Chinese route: `/zh/year-progress/`

The note updates automatically based on the visitor’s **local date** (month and year).
