I found the mismatch: the dashboard’s “Today’s Students” table is using a separate fetch/format path from the “Today’s Attendance” widget. The attendance widget is showing the correct students for the day, but the dashboard table can still end up with only one because it filters/derives its own `students` array separately.

Plan:

1. Make Today’s Attendance the source of truth on the instructor dashboard
   - In `src/pages/instructor/InstructorDashboard.tsx`, use `useInstructorAttendance(instructorId)` directly for the dashboard page.
   - Build the “Today’s Students” table from `todayStudents` returned by that hook, so it matches the exact list displayed in the “Today’s Attendance” module.

2. Preserve progress/notes/profile formatting from the existing dashboard data
   - Keep the dashboard hook’s per-student progress data where available.
   - Merge attendance-hook students with dashboard-hook students by `studentId` so the table still shows progress, level, avatar, initials, notes status, and class time.
   - If a student is present in attendance but missing from dashboard progress data, show them with safe defaults instead of dropping them.

3. Fix the top stat so it communicates the correct count
   - The “Today’s Classes” stat currently counts unique class time slots, so two students in the same time slot display as `1` class today.
   - Update the stat text to avoid confusion by adding/using the actual today student count, e.g. `2 students today`, while preserving the existing class/session count if needed.

4. Keep demo mode behavior intact
   - Demo mode will continue to use `mockInstructorDashboard` data.
   - Live mode will use the attendance hook for the day-specific student list/count.

5. Verify with the current data pattern
   - The database currently shows DJ Stylistic has two active Thursday students at `5:30 PM - 7:00 PM`, which explains why “Today’s Classes” can say `1` while today’s attendance lists two students.
   - After the change, the “Today’s Students” module should list both students, matching the attendance module.