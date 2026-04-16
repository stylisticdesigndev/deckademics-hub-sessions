

## Build: Instructor Attendance Management

### Problem
Instructors have no way to mark student attendance. The `attendance` table exists and the student side reads from it, but there's no instructor UI to create/update records. The attendance memory doc confirms "daily attendance is managed by instructors" but the feature was never built.

### Approach
Add a dedicated **Attendance** page for instructors at `/instructor/attendance`. This is the most natural place — a separate nav item rather than burying it inside the Students or Classes page.

The page shows the instructor's assigned students grouped by today's class day, letting them mark each student as **Present** or **Absent** for the current week's class date. It also shows a history view of past weeks.

### Changes

**1. New file: `src/pages/instructor/InstructorAttendance.tsx`**
- Header: "Attendance" with muted subtitle
- Current week section: shows students whose `class_day` matches today or the upcoming class day this week
- Each student row: avatar, name, level, class day/time, and Present/Absent toggle buttons
- On click, upserts into the `attendance` table (`student_id`, `class_id`, `date`, `status`)
- Past weeks section: collapsible or tabbed view showing recent attendance history (last 4-8 weeks) with status badges
- Demo mode toggle (consistent with other instructor pages)
- Uses the `unmarked` concept: dates with no record show as "Not Recorded" (gray), matching the student side

**2. New file: `src/hooks/instructor/useInstructorAttendance.ts`**
- Fetches all students assigned to this instructor (reuses pattern from `useInstructorStudentsSimple`)
- Fetches attendance records from the `attendance` table for these students
- Provides `markAttendance(studentId, date, status)` mutation that upserts into the `attendance` table
- Generates weekly date list per student based on their `class_day`

**3. Update: `src/components/navigation/InstructorNavigation.tsx`**
- Add "Attendance" nav item with `ClipboardCheck` icon, positioned after "Classes"

**4. Update: `src/App.tsx`**
- Import `InstructorAttendance` and add route `/instructor/attendance` inside the instructor layout

### Attendance marking logic
- Instructor sees their students for the current week's class date
- If no `attendance` record exists for that student+date, it shows as "unmarked" (neutral/gray)
- Clicking Present or Absent upserts a row in the `attendance` table
- This is the same table the student side reads from, so changes appear immediately on the student's Classes page
- No new database tables or migrations needed — uses existing `attendance` table

### UI layout sketch
```text
┌─────────────────────────────────────────┐
│ Attendance                              │
│ Mark and review student attendance      │
├─────────────────────────────────────────┤
│ This Week               [Demo toggle]  │
├─────────────────────────────────────────┤
│ Monday, April 13                        │
│ ┌─ Avatar  John Doe  Novice  ○ ● ───┐ │
│ │          3:30-5:00  [Present][Absent]│ │
│ └────────────────────────────────────┘ │
│ ┌─ Avatar  Jane Smith  Amateur ○ ● ─┐ │
│ │          3:30-5:00  [Present][Absent]│ │
│ └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Wednesday, April 15                     │
│ ┌─ Avatar  Bob Lee  Intermediate ────┐ │
│ │          5:30-7:00  [Present][Absent]│ │
│ └────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Past Weeks  [▾ Expand]                  │
│ Week of Apr 7 / Week of Mar 31 / ...   │
└─────────────────────────────────────────┘
```

### Files
| File | Action |
|------|--------|
| `src/pages/instructor/InstructorAttendance.tsx` | Create |
| `src/hooks/instructor/useInstructorAttendance.ts` | Create |
| `src/components/navigation/InstructorNavigation.tsx` | Edit — add nav item |
| `src/App.tsx` | Edit — add route |

