## Problem

The "Export Image" (PNG) and "Export PDF" buttons on `/c/$classId/export` fail. Root cause: the project's Tailwind v4 theme tokens use `oklch(...)` colors (see `src/styles.css`). The `html-to-image` library cannot serialize modern color functions (`oklch`, `color-mix`, `lab`) — it throws or produces a blank/black canvas. Tokens like `bg-canvas`, `bg-surface`, `border-border` used in the rendered card resolve to `oklch`, which breaks the capture.

Additionally, the PDF flow currently uses 10 students/page; the user wants 30/page.

## Fix

### 1. Replace `html-to-image` with `html2canvas-pro`
`html2canvas-pro` is a maintained fork that natively supports `oklch`, `color-mix`, and Tailwind v4 color tokens. It's a drop-in for our use case.

- Add dependency: `html2canvas-pro`
- Remove usage of `html-to-image` (`toPng`) in `src/routes/c.$classId.export.tsx`
- New capture helper:
  ```ts
  const canvas = await html2canvas(node, {
    scale: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
  const dataUrl = canvas.toDataURL("image/png");
  ```

### 2. Make the rendered card token-safe
As an additional safety net, the `ClassCard` already uses Tailwind palette colors (orange-300, slate-900, etc., not theme tokens) for its themes — good. But the outer preview wrapper uses `bg-canvas` / `border-border`. We capture only `cardRef` (the card itself), which doesn't use theme tokens, so this is fine. No change needed inside `ClassCard`.

### 3. PDF: 30 students per page (was 10)
Change `PER_PAGE = 10` → `PER_PAGE = 30` in `handleExportPdf`.
Also:
- Increase offscreen card width to 720px for better legibility at 30 rows
- Tighten row padding inside `ClassCard` when `pageInfo` is set (compact mode) so 30 rows fit comfortably on A4 portrait
- Update button label to "PDF (30 / page)" and helper copy

### 4. PNG (single page, all students) — make it reliable + attractive
- Render a dedicated "all-in-one" capture node (offscreen, full roster) so the on-screen preview width doesn't constrain it
- Use `html2canvas-pro` with `scale: 3`
- Filename: `wisdom-{class}-{subject}-{theme}-all.png`

### 5. UI polish for the Export page
- Sticky action bar (Download PNG / Download PDF) with gradient brand buttons and loading spinners
- Theme picker: larger swatches in a responsive grid, with selected state ring + checkmark
- Add a small "Summary" stat row above preview: total students, present, absent, top scorer
- Smooth shadow + rounded-3xl preview frame with subtle gradient backdrop
- Mobile: stack controls; buttons full-width on small screens
- Toasts for success/failure with the exact error message when capture fails (helps future debugging)

### 6. Error handling
Wrap both export handlers in try/catch and surface `err.message` via toast so failures are visible instead of silent.

## Files to change

- `package.json` — add `html2canvas-pro`
- `src/routes/c.$classId.export.tsx` — swap capture lib, 30/page PDF, new offscreen all-in-one PNG path, refreshed UI, better error toasts

## Out of scope

- No changes to data model, auth, or other routes.
- No changes to `ClassCard` theme palette (already capture-safe).

After implementation I'll verify by triggering both exports in the preview and confirming downloads succeed without console errors.