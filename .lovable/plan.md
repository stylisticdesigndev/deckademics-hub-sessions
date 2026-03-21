

# Fix "Present" Legend to Match Calendar Style

## Problem
In the calendar, "present" days appear as circles with a green outline (border), but the legend shows a filled green circle. They should match.

## Fix

**File: `src/components/student/classes/AttendanceCalendar.tsx`**

1. **Update the present modifier style** (line 36-40): Change from a filled green background to a green border outline with transparent background, matching the `day_today` style pattern.

2. **Update the legend indicator** (line 110): Change from a filled green circle to an outlined green circle using `border` instead of `backgroundColor`.

Both changes ensure the legend visually matches what the user sees on the calendar for present/today dates.

