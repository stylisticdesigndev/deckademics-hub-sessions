

# Bug Report Badge — Clear on View

## Problem
The "Bug Reports" nav badge shows open/in-progress count and never clears just by viewing the page. The admin has to change every report's status to make it disappear, which is awkward.

## Approach Options

**Option A — Mark as "seen" when admin visits the page**
- Add a `seen_by_admin` boolean (or `seen_at` timestamp) column to `bug_reports`
- When admin navigates to `/admin/bug-reports`, mark all unseen reports as seen
- Badge counts only unseen reports
- New reports reset to unseen automatically

**Option B — Badge counts only truly new (unreviewed) reports**
- Keep current behavior where badge = open + in_progress count
- Badge clears as admin changes statuses (already works)
- No code changes needed, but badge persists until action is taken

**Recommendation: Option A** — it matches the UX pattern already used by the notification bell.

## Technical Details

### 1. Database Migration
Add `seen_by_admin` column to `bug_reports`:
```sql
ALTER TABLE public.bug_reports
ADD COLUMN seen_by_admin boolean NOT NULL DEFAULT false;
```

### 2. AdminNavigation.tsx
Change badge query to count where `seen_by_admin = false` instead of filtering by status.

### 3. AdminBugReports.tsx
On page load (via `useEffect`), run an update marking all `seen_by_admin = false` reports as `seen_by_admin = true`. Then invalidate the badge query so it refreshes to zero.

### 4. Database Trigger Update
Modify `notify_admins_new_bug_report` — no change needed since new rows default to `seen_by_admin = false`.

## Files to Modify
| File | Change |
|---|---|
| Migration SQL | Add `seen_by_admin` column |
| `src/components/navigation/AdminNavigation.tsx` | Query unseen count instead of status-based count |
| `src/pages/admin/AdminBugReports.tsx` | Mark reports as seen on page load, invalidate badge query |

