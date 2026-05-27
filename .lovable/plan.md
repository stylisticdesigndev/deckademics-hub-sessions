## Problem

When a student marks themselves absent from the **dashboard "Upcoming Classes"** card (`UpcomingClassCard`), only an `attendance` row is inserted. No message is sent to the instructor, so nothing appears in the instructor's Messages dropdown / unread notifications.

The other absent flow (Student → Classes page → `ClassAttendanceCard` → `useStudentClassAttendance.markAbsent`) already does the right thing: inserts attendance, sends an automatic message ("Heads up — I won't be at class on …"), and invokes the `notify-instructor-absence` edge function for the future push hook.

The "I'm Running Late" button (`RunningLateButton`) already follows the same pattern (status + auto-message + `notify-instructor-late` edge function).

## Change

Make the dashboard `UpcomingClassCard`'s "Mark Absent" do exactly what the Classes-page flow does, so absences always notify the instructor regardless of where they're marked.

### 1. `src/components/cards/UpcomingClassCard.tsx`
In `handleConfirmAbsent`, after the existing `attendance` insert:
- Look up `students.instructor_id` + student name (same pattern as `RunningLateButton` / `useStudentClassAttendance`).
- If `instructor_id` exists, insert a row into `messages`:
  - `sender_id`: student
  - `receiver_id`: instructor
  - `subject`: `"Marked Absent"`
  - `content`: `"Heads up — I won't be at class on {session.date}."` (append `Reason: …` when provided)
- Best-effort `supabase.functions.invoke('notify-instructor-absence', { body: { instructor_id, student_id, student_name, absence_date: isoDate, reason } })`. Wrap in try/catch so push failure doesn't block the absence.
- Keep the existing success toast wording aligned ("Marked absent. Your instructor has been notified.").

No changes to the message/notification shape — reuses the existing instructor unread-message badge (`useUserNotifications`) so the instructor sees the alert in their notification dropdown automatically.

### 2. Push notifications (future)
Both `notify-instructor-late` and `notify-instructor-absence` edge functions already exist and log `pending: ['os_push_notification']`. No code change today — when a push provider (FCM/APNs/OneSignal) is wired in, both "Running Late" and "Marked Absent" will dispatch real OS push without further client changes. No app open required.

## Files

- `src/components/cards/UpcomingClassCard.tsx` — add message insert + edge function invoke after attendance insert.

## Out of scope

- No DB migrations (messages + edge function already exist).
- No changes to `ClassAttendanceCard` flow (already correct).
- No actual push provider integration — left as the documented next step in the existing edge functions.
