

# Auto-Select Student's Level Tab on Curriculum Page

## Problem
The curriculum page always defaults to the "Novice" tab regardless of the student's actual level.

## Fix

**File: `src/pages/student/StudentCurriculum.tsx`**

1. Import `useAuth` and `supabase`, add a query to fetch the student's level from the `students` table
2. Use the fetched level (e.g. `'intermediate'`) as the `defaultValue` for the `<Tabs>` component
3. Since `defaultValue` only works on initial render, use controlled `value`/`onValueChange` state instead, initialized to `'novice'` and updated via `useEffect` once the student's level is fetched

## Technical Detail
- Query: `supabase.from('students').select('level').eq('id', userId).single()`
- Map the DB value (e.g. `'beginner'` → `'novice'`) using existing `LEVEL_VALUE_MAP`
- Fall back to `'novice'` if no level found
- Show loading state while both curriculum and student level are loading

