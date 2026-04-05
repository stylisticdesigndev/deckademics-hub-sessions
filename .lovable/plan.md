

# Fix Inconsistent Progress Calculations

## Problem

Three hooks calculate progress differently, causing mismatched percentages:

| View | Shows | Why |
|------|-------|-----|
| Instructor student detail | **10%** (correct) | Includes all 3 admin skills, even those with no record (0%) |
| Student dashboard | **30%** | Only counts skills with existing `student_progress` rows (misses Skill 1, Skill 2 at 0%) |
| Instructor dashboard | **23%** | Averages ALL `student_progress` rows including legacy curriculum entries |

The instructor student detail hook (`useInstructorStudentsSimple.ts`) has the correct approach: fetch admin-defined `progress_skills` for the student's level, then match against `student_progress` records, defaulting unmatched skills to 0%.

## Fix

### 1. `src/hooks/student/dashboard/useStudentProgress.ts`
- After fetching admin-defined skill names and student progress records, build the result from the admin skill list (not from matching records)
- For each admin skill, look up the `student_progress` record; default to 0% if none exists
- This ensures Skill 1 and Skill 2 appear at 0%, making the average 10% instead of 30%

### 2. `src/hooks/instructor/useInstructorDashboard.ts`
- After fetching student IDs, also fetch admin-defined `progress_skills`
- For each student, get their level, filter the relevant skills, and compute average from matched records only (defaulting missing to 0%)
- This eliminates legacy curriculum records from the calculation

## Result

All three views will show **10%** for Son Gohan (30 + 0 + 0 / 3 = 10%).

## Files to edit

| File | Change |
|------|--------|
| `src/hooks/student/dashboard/useStudentProgress.ts` | Build progress array from admin skill definitions, not from matching DB records |
| `src/hooks/instructor/useInstructorDashboard.ts` | Add `progress_skills` fetch; filter progress by admin skills per student level |

