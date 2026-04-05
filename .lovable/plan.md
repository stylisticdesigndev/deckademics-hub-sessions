

# Instructor Payments Page Improvements

## 1. Clickable Payment History Rows with Detail View

Add a detail dialog that opens when clicking any row in Payment History. It shows a full breakdown:
- Instructor name, pay period dates
- Hourly rate, hours worked, class amount
- Bonus amount + description (if any)
- Grand total
- Date paid

This gives the admin a clean summary at a glance without scanning across columns.

**File**: `src/pages/admin/AdminInstructorPayments.tsx` -- add a `showPaymentDetailDialog` state, make history rows clickable with `cursor-pointer hover:bg-muted`, render a read-only detail dialog.

## 2. Remove "Create Payment" and "Add Bonus Payment" Header Buttons

You're right -- with "Generate Pay Period" handling batch creation and per-row "Bonus" buttons for attaching bonuses, these two standalone buttons are redundant. They add confusion and duplicate functionality.

**Remove**: The "Create Payment" and "Add Bonus" buttons from the header, along with their dialogs (`showCreateClassDialog`, `showCreateBonusDialog`) and all associated form state and handlers (~150 lines of cleanup).

The header will just have the single "Generate Pay Period" button.

## 3. Replace Stat Cards with More Useful Metrics

Current cards are weak: "Pending Payments" count is visible in the table, "Instructor Hourly Rates" duplicates the Rates table below.

**Replace with these 3 cards**:
- **Total Payroll This Period** -- sum of all pending payments (class + bonus). Shows what the admin owes right now.
- **Total Paid This Month** -- keep this one, it's useful for tracking monthly spend.
- **Total Paid All Time** -- lifetime total paid to all instructors, gives a big-picture view.

These are actionable financial metrics rather than redundant info.

**Files**: `src/components/admin/instructor-payments/InstructorPaymentStatsCards.tsx` (redesign cards), `src/hooks/useInstructorPayments.ts` (update stats calculation to include all-time total).

## Summary

| Area | Change |
|------|--------|
| `AdminInstructorPayments.tsx` | Add payment detail dialog on history row click; remove Create Payment + Add Bonus header buttons and their dialogs/state |
| `InstructorPaymentStatsCards.tsx` | Replace 3 cards: Total Payroll This Period, Paid This Month, Total Paid All Time |
| `useInstructorPayments.ts` | Update stats to compute all-time paid total instead of instructor rates count |

