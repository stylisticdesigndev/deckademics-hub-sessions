

# Fix Level Redundancy on Student Dashboard

## Problem
The student's level is shown twice:
1. In the welcome header: "You're at **Intermediate** level."
2. In the stats card grid (the bordered box with the Award icon)

## Fix

**File: `src/pages/student/StudentDashboard.tsx`** (lines 106-108)

Change the subtitle from showing the level to showing the student's assigned instructor:

```
You're at Intermediate level.
```
becomes:
```
Your instructor: [Instructor Name]
```

Use `studentData.instructor` which is already available (it comes from `useStudentDashboardCore` and shows the instructor name or "Not assigned").

