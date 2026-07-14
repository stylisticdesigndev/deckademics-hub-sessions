---
name: Guided Tours (Onboarding Walkthrough)
description: Hybrid onboarding — first-login welcome + per-page driver.js coach-marks. Completion tracked in user_onboarding table with localStorage cache. Replay from Profile.
type: feature
---
# Guided Tours

## Architecture
- **Engine**: driver.js (~10KB), themed via `src/lib/tour/driver-theme.css` (dark card, brand green next button, `deckademics-tour` popover class).
- **Persistence**: `public.user_onboarding` table (PK `user_id, tour_id`) with localStorage cache in `useOnboardingState` for zero-flicker gating.
- **Auto-play controller**: `src/components/onboarding/PageTourController.tsx` mounted in each role layout AND each dashboard gate. Watches `useLocation()`; on route match to a registered tour id, waits 500ms then drives.
- **Welcome modal**: `src/components/onboarding/WelcomeModal.tsx`, 3 slides per role, mounted in each dashboard gate. Marks its own `*-welcome-v1` id on Skip/Done.
- **Replay UI**: `src/components/onboarding/TourReplayCard.tsx` on each Profile page. Replay welcome, dropdown-pick any per-page tour, or Reset all.

## Tour registry
`src/lib/tour/tours.ts` — versioned tour ids (`v1` suffix). Bump the version to force a tour to re-play once for existing users.
- STUDENT_TOURS: dashboard, progress, curriculum, classes, notes, messages, announcements, profile.
- INSTRUCTOR_TOURS: dashboard, students, attendance, classes, calendar, curriculum, messages, ledger, profile.
- ADMIN_TOURS: dashboard, instructors, students, curriculum, skills, attendance, payments, instructorPayments, messages, announcements, bugReports, featureRequests, settings, profile.

## Anchoring
Sidebar nav items expose `data-tour="nav-<Title>"` in StudentNavigation, InstructorNavigation, AdminNavigation. Tour steps target `[data-tour="nav-Students"]` etc. Steps whose selector isn't in the DOM are silently filtered; if all filtered, tour is auto-marked seen (no infinite retry).

## Notes
- The existing instructor `GradingWalkthrough` (first-time grading flow) is unrelated and remains.
- Admin visiting `/instructor/dashboard` will see the instructor welcome too — acceptable, dismissible.
- To add a new page tour: add an entry to the appropriate `*_TOURS` map with a fresh `id`; that's it — the controller picks it up.