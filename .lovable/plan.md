

# Fix Multiple Admin-Side Issues

## Issues Found

1. **Student-to-instructor assignment error**: The `assignStudentsToInstructor` mutation calls the `assign_student_to_instructor` RPC function, which internally verifies the caller is an admin using `getClaims` -- wait, that's the edge function. The hook uses `supabase.rpc('assign_student_to_instructor')` which is a database function. Need to check if it's the edge function or the RPC being called. The hook (`useStudentAssignment.ts` line 89) calls `supabase.rpc('assign_student_to_instructor')` -- this is the DB function, which requires `SECURITY DEFINER` and doesn't check auth itself. Should work. The error may be an RLS issue on the `students` table -- the admin update policy uses `is_admin()` which calls `has_role(auth.uid(), 'admin')`. This should work. Will add error logging and verify the RPC function works.

2. **Two notification icons in admin header**: In `DashboardLayout.tsx` lines 179-187, there's `<NotificationDropdown />` (the bell with admin_notifications) AND a separate `<Button>` with a `<Bell>` icon (for announcement unread count). For admin users, both show up. Fix: hide the announcement bell for admins since they already have the NotificationDropdown.

3. **Notification badge doesn't clear on click**: The `NotificationDropdown` marks notifications as read on click, but the unread count badge doesn't disappear because the popover stays open and the query takes time to refetch. The real issue is that clicking the bell in the dropdown opens it, but the number on the bell button doesn't react to individual reads until a refetch completes. Fix: optimistically update the count when marking as read/all read.

4. **Active Students should be default tab**: In `AdminStudents.tsx` line 62, `selectedTabValue` defaults to `'pending'`. Change to `'active'`.

5. **Progress page shows novice and intermediate twice**: In `AdminProgress.tsx` line 42, `levelCounts` is hardcoded with `{ novice: 0, amateur: 0, intermediate: 0, advanced: 0 }`. But students in the DB may have `level = 'beginner'` (the default). `beginner` doesn't match any of these keys, so `counts[s.level]` creates a new `beginner` key while `novice` stays at 0. The real levels stored are `beginner`, `novice`, `amateur`, `intermediate`, `advanced`. Fix: include `beginner` in the counts and remove `novice` if it's not actually used, OR map `beginner` to `novice`. Based on the student level select in AdminStudents, the levels are `novice`, `amateur`, `intermediate`, `advanced` -- so `beginner` is a DB default that should be `novice`. The display should show the 4 actual levels used in the UI. Fix the default in the DB and map `beginner` to `novice` in the progress page.

6. **Attendance: admin vs instructor makeup scheduling**: Currently the admin attendance page has mock data (hardcoded `missedAttendance` array with fake "John Doe" data) and the `updateStatus`/`scheduleMakeup` functions are stubs that just log to console. Need to clarify to the user how this works: Instructors manage attendance through their classes page; students can self-mark absent; admin sees a summary. Makeup scheduling is currently only available on the admin side (as a UI stub). Will explain this clearly.

7. **Instructor Payments showing nothing**: The `useInstructorPayments` hook queries `instructor_payments` table. If there are no records in that table, nothing shows. The instructor rates table is also derived from payments data (`instructorsList` in line 48-66 of AdminInstructorPayments), meaning if there are no payments, there are no instructors listed either. Fix: fetch instructors independently from the `instructors` table (with profiles) so the "Instructor Rates" section always shows active instructors regardless of whether payments exist.

8. **Admin not showing all students/instructors**: The students page fetches with `.eq('enrollment_status', 'active')` for active tab and `.eq('enrollment_status', 'pending')` for pending. The `student_progress` table has no admin SELECT policy, which could affect the Progress page but not the Students page. The Messages page fetches ALL profiles via `supabase.from('profiles').select(...)` which works because admin has an "Admins can view all profiles" policy. The Students page only fetches `active` and `pending` -- if any students have other statuses (or null), they won't appear. Need to also check if the admin RLS on `student_progress` is missing (it is -- no admin policy exists).

---

## Plan

### Step 1 -- Fix two notification icons for admin
In `DashboardLayout.tsx`, hide the announcement bell button when `userType === 'admin'` since they already have the `NotificationDropdown`. Only show the announcement bell for student/instructor.

### Step 2 -- Fix notification badge not clearing
In `NotificationDropdown.tsx`, optimistically update the local count. After `markAsRead` or `markAllAsRead`, immediately update the query cache to reflect the read state before the refetch completes.

### Step 3 -- Default to Active Students tab
In `AdminStudents.tsx` line 62, change `useState('pending')` to `useState('active')`.

### Step 4 -- Fix duplicate levels on Progress page
In `AdminProgress.tsx`, map `beginner` level to `novice` when counting. The `levelCounts` object should only have the 4 canonical levels: novice, amateur, intermediate, advanced.

### Step 5 -- Fix Instructor Payments not showing instructors
In `AdminInstructorPayments.tsx`, fetch the instructor list independently from the `instructors` table + profiles instead of deriving it from payments data. This ensures instructors always appear even with zero payment records.

### Step 6 -- Fix admin not seeing all students/instructors
Add missing admin SELECT policy on `student_progress` table. Also verify the Students page query is working -- ensure students with `beginner` level aren't being filtered out erroneously.

### Step 7 -- Fix student-to-instructor assignment error
The `assign_student_to_instructor` DB function should work fine. Check if the error is from the RPC call itself. Add proper error handling and check if the function expects specific parameter types. The function signature is `assign_student_to_instructor(student_id uuid, instructor_id uuid)` which matches the call. Will add better error reporting.

### Step 8 -- Clarify attendance makeup system
Explain to the user how attendance works across roles and note that the admin attendance page currently uses mock data for the missed classes section. The `updateStatus` and `scheduleMakeup` are stubs. Both admin and instructor should be able to schedule makeups, but the student can only mark themselves absent. Will document this in the response.

### Files to modify
- `src/components/layout/DashboardLayout.tsx` -- hide announcement bell for admin
- `src/components/admin/NotificationDropdown.tsx` -- optimistic badge update
- `src/pages/admin/AdminStudents.tsx` -- default tab to 'active'
- `src/pages/admin/AdminProgress.tsx` -- fix level mapping
- `src/hooks/useAdminProgress.ts` -- map beginner to novice
- `src/pages/admin/AdminInstructorPayments.tsx` -- fetch instructors independently
- `src/hooks/useStudentAssignment.ts` -- improve error handling on assignment
- Database migration: add admin SELECT policy on `student_progress`

