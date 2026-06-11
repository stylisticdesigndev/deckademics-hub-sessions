## Goal

Add real mobile/desktop push notifications (Phase 3) using the free **Web Push** standard — no Twilio, no email domain, no app store, no monthly cost. Works on Android + desktop browsers immediately, and on iPhone (iOS 16.4+) once the app is added to the home screen. Every major event fires a push to opted-in students, instructors, and admins.

## How it works (plain version)

Each user's device, after they tap "Enable push notifications" and approve the browser prompt, registers a tiny background worker and saves a "subscription" (a device address). When an event happens in the app, the server sends a push to that address, and the phone/computer shows a notification even if the app is closed. Tapping it opens the relevant screen.

## What counts as an event (all of it)

Push is sent to the right recipient for:
- New message (instructor ↔ student ↔ admin)
- Student marks absent / "running late" → instructor
- Instructor marks attendance → student
- New announcement → each targeted role
- New task assigned → student
- New schedule change request → instructor; approve/reject → student
- New student assignment → instructor + student
- Payment created / marked overdue → student

## Setup (one-time, automated, $0)

- Generate a **VAPID key pair** (the free credential the Web Push standard requires). Public key ships in the client; private key + subject are stored as project secrets (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). No external account.

## Implementation

### 1. Database
New migration:
- `push_subscriptions` table: `id`, `user_id`, `endpoint` (unique), `p256dh`, `auth`, `user_agent`, `created_at`. One row per device, so a user can be subscribed on phone + laptop. Includes GRANTs + RLS (users manage only their own rows; service_role full access for the edge function).
- Add `push_notifications boolean default false` to `notification_preferences` (defaults off because it needs explicit browser permission).

### 2. Service worker
- `public/sw.js` — a **messaging-only** worker (push + notificationclick handlers, no app-shell caching). This is the push exception to the no-service-worker preview rule, so it won't serve stale HTML. On `push` it shows the notification; on `notificationclick` it focuses/opens the deep link from the payload.

### 3. Client subscribe flow
- `src/hooks/usePushNotifications.ts` — registers `/sw.js`, requests permission, subscribes via `pushManager.subscribe` with the VAPID public key, and upserts the subscription into `push_subscriptions`. Also handles unsubscribe/cleanup of stale endpoints.
- Update `NotificationPreferencesCard` to add a **Push Notifications** toggle (with an iPhone "add to home screen first" hint). Mount the card on instructor and admin profile pages too (student already has it), so all roles can opt in.

### 4. Edge function
- `supabase/functions/send-push/index.ts` — input `{ recipient_id, title, body, url? }`. Reads the recipient's `notification_preferences.push_notifications` (skip if off), loads their `push_subscriptions`, and sends a Web Push to each device using `web-push` with the VAPID secrets. Deletes dead subscriptions (410/404 responses). Returns a per-device delivery summary.

### 5. Wiring the events
Fire-and-forget `supabase.functions.invoke('send-push', …)` at each existing event site (same pattern as the current `notify-instructor-absence` calls), never blocking the user action:

| Event | File | Recipient |
|---|---|---|
| Student marks absent (dashboard) | `src/components/cards/UpcomingClassCard.tsx` | instructor |
| Student marks absent (classes) | `src/hooks/student/useStudentClassAttendance.ts` | instructor |
| Student running late | `src/components/student/RunningLateButton.tsx` | instructor |
| Instructor marks attendance | `src/hooks/instructor/useInstructorAttendance.ts` | student |
| New message | student + instructor message composers | the receiver |
| New announcement | `src/components/admin/announcements/AnnouncementForm.tsx` | each targeted role |
| New task | task creation hook / `StudentNoteDialog.tsx` | student |
| Schedule change request | `src/hooks/useScheduleChangeRequests.ts` | instructor / student |
| New student assignment | `src/hooks/useStudentAssignment.ts` | instructor + student |
| Payment created/overdue | `src/hooks/useCreatePayment.ts` | student |

## Notes / limitations

- **iPhone:** push only works after the user installs the app to the home screen (one tap from Safari share menu). The toggle will show this hint. Android, Chrome, Edge, and desktop work without install.
- **In-app notification dropdowns stay** as-is; push is an additional channel.
- **Email (Phase 1)** stays parked until DNS is sorted — the `send-push` call sites are structured so a `send-email` call can be added next to each later without rework.

## Files

- New migration: `push_subscriptions` table + `notification_preferences.push_notifications`
- New: `public/sw.js`
- New: `src/hooks/usePushNotifications.ts`
- New: `supabase/functions/send-push/index.ts`
- Edit: `NotificationPreferencesCard.tsx` (+ mount on instructor/admin profiles)
- Edit: the event sites above to invoke `send-push`
- Secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Out of scope
- SMS/Twilio (Phase 2), email (Phase 1, parked), native app store builds (Phase 4), two-way reply from the notification.
