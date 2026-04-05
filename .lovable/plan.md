

# Instructor Payments Improvements

## Problems to solve
1. **Schedule setup is too manual** -- admin types free-text time ranges. The school has 3 fixed class slots Mon-Fri.
2. **Instructor name not showing** in the Current Pay Period table (likely empty string from profiles join).
3. **Bonus payments are separate rows** -- admin wants to attach a bonus to an existing class payment row instead of creating a standalone bonus record.
4. **No delete** -- admin can't remove a pending payment if created by mistake.

## Plan

### 1. Preset class time slots in Schedule Editor

Replace the free-text "Hours" input in `ScheduleRowEditor.tsx` with a multi-select of the school's 3 fixed class slots:
- **3:30 PM - 5:00 PM** (1.5 hrs)
- **5:30 PM - 7:00 PM** (1.5 hrs)
- **7:30 PM - 9:00 PM** (1.5 hrs)

Each day can have 1-3 slots selected. Store them as a comma-separated string in the `hours` column (e.g., `"3:30 PM - 5:00 PM, 5:30 PM - 7:00 PM"`). Update `parseHoursDuration` in `scheduleHours.ts` to handle multiple comma-separated time ranges by splitting and summing.

Also limit day options to Monday-Friday only (remove Saturday/Sunday from the weekdays array for this context).

**Files**: `src/components/instructor/ScheduleRowEditor.tsx`, `src/utils/scheduleHours.ts`

### 2. Fix instructor name not showing

The `useInstructorPayments.ts` hook joins `instructors.profiles` but the join returns an object (not array) when using a singular FK relation. The code accesses `profiles?.[0]` which may fail. Fix to handle both array and object shapes, and add a fallback to look up the name from the instructors list if the join returns empty.

**File**: `src/hooks/useInstructorPayments.ts`

### 3. Add bonus amount to existing pending payment row

Instead of creating a separate bonus payment record, add an "Add Bonus" button to each pending class payment row in the Current Pay Period table. Clicking it opens a small dialog to enter a bonus amount and description. This updates the existing payment record by adding a `bonus_amount` and `bonus_description` column to `instructor_payments`.

The total displayed becomes `class amount + bonus amount`. The row shows both the class amount and bonus as a combined total with a note.

**Database migration**: Add `bonus_amount numeric default 0` and `bonus_description text` columns to `instructor_payments`.

**Files**: `AdminInstructorPayments.tsx` (add bonus dialog per row, update display), `useInstructorPayments.ts` (fetch new columns, compute combined total)

### 4. Add delete button for pending payments

Add a delete (trash) icon button to each row in the Current Pay Period table with a confirmation dialog. Uses a simple `supabase.from('instructor_payments').delete().eq('id', paymentId)`.

**File**: `src/pages/admin/AdminInstructorPayments.tsx`

## Summary

| Area | Change |
|------|--------|
| DB migration | Add `bonus_amount`, `bonus_description` to `instructor_payments` |
| `ScheduleRowEditor.tsx` | Replace free-text hours with checkbox slots for the 3 class times, Mon-Fri only |
| `scheduleHours.ts` | Handle comma-separated time ranges |
| `useInstructorPayments.ts` | Fix name join, fetch bonus columns |
| `AdminInstructorPayments.tsx` | Add per-row "Add Bonus" and "Delete" buttons, update total display |

