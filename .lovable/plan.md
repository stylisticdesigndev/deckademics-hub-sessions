

# Full QA Audit and Security Report — Deckademics DJ School

## Current Security Scan: 11 Findings (5 Critical, 6 Warnings)

---

## SECTION A: SECURITY ISSUES

### CRITICAL — Must Fix

**S1. Instructors can view ALL user profiles (emails, names, bios)**
- Policy `"Instructors can view student profiles"` on `profiles` uses `USING (has_role(auth.uid(), 'instructor'))` with no row filter
- Any instructor sees every user's profile, including other instructors and admins
- Fix: Restrict to `WHERE profiles.id IN (SELECT s.id FROM students s WHERE s.instructor_id = auth.uid())`

**S2. Instructors can view ALL student records (notes, enrollment status, assigned instructor)**
- Policy `"Instructors can view student records"` on `students` uses `get_user_role(auth.uid()) = 'instructor'` with no row filter
- Any instructor can read every student's data, not just their assigned students
- Fix: Change to `WHERE instructor_id = auth.uid()`

**S3. Users may escalate their own role via profile update**
- Policy `"Users can update their own profile"` checks `role = get_profile_role(auth.uid())` in WITH CHECK
- Due to Postgres transaction timing, this may not reliably prevent role changes
- Fix: Use a BEFORE UPDATE trigger that prevents changing the `role` column, or use a column-specific grant

**S4. Private student notes broadcast to all Realtime subscribers**
- `student_notes` is published to Supabase Realtime but has no policies on `realtime.messages`
- Any authenticated user can subscribe and receive all note changes
- Fix: Either remove `student_notes` from Realtime publication, or add authorization policies on `realtime.messages`

**S5. Private message attachments are publicly readable**
- The `message-attachments` bucket is public and the SELECT policy allows unauthenticated access
- Fix: Make bucket private, or restrict SELECT to authenticated users who are the sender/receiver of the related message

### WARNINGS — Should Fix

**S6. Several student table policies apply to `{public}` instead of `{authenticated}`**
- 9 policies on `students` table use `{public}` role (INSERT, DELETE, UPDATE, SELECT)
- While they use `is_admin()` or `auth.uid()`, applying to `{public}` is incorrect practice
- Fix: Change all to `{authenticated}`

**S7. Any authenticated user can upload background videos**
- Multiple overlapping INSERT policies on `background-videos` bucket
- Fix: Restrict uploads to admin users only; deduplicate overlapping policies

**S8. Instructor schedule self-management policy applies to `{public}`**
- `"Instructors can manage their own schedules"` uses `{public}` instead of `{authenticated}`
- Fix: Change to `{authenticated}`

**S9. No Realtime channel authorization**
- No RLS policies on `realtime.messages` — any authenticated user can subscribe to any topic
- Fix: Add policies on `realtime.messages` scoping by `auth.uid()`

**S10. Leaked password protection disabled** — Must enable in Supabase Dashboard > Auth > Settings

**S11. Postgres version needs security patches** — Must upgrade in Supabase Dashboard > Settings > Infrastructure

### PREVIOUSLY FIXED (confirmed resolved)
- Blanket storage policy dropped
- Instructor public exposure restricted to authenticated
- Public admin notification insert removed
- Blanket profile insert removed
- Error messages sanitized in toasts

---

## SECTION B: FUNCTIONAL QA FINDINGS

### B1. Duplicate/Overlapping Policies (technical debt)
- `students` table has both `"Admins can view all student records"` (ALL) and `"Admins can view any student record"` (SELECT) — redundant
- `"Instructors can update assigned students"` exists twice (one `{authenticated}`, one `{public}`)
- `background-videos` has 3 SELECT, 2 INSERT, 2 DELETE, 2 UPDATE policies — should consolidate

### B2. `Instructors can update their own information` on `instructors` table still uses `{public}`
- Line 602-607 in schema: `Applies to: {public}`, `USING: auth.uid() = id`
- Should be `{authenticated}`

### B3. `as any` casts throughout codebase
- `progress_skills` and `student_tasks` are cast as `any` in multiple hooks because they're not in the generated Supabase types
- Fix: Regenerate `src/integrations/supabase/types.ts` to include these tables, then remove casts

### B4. `console.log` statements in production
- Extensive debug logging throughout `AuthProvider.tsx`, `useInstructorDashboard.ts`, `InstructorStudents.tsx`
- All guarded by `import.meta.env.DEV` in AuthProvider (good), but NOT guarded in hooks/pages
- Fix: Gate remaining console.logs behind `import.meta.env.DEV`

### B5. Navigation components call `supabase.auth.getUser()` separately
- `StudentNavigation`, `InstructorNavigation`, `AdminNavigation` each make a redundant `getUser()` call
- Should derive userId from `useAuth()` context instead

### B6. Hardcoded course_id in InstructorStudents.tsx
- Line 275: `course_id: '04e2bb7f-e11c-44e0-8153-399b93923e3b'` — hardcoded UUID
- Should be dynamic or configurable

### B7. AdminStudents loading state uses Loader2 spinner, not VinylLoader
- Line 244-249: Uses `<Loader2 className="h-8 w-8 animate-spin" />` instead of `<VinylLoader />`
- Same issue in `AdminAttendance.tsx` (line 27-33) and `AdminPayments.tsx`

### B8. Announcements SELECT policy allows unauthenticated access
- `"Announcements are viewable by everyone"` uses `{public}` with `USING (true)`
- Same for `courses` and `classes` tables
- Low risk since these are semi-public data, but should be restricted to `{authenticated}` for consistency

---

## SECTION C: IMPLEMENTATION PLAN

### Database Migration (single migration file)

```sql
-- S1: Restrict instructor profile access to assigned students only
DROP POLICY IF EXISTS "Instructors can view student profiles" ON public.profiles;
CREATE POLICY "Instructors can view assigned student profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND id IN (SELECT s.id FROM public.students s WHERE s.instructor_id = auth.uid())
  );

-- S2: Restrict instructor student record access
DROP POLICY IF EXISTS "Instructors can view student records" ON public.students;
CREATE POLICY "Instructors can view assigned student records" ON public.students
  FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

-- S3: Prevent role escalation via profile update
-- Replace the WITH CHECK to explicitly prevent role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = get_profile_role(auth.uid()));

-- S4: Remove student_notes from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.student_notes;

-- S5: Restrict message-attachments to authenticated users
DROP POLICY IF EXISTS "Anyone can view message attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view message attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'message-attachments');

-- S6: Fix student table policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can create student records" ON public.students;
CREATE POLICY "Admins can create student records" ON public.students
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete any student record" ON public.students;
CREATE POLICY "Admins can delete any student record" ON public.students
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any student record" ON public.students;
CREATE POLICY "Admins can update any student record" ON public.students
  FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all student records" ON public.students;
-- This ALL policy is redundant with the specific ones, drop it

DROP POLICY IF EXISTS "Admins can view any student record" ON public.students;
CREATE POLICY "Admins can view any student record" ON public.students
  FOR SELECT TO authenticated USING (is_admin());

-- Remove duplicate instructor update policy
DROP POLICY IF EXISTS "Instructors can update their assigned students" ON public.students;

DROP POLICY IF EXISTS "Students can update their own information" ON public.students;
CREATE POLICY "Students can update their own information" ON public.students
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own student record" ON public.students;
CREATE POLICY "Users can view their own student record" ON public.students
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- S7: Restrict background video uploads to admins
DROP POLICY IF EXISTS "Anyone can upload background videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload background videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'background-videos' AND has_role(auth.uid(), 'admin'::app_role));

-- Deduplicate SELECT policies on background-videos
DROP POLICY IF EXISTS "Anyone can view background videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- Keep only "Public read for background videos"

-- Deduplicate DELETE/UPDATE policies
DROP POLICY IF EXISTS "Users can delete their own background videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own background videos" ON storage.objects;
-- Keep "Authenticated users can delete/update their own videos"

-- S8: Fix instructor schedule policy
DROP POLICY IF EXISTS "Instructors can manage their own schedules" ON public.instructor_schedules;
CREATE POLICY "Instructors can manage their own schedules" ON public.instructor_schedules
  FOR ALL TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- B2: Fix instructor self-update policy
DROP POLICY IF EXISTS "Instructors can update their own information" ON public.instructors;
CREATE POLICY "Instructors can update their own information" ON public.instructors
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- B8: Restrict announcements/courses/classes to authenticated
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements viewable by authenticated" ON public.announcements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses viewable by authenticated" ON public.courses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Classes are viewable by everyone" ON public.classes;
CREATE POLICY "Classes viewable by authenticated" ON public.classes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Instructors can update their own classes" ON public.classes;
CREATE POLICY "Instructors can update their own classes" ON public.classes
  FOR UPDATE TO authenticated USING (instructor_id = auth.uid());

-- Fix remaining {public} policies on other tables
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
```

### Code Changes

| File | Change |
|------|--------|
| `src/components/navigation/StudentNavigation.tsx` | Use `useAuth()` instead of `supabase.auth.getUser()` |
| `src/components/navigation/InstructorNavigation.tsx` | Same |
| `src/components/navigation/AdminNavigation.tsx` | Same |
| `src/pages/admin/AdminStudents.tsx` | Replace `Loader2` with `VinylLoader` |
| `src/pages/admin/AdminAttendance.tsx` | Replace `Loader2` with `VinylLoader` |
| `src/pages/admin/AdminPayments.tsx` | Replace `Loader2` with `VinylLoader` |
| `src/hooks/instructor/useInstructorDashboard.ts` | Gate console.logs behind `import.meta.env.DEV` |
| `src/pages/instructor/InstructorStudents.tsx` | Gate console.logs; remove hardcoded course_id (use a lookup) |

### Security Findings to Update After Fix
- Delete resolved findings from the security scanner
- Mark S10/S11 as requiring manual user action in Supabase Dashboard

### User Action Required (cannot fix via code)
1. Enable leaked password protection: Supabase Dashboard > Authentication > Settings
2. Upgrade Postgres version: Supabase Dashboard > Settings > Infrastructure

