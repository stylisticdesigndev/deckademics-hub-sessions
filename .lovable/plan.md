
# Fix Dashboard Flickering — Show VinylLoader Until All Data Is Ready

## Problem

Both the Instructor and Student dashboards render the page shell (welcome header, demo button) immediately while showing inline skeletons for data sections. This causes visible flickering as the layout shifts between partial content → skeletons → real data.

## Fix

Show the full-page `VinylLoader` (spinning record) until **all** dashboard data has finished loading. Only then render the entire dashboard at once — no partial renders, no skeletons, no flicker.

## Changes

### 1. `src/pages/instructor/InstructorDashboard.tsx`
- Add a full-page `VinylLoader` return when `loading` is true (and not in demo mode)
- Remove the inline `Skeleton` imports and conditional skeleton sections
- The entire dashboard (welcome, stats, student table) only renders once data is ready

### 2. `src/pages/student/StudentDashboard.tsx`
- When `loading` is true and not in demo mode, return `VinylLoader` for the whole page
- Remove the inline `DashboardSkeleton` conditional at line 141-142
- The entire dashboard renders at once after all data (including attendance) is fetched

### 3. `src/hooks/instructor/useInstructorDashboard.ts`
- Keep `loading` initialized to `true` — it only becomes `false` after fetch completes
- Remove the early `setLoading(false)` at line 55 when instructorId is missing during initial auth settling — instead, only set `false` once we're certain there's no instructorId (i.e., role is confirmed as instructor but no ID exists)

## Files

| File | Change |
|------|--------|
| `src/pages/instructor/InstructorDashboard.tsx` | Return `<VinylLoader />` when loading, remove inline skeletons |
| `src/pages/student/StudentDashboard.tsx` | Return `<VinylLoader />` when loading, remove `DashboardSkeleton` inline usage |
| `src/hooks/instructor/useInstructorDashboard.ts` | Fix early `setLoading(false)` that causes brief flash of empty state |
