## Goal

When a student marks themselves absent, mirror the "I'm Running Late" pattern:
1. Save the absence (already happens).
2. Send an automated message into the instructor's Messages with the student's reason.
3. Trigger an in-app alert/push to the instructor via an edge function.

## Behavior

- Toast to student updates to: *"Instructor notified. Your absence and message have been sent."*
- Instructor receives a new message in their Messages inbox titled **"Marked Absent"** with content:
  - With reason: `Heads up — I won't be at class on MM/DD/YYYY. Reason: <reason>`
  - Without reason: `Heads up — I won't be at class on MM/DD/YYYY.`
- Instructor's notification badge increments (it already polls unread messages, so no extra wiring needed there).
- Edge function logs the dispatch and is wired for future FCM/APNs push.

## Technical changes

**1. `src/hooks/student/useStudentClassAttendance.ts` — `markAbsent`**

After the existing `attendance` insert succeeds:
- Look up the student's `instructor_id` and profile name from the `students` + `profiles` tables (same query shape as `RunningLateButton`).
- If instructor exists, insert into `messages`:
  ```ts
  { sender_id: studentId, receiver_id: instructorId,
    subject: 'Marked Absent',
    content: reason
      ? `Heads up — I won't be at class on ${formatDateUS(absenceDate)}. Reason: ${reason}`
      : `Heads up — I won't be at class on ${formatDateUS(absenceDate)}.` }
  ```
- Best-effort `supabase.functions.invoke('notify-instructor-absence', { body: { instructor_id, student_id, student_name, absence_date, reason } })` wrapped in try/catch (don't fail the flow if push fails).
- Update toast copy.

**2. New edge function `supabase/functions/notify-instructor-absence/index.ts`**

Clone of `notify-instructor-late`:
- Verify auth bearer.
- Read instructor `notification_preferences`.
- Log dispatch with student name, date, reason.
- Returns `{ ok: true, delivered: ['in_app_message'], pending: ['os_push_notification'] }`.
- Auto-deployed; no secrets needed (uses existing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_ANON_KEY`).
- Add to `supabase/config.toml` if needed (check existing entries pattern).

**3. RLS — no changes needed**

- `messages` already allows `sender_id = auth.uid()` insert.
- `student_absences` / `attendance` insert policies already in place.

## Files modified / created

- Modify: `src/hooks/student/useStudentClassAttendance.ts`
- Create: `supabase/functions/notify-instructor-absence/index.ts`
- Modify (if needed): `supabase/config.toml` to register the new function

## Out of scope

- Real OS push notifications (FCM/APNs) — same future hook as running-late.
- Notifying cover instructors or secondary instructors — only the primary `students.instructor_id` is messaged, matching the running-late behavior.
