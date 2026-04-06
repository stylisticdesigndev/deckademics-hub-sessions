

# Full QA Audit and Security Fix Plan

## Security Issues (to fix)

### Critical (ERROR level)

**1. Storage: "Public access to all buckets" policy allows anyone to read/write/delete ALL files**
- A blanket `ALL` policy with `USING (true) / WITH CHECK (true)` on `storage.objects` for `{public}` role
- Migration: `DROP POLICY "Public access to all buckets" ON storage.objects;`

**2. Instructor hourly_rate exposed to unauthenticated users**
- Policy "Instructors are viewable by everyone" uses `USING (true)` for `{public}`
- Also "Instructors can view and update their own records" is an `ALL` policy on `{public}` (allows unauthenticated writes)
- Migration:
  - Drop "Instructors are viewable by everyone"
  - Create replacement: `FOR SELECT TO authenticated USING (true)`
  - Drop "Instructors can view and update their own records" (redundant — covered by existing self-update and admin policies)

**3. Anyone can inject admin notifications**
- "System can insert notifications" uses `WITH CHECK (true)` for `{public}`
- Migration: Drop this policy. The trigger `notify_admins_new_student` / `notify_admins_new_instructor` already runs as `SECURITY DEFINER`, so it bypasses RLS. No public insert policy is needed.

### Warning level

**4. Raw error messages leaked to users in toasts**
- ~20+ locations across `InstructorStudents.tsx`, `AuthProvider.tsx`, `useAdminAttendance.ts`, `useInstructorAssignment.ts`, `useUpdateStudentLevel.ts`, `AdminStudents.tsx`, etc.
- Fix: Replace `error.message` in user-facing toast descriptions with generic messages; keep `console.error` for debugging
- Files to edit: `src/pages/instructor/InstructorStudents.tsx`, `src/hooks/useInstructorAssignment.ts`, `src/hooks/useAdminAttendance.ts`, `src/hooks/useUpdateStudentLevel.ts`, `src/pages/admin/AdminStudents.tsx`, `src/hooks/instructor/useInstructorDashboard.ts`, `src/hooks/student/useStudentClassAttendance.ts`
- Auth-related errors (login failed, registration failed) can keep showing `error.message` since Supabase sanitizes those already

**5. Leaked password protection disabled** — User needs to enable in Supabase dashboard (Settings > Auth > Password protection). Cannot be fixed via code.

**6. Postgres version needs upgrade** — User needs to upgrade via Supabase dashboard. Cannot be fixed via code.

**7. Duplicate "always true" RLS policies** — The two linter warnings map to the storage and admin_notifications issues above (already addressed).

## Functional QA Findings

**8. Profiles INSERT policy "Allow trigger to create profiles" uses `WITH CHECK (true)` for `{public}`**
- The `handle_new_user` trigger runs as `SECURITY DEFINER` and bypasses RLS, so this blanket policy is unnecessary and allows anyone to insert arbitrary profile rows.
- Migration: Drop this policy.

## Summary of Changes

### Database Migration (single migration)
```sql
-- 1. Remove blanket storage policy
DROP POLICY IF EXISTS "Public access to all buckets" ON storage.objects;

-- 2. Fix instructor public exposure
DROP POLICY IF EXISTS "Instructors are viewable by everyone" ON public.instructors;
DROP POLICY IF EXISTS "Instructors can view and update their own records" ON public.instructors;
CREATE POLICY "Authenticated users can view instructors" ON public.instructors
  FOR SELECT TO authenticated USING (true);

-- 3. Remove public admin notification insert
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- 4. Remove blanket profile insert
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON public.profiles;
```

### Code Changes — Sanitize Error Messages
For each file listed in item 4, replace user-facing `error.message` with generic text like "Something went wrong. Please try again." while keeping `console.error` for developer debugging. Auth error messages (login/signup) are left as-is since they come from Supabase's sanitized auth API.

| File | Change |
|------|--------|
| `src/pages/instructor/InstructorStudents.tsx` | ~7 toast calls: replace `error.message` with generic text |
| `src/hooks/useInstructorAssignment.ts` | 1 toast call |
| `src/hooks/useAdminAttendance.ts` | 3 toast calls |
| `src/hooks/useUpdateStudentLevel.ts` | 1 toast call |
| `src/pages/admin/AdminStudents.tsx` | 2 toast calls |
| `src/hooks/instructor/useInstructorDashboard.ts` | 1 toast call |
| `src/hooks/student/useStudentClassAttendance.ts` | 1 toast call |

### User Action Required (not code-fixable)
- Enable leaked password protection in Supabase Dashboard > Authentication > Settings
- Upgrade Postgres version in Supabase Dashboard > Settings > Infrastructure

### Security Findings to Update/Delete After Fix
- Delete: `storage_public_access_all_buckets`, `admin_notifications_public_insert`, `instructor_hourly_public`, `error_obj_in_toast`
- Update: `SUPA_rls_policy_always_true` (resolved by policy drops), `SUPA_auth_leaked_password_protection` and `SUPA_vulnerable_postgres_version` (mark as requiring user action)

