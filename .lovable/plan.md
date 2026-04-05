

# Add Inactive Tab + Pagination to Student Management

## Changes

### 1. Add "Inactive Students" tab
- Add a third tab showing students with `enrollment_status = 'inactive'` or `'declined'`
- Each row shows name, email, previous level, and a "Reactivate" action button
- Reactivate sets `enrollment_status` back to `'active'`
- Update the deactivate confirmation dialog text (remove "cannot be undone" since it now can be)

### 2. Add pagination to Active Students table
- Show 10 students per page
- Add simple Previous/Next controls below the table with a page indicator ("Page 1 of 3")
- Reset to page 1 when search query changes

### 3. Hook changes (`useAdminStudents.ts`)
- Add `fetchInactiveStudents` query that fetches students where `enrollment_status IN ('inactive', 'declined')`
- Add `reactivateStudent` mutation that sets `enrollment_status = 'active'`
- Export `inactiveStudents`, `isLoadingInactive`, and `reactivateStudent`

### 4. Detail sheet update
- When viewing an inactive student, show a "Reactivate" button instead of "Deactivate"
- Update status badge styling to show inactive/declined in gray/red

## Files to edit

| File | Change |
|------|--------|
| `src/hooks/useAdminStudents.ts` | Add `fetchInactiveStudents` query + `reactivateStudent` mutation |
| `src/pages/admin/AdminStudents.tsx` | Add Inactive tab, pagination controls for active table, reactivate actions, update detail sheet |

