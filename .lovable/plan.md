## Goal

Redesign the PNG/PDF export to look exactly like the uploaded reference (dark navy header banner with trophy + graduation icon, three Tamil-titled side-by-side columns: **ஆக சிறந்த மாணவர்கள்** / **கடைசி மதிப்பெண் பெற்றவர்கள்** / **தேர்வு எழுதாத மாணவர்கள்**, plus a footer ribbon). Also fix the mark-entry "next field erases" bug and lock PDF pagination to 10 students per page.

## 1. New export card design (`src/routes/c.$classId.export.tsx` → `ClassCard`)

Rebuild `ClassCard` to match the reference exactly:

**Header banner** (dark navy gradient `#0b1f4d → #1a3a8a` with gold accents)
- Left: graduation/book icon in gold laurel circle
- Center: "விஸ்டம் மேக்ஸ் டியூஷன் சென்டர்" (large Tamil) + "WISDOM MATHS TUITION CENTRE" (small caps)
- Right: gold trophy badge
- Below: 3 rounded info pills — **தேதி** (date), **வகுப்பு** (class), **மொத்த மதிப்பெண்** (total marks) — each with its own icon

**Three result columns** (side-by-side, equal width, white cards with colored top headers):

| Column | Header color | Title | Filter |
|---|---|---|---|
| 1 | green | ஆக சிறந்த மாணவர்கள் ★ | numeric marks **= totalMarks** (full marks) — sorted high→low. If none have full marks, fall back to top scorers. |
| 2 | red | கடைசி மதிப்பெண் பெற்றவர்கள் | numeric marks **< totalMarks** sorted low→high (lowest scorers, includes 0) |
| 3 | blue | தேர்வு எழுதாத மாணவர்கள் | mark === `"ab"` OR `"no"` — show "—" instead of number |

Each row: numbered circle badge (matching column color) + Tamil name + score on the right. Use S.No that continues across columns (1..N).

**Footer ribbons** (matching reference):
- Column 1 footer (green tint): "வெற்றி என்பது தயாரிப்பும், முயற்சியும், விட்டாமயற்சியும் சேர்ந்த பலன்!"
- Column 2 footer (red tint): "தோல்வி என்பது முடிவு அல்ல, மீண்டும் முயற்சி செய்ய ஒரு வாய்ப்பு!"
- Column 3 footer (blue tint): "தேர்வு எழுதுவது ஒரு நாள் இருக்கலாம், அதன் பயணம் தொடர்ட்டும்!"
- Bottom dark banner: "★ முயற்சி செய்! முன்னேறு! வெற்றி நிச்சயம்! ★"

Keep the existing modern KPI tiles + score distribution + pass-rate ring as a **second section below** the 3 columns (so users still get analytics), or move them above — TBD. Default: keep KPI/analytics row above the 3-column grid for richness.

Drop the older single ranked table (replaced by the 3-column layout). Keep medal styling for top scorers within column 1.

## 2. Fix mark-entry "next field erases" bug (`src/routes/c.$classId.marks.tsx`)

Root cause: the `MarkInputCell` `useEffect([value])` resets local `text` state every time the parent re-renders with a new `marks` object. After committing mark N, the parent updates state → all sibling cells re-render → but on a fast Enter the next cell hasn't yet received focus, and the `useEffect` overwrites whatever the user just typed.

Fix:
- Track a local "dirty" flag; only sync `text` from `value` when the input is **not focused** AND not dirty.
- OR keep `useEffect` but guard with `if (document.activeElement === inputRef.current) return;`
- Use a `ref` on the input to do this check reliably.

This stops the next focused cell from being wiped when the previous commit triggers a re-render.

Also: ensure parsing accepts the keywords as already documented — `ab` → absent, `no` → did-not-write. (Already correct in `parseMarkInput`; no code change needed there, just confirm placeholder text stays helpful.)

## 3. PDF: 10 students per page

In `src/routes/c.$classId.export.tsx`:
- Change `const PER_PAGE_PDF = 20` → `const PER_PAGE_PDF = 10`.
- Update hero copy `"PDF · 20 / page"` → `"PDF · 10 / page"`.
- Pagination logic stays (`chunks` builder already handles any size).

For PDF, each page renders the **full 3-column card** but only with that page's slice of students distributed across the columns based on the same 3 filters (full-mark / lowest / absent). For PDFs we still slice the `rows` array into 10s and render the same `ClassCard`; the 3-column filter then operates on `analysisRows` (full roster) for accurate categories, while the per-page table area shows that page's slice. (Same pattern already used: `analysisRows` vs `rows`.)

## 4. PNG: single all-in-one image matching reference

The PNG path already renders `ClassCard` offscreen at `CARD_WIDTH=720` with `scale: 3`. After the redesign, this same path will produce the reference-style image. No structural change needed — just the new `ClassCard` markup.

Filename pattern stays: `wisdom-{class}-{subject}-{theme}-all.png`.

## 5. Theme picker

Keep the 10 themes — they retint the header gradient + accent only. The 3-column section uses fixed green/red/blue (matching reference) regardless of theme so the semantic meaning (top/low/absent) stays consistent.

## Files to edit

- `src/routes/c.$classId.export.tsx` — rewrite `ClassCard`, set `PER_PAGE_PDF = 10`, update button label.
- `src/routes/c.$classId.marks.tsx` — fix `MarkInputCell` focus-aware sync to stop erasing.

## Out of scope

- No data-model changes.
- No new Tamil translation infra (strings are inline in the card).
- No new themes.
