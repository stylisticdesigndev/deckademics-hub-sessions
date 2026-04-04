

# Fix Duplicate "Overall Progress" on Student Progress Page

## Root Cause

The `student_progress` table contains rows with `skill_name = "Overall Progress"` (values: 75%, 55%). These were inserted as standalone entries rather than being auto-calculated. On the Progress page:

- The **top card** ("Overall Progress") averages ALL rows including these — producing 28%
- The **bottom of the skills list** shows these "Overall Progress" rows as individual skills — showing 75%

This creates confusion: two different "Overall Progress" numbers, and the average is wrong because it includes rows that aren't actual skills.

## Fix

### 1. `src/pages/student/StudentProgress.tsx`
- Filter out any `student_progress` rows where `skill_name` is `"Overall Progress"` before rendering
- The top "Overall Progress" card already auto-calculates the correct average from real skills — no need for stored "Overall Progress" rows

### 2. `src/hooks/student/dashboard/useStudentProgress.ts`
- Same filter: exclude `skill_name = "Overall Progress"` rows so the dashboard ring also shows the correct auto-calculated value

### 3. `src/hooks/student/useStudentDashboardCore.ts`
- No changes needed — it already averages whatever `useStudentProgress` returns, so fixing the source fixes the dashboard too

This ensures "Overall Progress" is always **auto-calculated** from real skill proficiencies, never stored or displayed as a separate skill row.

## Files Changed
1. `src/pages/student/StudentProgress.tsx` — filter out "Overall Progress" rows from `progressData`
2. `src/hooks/student/dashboard/useStudentProgress.ts` — filter out "Overall Progress" rows from fetched data

