

# Cleanup: Search, Stats Cards, and Pagination

## 1. Remove Search Bar

The search filters pending and completed payments by instructor name. With a small instructor roster, it adds no real value -- the admin can see all rows at a glance. It also doesn't filter the Instructor Rates table, making it inconsistent.

**Action**: Remove `InstructorPaymentSearch` import, the `searchQuery` state, and the filter logic. Use `pendingPayments` and `completedPayments` directly instead of `filteredPendingPayments` and `filteredCompletedPayments`.

## 2. Simplify Stats Cards

"Paid This Month" and "Total Paid All Time" are not actionable -- they're just historical numbers the admin rarely needs at a glance. Keep only **Total Payroll This Period** (what's owed right now) since that's the one metric that drives action. Remove the other two cards entirely for a cleaner layout.

**Files**: `AdminInstructorPayments.tsx` (remove stats component or pass simplified props), `InstructorPaymentStatsCards.tsx` (reduce to single card or inline it), `useInstructorPayments.ts` (simplify stats calculation).

## 3. Add Pagination to Payment History

Show **10 rows** per page in the Payment History table. Add pagination controls below using the existing `Pagination` UI components.

**Implementation**: Add `currentPage` state, slice `completedPayments` to show `(page-1)*10` through `page*10`, render `Pagination` / `PaginationContent` / `PaginationPrevious` / `PaginationNext` / `PaginationItem` below the table.

## Files Changed

| File | Change |
|------|--------|
| `AdminInstructorPayments.tsx` | Remove search bar + state + filters; remove stats cards component usage (replace with single inline "Total Payroll" card or keep just that one); add pagination state + controls to Payment History |
| `InstructorPaymentStatsCards.tsx` | Remove file or simplify to single card |
| `InstructorPaymentSearch.tsx` | Remove file (no longer used) |
| `useInstructorPayments.ts` | Simplify stats to only pending total |

