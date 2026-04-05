

# Fix Instructor View Details + Deactivation Flow + Admin Skill Management

## Issues Found

1. **"View Details" does nothing**: The `viewInstructor` function sets `viewInstructorId` state, but no Sheet/Dialog reads that state to render anything. The button is a dead end.

2. **Deactivating an instructor with students**: Currently the deactivation dialog is a simple "Are you sure?" confirmation with no mention of what happens to the instructor's assigned students. Students remain orphaned (still pointing to the now-inactive instructor).

3. **Admin skill management**: The Curriculum page (`/admin/curriculum`) already lets the admin create modules and lessons per level. These lessons ARE the skills -- the student progress system maps `student_progress.skill_name` to `"Module Name - Lesson Title"`. However, there is no direct UI on the admin side to view/update individual student proficiency values for those skills. The instructor does this from their Students tab. The admin currently has the Progress Overview page but it's read-only summary data.

## Plan

### Step 1 -- Replace "View Details" with a useful detail Sheet

Replace the non-functional Eye button with a Sheet that opens when clicked, showing:
- Instructor name, email, status, hourly rate, years of experience, specialties, bio
- List of currently assigned students (reuse the same query pattern from `useStudentAssignment`)
- Quick action buttons: Assign Students, Deactivate, Message

This makes "View Details" actually functional and useful.

**Files changed**: `src/pages/admin/AdminInstructors.tsx` -- add a `<Sheet>` component controlled by `viewInstructorId`

### Step 2 -- Improve deactivation flow for instructors with students

When deactivating an instructor who has assigned students:
- Before confirming, fetch and display the list of students assigned to that instructor
- Show a warning: "This instructor has X students assigned. Their students will become unassigned."
- On confirm, unassign all students (set `instructor_id = null`) then deactivate the instructor

This prevents orphaned student-instructor relationships.

**Files changed**: 
- `src/pages/admin/AdminInstructors.tsx` -- update `DeactivateInstructorDialog` to fetch assigned students and unassign them on confirm
- `src/hooks/useAdminInstructors.ts` -- add a `deactivateAndUnassign` mutation that first nulls out `instructor_id` on affected students, then sets instructor status to inactive

### Step 3 -- Clarify admin skill management (Curriculum page)

The Curriculum page at `/admin/curriculum` is already where the admin creates modules and lessons (skills) per level. These are the same skills that appear on instructor and student sides. No new page is needed.

Add a brief explanatory note/banner to the Curriculum page making this connection clear: "Lessons created here appear as trackable skills on instructor and student dashboards. Instructors can then set proficiency percentages for each student."

**Files changed**: `src/pages/admin/AdminCurriculum.tsx` -- add an informational `Alert` below the header explaining the curriculum-to-skills relationship

