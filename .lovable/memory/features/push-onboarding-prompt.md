---
name: Push Notification Onboarding Prompt
description: Weekly recurring modal inviting students/instructors to enable push notifications
type: feature
---
Opt-in (not opt-out — browsers/iOS forbid silently enabling web push). Modal re-prompts every 7 days until enabled.

- Component: src/components/notifications/PushNotificationPrompt.tsx, mounted on StudentDashboard and InstructorDashboard.
- Uses usePushNotifications hook + localStorage key `push-prompt-shown:<userId>` storing a timestamp (ms). Suppressed for 7 days after each show/dismiss (PROMPT_INTERVAL_MS).
- Only shows when push.supported && !push.enabled. iPhone users not yet added to Home Screen (needsHomeScreen) get an "Add to Home Screen" hint instead of an enable button.
- Buttons: Enable notifications (calls push.enable()), Maybe later (records timestamp, dismisses). Manual control still lives in Profile NotificationPreferencesCard.
