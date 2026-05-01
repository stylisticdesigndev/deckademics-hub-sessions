## Why the previous fix didn't work

The earlier pass added `overflow-x-auto` around individual tables, but the screenshots show the **entire page** still scrolls sideways — including the red "ADMINISTRATION MODE" banner, the page title, and the search bar. That means the overflow is happening at the layout level, not inside the tables.

Two root causes:

1. **`DashboardLayout` doesn't constrain its main column.** `<div className="flex-1 overflow-auto">` and `<main className="p-4 md:p-6">` have no `min-w-0` / `max-w-full`. In a flex row, a flex child defaults to `min-width: auto`, so any wide descendant (a table, a long header, a fixed-width input) makes the whole right column grow past the viewport and scroll horizontally.
2. **Inner pages still have `min-w-[180px]` / `min-w-[200px]` cells, fixed-width selects, and wide tables that aren't truly contained** — wrapping them in `overflow-x-auto` only helps if the parent is actually clipped to the viewport width. It isn't.

The fix has two layers: lock the layout to the viewport width, then redesign the worst tables so they don't need horizontal scrolling at all on mobile.

## Plan

### 1. Fix the layout root (the real bug)

**`src/components/layout/DashboardLayout.tsx`**
- Change the main scroll column to `flex-1 min-w-0 overflow-x-hidden overflow-y-auto` so it can't grow past the available width.
- Add `min-w-0` and `max-w-full` to `<main>`.
- Add `min-w-0` to the sticky header inner wrappers and let the admin banner's "Return to Teaching View" button shrink (`shrink` + `truncate`) so the banner itself wraps cleanly on 390px.

This single change stops the page from scrolling horizontally regardless of what any child page does.

### 2. Redesign the wide admin tables as mobile-friendly cards

Per your guidance ("redesign things so they live in containers that don't need to be side scrolling"), the tables with 7–9 columns will get a **mobile card view** while keeping the desktop table intact. Pattern:

```text
md:hidden  → stacked card list (one card per row, key fields only)
hidden md:block → existing data table (with overflow-x-auto as a fallback)
```

Pages getting the dual layout:

- **`AdminStudents.tsx`** — Active/Pending/Inactive tables (9 cols). Mobile card shows: avatar + name, email, level badge, instructor, status, action menu. Bulk-action toolbar already wraps; keep it.
- **`AdminInstructors.tsx`** — instructor list. Mobile card: avatar + name, email, student count, status, actions.
- **`AdminProgress.tsx`** — student progress table (4 cols incl. progress bar). Mobile card: name + email, level badge, instructor line, full-width progress bar underneath. Removes the `min-w-[180px]` that's forcing the page wide.
- **`AdminInstructorPayments.tsx`** — three wide payroll tables (5–7 cols). Mobile card per instructor/payment with the key amounts and a single action button.
- **`AdminLedgerPreview.tsx`** — pending / upcoming / all payment tables. Mobile card: student + amount as the headline, then date/status, then action.
- **`AdminPayments.tsx`** (`PaymentsTable.tsx` component) — same card pattern for the three payment tabs.
- **`AdminAttendance.tsx`** — "Missed Classes This Week" table (the one in your screenshot). Mobile card: student + email, missed-class count, last-class date, action.

For the simpler offenders, no card redesign is needed once the layout root is fixed — only small tightening:

- **`AdminBugReports.tsx`** / **`AdminFeatureRequests.tsx`** — already mostly fine; verify status `Select` is `w-full sm:w-[130px]`.
- **`AdminCurriculum.tsx`** / **`AdminSkills.tsx`** — Tabs already responsive; verify long labels truncate.
- **`AdminMessages.tsx`** — recipient picker already responsive; no changes.

### 3. QA pass

After the changes, walk through each admin route at 390px:
`/admin/dashboard`, `/admin/instructors`, `/admin/students`, `/admin/curriculum`, `/admin/skills`, `/admin/progress`, `/admin/attendance`, `/admin/payments`, `/admin/instructor-payments`, `/admin/ledger-preview`, `/admin/messages`, `/admin/announcements`, `/admin/bug-reports`, `/admin/feature-requests`, `/admin/settings`.

For each, confirm: no horizontal page scroll, the admin banner fits, headers wrap, and the data is reachable without sideways swipe.

## Files to edit

- `src/components/layout/DashboardLayout.tsx` — root overflow + min-w-0 fix (the key change).
- `src/pages/admin/AdminStudents.tsx` — add mobile card view for the 3 student tables.
- `src/pages/admin/AdminInstructors.tsx` — add mobile card view.
- `src/pages/admin/AdminProgress.tsx` — add mobile card view; remove `min-w-[180px]`.
- `src/pages/admin/AdminInstructorPayments.tsx` — add mobile card view for all 3 tables.
- `src/pages/admin/AdminLedgerPreview.tsx` — add mobile card view for payment tables.
- `src/components/admin/payments/PaymentsTable.tsx` — add mobile card view.
- `src/pages/admin/AdminAttendance.tsx` — add mobile card view for the missed-classes table.
- Minor verification on `AdminBugReports.tsx`, `AdminFeatureRequests.tsx`, `AdminCurriculum.tsx`, `AdminSkills.tsx`.

## Out of scope

- No business-logic changes; pure layout / responsive presentation.
- No desktop changes — desktop continues to use the existing tables.
- No design-system / color changes.
