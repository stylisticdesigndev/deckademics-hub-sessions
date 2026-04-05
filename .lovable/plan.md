

# Redesign Schedule Editor as a Grid

## Problem
The current schedule editor requires adding days one at a time via "Add Teaching Day" button, selecting the day from a dropdown, then checking slots. Too many steps.

## Solution
Replace the entire schedule dialog content with a single grid/table showing all 7 days (Monday-Sunday) as rows and all 3 class slots as columns. Each cell is a checkbox. Admin just clicks the checkboxes for the slots that instructor teaches. One screen, no add/remove buttons needed.

```text
              3:30-5:00   5:30-7:00   7:30-9:00
Monday          [x]         [x]         [ ]
Tuesday         [ ]         [x]         [x]
Wednesday       [x]         [ ]         [ ]
Thursday        [ ]         [ ]         [ ]
Friday          [x]         [x]         [x]
Saturday        [ ]         [ ]         [ ]
Sunday          [ ]         [ ]         [ ]
```

## Implementation

### File: `src/pages/admin/AdminInstructorPayments.tsx`

**Schedule state change**: Replace `scheduleItems` array with a simpler grid state, or keep the same data format but render it differently. On dialog open, convert existing `scheduleItems` (array of `{day, hours}`) into a lookup map. On save, convert the grid back to the array format for the database.

**Replace the schedule dialog body** (lines 879-896): Remove the `ScheduleRowEditor` loop and "Add Teaching Day" button. Replace with a compact table:
- 7 rows (Mon-Sun), 3 columns (the 3 slots)
- Each cell is a `Checkbox`
- Toggling a checkbox updates the internal state
- Widen dialog slightly to fit the grid

**Save logic** stays the same -- `handleSaveSchedule` already deletes all rows and re-inserts. We just need to convert the grid state back to `{day, hours}[]` format (only include days that have at least one slot checked).

### File: `src/components/instructor/ScheduleRowEditor.tsx`
No changes needed -- it won't be used in the admin dialog anymore. It can remain for the instructor's own profile editor if desired.

### File: `src/utils/scheduleHours.ts`
No changes -- it already parses comma-separated time ranges.

## Summary

| File | Change |
|------|--------|
| `AdminInstructorPayments.tsx` | Replace schedule dialog body with a 7-day x 3-slot checkbox grid |

