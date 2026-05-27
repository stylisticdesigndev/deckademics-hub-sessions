## Goal

Until real PWA push is in place, send an automatic email for every "major" event — to both instructors and students. Default **on** for all existing and new users; each user can disable it from their Profile → Notifications card.

## Approach

Use **Lovable Emails** (built-in, queued, retry-safe). Wire one shared edge function that every event site calls; the function looks up the recipient's `notification_preferences.email_notifications` flag and skips sending if it's off.

## Prerequisite: email sender domain

No domain is configured yet. The first step is the standard email domain setup dialog — once the user picks/verifies a sender domain, the rest is automatic (queue infra, deploy, etc.).

## What counts as a "major" event

### Student receives email for
- New message from instructor
- New announcement targeting students
- New task assigned by instructor (`student_tasks` insert)
- Instructor marks them present/absent in attendance
- Schedule change request approved/rejected
- New payment created / payment marked overdue

### Instructor receives email for
- Student marks themselves absent (already auto-messages — also send email)
- Student "I'm Running Late" (already auto-messages — also send email)
- New message from student
- New announcement targeting instructors
- New student assigned to them
- New schedule change request for one of their students

Admins are out of scope for v1 (their notification dropdown already covers it).

## Implementation

### 1. Setup (one-time, automated)
- Email sender domain (user action — dialog below).
- Scaffold transactional email infrastructure (queue, dispatcher cron, unsubscribe tokens, send log).
- Single new edge function `send-event-email` with input `{ recipient_id, event_type, subject, preview, body_md, link_url? }`. It:
  - Reads `notification_preferences.email_notifications` for `recipient_id` (default true if no row exists).
  - If off → returns `{ skipped: true }` without sending.
  - If on → enqueues a transactional email via the standard `send-transactional-email` function with a simple branded HTML template (Deckademics header, the event copy, a CTA link back to the relevant app page, footer with one-click unsubscribe).
  - All sends logged automatically in `email_send_log`.

### 2. Default-on guarantee
- DB default for `notification_preferences.email_notifications` is already `true`.
- New users without a row are treated as opted-in by the edge function (no row read = default true).
- No backfill migration needed — existing users with no preferences row are already considered opted-in by the lookup logic.

### 3. Per-user toggle UI
- Student profile already shows `NotificationPreferencesCard` ✅.
- Add the same `NotificationPreferencesCard` to `src/pages/instructor/InstructorProfile.tsx`. Existing hook + table already support instructors (table is per-`user_id`, not per-role).
- Reword the email switch description to: *"Receive an email for new messages, announcements, attendance, tasks, and schedule changes."* So the user understands what "on" actually means.

### 4. Event wiring — call `send-event-email` from existing code paths
Client-side (best-effort, fire-and-forget — never block the user action):

| Event | File | Recipient |
|---|---|---|
| Student marks absent (dashboard card) | `src/components/cards/UpcomingClassCard.tsx` | instructor |
| Student marks absent (classes page) | `src/hooks/student/useStudentClassAttendance.ts` | instructor |
| Student "I'm Running Late" | `src/components/student/RunningLateButton.tsx` | instructor |
| Instructor marks attendance | `src/hooks/instructor/useInstructorAttendance.ts` | student |
| Send a message | wherever `messages` insert happens (instructor + student message composers) | the receiver |
| New announcement published | `src/components/admin/announcements/AnnouncementForm.tsx` (admin save flow) | fan-out to each targeted role |
| Instructor creates a task | `src/components/notes/StudentNoteDialog.tsx` / task creation hook | student |
| New schedule change request | `src/hooks/useScheduleChangeRequests.ts` | instructor (and student on review) |
| New student assignment | `src/hooks/useStudentAssignment.ts` / `assign-student-to-instructor` edge function | instructor + student |
| Payment created/overdue | `src/hooks/useCreatePayment.ts` | student |

For the announcement fan-out (potentially many recipients), the call expands to one edge function invoke per recipient — the queue handles throughput and rate-limit backoff.

### 5. Future push migration
When you add a real push provider, replace the `send-event-email` body with a dual dispatch (`email + push`) gated by separate prefs. The call sites stay the same.

## Files

- New: `supabase/functions/send-event-email/index.ts`
- Edit: `src/pages/instructor/InstructorProfile.tsx` (mount existing card)
- Edit: `src/components/student/profile/NotificationPreferencesCard.tsx` (clearer email copy)
- Edit: the event sites listed above to fire-and-forget invoke `send-event-email`

## Out of scope
- Real OS push notifications (tracked separately).
- Admin email notifications.
- Granular per-event toggles (single email on/off switch for now; can split later).
- SMS (existing SMS switch stays, no behavior change in this pass).

## Next step

Setting up your sender domain — this is the address users will see in their inbox (e.g. `notify@yourdomain.com`). Once that's done I'll build everything above end-to-end.

<presentation-actions>
<presentation-open-email-setup>Set up email domain</presentation-open-email-setup>
</presentation-actions>
