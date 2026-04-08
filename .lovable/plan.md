

# Student Schedule Management — Class Day, Start Time, and Change Requests

## Summary

Add `class_day` and `class_time` columns to the `students` table so admins can assign each student a recurring class day and time slot. Make `start_date` editable by admins. Allow instructors to request schedule changes (day/time) that require admin approval via a new `schedule_change_requests` table.

---

## Database Changes (2 migrations)

**Migration 1: Add schedule columns to `students`**
```sql
ALTER TABLE public.students
  ADD COLUMN class_day text,
  ADD COLUMN class_time text;
```
`class_day` stores a weekday name (e.g. "Monday"). `class_time` stores a time slot string (e.g. "3:30 PM - 5:00 PM") matching the school's fixed blocks.

**Migration 2: Create `schedule_change_requests` table**
```sql
CREATE TABLE public.schedule_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  current_day text,
  current_time text,
  new_day text NOT NULL,
  new_time text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.schedule_change_requests ENABLE ROW LEVEL SECURITY;

-- Instructors can create requests for their students
CREATE POLICY "Instructors can insert schedule requests"
  ON public.schedule_change_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    has_role(auth.uid(), 'instructor') AND
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.instructor_id = auth.uid())
  );

-- Instructors can view their own requests
CREATE POLICY "Instructors can view own requests"
  ON public.schedule_change_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

-- Admins full access
CREATE POLICY "Admins can manage all schedule requests"
  ON public.schedule_change_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

---

## Admin Side — Student Detail Sheet Changes

**File: `src/pages/admin/AdminStudents.tsx`**

In the student detail Sheet, add editable fields for:
- **Start Date** — date picker (currently read-only text showing `start_date`)
- **Class Day** — dropdown with Monday–Sunday
- **Class Time** — dropdown with the 3 fixed time slots (3:30 PM - 5:00 PM, 5:30 PM - 7:00 PM, 7:30 PM - 9:00 PM)

Also show the active table columns for Day and Time in the active students table.

**File: `src/hooks/useAdminStudents.ts`**

- Add `start_date`, `class_day`, `class_time` to the select query
- Add `updateStudentSchedule` mutation that updates these 3 fields
- Expose in the interface

**New component: `src/components/admin/schedule-requests/ScheduleRequestsList.tsx`**

A card/section shown on the Admin Students page (or as a new tab) listing pending schedule change requests with Approve/Decline buttons. On approval, the admin action updates the student's `class_day` and `class_time` and sets the request status to `approved`.

---

## Instructor Side — Request Schedule Change

**File: `src/pages/instructor/InstructorStudents.tsx`**

In the student detail view, add a "Request Schedule Change" button that opens a dialog with:
- New Day dropdown
- New Time slot dropdown
- Reason text field
- Submit button

This inserts into `schedule_change_requests`. Show a badge/indicator if a pending request already exists for that student.

**New hook: `src/hooks/useScheduleChangeRequests.ts`**

Shared hook for:
- Fetching requests (filtered by instructor or all for admin)
- Creating a request (instructor)
- Approving/declining a request (admin — also updates `students` table on approval)

---

## UI Updates

- Admin active students table: add "Day" and "Time" columns
- Admin student detail sheet: add Start Date picker, Day dropdown, Time dropdown
- Admin: "Schedule Requests" tab or notification badge on Students page for pending requests
- Instructor student detail: "Request Schedule Change" button and pending request indicator

---

## Files to Create/Modify

| File | Action |
|---|---|
| `src/hooks/useAdminStudents.ts` | Add schedule fields to query + new mutation |
| `src/hooks/useScheduleChangeRequests.ts` | New shared hook |
| `src/pages/admin/AdminStudents.tsx` | Add Day/Time columns, editable fields in detail sheet, schedule requests tab |
| `src/components/admin/schedule-requests/ScheduleRequestsList.tsx` | New component |
| `src/pages/instructor/InstructorStudents.tsx` | Add request schedule change dialog |

