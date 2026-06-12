---
name: Push Notification Onboarding Prompt
description: One-time post-onboarding modal inviting students/instructors to enable push notifications
type: feature
---
Opt-in (not opt-out — browsers/iOS forbid silently enabling web push). Modal shown once per user per device.

- Component: src/components/notifications/PushNotificationPrompt.tsx, mounted on StudentDashboard and InstructorDashboard.
- Uses usePushNotifications hook + a localStorage flag `push-prompt-shown:<userId>` so it only ever appears once.
- Only shows when push.supported && !push.enabled. iPhone users not yet added to Home Screen (needsHomeScreen) get an "Add to Home Screen" hint instead of an enable button.
- Buttons: Enable notifications (calls push.enable()), Maybe later (sets flag, dismisses). Manual control still lives in Profile NotificationPreferencesCard.
