---
name: In-Class Push Reminders (Attendance + Class Notes)
description: Two push nudges per class — attendance 15 min after start (swipe attendance deck), class-notes 15 min before end (per-student swipe notes deck for primary students only)
type: feature
---

## Reminders
- Edge function `attendance-inclass-reminder-push` runs every 5 min via pg_cron.
- Fires once per (instructor, class_date, class_time, kind) — dedupe table `attendance_inclass_reminder_sent`.
- Two kinds per class:
  - `start` — class_start + 15 min → attendance nudge (primary + secondary + cover; skipped when all students in the slot are already marked).
  - `end` — class_end − 15 min → class-notes nudge (PRIMARY/SECONDARY only, no covers; skipped when the instructor already wrote a note today for every remaining primary student in that slot).
- Push only — no in-app toast, bell badge, or admin_notifications row.
- Requires `notification_preferences.push_notifications = true` and an active `push_subscriptions` row.

## UI
- Attendance push URL: `/instructor/attendance/quick?classTime=<slot>` → `InstructorQuickAttendance` swipe deck (present/absent).
- Notes push URL: `/instructor/notes/quick?classTime=<slot>` → `InstructorQuickNotes` per-student card deck (photo + textarea + Save/Skip). Saves to `student_notes`.
- Both routes are mobile/tablet only; desktop shows a "best on mobile" screen with a link back.
- Cover/makeup students are excluded from the notes deck — their notes are added manually from the student profile.