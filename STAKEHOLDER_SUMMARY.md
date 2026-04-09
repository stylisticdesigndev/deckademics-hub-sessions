# Deckademics DJ School — Stakeholder Handoff Summary

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS v3, shadcn/ui components |
| State / Data | TanStack Query v5, React Context |
| Backend / Auth | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| Routing | React Router v6 |

---

## Authentication Flow

1. **Sign Up** — User registers via `/auth/student`, `/auth/instructor`, or `/auth/admin`.
   - Supabase `auth.signUp()` is called with role metadata (`first_name`, `last_name`, `role`).
   - A database trigger (`handle_new_user`) automatically creates rows in `profiles`, `user_roles`, and the role-specific table (`students` or `instructors`).

2. **Approval Gate** — Students and instructors start with `pending` status.
   - The `ProtectedRoute` component checks `enrollment_status` (students) or `status` (instructors).
   - Pending users see a "Pending Approval" screen until an admin approves them.

3. **Login** — `supabase.auth.signInWithPassword()`. Session is persisted in localStorage and auto-refreshed.

4. **Role-Based Routing** — The `ProtectedRoute` component enforces `allowedRoles` per route group:
   - `/student/*` → `['student']`
   - `/instructor/*` → `['instructor']`
   - `/admin/*` → `['admin']`

5. **Password Reset** — "Forgot Password" triggers `resetPasswordForEmail()` with `redirectTo` pointing to `/reset-password`. The reset page calls `supabase.auth.updateUser({ password })`.

6. **Photo Gate** — Students without a profile photo are redirected to `/student/photo-upload` before accessing the dashboard.

---

## Role System

Roles are stored in a dedicated `user_roles` table (not on the `profiles` table) to prevent privilege escalation:

```
user_roles (user_id UUID, role app_role)
```

A `has_role(_user_id, _role)` security-definer function is used in all RLS policies instead of querying `user_roles` directly, preventing recursive RLS issues.

---

## Demo Mode

Demo mode is a stakeholder-facing feature that substitutes live database data with static mock data so dashboards appear fully populated without requiring real records.

### How to find it

Search the codebase for `===== DEMO MODE` to find all usage sites.

### Files containing demo data

| File | Purpose |
|---|---|
| `src/data/mockDashboardData.ts` | Student dashboard mock data |
| `src/data/mockInstructorData.ts` | Instructor dashboard mock data |

### Files containing demo toggle logic

| File | What it does |
|---|---|
| `src/pages/student/StudentDashboardGate.tsx` | `demoMode` state |
| `src/pages/student/StudentDashboard.tsx` | Swaps live → mock data |
| `src/pages/instructor/InstructorDashboardGate.tsx` | `demoMode` state |
| `src/pages/instructor/InstructorDashboard.tsx` | Swaps live → mock data |

### How to remove demo mode later

1. Delete `src/data/mockDashboardData.ts` and `src/data/mockInstructorData.ts`.
2. Remove all code between `// ===== DEMO MODE START =====` and `// ===== DEMO MODE END =====` markers.
3. Remove the Demo/Live Data toggle button from the dashboard headers.

---

## Security Measures

- **Row Level Security (RLS)** is enabled on all tables. Policies use `has_role()` to gate access.
- **Instructor isolation** — Instructors can only view profiles and records of their assigned students.
- **Role escalation prevention** — A profile update policy explicitly blocks changing the `role` column.
- **Environment-only credentials** — Supabase URL and anon key are sourced from `.env` variables; no hardcoded fallbacks in the codebase.
- **Password policy** — Minimum 8 characters with uppercase, lowercase, number, and special character requirements enforced in the UI.
- **Console logging** — All `console.log` statements are gated behind `import.meta.env.DEV` and stripped from production builds.
- **Storage buckets** — `message-attachments` bucket is restricted to authenticated users.

---

## Bug Reporting

Students and instructors can submit bug reports via the **Report a Bug** button available in the navigation sidebar. Reports are stored in the `bug_reports` table and surfaced on the Admin Bug Reports page.

- **Badge** — The admin sidebar shows a badge with the count of `open` and `in_progress` reports.
- **Badge clears** — The badge count decreases only when an admin changes a report's status to `resolved` or `closed`.

---

## PWA — Installable Web App

The app is configured as a Progressive Web App (PWA) so users can "install" it to their phone's home screen. There is **no service worker** — this is a manifest-only setup for installability.

### What's configured

| Item | Detail |
|---|---|
| `public/manifest.json` | App name, icons, standalone display, brand colors |
| `index.html` | `<link rel="manifest">`, Apple meta tags, theme-color |
| `public/app-icon.png` | Home screen icon (Deckademics logo) |
| `src/components/pwa/IOSSplashScreen.tsx` | Branded splash on launch (standalone mode only) |

### Brand colours used

- **Background** (splash / Android splash): `#222730`
- **Theme** (status bar): `#41A55B`

---

## Student Setup Guide — "Installing" the App

### On iPhone (Safari)

1. Open the app URL in **Safari** (not Chrome).
2. Tap the **Share** button (square with arrow at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name ("Deckademics Hub") and tap **Add**.
5. The Deckademics icon will appear on your home screen.
6. Tap it to launch — the app opens full-screen without browser UI.
7. On first launch you'll see a brief splash screen with the Deckademics logo.

### On Android (Chrome)

1. Open the app URL in **Chrome**.
2. Tap the **three-dot menu** (⋮) in the top-right.
3. Tap **"Add to Home screen"** (or "Install app" if prompted).
4. Confirm and tap **Add**.
5. The Deckademics icon appears on your home screen.
6. Tap it to launch — Chrome generates a splash screen automatically using the app icon and brand colours.

### What to expect

- **Icon**: The Deckademics logo on your home screen.
- **Splash screen**: A dark background (`#222730`) with the logo centred — appears briefly on launch.
- **Standalone mode**: The browser address bar and navigation are hidden — the app feels like a native app.
- **Note**: This is a web app, not a native App Store download. An internet connection is required.

---

## Manual Supabase Dashboard Items (Pending)

These items require manual configuration in the Supabase Dashboard and cannot be automated via code:

1. **Leaked password protection** — Enable at: Authentication → Settings → Attack Protection.
2. **Postgres version upgrade** — Check at: Settings → Infrastructure. May require removing the `pgjwt` extension first.

---

## Key File Map

| Area | Primary Files |
|---|---|
| Auth Provider | `src/providers/AuthProvider.tsx` |
| Supabase Client | `src/integrations/supabase/client.ts` |
| Route Protection | `src/routes/ProtectedRoute.tsx` |
| Student Dashboard | `src/pages/student/StudentDashboardGate.tsx`, `StudentDashboard.tsx` |
| Instructor Dashboard | `src/pages/instructor/InstructorDashboardGate.tsx`, `InstructorDashboard.tsx` |
| Admin Dashboard | `src/pages/admin/AdminDashboard.tsx` |
| Database Types | `src/integrations/supabase/types.ts` (auto-generated, read-only) |
| Edge Functions | `supabase/functions/` |
| PWA Manifest | `public/manifest.json` |
| iOS Splash | `src/components/pwa/IOSSplashScreen.tsx` |
| Bug Reports | `src/pages/admin/AdminBugReports.tsx`, `src/components/bugs/BugReportDialog.tsx` |
