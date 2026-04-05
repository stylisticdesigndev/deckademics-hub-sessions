

# Fix Skills Not Reflecting Across Views

## Problem

The student progress page (`/student/progress`) reads directly from the `student_progress` table, which contains a mix of:
- **Curriculum lesson completions** (e.g., "Advanced Mixing - Creative Transitions") -- written when instructors toggle lesson checkboxes
- **Admin-defined skill assessments** (e.g., "Beat Juggling") -- written when instructors update skill proficiency

The student page shows ALL of these indiscriminately, instead of only showing the admin-defined skills from `progress_skills`. The instructor side already correctly separates these two concepts (skills vs. curriculum modules), but the student side does not.

## Solution

Refactor `StudentProgress.tsx` to match the instructor-side pattern:

1. **Fetch the student's level** from the `students` table
2. **Fetch admin-defined skills** from `progress_skills` filtered by the student's level
3. **Fetch student_progress records** and match them against admin-defined skill names only
4. **Display two separate sections**: Skills (from `progress_skills`) and Curriculum Modules (from `curriculum_modules` + `curriculum_lessons`)
5. **Overall progress** calculated only from admin-defined skill proficiencies (not curriculum completions)

## Files to edit

| File | Change |
|------|--------|
| `src/pages/student/StudentProgress.tsx` | Rewrite data fetching to use `progress_skills` for the skills section; add curriculum module progress section; filter `student_progress` to only match admin-defined skill names |
| `src/hooks/student/dashboard/useStudentProgress.ts` | Update to join against `progress_skills` so dashboard widgets also show correct data |

## Detail

### `StudentProgress.tsx` changes
- Fetch student's level from `students` table using `userId`
- Fetch `progress_skills` filtered by that level
- Fetch `student_progress` for the student
- Match: for each `progress_skills` entry, find the corresponding `student_progress` row by `skill_name`
- Display skills with their proficiency (0% if no matching record)
- Separately fetch `curriculum_modules` and `curriculum_lessons` for the student's level, and show lesson completion status (checked off via `student_progress` entries like "Module - Lesson")
- Overall progress = average of admin-defined skill proficiencies only

### `useStudentProgress.ts` (dashboard hook) changes
- Same filtering: only include `student_progress` rows whose `skill_name` matches an entry in `progress_skills` for the student's level
- This fixes the dashboard progress ring and skill breakdown chart

