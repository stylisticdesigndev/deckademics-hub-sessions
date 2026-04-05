
Fix the instructor student details view so it matches the Skills-only flow already used elsewhere.

1. Update the tab label in `src/pages/instructor/InstructorStudents.tsx`
- Change the visible tab text from `Progress` to `Skills`
- Keep the internal tab value as-is unless a rename is needed for clarity, to minimize risk

2. Remove curriculum from this page
- Delete the curriculum section currently rendered under the same tab (`detailedStudent.moduleProgress`)
- Keep curriculum tracking on the dedicated Curriculum page, not inside the student details modal
- Replace the current generic empty state with a skills-specific one if no skills exist yet

3. Clean up curriculum-only UI logic in `src/pages/instructor/InstructorStudents.tsx`
- Remove module-progress state, dialog wiring, and handlers that are only used by the curriculum block
- Remove lesson checkbox / lesson note controls from this page if they are no longer rendered anywhere in the modal

4. Align the data for this screen in `src/hooks/instructor/useInstructorStudentsSimple.ts`
- Stop preparing `moduleProgress` for the instructor students page if it is no longer displayed
- Stop falling back to module-based progress for this screen
- Keep this page driven by admin-defined `progress_skills` plus matching `student_progress` records so it stays consistent with admin and student flows

Files to update
- `src/pages/instructor/InstructorStudents.tsx`
- `src/hooks/instructor/useInstructorStudentsSimple.ts`

Expected result
- The tab reads `Skills`
- Curriculum no longer appears on this page
- Instructor-side skill data matches the admin-defined Skills system
