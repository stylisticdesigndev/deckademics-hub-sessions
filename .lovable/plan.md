

# Fix Instructor Notes Display, Editing, and Date Format

## Problem Analysis

1. **Notes not reflecting**: The `handleAddNote` correctly INSERTs into the `student_notes` table, but `useInstructorStudentsSimple` reads from the legacy `students.notes` text column. These are completely different data sources -- notes are saved to one place but read from another.

2. **Notes not editable**: The Notes tab in the student detail dialog renders notes as plain text divs with no click/edit capability.

3. **Date format**: Enrollment date displays as `YYYY-MM-DD` (from `start_date.slice(0,10)`), not American `MM/DD/YYYY`.

## Changes

### 1. `src/hooks/instructor/useInstructorStudentsSimple.ts`
- After fetching students, also query the `student_notes` table for all student IDs where `instructor_id` matches
- Replace the legacy `students.notes` string splitting with actual `student_notes` records
- Store notes as objects (id, content, title, created_at) instead of plain strings so they can be edited

### 2. `src/pages/instructor/InstructorStudents.tsx`

**Update the Student interface**:
- Change `notes?: string[]` to `notes?: { id: string; content: string; title?: string; created_at: string }[]`

**Notes tab in student detail dialog** (lines 1262-1280):
- Make each note clickable to open an edit dialog
- Show note date and title
- Add an edit dialog that UPDATEs the `student_notes` record by ID

**Add edit note handler**:
- New state: `editingNoteId`, `editNoteText`, `showEditNoteDialog`
- `handleEditNote` function that calls `supabase.from('student_notes').update({ content }).eq('id', noteId)`

**Fix enrollment date format** (line 1154):
- Format `detailedStudent.enrollmentDate` using `format(new Date(...), 'MM/dd/yyyy')` from date-fns

### 3. `src/hooks/instructor/useInstructorStudentsSimple.ts` — date format
- Format `enrollmentDate` as `MM/DD/YYYY` when building student objects

## Technical Details
- The `student_notes` table has RLS allowing instructors to SELECT their own notes (`instructor_id = auth.uid()`)
- The `student_notes` table has no UPDATE policy for instructors currently — a new RLS policy is needed: "Instructors can update their own notes" for UPDATE where `instructor_id = auth.uid()`
- Uses `date-fns` `format` function already imported elsewhere in the project
- The note objects carry their `id` so the edit dialog can target the correct row

