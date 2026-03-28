

# Fix Progress Tab Checkbox Toggle + Confirm Curriculum Linkage

## Your Understanding is Correct

Yes — the Progress section directly reflects the admin's curriculum. When an admin adds or removes modules/lessons in the Curriculum page, the Progress tab automatically shows the updated list because it reads from `curriculum_modules` and `curriculum_lessons` in real time.

## Why Checkboxes Don't Work

There is a **skill_name format mismatch** between saving and reading:

- **When toggling** (in `InstructorStudents.tsx`), the skill is saved as: `"Module Name - Lesson Title"`
- **When loading** (in `useInstructorStudentsSimple.ts`), it checks: `studentSkills.has(lesson.title)` — just the bare lesson title

These will never match, so checkboxes always appear unchecked, and clicking them saves data that is never recognized on reload.

## Fix

### File: `src/hooks/instructor/useInstructorStudentsSimple.ts`

Change line 189 from:
```typescript
completed: studentSkills.has(l.title),
```
to:
```typescript
completed: studentSkills.has(`${mod.title} - ${l.title}`),
```

This matches the `"${moduleName} - ${lessonTitle}"` format used by `toggleLessonCompletion` when saving to `student_progress.skill_name`.

### One file changed, one line fix.

## Technical Details
- The `student_progress` table stores `skill_name` as `"Module Name - Lesson Title"` (set on line 592 of InstructorStudents.tsx)
- The hook's `progressSkillsByStudent` Set contains these full compound names
- The check just needs to use the same compound format when looking up completion status

