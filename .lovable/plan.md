## Goal

Keep the instructor dashboard exactly as it was. Build the swipe-style attendance experience as a **standalone full-screen page** that only opens when an instructor taps a **push notification** on their phone or tablet. Push-only, no in-app notification, no desktop version.

## Step 1 — Revert the dashboard

Restore `src/components/instructor/dashboard/TodayAttendanceSection.tsx` to the original list layout (avatar + name + level · class time + Present/Absent buttons). No swipe UI on the dashboard.

The swipe component (`SwipeAttendanceStack.tsx`) is not deleted — it becomes the body of the new standalone page.

You can also roll back the whole previous turn from chat history if you'd rather start clean:

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

## Step 2 — New full-screen page

Route: `/instructor/attendance/quick`

- Mobile/tablet only. On desktop viewports (≥ `md`), show a friendly "Open this on your phone or tablet to swipe through attendance" screen with a link back to `/instructor/attendance`.
- Full-screen layout — no dashboard sidebar/header chrome. Uses its own minimal top bar (close button + "Today's Attendance" + progress "3 of 5").
- Renders the existing swipe stack (photo hero, X / ✓ FABs, drag-to-decide, PRESENT/ABSENT stamps, Undo).
- Optional `?classTime=5:30 PM - 7:00 PM` query param filters to a single class slot; without it, shows all of today's remaining students.
- When the deck empties, show the "All caught up" state with a "Back to dashboard" button.

## Step 3 — Push notifications (push-only, mid-class + pre-end)

Two reminders per class the instructor is scheduled to teach today:
1. **15 min after class start** — "Class is rolling — take attendance"
2. **15 min before class end** — "Wrap-up time — log attendance before students leave"

Each push deep-links to `/instructor/attendance/quick?classTime=<slot>` so tapping it opens the full-screen swipe deck for that specific class.

**Delivery:**
- New Supabase edge function `attendance-inclass-reminder-push` runs every 5 minutes via `pg_cron` + `pg_net`.
- Scans `students` grouped by `class_day` + `class_time` to find classes whose start-time+15m or end-time-15m falls in the last 5-minute window (America/New_York, matching your existing scheduling logic).
- For each match, resolves the assigned instructor(s) via `student_instructors` (+ any active `cover_sessions` for today) and sends a Web Push via the existing `send-push` function with the deep link URL.
- **No in-app notification, no toast, no bell badge.** Purely OS-level push.
- New table `attendance_inclass_reminder_sent (instructor_id, class_date, class_time, kind)` with UNIQUE constraint so each reminder fires at most once per instructor per class per kind. Table gets RLS + GRANTs.

**Suppression rules** (so we don't nag when the work is done):
- Skip a reminder if attendance for every student in that class slot is already marked for today.
- Skip if the instructor has no active push subscription.

## Step 4 — Deep-link handling

- `ProtectedRoute` already gates `/instructor/*`. The new page sits inside that route so an unauthenticated tap sends the instructor through login and back to the deep link.
- Service worker's `notificationclick` handler already opens the payload's `url`, so no SW changes needed.

## Technical notes

- Files touched:
  - Revert: `src/components/instructor/dashboard/TodayAttendanceSection.tsx`
  - Keep: `src/components/instructor/dashboard/SwipeAttendanceStack.tsx`
  - New page: `src/pages/instructor/InstructorQuickAttendance.tsx`
  - Route registration: `src/App.tsx` (or wherever instructor routes are declared)
  - New edge function: `supabase/functions/attendance-inclass-reminder-push/index.ts`
  - Migration: new tracking table + `pg_cron` schedule (every 5 min)
- Reuses `useInstructorAttendance` hook (already returns `todayStudents` and `markAttendance`) with an optional client-side filter by `classTime`.
- Reuses `send-push` edge function and existing `push_subscriptions` table.
- No new dependencies (framer-motion already installed last turn).

## Out of scope

- Desktop swipe experience (explicitly excluded).
- In-app notifications for these reminders.
- Changing the existing 2-hour post-class overdue reminder.
