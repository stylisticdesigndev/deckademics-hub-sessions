

# Fix Dashboard Stats Layout, Note Modal Actions, and Instructor Display

## Problem Summary

1. **Dashboard top stats cards** use `grid-cols-2 md:grid-cols-4` but there are only 3 cards, so they don't fill the row evenly.
2. **Note view modal** shows content but no edit/delete buttons for personal notes.
3. **Student profile and dashboard** fetch instructor info through enrollments/classes join chain, but instructor assignment is stored directly on `students.instructor_id`. This means the instructor never appears.

## Changes

### 1. `src/components/student/dashboard/StudentStatsSection.tsx`
- Change grid from `grid-cols-2 md:grid-cols-4` to `grid-cols-1 md:grid-cols-3` so the 3 cards space evenly across the full width.

### 2. `src/pages/student/StudentNotes.tsx`
- In `renderViewDialog`, add edit and delete buttons in the dialog footer when the note is a personal note.
- Edit button opens the PersonalNoteDialog with the note data pre-filled (reuses existing `setEditingNote` + `setDialogOpen` flow).
- Delete button calls `handleDeleteNote` and closes the view modal.

### 3. `src/pages/student/StudentProfile.tsx` — Fix instructor fetch
- Replace the enrollments → classes → instructor_id lookup with a direct read of `students.instructor_id`, then fetch that instructor's profile from `profiles`.
- This matches how the admin/instructor side assigns students (`students.instructor_id`).

### 4. `src/hooks/student/useStudentDashboardCore.ts` — Fix dashboard instructor
- After fetching student info, also read `instructor_id` from the student record.
- If `instructor_id` exists, fetch the instructor's name from `profiles` and use it as the `instructor` field in `studentData`, instead of relying solely on `upcomingClasses[0].instructor`.

## Technical Details

**Profile fix** (StudentProfile.tsx lines 78-141): Remove the enrollments → classes → instructor chain. After fetching the student record, check `student.instructor_id`. If set, query `profiles` for that ID to get `first_name`/`last_name`.

**Dashboard fix** (useStudentDashboardCore.ts lines 49-53): Expand the student select to include `instructor_id`. When present, fetch instructor profile and store name. In the `studentData` memo, prefer this over `nextClassInfo.instructor`.

**Note modal fix** (StudentNotes.tsx lines 279-310): Add a footer div inside the DialogContent with conditional edit/delete buttons when `viewingNote.type === 'personal'`.

## Files Changed
1. `src/components/student/dashboard/StudentStatsSection.tsx` — grid layout fix
2. `src/pages/student/StudentNotes.tsx` — add edit/delete to view modal
3. `src/pages/student/StudentProfile.tsx` — fetch instructor from `students.instructor_id`
4. `src/hooks/student/useStudentDashboardCore.ts` — fetch assigned instructor name for dashboard

