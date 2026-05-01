## Mobile audit results (Admin pages)

I scanned every admin page. Below is the verdict, then the targeted fix plan. Pages already responsive are left untouched per your rule.

### ✅ Already responsive — no changes
- `AdminDashboard` — uses `md:grid-cols-3`, single-column stack on mobile.
- `AdminAttendance` — header is a single column; stats use `md:grid-cols-2 lg:grid-cols-3`. **However** its data table overflows (see fixes).
- `AdminProfile`, `AdminProfileSetup`, `AdminAnnouncements` (mostly fine, see one tiny fix).
- `AdminSettings` — uses card-based forms, dialogs are mobile-friendly.

### ❌ Pages causing horizontal scroll on mobile
Confirmed issues from code inspection:

1. **`AdminInstructors`** — Header uses `flex justify-between items-center` (no wrap). Page wraps everything in `TooltipProvider` with no overflow guards.
2. **`AdminStudents`** — Three full-width data tables (Active/Pending/Inactive) with 9 columns. No `overflow-x-auto` wrapper. Bulk-action toolbar is a non-wrapping flex row of 5+ buttons.
3. **`AdminCurriculum`** — Header is `flex justify-between items-center`. `TabsList grid-cols-4` with long labels.
4. **`AdminSkills`** — `TabsList grid-cols-4` ("Novice/Amateur/Intermediate/Advanced") with counts overflows at 375px.
5. **`AdminProgress`** — Filter row uses two `Select` triggers fixed at `w-[160px]` and `w-[200px]` plus a min-200px search input → forces horizontal scroll. Table has 4 columns including a `min-w-[180px]` progress cell.
6. **`AdminPayments`** — Header `flex justify-between items-start` with a "Create Payment" button. Stats and tables (in child components) likely overflow; need to confirm child component too.
7. **`AdminInstructorPayments`** — Header packs title + help button + 2 action buttons (`Generate All`, `Generate Selected min-w-[200px]`) in a single `flex justify-between` row → strong horizontal overflow. Multiple wide tables (5–7 columns) with no `overflow-x-auto`.
8. **`AdminLedgerPreview`** — Header has wrap, but inner sub-headers don't. Some tables already wrapped; others not. Also `min-w-[180px]` button.
9. **`AdminMessages`** — Generally fine, but the recipient picker uses `grid-cols-2 md:grid-cols-3` which is OK; the Tabs row + Compose form can overflow on tiny screens.
10. **`AdminBugReports`** / **`AdminFeatureRequests`** — Card rows use `flex items-start justify-between gap-4` with `SelectTrigger w-[130px]/w-[140px]` inside; on 320–375px the status select can push off-screen.

### Fix plan (only the broken pages)

For each fix I'll apply the same minimal pattern:
- **Headers**: `flex justify-between items-center` → `flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start`. Add `min-w-0` to title block. Action button cluster gets `flex flex-wrap items-center gap-2`.
- **Wide tables**: wrap the `<Table>` in `<div className="overflow-x-auto">` (or upgrade existing `rounded-md border` to also include `overflow-x-auto`).
- **Tabs with many items**: change `grid-cols-4` (or 3) to be horizontally scrollable on mobile by using `w-full overflow-x-auto` and removing the rigid grid at small screens, or stack to 2 rows: `grid-cols-2 sm:grid-cols-4`.
- **Filter rows**: change fixed-width `Select`s to `w-full sm:w-[160px]`. Remove `min-w-[200px]` on search and use `flex-1 min-w-0`. Wrap in `flex flex-col sm:flex-row`.
- **Bulk-action toolbars**: add `flex-wrap` so buttons stack.
- **Buttons**: remove `min-w-[200px]` / `min-w-[180px]` on mobile (`sm:min-w-[200px]`).

#### Pages I will edit
- `src/pages/admin/AdminInstructors.tsx` — header wrap.
- `src/pages/admin/AdminStudents.tsx` — header (already partly OK), bulk-action toolbar `flex-wrap`, wrap each `<Table>` in `overflow-x-auto`.
- `src/pages/admin/AdminCurriculum.tsx` — header wrap; make TabsList scrollable on mobile.
- `src/pages/admin/AdminSkills.tsx` — TabsList responsive (`grid-cols-2 sm:grid-cols-4`).
- `src/pages/admin/AdminProgress.tsx` — filter row stacks on mobile; table wrapped in `overflow-x-auto`.
- `src/pages/admin/AdminPayments.tsx` — header wrap; check child `PaymentsTable`/`PaymentStatsCards` and add `overflow-x-auto` where needed.
- `src/pages/admin/AdminInstructorPayments.tsx` — header restructured into stacked title + wrapping action cluster; `min-w-[200px]` becomes `sm:min-w-[200px]`; all 3 tables wrapped in `overflow-x-auto`.
- `src/pages/admin/AdminLedgerPreview.tsx` — sub-section headers (Student Payments / Instructor Payments) get the same wrap treatment; `min-w-[180px]` button becomes `sm:min-w-[180px]`; remaining unwrapped tables get `overflow-x-auto`.
- `src/pages/admin/AdminBugReports.tsx` — `SelectTrigger w-[130px]` becomes `w-full sm:w-[130px]`; row containers get `flex-col sm:flex-row`.
- `src/pages/admin/AdminFeatureRequests.tsx` — same as above with `w-[140px]`.
- `src/pages/admin/AdminMessages.tsx` — TabsList allowed to wrap; recipient picker keeps current responsive grid.

#### Pages I will NOT touch (verified responsive)
- `AdminDashboard`, `AdminAttendance` (page shell only; its inner table will be wrapped in `overflow-x-auto` as part of fix #5 above), `AdminAnnouncements`, `AdminSettings`, `AdminProfile`, `AdminProfileSetup`, `AdminDashboardGate`.

Note: I will keep "Demo" buttons untouched per your future-removal note — only the layout around them changes so they don't push the viewport.

### Out of scope
- No content/feature changes.
- No design-system color changes.
- Desktop layout stays identical (all changes are `sm:` upward).
- I will not run a real device QA (browser preview requires login); changes are CSS-only and follow the pattern already used successfully on `InstructorAttendance`.