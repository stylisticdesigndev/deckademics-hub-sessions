## Goal

Three small, related polish updates so the DJ name is consistently primary for instructors, and the student profile shows complete enrollment info.

## 1. Student Profile → Enrollment Details: add Classroom

File: `src/pages/student/StudentProfile.tsx`

- The Course grid already shows Level, Status, Class Day, Class Time, Start Date.
- Add a new "Classroom" cell pulling from `studentData?.class_room` (column already exists on `students`). In demo mode, show a sample value like "Classroom 1".
- Place it next to Class Time so the schedule reads: Class Day → Class Time → Classroom. Keep Start Date on its own full-width row.

No DB change required — `class_room` is already selected via `select('*')`.

## 2. Student Profile → Instructor Dialog: show DJ name + legal name

File: `src/pages/student/StudentProfile.tsx` (instructor dialog block, lines ~454-470)

- The instructor object already includes `dj_name` (fetched on line 122).
- Update the dialog header so it shows:
  - Primary line (large, semibold): the DJ name (fallback to "First Last" if no DJ name).
  - Secondary line (small, muted): "First Last" legal name (only shown when a DJ name exists, so we don't duplicate).
- Update the avatar fallback initials to prefer DJ name initials, falling back to legal-name initials (mirrors the trigger button logic on lines 414-421).

This is the only place students see the instructor's legal name, matching the existing rule.

## 3. Instructor side: use DJ name as the in-app username

The instructor's own first/last name still appears in two chrome spots. Switch both to use `getInstructorDisplayName` (already exists in `src/utils/instructorName.ts`):

a. **Sidebar footer** — `src/components/navigation/SidebarUserFooter.tsx`
- When `userType === 'instructor'`, derive `fullName` and `initials` from `profile.dj_name` first, then fall back to first/last. Student and admin behavior unchanged.

b. **Dashboard welcome** — `src/components/instructor/dashboard/WelcomeSection.tsx`
- Replace the `getInstructorName` helper to prefer `userData.profile.dj_name` (and `session.user.user_metadata.dj_name` as a session fallback) before first/last name.
- Result: "Welcome, DJ Stagename".

Spot-checked the other instructor pages (`InstructorProfile`, `InstructorMessages`, `InstructorClasses`, etc.) — they already either show the editable `dj_name` field, or they display student names (not the instructor's own name), so no change is needed there.

## Out of scope / no DB changes

- No migration needed. `dj_name` already exists on `profiles`, and `class_room` already exists on `students`.
- `getInstructorDisplayName` utility already exists and is reused.
