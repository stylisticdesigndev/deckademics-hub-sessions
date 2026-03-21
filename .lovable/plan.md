

# Fix Attendance Calendar Legend Alignment

## Problem
The legend uses `flex flex-wrap gap-3` with 4 items (Present, Absent, Upcoming, Today). At narrow widths, 3 items fit on the first row and 1 orphan wraps to a second row alone, creating an awkward visual.

## Fix

**File: `src/components/student/classes/AttendanceCalendar.tsx`**

Change the legend from `flex flex-wrap gap-3` to a 2x2 grid layout using `grid grid-cols-2 gap-x-6 gap-y-2`. This ensures the 4 legend items are always evenly distributed in two rows of two, regardless of container width.

