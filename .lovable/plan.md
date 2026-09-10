# Shared student notes + a more useful student profile

Two changes for instructors: notes written by any instructor become visible to every instructor, and the student profile gains an at-a-glance summary strip plus quick action buttons. The existing layout and tabs stay exactly as they are — this only adds.

## 1. Notes visible school-wide

Today an instructor only sees notes they personally wrote, so covering another instructor's class means the student's history is invisible.

- Every instructor can read every note on any student.
- Each note shows who wrote it and when.
- Editing and deleting stay restricted to the note's author (admins keep full control).
- Notes from other instructors appear in the same Notes tab, clearly labelled with the author's DJ name.

## 2. Student profile: at-a-glance strip

A compact summary row added at the top of the student detail view, above the existing tabs:

- **Next class** — day and time, plus recent attendance rate (e.g. "9 of 10 recent classes").
- **Level progress** — skills mastered out of total, and a "Ready to advance" badge when they qualify.
- **Latest note** — one-line preview with author and date; tapping it jumps to the Notes tab.
- **Status flags** — small badges only when relevant: absent today, running late, pending schedule change, unread message from this student.

## 3. Quick actions

An action row in the profile header:

- **Message** — opens a chat thread with that student straight away.
- **Add note** — opens the note composer directly.
- **Add task** — opens the task composer directly.
- **Call** and **Email** — tap to dial or open mail, shown only when the student has that detail on file.

On phones these collapse into an icon row so they stay on one line.

## Technical notes

- Migration on `student_notes`: add a SELECT policy for role `instructor` covering all rows; keep the existing author-scoped UPDATE/DELETE policies unchanged. Grant remains as-is.
- `useInstructorStudentsSimple` note fetch drops the `.eq('instructor_id', instructorId)` filter and joins author display names via the existing `get_instructor_display_names` RPC; `getInstructorDisplayName` supplies the label. Note type gains `authorId` / `authorName`; edit/delete controls render only when `authorId === instructorId`.
- Student rows for unassigned students: reading notes requires no `students` row access, but the profile is opened from lists the instructor can already see, so no change to `can_instructor_access_student` is needed. Covering instructors continue to reach full profiles through `cover_sessions`.
- New presentational component `StudentProfileSummary` (glance strip + action row) rendered inside `InstructorStudentDetailDialog` and the inline detail panel in `InstructorStudents.tsx`, so both stay in sync.
- Attendance rate derived from the last 10 `attendance` rows for the student; status flags read `student_status`, `student_absences`, `schedule_change_requests` (pending), and unread `messages`.
- Message action navigates to `/instructor/messages?to=<studentId>` — the deep link already exists.
