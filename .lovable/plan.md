

# Separate Student Progress Skills from Curriculum

## Problem

The current system conflates two different concepts:
- **Curriculum**: A reference overview of what's taught at each level (modules + lessons). Already correct on all sides.
- **Student Progress Skills**: Trackable skills per level that the admin creates, the instructor sees and updates proficiency on, and the student sees as their progress.

Currently, the instructor side uses **hardcoded** module/lesson arrays (lines 124-175 of `InstructorStudents.tsx`) rather than pulling from the database. The admin has no dedicated interface to manage progress skills separately from curriculum.

## Plan

### 1. Create a new `progress_skills` database table

A new table to store admin-defined skills per level:

```
progress_skills
  - id (uuid, PK)
  - name (text, NOT NULL) -- e.g. "Beat Juggling", "Double Click Flare"
  - level (text, NOT NULL) -- novice, amateur, intermediate, advanced
  - description (text, nullable)
  - order_index (integer, default 0)
  - created_at, updated_at (timestamps)
```

Add RLS policies for admin full access, instructor/student read access. The existing `student_progress` table continues to store per-student proficiency, but `skill_name` will reference these admin-defined skills.

### 2. Add "Skills Management" section to Admin

Add a new admin page or a new tab/section within the existing admin area. Given the nav already has "Curriculum" and "Progress Overview", the cleanest approach is a new nav item **"Skills"** between Curriculum and Progress Overview.

**New page: `AdminSkills.tsx`**
- Tabbed by level (Novice / Amateur / Intermediate / Advanced)
- Each tab shows a list of skills for that level
- Admin can add, edit, reorder, and delete skills
- Simple card/list UI similar to curriculum but focused on skill names

**Files**: New `src/pages/admin/AdminSkills.tsx`, new route in `App.tsx`, new nav item in `AdminNavigation.tsx`

### 3. Create hooks for skill management

- `useProgressSkills.ts` -- fetch skills, optionally filtered by level
- `useCreateProgressSkill.ts` -- insert new skill
- `useUpdateProgressSkill.ts` -- update skill
- `useDeleteProgressSkill.ts` -- delete skill

### 4. Update Instructor Students page to use database skills

Replace the hardcoded `curriculumModules` array (lines 124-175) with a query to `progress_skills` filtered by the student's level. The instructor sees skills relevant to each student's current level and can update proficiency via the existing `student_progress` table, using the skill name from `progress_skills`.

**File**: `src/pages/instructor/InstructorStudents.tsx`

### 5. Update Student Progress page to display skills by level

The student progress page already reads from `student_progress` table. No major change needed -- it will continue showing whatever skills have proficiency entries. The skill names will now match the admin-defined skills.

**File**: `src/pages/student/StudentProgress.tsx` (minor, if any changes)

### 6. Update the Curriculum page banner

Change the existing info banner on `AdminCurriculum.tsx` to clarify that curriculum is a reference guide only, and that trackable skills are managed separately in the Skills section.

**File**: `src/pages/admin/AdminCurriculum.tsx`

## Summary of changes

| Area | What changes |
|------|-------------|
| Database | New `progress_skills` table with RLS |
| Admin nav | New "Skills" nav item |
| New page | `AdminSkills.tsx` -- CRUD for skills per level |
| New hooks | 4 hooks for progress skill management |
| Instructor | Replace hardcoded modules with DB skills query |
| Admin Curriculum | Update info banner text |
| Routing | Add `/admin/skills` route |

