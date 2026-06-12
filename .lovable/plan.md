# Fix: student absence/late alerts not reaching instructors

## What you reported
You marked **Future Trunks** absent from the student side. Neither instructor (you, DJ Stylistic = primary; Master Roshi = secondary) got a push **or** an in-app message/notification.

## What I confirmed in your data
- Both instructors are correctly linked to the student (you primary, Roshi secondary).
- Both have active push subscriptions (your iPhone via Apple Web Push, Roshi's Android via FCM) and both have push **opted in**.
- Today's absence created the attendance record, but **no in-app messages were created** for either instructor, and **Master Roshi has never received one**.
- The notification edge functions show **no recent runs** for this absence.

## Root cause
The "notify my instructors" step runs **in the browser** and is fragile:

1. It loops over instructors one-by-one and inserts messages / calls push from the client. If that block hits a silent error or the instructor list comes back empty, the absence still saves but **no one is notified** — exactly what happened (the attendance row exists, the messages don't).
2. The helper that figures out "who are this student's instructors" reads the link table through row-level security. That's brittle and is the kind of thing that can return an incomplete list (e.g. miss the newly added secondary, Roshi).

So nothing was "deleted/broken" in your data — the client-side notify step just silently no-op'd.

## The fix (student-initiated flow only — per your choice)
Move the fan-out to the **server**, so it runs reliably and always sees the full instructor list. The student's app makes **one** call; the server does the rest with elevated privileges (no RLS blind spots).

### Scope
Only the three **student-initiated** actions notify instructors (instructor-side attendance marking stays as-is, notifying only the student):
- Mark Absent (Today's Class card + Class Attendance page)
- I'm Running Late
- Undo absence ("I can make it")

### Behavior after the fix
For each action, every assigned instructor (primary **and** secondary, plus any cover instructor) reliably gets:
- an **in-app message** (shows in their notification bell + Messages), and
- a **push notification** if they're opted in (best-effort; the in-app message always lands).

If the student has no instructors, it's a clean no-op (no crash, no half-finished state).

## Technical details
- **New edge function `notify-student-event`** (service role):
  - Validates the caller's JWT and requires `caller == student_id` (a student can only fire alerts for themselves).
  - Accepts `{ student_id, kind: 'absent' | 'late' | 'undo_absent', date?, reason? }`.
  - Resolves the full instructor set with the service role: `student_instructors` (primary + secondary) with fallback to `students.instructor_id`, plus matching `cover_sessions` for that date.
  - Inserts the appropriate `messages` row for each instructor (same wording as today).
  - Sends web-push to each opted-in instructor (same VAPID/web-push logic already used by `send-push`), and prunes stale subscriptions.
  - Returns a summary `{ notified, pushed }` so the client can surface failures instead of swallowing them.
- **Client changes** — replace the in-component loops with a single `supabase.functions.invoke('notify-student-event', ...)` call in:
  - `src/components/cards/UpcomingClassCard.tsx` (handleConfirmAbsent)
  - `src/hooks/student/useStudentClassAttendance.ts` (markAbsent, undoAbsent)
  - `src/components/student/RunningLateButton.tsx`
  - The attendance row insert stays in the client (RLS already allows the student to mark themselves absent); only the notify/messaging/push moves server-side.
- Keep `getStudentInstructorIds` for any remaining client uses, but the student-event flows no longer depend on client-side RLS visibility.
- Leave instructor-side `useInstructorAttendance.markAttendance` unchanged (still notifies only the student).
- Config: `notify-student-event` deploys automatically; secrets needed (`VAPID_PRIVATE_KEY`, service role) already exist.

## Verification
1. Log in as Future Trunks, mark absent → confirm a `messages` row appears for **both** you and Master Roshi, and both bells show the alert.
2. Confirm push arrives on your iPhone and Roshi's Android (push is best-effort; iPhonePWA must be installed to Home Screen, which yours already is).
3. Repeat for "Running Late" and "I can make it" (undo).
4. Check the new function's logs show the run and a `notified`/`pushed` count.

## Note on automatic PDFs (unrelated)
This change doesn't touch the user-guide PDFs; no guide updates are implied by a notification bug fix.
