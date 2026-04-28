# Fix Today's Attendance mobile layout

## Problem
On mobile (393px), the Today's Attendance card in the instructor dashboard crams the avatar, name, level/time text, status badge, and two action buttons (Present/Absent) into a single horizontal row. This squeezes the time text into a sliver, causing it to wrap vertically ("5:30\nPM\n-\n7:00\nPM"), and the status badge visually overlaps the text.

## Fix
Restructure the card in `src/components/instructor/dashboard/TodayAttendanceSection.tsx` into a stacked, responsive layout:

1. **Top row**: Avatar + name + level/time text + status badge (right-aligned).
   - Keep level and class time on one line, but allow it to truncate cleanly instead of being crushed.
   - Status badge sits on the right of the identity row, not jammed next to buttons.
2. **Bottom row**: Present / Absent buttons span full width side-by-side (`grid grid-cols-2 gap-2`), giving comfortable tap targets on mobile.
3. On `sm:` and larger screens, restore the inline single-row layout (identity left, badge + buttons right) so desktop stays compact.

No data, hook, or behavior changes — purely presentational/responsive markup.

## Files
- `src/components/instructor/dashboard/TodayAttendanceSection.tsx`
