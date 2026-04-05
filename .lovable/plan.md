

# Build 3 New Admin Features

## Feature 3: Student Progress Overview

A new page at `/admin/progress` showing a bird's-eye view of curriculum completion across all students, grouped by level and instructor.

**What it shows:**
- Summary cards: average overall progress across all students, count by level
- A table listing every active student with their auto-calculated overall progress percentage (average of module completions), level, and assigned instructor
- Grouping/filtering by level (novice, amateur, intermediate, advanced) and by instructor

**Files:**
- New `src/pages/admin/AdminProgress.tsx` -- the page component
- New `src/hooks/useAdminProgress.ts` -- fetches all active students, their `student_progress` records, and `curriculum_modules`/`curriculum_lessons` to compute per-student overall progress (same auto-calc logic used on instructor/student sides)
- Update `src/App.tsx` -- add route `/admin/progress`
- Update `src/components/navigation/AdminNavigation.tsx` -- add "Progress Overview" nav item with `TrendingUp` icon

---

## Feature 4: Bulk Actions on Student & Instructor Tables

Add multi-select checkboxes to the Active Students table and Active Instructors table, with a toolbar that appears when items are selected.

**Student bulk actions:**
- Change level (apply same level to all selected)
- Deactivate selected
- Send message to selected (opens compose with pre-filled recipients)

**Instructor bulk actions:**
- Deactivate selected
- Send message to selected

**Files:**
- Update `src/pages/admin/AdminStudents.tsx` -- add checkbox column, selection state, bulk action toolbar
- Update `src/pages/admin/AdminInstructors.tsx` -- same pattern
- No new hooks needed; reuse existing mutation hooks for level changes, deactivation, and messaging

---

## Feature 5: Functional Notification System

Connect the existing notification toggle switches in Admin Settings to real triggers. When enabled, the system will send in-app notifications (shown as announcements or toast-style alerts) when key events occur.

**Triggers to implement:**
- New student signup (pending approval)
- New instructor signup (pending approval)
- Payment marked as overdue

**How it works:**
- New `admin_notifications` database table: `id`, `admin_id`, `type` (new_student, new_instructor, overdue_payment), `title`, `message`, `read`, `created_at`
- A database trigger function that inserts a notification row when a new student or instructor record is created with `pending` status
- A database trigger function that inserts a notification when a payment status changes to a past-due state
- New `src/hooks/useAdminNotifications.ts` hook to query unread notifications
- A notification bell/dropdown in the admin layout header showing unread count and recent notifications
- The existing Settings toggles will control whether these notifications are generated (check `app_settings.notifications_enabled` in the trigger functions)

**Files:**
- Database migration: create `admin_notifications` table with RLS, create trigger functions
- New `src/hooks/useAdminNotifications.ts`
- New `src/components/admin/NotificationDropdown.tsx` -- bell icon + dropdown list
- Update `src/routes/AdminLayoutRoute.tsx` or `src/components/layout/DashboardLayout.tsx` -- add notification dropdown to header
- Existing `AdminSettings.tsx` toggles already save to `app_settings` -- no change needed there

---

## Implementation Order

1. Student Progress Overview (standalone, no dependencies)
2. Bulk Actions on tables (UI-only, uses existing hooks)
3. Functional Notifications (requires migration + triggers + new components)

