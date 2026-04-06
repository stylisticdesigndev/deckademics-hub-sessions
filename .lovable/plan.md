
Fix the flicker at the route level, not inside the dashboard page.

What I found
- The current vinyl loader in `InstructorDashboard.tsx`, `StudentDashboard.tsx`, and `AdminDashboard.tsx` is too low in the tree.
- `ProtectedRoute.tsx` only waits for auth/profile/approval. As soon as that finishes, `DashboardLayout` mounts, and then the dashboard page does its own loading. That creates a 2-step render: loader -> dashboard shell -> final content.
- The current replay matches that pattern.
- `AuthProvider.tsx` is also unstable in development because `onAuthStateChange` is not cleaned up while `React.StrictMode` is enabled in `src/main.tsx`, so auth listeners can stack and cause extra rerenders.

Implementation plan
1. Move dashboard loading above the layout
- Create dedicated gated dashboard entry components for instructor, student, and admin.
- Each one will fetch its dashboard data first.
- While loading, render only `<VinylLoader message="Loading dashboard..." />`.
- Only mount `DashboardLayout` after the dashboard is fully ready.

2. Refactor dashboards into content-only views
- Update `InstructorDashboard.tsx`, `StudentDashboard.tsx`, and `AdminDashboard.tsx` so they render dashboard content from already-ready data/props.
- Remove the current page-level full-page loader logic from inside these dashboard views.

3. Update routing
- In `App.tsx`, route `/instructor/dashboard`, `/student/dashboard`, and `/admin/dashboard` through the new gated dashboard components instead of relying on the shared layout route alone.
- Keep the existing shared layout routes for the other pages.

4. Remove delayed secondary fetches
- On the student side, stop using a separate `supabase.auth.getUser()` effect just to get `studentId`; derive it directly from auth state so attendance does not start as a second late-loading phase.
- On the instructor side, keep the ready state false until every dashboard query has finished.

5. Stabilize auth rendering
- Add proper cleanup for the Supabase auth subscription in `AuthProvider.tsx`.
- Prevent duplicate auth listeners so route transitions do not retrigger and flash.

Files likely involved
- `src/App.tsx`
- `src/providers/AuthProvider.tsx`
- `src/pages/instructor/InstructorDashboard.tsx`
- `src/pages/student/StudentDashboard.tsx`
- `src/pages/admin/AdminDashboard.tsx`
- `src/hooks/instructor/useInstructorDashboard.ts`
- New gated dashboard route/page components
- Possibly `src/components/ui/VinylLoader.tsx` if a stricter fullscreen mode is needed

Technical note
- No database changes are needed.
- This is mainly a loading-orchestration issue: the loader must own the whole dashboard route, not sit inside `DashboardLayout`.

Acceptance criteria
- On login or refresh, the vinyl loader stays visible until the full dashboard is ready.
- No sidebar/header/dashboard shell appears early.
- No second flicker when dashboard subqueries finish.
- Instructor, student, and admin dashboards all follow the same behavior.
