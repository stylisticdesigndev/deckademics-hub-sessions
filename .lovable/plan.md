

# Sync Admin Dashboard with Admin Page Data

## Problem
The admin dashboard has a standalone inline payment query (lines 21-37 in `AdminDashboard.tsx`) that duplicates logic and doesn't align with the richer stats already computed by `useAdminPayments`. The dashboard payment card only shows raw "Pending" and "Overdue" counts, while the payments page calculates dollar amounts, missed vs upcoming breakdowns, etc.

The student/instructor cards use RPC functions (`get_student_counts`, `get_instructor_counts`) which should be fine as long as the underlying DB functions are accurate. Those don't need changes.

## What changes

### 1. Replace inline payment query with `useAdminPayments` hook
Remove the standalone `useQuery` for `admin-payment-stats` in `AdminDashboard.tsx` and import `useAdminPayments` instead. This ensures the dashboard reflects the exact same data the payments page shows.

### 2. Enhance the Payment Status card
Update the Payment Status card to show richer data from `useAdminPayments`:
- **Pending (overdue)** count + dollar amount
- **Upcoming** count + dollar amount
- Consistent with what `PaymentStatsCards` shows on the payments page

### 3. No other modules need updating
- Students card: uses `get_student_counts` RPC -- correct
- Instructors card: uses `get_instructor_counts` RPC + `useAdminInstructors` for pending list -- correct
- Pending Approvals tab: already pulls from `useAdminInstructors` -- correct

## Files to edit

| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Remove inline payment query; import and use `useAdminPayments`; update Payment Status card to show missed/upcoming counts and dollar amounts |

