

# Fix Three Issues: Rename to Skills, Remove Curriculum Modules from Student View, Fix Notification Bell Flicker

## Issue 1: Rename "Curriculum Modules" and "Skills Breakdown" labels

The admin page calls them "Skills," so the student and instructor sides should match.

### Student Progress page (`StudentProgress.tsx`)
- "Skills Breakdown" -> "Skills"
- "Curriculum Modules" -> keep this section but see Issue 2

### Instructor Students page (`InstructorStudents.tsx`)
- "Curriculum Modules" heading (line 1160) is already alongside "Skills" (line 1104) -- no rename needed there, already says "Skills"

## Issue 2: Curriculum Modules still showing on Student Progress

The screenshot shows "Curriculum Modules" with lesson completion data (Advanced Mixing, etc.) on the student progress page. This section should be removed -- the student progress page should only show admin-defined skills and overall proficiency. Curriculum content belongs on the Curriculum page, not the Progress page.

### Changes in `StudentProgress.tsx`
- Remove the entire Curriculum Modules card (lines 228-273)
- Remove all curriculum-related state, interfaces, and fetch logic (modules state, CurriculumModule/CurriculumLesson interfaces, curriculum fetch code lines 88-128)
- Remove unused imports: `BookOpen`, `CheckCircle2`, `Circle`

## Issue 3: Notification bell flickering on student/instructor side

The bell in `DashboardLayout.tsx` counts unread announcements by fetching all announcements with a left join on `announcement_reads`, then filtering client-side. The flickering is caused by:

1. **Realtime subscription on `announcement_reads`** -- when the user clicks through to announcements and reads them, the INSERT triggers a refetch, but there's a race between the optimistic local state and the refetched data
2. **No optimistic update** -- the count resets to whatever the query returns on each refetch, causing flicker
3. **Interval polling every 60s** combined with realtime creates competing updates

### Fix in `DashboardLayout.tsx`
- Remove the realtime subscription on `announcement_reads` (it's causing the flickering loop)
- Keep only the interval-based polling (every 60s) for a stable count
- Add a ref to track whether the component is mounted to prevent state updates after unmount
- Use `useCallback` for the fetch function to avoid stale closures

## Files to edit

| File | Change |
|------|--------|
| `src/pages/student/StudentProgress.tsx` | Remove Curriculum Modules section entirely; rename "Skills Breakdown" to "Skills"; remove unused imports and state |
| `src/pages/instructor/InstructorStudents.tsx` | Rename "Curriculum Modules" heading to "Curriculum" (line 1160) for consistency |
| `src/components/layout/DashboardLayout.tsx` | Remove realtime subscription on `announcement_reads` to fix bell flickering; keep interval polling only |

