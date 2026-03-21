

# Deckademics DJ School - Site Audit & Improvement Plan

## Summary of Findings

After a deep dive through the entire codebase, here are issues and improvements organized by severity.

---

## Critical Issues (Bugs / Incorrect Behavior)

### 1. Admin Navigation has hardcoded badge counts
`AdminNavigation.tsx` lines 21-22 have hardcoded values:
```
const pendingInstructorsCount = 2;
const pendingStudentsCount = 5;
```
These should be fetched from the database dynamically.

### 2. Admin Dashboard has hardcoded payment stats
`AdminDashboard.tsx` lines 129-130 show hardcoded "Pending: 3" and "Overdue: 2" instead of querying real payment data.

### 3. Student Classes page uses random attendee count
`StudentClasses.tsx` line 142: `attendees: Math.floor(Math.random() * 8) + 3` generates random attendee numbers on every render. Should query actual enrollment counts.

### 4. Admin Auth page creates a nested AuthProvider
`AdminAuth.tsx` line 185 wraps content in a second `<AuthProvider>`, but `AuthProvider` is already in `main.tsx`. This creates a duplicate provider with its own state, potentially causing auth issues on the admin login page.

### 5. Instructor Auth page missing video background
The user added video backgrounds to home (`/`) and student auth (`/auth/student`), but instructor auth (`/auth/instructor`) still uses plain `bg-black`. Based on the user's memory note, this should be consistent.

### 6. Admin Auth page missing video background
Same issue as instructor auth -- still uses `bg-black`.

---

## Moderate Issues (UX / Consistency)

### 7. Student navigation missing "Classes" link
The `StudentNavigation.tsx` does not include a link to `/student/classes`, even though the route and page exist. Students can only reach it via direct URL.

### 8. Instructor Messages page icon inconsistency
In `InstructorNavigation.tsx`, "Messages" uses the `Bell` icon while "Announcements" uses `MessageSquare`. These seem swapped -- messages should use `MessageSquare` and announcements/notifications should use `Bell`.

### 9. No "Student Payments" link for students
Students have a payments page viewable via the admin side, but there's no navigation item for students to see their own payment history. The `payments` table has an RLS policy allowing students to view their own payments.

### 10. Admin profile route goes to non-existent page
The DashboardLayout routes admin users to `/admin/profile` on "Profile" click, but there's no `/admin/profile` route -- only `/admin/profile-setup`.

---

## Minor Issues (Code Quality)

### 11. Excessive console logging
Many files have verbose `console.log` calls that should be behind `DEV` checks or removed for production.

### 12. Duplicate RLS policies on several tables
Tables like `profiles`, `instructors`, and `students` have redundant SELECT/UPDATE policies (e.g., "Admins can update instructor records" and "Admins can update instructors" on the `instructors` table).

### 13. `announcement_reads` foreign keys not enforced
The `announcement_reads` table has `user_id` and `announcement_id` columns but no foreign key constraints shown, which could lead to orphaned records.

---

## Implementation Plan

### Phase 1: Fix Critical Bugs
1. **Fix hardcoded admin nav badges** - Query `get_student_counts()` and `get_instructor_counts()` RPCs in `AdminNavigation.tsx`
2. **Fix hardcoded payment stats** - Query actual payment data from the `payments` table in `AdminDashboard.tsx`
3. **Remove nested AuthProvider** in `AdminAuth.tsx` - Use the existing provider from `main.tsx`
4. **Fix random attendee count** - Query actual enrollment count per class in `StudentClasses.tsx`

### Phase 2: Add Missing Navigation & Consistency
5. **Add "Classes" to StudentNavigation** - Add Calendar icon link to `/student/classes`
6. **Add video background to Instructor Auth** - Match student auth page pattern
7. **Add video background to Admin Auth** - Match student auth page pattern  
8. **Swap icons** in InstructorNavigation (Bell ↔ MessageSquare)
9. **Fix admin profile route** - Either create an admin profile page or point to `/admin/settings`

### Phase 3: Enhancements
10. **Add Student Payments page** - Create a page at `/student/payments` showing the student's own payment history
11. **Clean up console logs** - Wrap in `import.meta.env.DEV` checks

### Technical Details
- Admin nav badges: Use `useAdminStudents` and `useAdminInstructors` hooks already available
- Payment stats: Query `payments` table filtered by `status = 'pending'` and overdue logic
- Video background: Import `VideoBackground` component, remove `bg-black` class, same pattern as `StudentAuth.tsx`
- Nested AuthProvider: Simply remove the `<AuthProvider>` wrapper in `AdminAuth.tsx` since it's already provided at the app level

