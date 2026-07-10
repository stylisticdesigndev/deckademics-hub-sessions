# Admin Responsive Audit — Mobile-First

Goal: make every admin screen scale cleanly on tablet and (priority) mobile. Desktop stays essentially the same, with minor spacing/alignment polish allowed. Approach for dense data tables: **stacked cards on mobile, real table on desktop**.

## Problem categories found

1. **Dense tables only scroll sideways.** Students (9 columns), Instructor Payments, Ledger Preview, Payments, Attendance, and Progress render full tables inside `overflow-x-auto`. On mobile this forces awkward horizontal swiping and columns get clipped — the main "breaks completely" symptom.
2. **Dialogs overflow the viewport.** Several use non-responsive fixed widths (`max-w-4xl`, `max-w-3xl`) or lack a mobile height cap, so they run off-screen or can't scroll on small devices.
3. **Crowded header / filter / action rows.** The dashboard header action cluster, bulk-action button rows, filter rows, and generate/date-range controls wrap poorly or overflow on narrow screens.

## Plan

### 1. Reusable mobile pattern (foundation)
- Add a small shared helper approach: render the existing `<Table>` inside a `hidden md:block` wrapper and a mobile `md:hidden` list of record cards for the same data. Each mobile card shows the primary identity (name/avatar), key fields as labeled rows, status badge, and the same action buttons.
- Keep a single source of data/handlers per page so desktop table and mobile cards stay in sync (no duplicated logic, just two presentations).

### 2. Convert the heavy tables to card views on mobile
- `src/pages/admin/AdminStudents.tsx` — Active / Pending / Inactive tables (3 tables). Mobile card: avatar + name, email, instructor, level, day/time, status, and the row's actions/checkbox. Preserve bulk-select.
- `src/pages/admin/AdminInstructorPayments.tsx` — pending + history tables and the generate-preview list. Mobile cards for each payment with amount, period, status, and action menu.
- `src/pages/admin/AdminLedgerPreview.tsx` — ledger tables (several `overflow-x-auto` blocks). Mobile cards per entry with the right-aligned action group stacked.
- `src/components/admin/payments/PaymentsTable.tsx` (used by `AdminPayments.tsx`) — mobile cards with student, amount, due date, type, status, and Mark Paid / edit / delete actions.
- `src/pages/admin/AdminProgress.tsx` — student table → mobile cards (name, level, instructor, milestone summary).
- `src/pages/admin/AdminAttendance.tsx` — attendance table → mobile cards.

### 3. Make all admin dialogs mobile-safe
- Standardize wide dialogs to `w-[calc(100%-2rem)]` gutters + responsive max width + `max-h-[85vh] overflow-y-auto`.
- Fix specifically: `StudentAssignmentDialog` and `InstructorAssignmentDialog` (`max-w-4xl`), `AdminLedgerPreview` (`max-w-3xl` and tall dialogs), plus review `AdminInstructors`, `AdminCurriculum`, `AdminSkills`, `AdminSettings`, `CreatePaymentDialog`, `ExtraPayDialog`, `AnnouncementForm`, `MockUsersSection` for a consistent mobile gutter + scroll cap.
- Ensure dialog footers stack (already `flex-col-reverse sm:flex-row`) and long content scrolls.

### 4. Header, filters, and action rows
- `src/components/layout/DashboardLayout.tsx` — verify the header action cluster (bug/feature/notifications/logout) fits on small phones; condense the Logout button to an icon-only variant on mobile if it crowds.
- Bulk-action row in `AdminStudents` (Change Level / Message / Mark Mock / Deactivate / Clear) — ensure it wraps cleanly and buttons stay tappable.
- Filter rows (`AdminProgress`, `AdminStudents`, `AdminBugReports`, `AdminFeatureRequests`) — make selects full-width and stack under the search on mobile (fix the fixed `w-[160px]` selects that don't shrink).
- `AdminInstructorPayments` generate/date-range and instructor-scope controls — stack and go full-width on mobile.

### 5. Page shells and stat grids (polish)
- Confirm page title/action headers use `flex-col gap-3 sm:flex-row` so the primary action button drops below the title on mobile (already done in `AdminPayments`; apply the same to other page headers that place a button beside the title).
- Verify stat-card grids collapse sensibly (`AdminDashboard`, `AdminProgress`, `AdminAttendance`, `PaymentStatsCards`) — mostly fine; adjust any that stay multi-column too early.

### 6. Verification
- Type-check with `tsgo` after changes.
- Since authenticated preview isn't available in this environment (external Supabase), verify layout via targeted responsive checks: render-level review at 375px (mobile), 768px (tablet), and desktop breakpoints, confirming no horizontal page overflow, tappable controls, and dialogs contained within the viewport.

## Technical notes
- No backend, data, or business-logic changes — presentation only.
- Reuse existing shadcn `Card`, `Badge`, `Button`, `DropdownMenu`; no new dependencies.
- Breakpoint convention: `md` (768px) as the table→card switch; keep `sm` tweaks for filter/header rows.
- All colors via existing semantic tokens (`deckademics-primary`, `muted-foreground`, etc.); no hardcoded colors.
