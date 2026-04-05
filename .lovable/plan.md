

# Admin Side Audit: Gaps vs Student & Instructor Sides

## Findings

After reviewing all admin pages, navigation, hooks, and comparing them with the student and instructor sides, here are the gaps and inconsistencies:

---

### 1. No Admin Profile Page (Missing Page)

Both student and instructor sides have a dedicated Profile page (`/student/profile`, `/instructor/profile`) where users can view/edit their avatar, name, bio, etc. The admin side only has a one-time ProfileSetup page but no persistent profile page in the dashboard layout and no Profile nav item in the sidebar.

**Fix**: Create `src/pages/admin/AdminProfile.tsx` mirroring the instructor/student profile pages (avatar upload, name editing, etc.). Add a route at `/admin/profile` and a "Profile" nav item in `AdminNavigation.tsx`.

---

### 2. No Admin Messages Page (Missing Feature)

Both student and instructor sides have a full messaging system with conversational threads, compose functionality, and unread badges. The admin side has no messages page at all -- admins cannot communicate with instructors or students through the app.

**Fix**: Create `src/pages/admin/AdminMessages.tsx` using the same conversation-based pattern as `InstructorMessages.tsx`. Admin should be able to message any user (students and instructors). Add route at `/admin/messages` and a "Messages" nav item with unread badge in `AdminNavigation.tsx`.

---

### 3. Admin Navigation Missing Badge Component (Inconsistency)

The student and instructor navigations use the shadcn `Badge` component for unread counts. The admin navigation uses a raw `<span>` with manual styling for pending counts. This is inconsistent visually.

**Fix**: Switch admin nav badges to use the `Badge` component matching the student/instructor pattern.

---

### 4. Student "View Details" Dialog is Barebones (Gap)

When an admin clicks "View Student" in the Students page, the dialog shows only 5 fields (name, email, level, status, instructor). The instructor side shows far more detail when viewing a student: progress breakdown, notes, attendance history, tasks.

**Fix**: Expand the admin "View Student" dialog to include: overall progress (auto-calculated), start date, and a link/button to quickly navigate to related admin pages (attendance, payments) for that student.

---

### 5. Debug Tab Still Visible in AdminStudents (Cleanup)

The AdminStudents page has a visible "Debug Info" tab that exposes raw database JSON. This should be removed or hidden before handing to the school owner.

**Fix**: Remove the debug tab and the `debugFetchStudents` / `handleDebugRefresh` related code from `AdminStudents.tsx`.

---

### 6. "Student Payments" Nav Icon is Calendar (Minor)

The admin nav uses a `Calendar` icon for "Student Payments" which is confusing. Should use `DollarSign` or similar to match the payments concept. The instructor payments already uses `DollarSign`.

**Fix**: Change the Student Payments icon from `Calendar` to a more appropriate payment icon like `CreditCard` or use a different icon to differentiate from Instructor Payments.

---

### 7. No "Create Admin" Feature (Gap)

The admin side can create instructors (via edge function) and demo students, but there is no way to create additional admin accounts from within the app. The school owner will need this to grant admin access to trusted staff.

**Fix**: Add an "Add Admin" dialog in the Admin Settings page (similar to the "Add Instructor" flow) that creates a new user with the admin role via an edge function.

---

## Plan Summary

| # | Priority | Change | File(s) |
|---|----------|--------|---------|
| 1 | High | Create Admin Profile page | New `AdminProfile.tsx`, update `AdminNavigation.tsx`, update `App.tsx` routes |
| 2 | High | Create Admin Messages page | New `AdminMessages.tsx`, update `AdminNavigation.tsx`, update `App.tsx` routes |
| 3 | Medium | Fix admin nav to use Badge component + add unread message badge | `AdminNavigation.tsx` |
| 4 | Medium | Remove Debug tab from AdminStudents | `AdminStudents.tsx` |
| 5 | Medium | Expand View Student dialog with progress + start date | `AdminStudents.tsx` |
| 6 | Low | Fix Student Payments nav icon | `AdminNavigation.tsx` |
| 7 | Low | Add "Create Admin" feature in Settings | `AdminSettings.tsx`, new edge function `create-admin` |

### Technical Details

**Admin Profile** -- Reuse `AvatarUpload` component, follow the same edit-mode pattern as `InstructorProfile.tsx`. Query `profiles` table for the current admin user.

**Admin Messages** -- Fork `InstructorMessages.tsx` logic. Instead of querying students by `instructor_id`, query all profiles (students + instructors) as potential recipients. Use the shared `ConversationThread` and `ConversationList` components. Add `MessageSquare` to admin nav with unread badge using the same `useUnreadMessagesCount` hook.

**Debug Tab Removal** -- Delete the `debug` TabsTrigger, its `TabsContent`, the `debugInfo` state, `handleDebugRefresh`, and `debugFetchStudents` references. Keep the refresh button in the main UI.

**Create Admin Edge Function** -- Similar to `create-instructor`: creates auth user with admin role metadata, inserts profile and user_roles records, sends password reset email.

