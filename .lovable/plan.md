## Goal

Two changes:
1. On the student dashboard's "Today's Class" card, replace the "Add to Calendar" button with a "Mark Absent" button (with the same confirmation dialog used elsewhere).
2. Replace the hardcoded "Main Studio" location with a real, instructor-assigned classroom. Instructors can pick **Room One**, **Room Two**, or **Room Three** for each student from the Instructor → Student Detail page.

---

## Part 1 — Dashboard "Today's Class" card

**File:** `src/components/cards/UpcomingClassCard.tsx`

- Remove the "Add to Calendar" button in the footer.
- Add a destructive "Mark Absent" button that opens the same confirmation dialog used in `ClassAttendanceCard` (date + optional reason textarea, Cancel / Confirm Absent).
- On confirm, call `supabase.from('attendance').insert({ student_id, status: 'absent', date, notes: reason })`. The existing RLS policy "Students can mark themselves absent" already allows this.
- Only show the button when `session.isUpcoming` is true and a `studentId` is provided.
- Disable in demo mode.

**File:** `src/components/student/dashboard/UpcomingClassesSection.tsx`

- Pass `studentId` and `demoMode` down to `UpcomingClassCard`.
- Drop the now-unused `onAddToCalendar` prop chain (or leave the prop for compatibility but stop using it).

---

## Part 2 — Classroom assignment

### Database (schema migration)

Add a `class_room` column to the `students` table:

```sql
ALTER TABLE public.students
ADD COLUMN class_room text;
```

No default — null means "not assigned". Existing RLS already allows instructors to update assigned students.

### Instructor UI — assign the room

**File:** `src/pages/instructor/InstructorStudentDetail.tsx`

- Add `class_room` to the `DetailData` interface and the select query.
- Add a new "Classroom" row in the details grid showing the current value (or "Not assigned").
- Add an editable `<Select>` with three options: **Room One**, **Room Two**, **Room Three**, plus an "Unassigned" option.
- On change, update via `supabase.from('students').update({ class_room: value }).eq('id', studentId)` and refresh local state with a success toast.

### Student dashboard — show the assigned room

**File:** `src/hooks/student/useStudentDashboardCore.ts`

- Add `class_room` to the student select query.
- Use it as the `location` on the synthetic "Today's Class" entry instead of the hardcoded `'Main Studio'` (fall back to `'Not assigned'` if null).

**File:** `src/hooks/student/dashboard/useUpcomingClasses.ts`

- Change the fallback from `'Main Studio'` to `'Not assigned'` so real classes without a `location` don't show stale copy.

---

## Out of scope

- The instructor-side mock dashboard already uses "Classroom 1/2/3" labels — no change needed there.
- No changes to admin pages; instructors own this assignment per the existing student detail page.

## Files touched

- Migration: add `students.class_room`
- `src/components/cards/UpcomingClassCard.tsx`
- `src/components/student/dashboard/UpcomingClassesSection.tsx`
- `src/pages/instructor/InstructorStudentDetail.tsx`
- `src/hooks/student/useStudentDashboardCore.ts`
- `src/hooks/student/dashboard/useUpcomingClasses.ts`
