# Fix Student-Instructor Architecture Gaps

## Summary

Address the disconnected notes systems and missing feature parity between student and instructor sides.

## Critical Issue: Dual Notes Systems

The instructor's Students page writes notes to `students.notes` (a plain text column), but the student's Notes page reads from the `student_notes` table. These are completely disconnected -- notes written by an instructor from the Students page never appear on the student's Notes page.

### Fix: Migrate instructor note-writing to use `student_notes` table

`**src/pages/instructor/InstructorStudents.tsx**`

- Update `handleAddNote` to INSERT into `student_notes` table instead of updating `students.notes` text column
- Update `handleAddLessonNote` similarly
- Keep reading `students.notes` for backward compatibility (display old notes) but write new ones to `student_notes`

`**src/components/notes/StudentNoteDialog.tsx**`

- No changes needed -- it's a generic dialog, the parent controls save behavior

## Secondary Gaps (optional, lower priority)

1. **Instructor announcement dismiss**: Add dismiss button to `InstructorAnnouncements.tsx` matching the student pattern
2. **Real-time message updates**: Add Supabase realtime subscription for the `messages` table on both instructor and student sides

## Recommended Approach

Fix the critical notes disconnect first -- it's a data integrity issue. The other gaps are enhancements.

## Technical Details

- The `student_notes` table requires `instructor_id`, `student_id`, `content`, and optional `title`
- RLS policy on `student_notes` already allows instructors to INSERT for their assigned students
- The `students.notes` column can remain for legacy data but new notes should go to `student_notes`
- No database migration needed -- all tables and policies already exist