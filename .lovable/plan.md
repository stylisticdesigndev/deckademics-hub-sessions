

# Fix Live Progress Updates + Add Student To-Do Feature

## Problem 1: Progress Checkboxes Don't Update Live

**Root cause**: The `toggleLessonCompletion` function updates the `students` array state, but the modal reads from a separate `detailedStudent` state variable. Since `setDetailedStudent` is never called after toggling, the UI stays stale until the modal is closed and reopened.

**Fix**: After updating `setStudents`, also update `setDetailedStudent` with the same modified student data. This is a ~5-line addition inside `toggleLessonCompletion`.

### File: `src/pages/instructor/InstructorStudents.tsx`

After the `setStudents(...)` call (line 647-679), add a matching `setDetailedStudent` update that applies the same lesson toggle logic to the detailed student if it matches the toggled student ID.

## Problem 2: Student To-Do Feature

Yes — a to-do list makes sense. The Progress tab tracks curriculum completion (what the admin defines). But instructors often need to assign ad-hoc tasks: "practice crossfader transitions," "watch this tutorial," "bring headphones next week." These don't belong in the curriculum.

**Proposal**: Add a "Tasks" tab to the student detail modal, alongside Info/Notes/Progress. Instructors can:
- Add a task with a title and optional description
- Mark tasks as complete/incomplete
- Delete tasks
- See tasks sorted by status (incomplete first) then date

### Database: New `student_tasks` table

```text
student_tasks
├── id (uuid, PK)
├── student_id (uuid, NOT NULL)
├── instructor_id (uuid, NOT NULL)
├── title (text, NOT NULL)
├── description (text, nullable)
├── completed (boolean, default false)
├── created_at (timestamptz)
├── updated_at (timestamptz)
```

RLS policies:
- Instructors can CRUD tasks where `instructor_id = auth.uid()`
- Students can SELECT tasks where `student_id = auth.uid()`
- Students can UPDATE tasks where `student_id = auth.uid()` (to mark complete)
- Admins can manage all

### UI: New "Tasks" tab in student detail modal

- Simple list with checkbox, title, and description
- "Add Task" button with inline form (title + optional description)
- Completed tasks show strikethrough and move to bottom
- Delete button (trash icon) on each task

## Files Changed

1. `src/pages/instructor/InstructorStudents.tsx` — fix `setDetailedStudent` sync + add Tasks tab UI
2. **New migration** — create `student_tasks` table with RLS
3. `src/hooks/instructor/useInstructorStudentsSimple.ts` — optionally fetch tasks per student (or fetch on-demand in the tab)

## Technical Details

- The `setDetailedStudent` fix ensures the checkbox visually toggles immediately after the DB write succeeds
- The Tasks tab fetches tasks on-demand when the tab is selected, keeping the initial student load fast
- Tasks are independent from curriculum — they won't affect the Progress percentage
- Students will be able to see their tasks on their own dashboard (future enhancement)

