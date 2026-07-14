---
name: Quick Attendance Push Reminder
description: Push-only in-class attendance reminders (15 min after start, 15 min before end) deep-link to a mobile/tablet-only full-screen swipe deck at /instructor/attendance/quick
type: feature
---

## Reminders
- Edge function `attendance-inclass-reminder-push` runs every 5 min via pg_cron.
- Fires once per (instructor, class_date, class_time, kind) — dedupe table `attendance_inclass_reminder_sent`.
- Two kinds per class: `start` (class_start + 15 min) and `end` (class_end − 15 min).
- Skips instructors whose students in that slot are all already marked for today.
- Push only — no in-app toast, bell badge, or admin_notifications row.
- Requires `notification_preferences.push_notifications = true` and an active `push_subscriptions` row.

## UI
- Push payload URL: `/instructor/attendance/quick?classTime=<slot>`.
- Route `/instructor/attendance/quick` renders `InstructorQuickAttendance` (no dashboard layout chrome).
- Mobile/tablet only. Desktop viewports show a "best on mobile/tablet" screen with a link back to `/instructor/attendance`.
- Body reuses `SwipeAttendanceStack` (photo hero, drag or X/✓ FABs, PRESENT/ABSENT stamps, Undo).
- Dashboard `TodayAttendanceSection` stays the original list — swipe UI lives ONLY on `/instructor/attendance/quick`.