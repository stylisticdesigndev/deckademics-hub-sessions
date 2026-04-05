

# Allow Admin to Manage Instructor Schedules

## Problem
The "Generate Pay Period" button shows "No payments to generate" because the `instructor_schedules` table is empty. Currently, only instructors can set their own schedule via their profile page. If they haven't done so, the admin has no way to generate automated payments.

## Solution
Add the ability for the admin to view and edit instructor schedules directly from the **Admin Instructor Payments** page (or the Instructors page). This way the admin can ensure schedules are configured before generating pay periods.

## Changes

### 1. Add "Set Schedule" button to the Instructor Rates table
In `AdminInstructorPayments.tsx`, add a "Set Schedule" action button next to each instructor's "Update Rate" button. Clicking it opens a dialog with the existing `ScheduleRowEditor` component (already built) to add/edit day + hours rows.

### 2. Save schedules from admin side
Reuse the save logic from `useScheduleActions.ts` -- delete existing schedule rows for that instructor and insert the new ones into `instructor_schedules`.

### 3. Load existing schedules when opening the dialog
Fetch from `instructor_schedules` where `instructor_id` matches, and pre-populate the editor.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminInstructorPayments.tsx` | Add "Set Schedule" button per instructor row, schedule editor dialog, fetch/save logic |

No database changes needed -- the `instructor_schedules` table already exists with the right schema.

