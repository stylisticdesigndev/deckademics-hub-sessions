

# Update Curriculum Levels to Four Tiers

## Current State

The curriculum pages use three levels: **Beginner**, **Intermediate**, **Advanced**. The student table uses **Novice**, **Intermediate**, **Advanced**. Your school actually has four levels: **Novice**, **Amateur**, **Intermediate**, **Advanced**.

The `curriculum_modules` database table has a CHECK constraint limiting levels to `('beginner', 'intermediate', 'advanced')`.

## Changes Required

### 1. Database Migration
- Alter the `curriculum_modules` table CHECK constraint to allow four values: `'novice', 'amateur', 'intermediate', 'advanced'`
- Update any existing `'beginner'` rows to `'novice'` (since Novice is the entry level)

### 2. Update Type Definitions
- **`src/hooks/useCurriculumModules.ts`** — Change level type to `'novice' | 'amateur' | 'intermediate' | 'advanced'`
- **`src/hooks/useCreateCurriculumModule.ts`** — Same type update
- **`src/hooks/useUpdateCurriculumModule.ts`** — Same type update
- **`src/hooks/useUpdateStudentLevel.ts`** — Add `'amateur'` to `StudentLevel` type and display/value maps

### 3. Update Student Curriculum Page
- **`src/pages/student/StudentCurriculum.tsx`** — Change tabs from 3 to 4: Novice, Amateur, Intermediate, Advanced. Update the level array and `grid-cols-3` to `grid-cols-4`.

### 4. Update Admin Curriculum Page
- **`src/pages/admin/AdminCurriculum.tsx`** — Same tab changes (4 tabs), update Select dropdown options in module create/edit dialogs to include all four levels.

### 5. Update Instructor Curriculum Page
- **`src/pages/instructor/InstructorCurriculum.tsx`** — Same tab changes (4 tabs).

### 6. Update Student Progress Page
- **`src/pages/student/StudentProgress.tsx`** — Update the "Getting Started" card to show four level tiers instead of three.

