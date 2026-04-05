

# Sync Instructor & Student Sides with Admin Changes

After reviewing all the changes made on the admin side, here are the issues that need fixing on the instructor and student sides.

## Issues Found

### 1. Inconsistent date formatting (2 files)
Two files still use non-standard date formats instead of the shared `formatDateUS`/`formatDateTimeUS` utilities:

- **`src/components/student/classes/ClassAttendanceCard.tsx`**: Uses `format(date, 'EEEE, MMM d, yyyy')` and `format(date, 'EEEE, MMM d')` instead of `formatDateUS`
- **`src/pages/admin/AdminAttendance.tsx`**: Defines its own local `formatDateUS` function instead of importing the shared one from `src/lib/utils`

### 2. Student level naming mismatch
The admin payment system uses school-specific levels: **Novice, Amateur, Intermediate, Advanced**. But several files on the student and instructor side default to `'Beginner'` or `'beginner'` which doesn't match any of the school's actual levels.

Files affected:
- `src/hooks/student/useStudentDashboardCore.ts` -- defaults to `'Beginner'`
- `src/hooks/instructor/useInstructorDashboard.ts` -- defaults to `'Beginner'`
- `src/hooks/instructor/useInstructorStudentsSimple.ts` -- defaults to `'beginner'`
- `src/hooks/useAdminStudents.ts` -- defaults to `'beginner'`
- `src/hooks/useAdminProgress.ts` -- defaults to `'beginner'`
- `src/hooks/useStudentAssignment.ts` -- defaults to `'beginner'`

The DB default for `students.level` is `'novice'`, so all fallback defaults should be `'Novice'` (or `'novice'`) to align with the school's terminology.

### 3. No other architectural gaps
- Instructor dashboard fetches student data using `students → profiles` join (same two-step pattern isn't needed here because `students.id` references `profiles.id` directly via `!inner` and there's no FK ambiguity like with `payments`)
- Student progress, attendance, classes pages all query data correctly
- The `useAdminPayments` two-step fetch pattern is working and doesn't affect student/instructor read paths (students see their own payments via RLS)

## Plan

| File | Change |
|------|--------|
| `src/components/student/classes/ClassAttendanceCard.tsx` | Replace `format(date, 'EEEE, MMM d, yyyy')` with `formatDateUS(date)` and dialog title date similarly |
| `src/pages/admin/AdminAttendance.tsx` | Remove local `formatDateUS`, import from `@/lib/utils` |
| `src/hooks/student/useStudentDashboardCore.ts` | Change default `'Beginner'` → `'Novice'` (2 places) |
| `src/hooks/instructor/useInstructorDashboard.ts` | Change default `'Beginner'` → `'Novice'` |
| `src/hooks/instructor/useInstructorStudentsSimple.ts` | Change default `'beginner'` → `'novice'` (2 places) |
| `src/hooks/useAdminStudents.ts` | Change default `'beginner'` → `'novice'` (2 places) |
| `src/hooks/useAdminProgress.ts` | Change default `'beginner'` → `'novice'` |
| `src/hooks/useStudentAssignment.ts` | Change default `'beginner'` → `'novice'` |

All changes are small string replacements and import additions. No database changes needed.

