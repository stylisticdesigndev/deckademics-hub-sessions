

# Fix All Security Scan Errors and Warnings

## Issues to Fix

### ERRORS (2)

**1. `get_all_users()` exposes all user data to any authenticated user**
- The function has no authorization check — any logged-in user can dump all profiles
- Fix: Add `has_role(auth.uid(), 'admin')` guard inside the function

**2. Users can self-escalate role via profile UPDATE**
- Two duplicate UPDATE policies on `profiles` allow users to change their own `role` column to `'admin'`
- `is_admin()` checks `profiles.role` (not `user_roles`), so escalation works
- Fix: Replace duplicate UPDATE policies with one that prevents role changes; update `is_admin()` and `admin_create_instructor()` to use `has_role()` instead of `profiles.role`

### WARNINGS (2 fixable in code)

**3. Raw error objects in toast messages** (`InstructorStudents.tsx`)
- Lines 287 and 482 interpolate `${error}` into user-visible toasts
- Fix: Use generic message, log error to console only

**4. RLS policy always true** — `profiles` INSERT policy `WITH CHECK (true)` for the trigger
- This is needed for the `handle_new_user` trigger which runs as the service role, so it's intentional. Will leave as-is since the trigger needs it.

### WARNINGS (infrastructure — not fixable in code)
- Leaked password protection: Dashboard setting
- Function search path mutable: `get_user_role` is missing `SET search_path` — fixable in migration
- Postgres version: Dashboard action
- Permissive RLS `WITH CHECK (true)` on profiles INSERT: needed for auth trigger

## Plan

### 1. SQL Migration — Fix `get_all_users`, `is_admin`, `admin_create_instructor`, profile UPDATE policies, `get_user_role` search path

```sql
-- 1. Add admin guard to get_all_users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id uuid, email text, first_name text, last_name text, role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT p.id, p.email, p.first_name, p.last_name, p.role::text FROM public.profiles p;
END;
$$;

-- 2. Fix is_admin() to use user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

-- 3. Fix admin_create_instructor to use has_role
CREATE OR REPLACE FUNCTION public.admin_create_instructor(...)
  -- Add has_role check instead of profiles.role check

-- 4. Drop duplicate profile UPDATE policies, create restricted one
DROP POLICY "Users can update their own profile" ON profiles;
DROP POLICY "Users can update their own profiles" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- 5. Fix get_user_role search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
  ... SET search_path = public ...
```

### 2. `src/pages/instructor/InstructorStudents.tsx` — Sanitize error toasts
- Line 287: Change to generic message `'An unexpected error occurred. Please try again.'`
- Line 482: Same fix

### Files Changed
- SQL migration (new)
- `src/pages/instructor/InstructorStudents.tsx`

