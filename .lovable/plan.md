

# Approval Gate for New Students and Instructors

## Current behavior
- **Students**: `enrollment_status` defaults to `'active'` — they get full dashboard access immediately after signup
- **Instructors**: `status` defaults to `'pending'` — but the app doesn't block them; they still access the dashboard

## What changes

### 1. Database migration
- Change `students.enrollment_status` default from `'active'` to `'pending'`
- This ensures new student signups land in the admin Pending Approvals tab

### 2. New "Awaiting Approval" page (`src/pages/PendingApproval.tsx`)
- Simple centered page with the Deckademics logo, a message like "Your account is awaiting admin approval", and a sign-out button
- Shared by both students and instructors

### 3. Update `ProtectedRoute.tsx` to check approval status
- After confirming the user has the correct role, fetch their status:
  - **Students**: query `students` table for `enrollment_status`
  - **Instructors**: query `instructors` table for `status`
- If status is `'pending'`, render the PendingApproval page instead of `<Outlet />`
- Admins are never gated

### 4. Update `AuthProvider.tsx` redirect logic
- After sign-in, if the user is a pending student/instructor, redirect to `/pending-approval` (or just let ProtectedRoute handle it inline — no new route needed)

### 5. Add route for pending approval page
- Add `/pending-approval` as a simple authenticated route in `App.tsx` (or handle it inline in ProtectedRoute without a separate route)

## Files to edit

| File | Change |
|------|--------|
| **Migration SQL** | `ALTER TABLE students ALTER COLUMN enrollment_status SET DEFAULT 'pending'` |
| `src/routes/ProtectedRoute.tsx` | After role check passes, fetch student/instructor status; if pending, render PendingApproval component |
| `src/pages/PendingApproval.tsx` | New page: logo + "Awaiting Approval" message + sign-out button |
| `src/providers/AuthProvider.tsx` | No redirect change needed — ProtectedRoute handles the gate |

## How it works end to end

1. New student signs up → `handle_new_user` trigger inserts into `students` with `enrollment_status = 'pending'`
2. Student logs in → ProtectedRoute detects pending status → shows "Awaiting Approval" page
3. Admin approves student in Pending tab → status becomes `'active'`
4. Student refreshes or logs in again → ProtectedRoute sees active status → shows dashboard
5. Same flow for instructors (already defaults to `'pending'`)

