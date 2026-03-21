

# Fix Slow Student Dashboard Loading

## Root Cause

The console logs reveal the exact problem: `fetchStudentInfo` exits early because `isMountedRef.current` is `false`. React StrictMode (in `main.tsx`) unmounts and remounts components, setting `isMountedRef` to `false` on the first unmount -- but it's never reset to `true` on remount. This means the actual data fetch never completes.

Additionally, the architecture creates a waterfall: `useUpcomingClasses` and `useStudentProgress` must finish loading before `fetchStudentInfo` even starts, adding unnecessary delay.

## Plan

### 1. Rewrite `useStudentDashboardCore.ts` - Remove broken mount tracking, simplify fetch logic

- Reset `isMountedRef` to `true` at the start of each mount effect (not just in the cleanup)
- Reset `dataFetchedRef` and `fetchAttemptRef` on remount so data actually loads
- Remove the dependency on `classesLoading`/`progressLoading` to trigger fetch -- fetch student info immediately when `userId` is available, independently of classes/progress
- Remove excessive console logging

### 2. Simplify `useStudentDashboard.ts` - Remove redundant retry/refresh layer

- The retry logic in this hook duplicates what the core hook already does and adds complexity
- Simplify to just call through to the core hook without extra load attempt tracking
- Keep manual refresh functionality

### 3. No database or migration changes needed

All data fetching queries are correct. The issue is purely client-side timing/lifecycle bugs.

## Technical Details

Key fix in `useStudentDashboardCore.ts`:
- Add a mount effect that resets refs: `isMountedRef.current = true; dataFetchedRef.current = false; fetchAttemptRef.current = 0;`
- Decouple the student info fetch from classes/progress loading states -- fetch student record (`students` table) immediately on mount when `userId` exists
- Derive `totalProgress` and `nextClass` reactively from `progressData` and `upcomingClasses` using `useMemo` instead of setting them inside `fetchStudentInfo`

