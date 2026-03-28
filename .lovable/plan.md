

# Fix Blank Progress Tab — Populate moduleProgress Data

## Problem
The `useInstructorStudentsSimple` hook never fetches curriculum data. The `moduleProgress` field on each student is always `undefined`, so the Progress tab always shows "No progress data available."

## Root Cause
The hook fetches `student_progress` (skill proficiency scores) but never queries `curriculum_modules` or `curriculum_lessons`. The Progress tab UI expects structured module/lesson data with completion status — data that is never loaded.

## Solution

### File: `src/hooks/instructor/useInstructorStudentsSimple.ts`

Add two more queries to the existing `Promise.all` block:
1. `curriculum_modules` — fetch all modules, ordered by `order_index`
2. `curriculum_lessons` — fetch all lessons, ordered by `order_index`

Then, for each student, cross-reference their `student_progress` records against the curriculum to determine lesson completion. A lesson is considered "completed" if a `student_progress` row exists for that student with a matching `skill_name` equal to the lesson title (this is the pattern used by `toggleLessonCompletion` in InstructorStudents.tsx which inserts/deletes progress records keyed on lesson title).

Build the `moduleProgress` array per student:
- Filter modules by the student's `level`
- For each module, map its lessons and check completion
- Calculate module progress as `(completed lessons / total lessons) * 100`

### File: `src/pages/instructor/InstructorStudents.tsx`

Verify `toggleLessonCompletion` uses the same skill_name matching pattern. The existing code at ~line 584 already does this, so no changes needed here — just needs the data to flow in.

## What This Enables
- The Progress tab will show all curriculum modules matching the student's level
- Each module displays its lessons with checkboxes
- Instructors can toggle lesson completion and update module progress
- The "Update" button for manual percentage override will work

## Files Changed
1. `src/hooks/instructor/useInstructorStudentsSimple.ts` — add curriculum fetch + moduleProgress building logic

