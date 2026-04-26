## Goal
Add a beta-only **Feature Requests** system that mirrors the existing Bug Reports flow but lives entirely separately. Students and instructors can submit feature ideas from the dashboard header (lightbulb icon next to the bug icon), and admins manage them on a dedicated page.

## 1. Database (new migration)
Create a new table `feature_requests` (separate from `bug_reports`):
- `id` uuid pk
- `requester_id` uuid → auth.users
- `requester_role` text ('student' | 'instructor')
- `title` text
- `description` text
- `device_type` text nullable
- `screenshot_url` text nullable (optional mockup/reference image)
- `status` text default 'open' ('open' | 'planned' | 'in_progress' | 'shipped' | 'declined')
- `admin_notes` text nullable
- `created_at`, `updated_at` timestamps

**RLS** (mirroring `bug_reports`):
- Students/instructors: `INSERT` their own rows, `SELECT` their own rows.
- Admins (via `has_role(auth.uid(), 'admin')`): full `SELECT` / `UPDATE`.

**Storage bucket** `feature-screenshots` (public read) for optional attachments, with the same upload policy pattern as `bug-screenshots`.

## 2. Submission UI — `src/components/features/FeatureRequestDialog.tsx`
Near-clone of `BugReportDialog.tsx`:
- Trigger: `Lightbulb` icon (lucide) with `triggerVariant="icon"`, tooltip "Suggest a feature".
- Fields: Title, Description ("What feature would you like? Why is it useful?"), Device Type (same options), optional screenshot/mockup.
- Inserts into `feature_requests` and uploads to the `feature-screenshots` bucket.
- Toast on success: "Feature request submitted".

## 3. Header integration — `src/components/layout/DashboardLayout.tsx`
Right next to the existing bug button (line ~145), add the new dialog for non-admin users:
```tsx
{userType !== 'admin' && <BugReportDialog triggerVariant="icon" />}
{userType !== 'admin' && <FeatureRequestDialog triggerVariant="icon" />}
```
Order: Bug icon, then Lightbulb icon — visually distinct, no overlap.

## 4. Admin page — `src/pages/admin/AdminFeatureRequests.tsx`
Structural copy of `AdminBugReports.tsx`, swapped to `feature_requests`:
- Tabs: **Active** (open, planned, in_progress) / **Archived** (shipped, declined).
- Status filter dropdown per tab.
- Card per request showing requester name (joined via `profiles`), role badge, device, timestamp, description, optional screenshot, admin notes editor, status select, copy-to-clipboard button.
- Status options: Open, Planned, In Progress, Shipped, Declined (with appropriate icons/colors — e.g., `Lightbulb`, `CalendarClock`, `Hammer`, `Rocket`, `XCircle`).

## 5. Admin navigation + badge — `src/components/navigation/AdminNavigation.tsx`
- Add menu item: `{ title: "Feature Requests", icon: Lightbulb, href: "/admin/feature-requests", badge: openFeatureCount }`.
- Add a `useQuery` for `admin-open-feature-count` (counts rows where status in ('open','planned')).
- Place it directly under the existing "Bug Reports" entry to keep the beta-feedback tools grouped.

## 6. Routing — `src/App.tsx`
Register the new route alongside the bug route:
```tsx
<Route path="/admin/feature-requests" element={<AdminFeatureRequests />} />
```

## 7. Notifications (optional, mirrors bug pattern)
If `useAdminNotifications` aggregates bug count today, extend it to also surface new feature requests so the admin notification dropdown reflects beta feedback in one place. (Will check the hook before wiring; keep scope minimal if it complicates things.)

## Out of scope
- No public voting/upvotes (can be added later if requested).
- No email notifications on status change.
- No edits/deletes by the requester after submission (matches bug behavior).

## Files to create
- `supabase/migrations/<timestamp>_feature_requests.sql`
- `src/components/features/FeatureRequestDialog.tsx`
- `src/pages/admin/AdminFeatureRequests.tsx`

## Files to edit
- `src/components/layout/DashboardLayout.tsx` — add lightbulb trigger next to bug.
- `src/components/navigation/AdminNavigation.tsx` — add nav entry + count query.
- `src/App.tsx` — register route.
- (Possibly) `src/hooks/useAdminNotifications.ts` — include feature request count.

## Memory
After implementation, save a `mem://features/feature-requests-system` memory describing the table, statuses, RLS, and that it's a separate parallel system to bug reports.