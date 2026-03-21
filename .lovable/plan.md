

# Fix: Dashboard Showing Empty State Instead of Visual Charts

## Root Cause

Line 93 in `StudentDashboard.tsx`:
```js
const showEmptyState = isEmpty || isFirstTimeUser;
```

`isFirstTimeUser` is `true` when there are no upcoming classes AND no progress data. `isEmpty` is `true` when there are no announcements AND no upcoming classes. Both conditions trigger `<EmptyDashboard />`, hiding the visual charts entirely.

The visual chart components (OverallProgressRing, SkillBreakdownChart, AttendanceChart) already have their own "no data yet" empty states built in -- they should always render.

## Fix

**File: `src/pages/student/StudentDashboard.tsx`**
- Remove the `showEmptyState` conditional entirely
- Always render the chart layout (stats, progress ring, skill breakdown, attendance, etc.)
- The individual chart components already handle zero/empty data gracefully with placeholder visuals

This is a single-line logic change -- remove the ternary that gates the charts behind `showEmptyState`.

