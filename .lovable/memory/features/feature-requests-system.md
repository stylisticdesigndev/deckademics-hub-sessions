---
name: Feature Requests System
description: feature_requests table parallel to bug_reports, lightbulb dialog for students/instructors during beta
type: feature
---
Beta-only feature suggestion system, structurally parallel to bug reports but a separate table and admin page.

- Table: `feature_requests` (id, requester_id, requester_role, title, description, device_type, screenshot_url, status, admin_notes, seen_by_admin, timestamps).
- Statuses: open, planned, in_progress, shipped, declined. Active = open/planned/in_progress; Archived = shipped/declined.
- RLS: requesters can insert + view own; admins manage all (`has_role(auth.uid(), 'admin')`).
- Trigger `notify_admins_new_feature_request` writes to `admin_notifications` (type `feature_request`) when app_settings.notifications_enabled is true.
- Storage bucket: `feature-screenshots` (public read, user-folder-scoped insert).
- Submission UI: `src/components/features/FeatureRequestDialog.tsx` — Lightbulb icon trigger in DashboardLayout header, shown next to BugReportDialog for non-admin users.
- Admin page: `src/pages/admin/AdminFeatureRequests.tsx` at `/admin/feature-requests` with Active/Archived tabs.
- Nav badge query key: `admin-open-feature-count` (counts open + planned).
