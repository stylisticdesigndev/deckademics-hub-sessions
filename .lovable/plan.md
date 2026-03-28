

# Match Student Levels to Curriculum Levels

## Problem
The curriculum uses 4 levels: **Novice, Amateur, Intermediate, Advanced**. But the student management pages (both instructor and admin) only show 3 levels: **Beginner, Intermediate, Advanced** — missing "Amateur" entirely and using "Beginner" instead of "Novice."

The `useUpdateStudentLevel.ts` hook already has the correct 4-level system with proper mappings, but the UI dropdowns and badge colors don't match.

## Changes

### 1. `src/pages/instructor/InstructorStudents.tsx`
- Update all level filter/select dropdowns from `beginner/intermediate/advanced` to `novice/amateur/intermediate/advanced`
- Update `studentsByLevel` grouping to use all 4 levels: Novice, Amateur, Intermediate, Advanced
- Update all badge color mappings to cover 4 levels (novice=green, amateur=yellow, intermediate=blue, advanced=purple)
- Update the level edit dropdown in the student detail modal to show all 4 levels

### 2. `src/pages/admin/AdminStudents.tsx`
- Update the level select dropdown from `beginner/intermediate/advanced` to `novice/amateur/intermediate/advanced`

### 3. `src/hooks/instructor/useInstructorStudentsSimple.ts`
- Remove the `beginner → novice` normalization hack since levels will now be stored correctly
- Keep the lowercase normalization for safe comparison

These changes align all student-facing level UI with the curriculum's 4-tier system.

