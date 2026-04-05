

# Fix Instructor Payments Issues

## 1. "Failed to mark payment as paid" Error

**Root cause**: The `instructor_payments` table has a CHECK constraint that only allows status values: `'pending'`, `'completed'`, `'failed'`. But the code tries to set status to `'paid'`, which violates the constraint.

**Fix**: Database migration to update the check constraint to accept `'paid'` instead of (or in addition to) `'completed'`. We'll drop the old constraint and add a new one allowing `'pending'`, `'paid'`, `'failed'`.

## 2. Instructor Rates Button Alignment

**Root cause**: In the Instructor Rates table (line 595), the "Set Schedule" and "Update Rate" buttons are in a `TableCell` with `space-x-2` but no vertical alignment control. The buttons may wrap or misalign.

**Fix**: Wrap both buttons in a flex container with `items-center` and `justify-end` for consistent alignment within each row.

## Files Changed

| File | Change |
|------|--------|
| Migration SQL | Drop old `instructor_payments_status_check`, add new one allowing `'pending'`, `'paid'`, `'failed'` |
| `src/pages/admin/AdminInstructorPayments.tsx` | Wrap rate action buttons in a `flex items-center justify-end gap-2` container |

