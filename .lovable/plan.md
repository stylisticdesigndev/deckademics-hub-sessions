

# Fix Progress Tab Showing Empty + Auto-Calculate Overall Progress

## Root Cause

Two issues causing "No progress data available":

1. **Case mismatch**: Students have levels like `"Intermediate"`, `"Novice"` (capitalized), but `curriculum_modules.level` stores `"intermediate"`, `"novice"`, `"advanced"` (lowercase). The filter `allModules.filter(m => m.level === studentLevel)` returns zero matches.

2. **Level name mismatch**: The `students` table defaults to `'beginner'`, but curriculum modules use `'novice'` — there is no `'beginner'` level in the curriculum system.

## Overall Progress: Should It Be Auto-Calculated?

Yes — overall progress should be derived from module completion rather than set independently. The code already does this when toggling lessons or updating module progress (lines 551-553), but the initial calculation from the hook uses `student_progress.proficiency` averages, which is a different metric. Tying overall progress to module completion percentage makes it consistent and removes confusion.

## Changes

### 1. `src/hooks/instructor/useInstructorStudentsSimple.ts`

**Fix case-insensitive level matching** (line 179):
- Change `allModules.filter((m) => m.level === studentLevel)` to use `.toLowerCase()` on both sides

**Map 'beginner' to 'novice'**:
- Add a level normalization step: if student level is `'beginner'`, treat it as `'novice'` for curriculum matching

**Auto-calculate overall progress from modules**:
- Instead of using `progressById` (average proficiency from `student_progress`), calculate overall progress as the average of all module progress percentages
- This makes the overall progress ring consistent with the Progress tab data

### 2. `src/pages/instructor/InstructorStudents.tsx`

No changes needed — the UI already recalculates overall progress from modules when lessons are toggled. The fix is purely in the data-fetching layer.

## Technical Details

```typescript
// Level normalization mapping
const normalizeLevel = (level: string) => {
  const l = level.toLowerCase();
  return l === 'beginner' ? 'novice' : l;
};

// Filter modules with normalized comparison
const studentModules = allModules.filter(
  (m) => m.level === normalizeLevel(studentLevel)
);

// Overall progress = average of module percentages
const overallProgress = moduleProgress.length
  ? Math.round(moduleProgress.reduce((sum, m) => sum + m.progress, 0) / moduleProgress.length)
  : 0;
```

## Files Changed
1. `src/hooks/instructor/useInstructorStudentsSimple.ts` — fix level matching + auto-calculate overall progress

