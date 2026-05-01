# Fix Instructor Attendance Header Overflow on Mobile

## Problem

On mobile (390px), the Instructor Attendance page header places the title block and two action buttons ("Add Cover Session", "Demo") in a single horizontal row. The combined width exceeds the viewport, which forces the entire page to scroll sideways and pushes the Demo button off-screen.

## Fix

Restructure the header in `src/pages/instructor/InstructorAttendance.tsx` so that on small screens the title and the action buttons stack vertically, and the action buttons themselves wrap onto multiple lines if needed. On larger screens, keep the existing side-by-side layout.

Specifically:

- Change the outer header wrapper from `flex items-start justify-between` to a column-on-mobile, row-on-desktop layout (`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`).
- Allow the action button group to wrap (`flex flex-wrap items-center gap-2`) so "Add Cover Session" and "Demo" can sit on a second line if both don't fit.
- Add `min-w-0` to the title block so long subtitle text doesn't push siblings.

This keeps the page within the viewport width on mobile, eliminates the horizontal scroll, and preserves the current desktop appearance. No logic changes — the Demo button will be removed later as the user noted, and that future cleanup will not conflict with this layout fix.

## Files to edit

- `src/pages/instructor/InstructorAttendance.tsx` — header `<div>` block (around lines 110–130).
