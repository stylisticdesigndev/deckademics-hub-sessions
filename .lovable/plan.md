

# Remove Redundant Level Badge from Curriculum Module Cards

## Problem
Each curriculum module card shows a purple "intermediate" (or other level) badge chip next to the title. This is redundant since the student is already viewing that level's tab.

## Fix

Remove the `<Badge variant="secondary">{module.level}</Badge>` from module cards in:

1. **`src/pages/student/StudentCurriculum.tsx`** — Remove the Badge from the module card header
2. **`src/pages/instructor/InstructorCurriculum.tsx`** — Same removal
3. **`src/pages/admin/AdminCurriculum.tsx`** — Same removal (in the display cards, keep it in edit forms where it's functional)

Also remove unused `Badge` imports if no other badges remain in those files.

