

# Fix: Duplicate Instructor + Student Assignment Visibility

## Root Causes

1. **Duplicate Master Roshi**: Two separate instructor records exist in the database with different UUIDs but the same email (`kame@dbz.com`). One is a duplicate that needs to be removed via a migration. Students (Future Trunks, Son Gohan) are assigned to ID `7e03a1db...`; the other ID `af93c4f3...` has no students. The migration will delete the orphan instructor record and its associated profile/user_roles rows.

2. **"Assign Students" only shows unassigned students**: The dialog currently only lists students with `instructor_id IS NULL`. It should also show the instructor's currently assigned students so the admin can see who is already assigned and optionally unassign them.

---

## Plan

### Step 1 — Remove the duplicate instructor record (database migration)

Write a migration that:
- Deletes the instructor row with ID `af93c4f3-4fdc-48d9-8e01-985b0f41d737` (the one with zero students)
- Deletes the corresponding `profiles` and `user_roles` rows for that same ID
- Leaves the other Master Roshi (`7e03a1db...`) and his assigned students untouched

### Step 2 — Enhance the "Assign Students" dialog

Update `useStudentAssignment.ts` to also fetch students currently assigned to the selected instructor (a second query filtered by `instructor_id = instructorId`).

Update the student assignment section in `AdminInstructors.tsx` to show two groups:
- **Currently Assigned** — students already linked to this instructor, each with an "Unassign" button
- **Available Students** — unassigned students that can be selected and assigned (existing behavior)

This gives the admin a complete picture when clicking "Assign Students."

### Files changed
- New database migration (remove duplicate record)
- `src/hooks/useStudentAssignment.ts` — add `fetchAssignedStudents` query parameterized by instructor ID
- `src/pages/admin/AdminInstructors.tsx` — update the student assignment Sheet to display both sections

