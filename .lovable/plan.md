## Onboarding Walkthrough

Add a hybrid onboarding system: a short first-login welcome, plus contextual coach-mark tours the first time a user visits each major page. All tours are skippable and replayable from the Profile page.

### 1. Tour engine

- Add `driver.js` (small, framework-agnostic tour library, ~10KB) as the coach-mark engine. Themed to match the app (dark background, brand green accents, rounded corners).
- Wrap it in a single `useTour(tourId, steps)` hook that:
  - Reads/writes completion state to a new `user_onboarding` table (per user, per tour id) so progress follows the user across devices.
  - Falls back to `localStorage` if the row hasn't loaded yet, to avoid flicker.
  - Exposes `start()`, `reset()`, `hasSeen`.

### 2. First-login welcome

- A 3-slide modal shown once per user right after they land on their dashboard for the first time:
  1. What the app does (role-specific one-liner).
  2. Where the main things live (sidebar tour teaser).
  3. Where to get help / replay tours later (Profile → Replay tour).
- Buttons: **Skip**, **Back**, **Next**, **Start tour** (last slide → kicks off the dashboard page tour).

### 3. Per-page coach-mark tours

First visit to each page auto-starts a short tour (3–6 steps). Steps highlight real elements via `data-tour="..."` attributes added to existing components — no layout changes.

**Student tours:** Dashboard, Classes, Progress/Skills, Curriculum, Messages, Notes, Announcements, Profile.
**Instructor tours:** Dashboard, Students, Attendance, Classes, Calendar, Curriculum, Messages, Ledger, Profile.
**Admin tours:** Dashboard, Instructors, Students, Curriculum, Skills, Payments, Instructor Payments, Announcements, Bug Reports, Feature Requests, Settings, Profile.

Note: the existing instructor `GradingWalkthrough` stays as-is (it's a deeper grading-specific flow) and will be linked from the Instructor Students tour.

### 4. Skip & replay

- Every step has **Skip tour** and **Next/Back**. ESC also skips.
- Profile page (all three roles) gets a new **"App walkthrough"** card with:
  - **Replay welcome** button.
  - **Replay tour for this page…** dropdown listing all tours available to that role — clicking one navigates to the page and starts the tour.
  - **Reset all tours** (marks everything unseen so tours re-trigger naturally).

### 5. Data model

New table `public.user_onboarding`:
- `user_id uuid` (FK auth.users, cascade)
- `tour_id text`
- `completed_at timestamptz default now()`
- PK `(user_id, tour_id)`
- RLS: users can select/insert/delete their own rows only. Grants per project convention.

### 6. Docs

- Update `docs/user-guide/{student,instructor,admin}-guide.md` with a short "Guided tours" section explaining auto-tours and how to replay from Profile.
- Rebuild PDFs via `python docs/user-guide/generate_pdfs.py --sync`.
- Add a Change Log entry.

### Technical notes

- New files: `src/lib/tour/driver-theme.css`, `src/hooks/useTour.ts`, `src/hooks/useOnboardingState.ts`, `src/components/onboarding/WelcomeModal.tsx`, `src/components/onboarding/TourReplayCard.tsx`, `src/lib/tour/tours/{student,instructor,admin}.ts` (step definitions).
- Mount `WelcomeModal` inside the three `*DashboardGate` components so it only appears after data loads.
- Add `data-tour="..."` markers to existing sidebar nav items, key headers, primary action buttons — no behavior changes.
- Migration adds `user_onboarding` with grants (`authenticated`, `service_role`) and RLS policies scoped to `auth.uid()`.
- No changes to auth, routes, or business logic.

### Out of scope

- Video tutorials (docs memory notes those will replace PDFs later — separate effort).
- Analytics on tour completion (can be added later against `user_onboarding`).
