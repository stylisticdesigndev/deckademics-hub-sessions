---
name: Push Notifications (PWA Web Push)
description: Free Web Push (VAPID) notifications for all roles; send-push edge function + notifyPush helpers wired to all major events
type: feature
---
Phase 3 of the notifications roadmap. Real mobile/desktop push via the free Web Push standard (VAPID) — no Twilio, no email domain, no app store, $0.

- VAPID public key lives in code (src/hooks/usePushNotifications.ts and supabase/functions/send-push/index.ts); private key is the VAPID_PRIVATE_KEY secret; subject is mailto:notify@deckademics.com.
- DB: push_subscriptions (one row per device, RLS = own rows only) + notification_preferences.push_notifications boolean (default false; users opt in).
- Service worker: public/sw.js — messaging-only (push + notificationclick), no app-shell caching, so it never serves stale HTML.
- Client hook usePushNotifications handles permission, subscribe/unsubscribe, iOS "add to home screen" hint. Toggle lives in shared NotificationPreferencesCard (mounted on student, instructor, and admin profiles).
- Edge function send-push accepts { recipient_id } OR { target_roles: [] } (server-side fan-out for announcements), checks opt-in, sends via web-push, deletes stale (404/410) subscriptions.
- Fire-and-forget helpers in src/lib/notifyPush.ts: notifyPush(recipientId, title, body, url) and notifyPushRoles(roles, ...). Wired at: messages (student/instructor/admin), absence/late/undo, instructor attendance marking, announcements (all roles), tasks + instructor notes, schedule change request create/approve, student assignment, payment created.
- Student→instructor automated alerts (running late, mark absent, undo absence — RunningLateButton, UpcomingClassCard, useStudentClassAttendance) now fan out SERVER-SIDE via the notify-student-event edge function, called once with notifyStudentEvent(studentId, kind, { date, reason }) from notifyPush.ts. The function validates caller==student_id, resolves ALL instructors (student_instructors primary+secondary, fallback students.instructor_id, plus same-date cover_sessions) with the SERVICE ROLE (no client RLS blind spots — fixes secondary instructors silently missing), inserts the in-app messages, and sends web-push to opted-in instructors (prunes stale 404/410 subs). It returns { ok, notified, pushed }. The OLD client-side loop (per-instructor message insert + notify-instructor-absence/notify-instructor-late + notifyPush) was REMOVED from these three flows because it depended on client RLS visibility and swallowed errors. Instructor-side attendance marking (useInstructorAttendance.markAttendance) is unchanged — it only notifies the STUDENT. Direct thread replies (StudentMessages) stay one-to-one to the chosen instructor.
- iPhone caveat: push only works after Add to Home Screen (iOS 16.4+). Android/desktop work without install.
- notify-instructor-absence / notify-instructor-late edge functions are now legacy (no longer called by student flows; superseded by notify-student-event).
- Email (Phase 1) parked until DNS; SMS/Twilio (Phase 2) skipped.
