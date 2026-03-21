

# Differentiate "Present" and "Today" in Attendance Calendar

## Problem
"Present" (green outline circle) and "Today" (primary border circle) look too similar — both are outline-style circles, making them hard to distinguish.

## Solution
Change "Present" from an outline circle to a **filled green circle** (solid green background with white text). This clearly separates it from "Today," which remains an outline/border style.

Add "Today" to the legend so all visual indicators are documented.

## Changes

**File: `src/components/student/classes/AttendanceCalendar.tsx`**

1. **Present modifier style** (lines 36-41): Change from green border/transparent background to solid green fill with white text
2. **Today class** (line 102): Keep as-is (border outline style) — already distinct as a thin primary-colored border
3. **Legend** (lines 109-122): 
   - Update "Present" indicator to a filled green circle
   - Add a 4th legend item: "Today" with a circle matching the `day_today` style (thin primary border, no fill)

