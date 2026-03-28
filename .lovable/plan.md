

# Student Personal Notes + Instructor Notes Combined View

## Summary
Create a new `student_personal_notes` table for student-authored notes, and update the Notes page to show both personal notes and instructor notes in a unified, tabbed interface.

## Database Changes

### New table: `student_personal_notes`
- `id` (uuid, PK, default gen_random_uuid())
- `student_id` (uuid, NOT NULL) — references the student
- `title` (text, nullable)
- `content` (text, NOT NULL)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### RLS Policies
- Students can SELECT, INSERT, UPDATE, DELETE their own notes (`student_id = auth.uid()`)
- Admins can SELECT all (via `has_role`)
- Instructors can SELECT notes for their assigned students

### Trigger
- `update_updated_at` trigger on UPDATE

## Frontend Changes

### `src/hooks/student/useStudentPersonalNotes.ts` (new)
- Hook to CRUD personal notes from `student_personal_notes`
- `useQuery` to fetch, `useMutation` for create/update/delete

### `src/pages/student/StudentNotes.tsx`
- Add tabs: "All", "My Notes", "Instructor Notes"
- "All" tab shows both types merged by date (like the messages pattern)
- "My Notes" tab shows only personal notes with a "New Note" button
- "Instructor Notes" tab shows existing instructor notes
- Add a floating or header "Add Note" button that opens a dialog
- Each personal note card has edit/delete actions

### `src/components/student/notes/PersonalNoteDialog.tsx` (new)
- Dialog with title (optional) and content (required) fields
- Used for both creating and editing personal notes

### Note card rendering
- Personal notes get a distinct visual indicator (e.g., different icon or subtle label like "My Note")
- Instructor notes keep the existing instructor name/date display

## Technical Details
- Separate table avoids polluting the instructor-student notes relationship
- The `student_notes` table and hook remain unchanged — instructor notes continue working as-is
- Personal notes use the same date-grouping logic (Today, Yesterday, This Week, Earlier)

