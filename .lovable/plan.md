

## Plan: Unified Login + Admin Mode Switcher + RBAC

This is a significant architectural change that consolidates authentication, adds a mode-switching system for admin users, and implements hardcoded permission gates.

### What Changes

**1. Unified Login Flow**
- Remove the separate `/auth/admin` page and the "Administrator Access" link from the landing page
- Remove the separate `AdminAuth.tsx` page
- All users (students, instructors, admins) log in through the existing Student or Instructor auth pages — admins who are also instructors use `/auth/instructor`
- After login, ALL users (including admins) route to their instructor/student dashboard first — not to `/admin/dashboard`
- Update `redirectBasedOnRole` in `AuthProvider.tsx`: admins redirect to `/instructor/dashboard` instead of `/admin/dashboard`

**2. Hardcoded Admin Emails + Permission Constants**
- Create `src/constants/adminPermissions.ts` with:
  - `OWNER_EMAIL = 'nick@deckademics.com'` — full access including Payroll
  - `DEVELOPER_EMAIL = 'djstylistic11@gmail.com'` — full admin except Payroll
  - Helper functions: `isAdminUser(email)`, `isOwner(email)`, `canAccessPayroll(email)`

**3. Admin Mode Switcher**
- For users whose email matches Nick or Evan, add an "Admin Portal" button in the `InstructorNavigation` sidebar (conditionally rendered)
- Clicking it navigates to `/admin/dashboard`
- In `DashboardLayout`, when `userType="admin"`:
  - Change sidebar background color (e.g., dark red/maroon tint)
  - Add a top banner: "ADMINISTRATION MODE" with a "Return to Teaching View" button that navigates back to `/instructor/dashboard`
- Update `ProtectedRoute` to allow admin-role users to access both `/instructor/*` and `/admin/*` routes

**4. Payroll Security Gate**
- In `AdminInstructorPayments.tsx` and `AdminPayments.tsx` (student payments): wrap with an access check using `canAccessPayroll(email)`
- If the user is not Nick, render an "Access Denied" card instead of the page content
- Also hide Payroll nav items in `AdminNavigation` for non-owner admins

**5. Admin Landing Page (Control Center)**
- Redesign `AdminDashboard.tsx` as a split layout:
  - Left side: "DJ School Operations" — links to Students, Instructors, Curriculum, Skills, Attendance, Payments, etc.
  - Right side: "Music Production Operations" — placeholder card with "Coming Soon"

**6. Future-Proofing Roles**
- Add comments and structure in `adminPermissions.ts` for future `admin_dj` and `admin_prod` role types
- The permission helpers will check email first (hardcoded), then fall back to Supabase role checks (for future DB-driven roles)

### Routing Changes
- Remove `/auth/admin` route from `App.tsx`
- Update `ProtectedRoute` so `allowedRoles={['admin']}` routes also accept users with role `'instructor'` IF their email is in the admin list (or better: ensure these users have the `admin` role in the DB already)
- Add `allowedRoles={['admin', 'instructor']}` flexibility for admin routes since Nick/Evan are both instructors and admins

### Files to Create
- `src/constants/adminPermissions.ts`

### Files to Modify
- `src/App.tsx` — remove `/auth/admin` route
- `src/pages/Index.tsx` — remove "Administrator Access" link
- `src/providers/AuthProvider.tsx` — redirect admins to instructor dashboard
- `src/routes/ProtectedRoute.tsx` — allow admin users on instructor routes
- `src/components/navigation/InstructorNavigation.tsx` — add "Admin Portal" button for admin users
- `src/components/navigation/AdminNavigation.tsx` — hide payroll items for non-owner, add "Return to Teaching View" button
- `src/components/layout/DashboardLayout.tsx` — admin mode visual styling (sidebar color, top banner)
- `src/pages/admin/AdminDashboard.tsx` — split Control Center layout
- `src/pages/admin/AdminInstructorPayments.tsx` — payroll access gate
- `src/pages/admin/AdminPayments.tsx` — payroll access gate
- Delete `src/pages/auth/AdminAuth.tsx`

### No Database Changes Required
Nick and Evan should already have the `admin` role in `user_roles`. The hardcoded email checks are an additional application-layer gate. No schema changes needed.

