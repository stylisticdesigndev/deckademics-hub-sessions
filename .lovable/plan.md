

# Fix Dashboard Progress Mismatch

## Problem
The dashboard hook (`useInstructorDashboard.ts` line 137) still multiplies proficiency by 10, treating it as the old 1-10 scale. But the constraint was updated to 0-100 and the Students page already reads raw values. This causes dashboard percentages to be wildly inflated (e.g., 40% stored shows as 400% or gets rounded incorrectly).

## Fix
**File: `src/hooks/instructor/useInstructorDashboard.ts`**

Line 132-138: Remove the `* 10` multiplier. Change:
```ts
// Convert proficiency (1-10 scale) to percentage (0-100 scale)
const averageStudentProgress = studentProgress.length > 0 
  ? Math.round(studentProgress.reduce((sum, p) => {
      return sum + (...);
    }, 0) / studentProgress.length * 10)
  : 0;
```
To:
```ts
// Proficiency is stored as raw percentage (0-100)
const averageStudentProgress = studentProgress.length > 0 
  ? Math.round(studentProgress.reduce((sum, p) => {
      return sum + (...);
    }, 0) / studentProgress.length)
  : 0;
```

Remove the `* 10` from line 137 and update the comment on line 132.

### Files Changed
- `src/hooks/instructor/useInstructorDashboard.ts` — remove `* 10` multiplier on line 137

