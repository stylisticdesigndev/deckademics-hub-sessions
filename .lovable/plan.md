

# Fix Skill Breakdown Card: Cap at 6 + Use Real Data

## Problems

1. **SkillBreakdownChart** renders all skills with no limit — card grows unbounded
2. **ProgressSection** has hardcoded skill names ("Beat Matching", "Scratching", etc.) instead of using admin-defined skills from `progress_skills`

## Changes

### 1. `src/components/student/dashboard/SkillBreakdownChart.tsx`
- Slice the `skills` array to show only the **first 6** (most recently updated or highest proficiency — sorted before slicing)
- If more than 6 skills exist, render a "View All" link pointing to `/student/progress`

### 2. `src/components/student/dashboard/ProgressSection.tsx`
- Accept `skills` data as a prop (array of `{ skill_name, proficiency }`)
- Replace the four hardcoded progress bars with dynamic bars from the passed-in skills data
- Cap the displayed skills at 4 with a "View All" link if more exist

### 3. `src/pages/student/StudentDashboard.tsx` (or wherever ProgressSection is rendered)
- Pass the `progressData` from `useStudentDashboardCore` into `ProgressSection` as a prop

## Files to edit

| File | Change |
|------|--------|
| `src/components/student/dashboard/SkillBreakdownChart.tsx` | Limit to 6 skills, add "View All" link |
| `src/components/student/dashboard/ProgressSection.tsx` | Accept skills prop, render dynamically, cap at 4 |
| Parent that renders ProgressSection | Pass `progressData` prop |

