

# Remove Manual Overall Progress — Make It Purely Auto-Calculated

## Summary

Remove the "Update Progress" button/dialog for overall progress on the instructor side. Overall progress will always be the average of module completion percentages. Also delete the 2 existing "Overall Progress" rows from the database.

## Changes

### 1. `src/pages/instructor/InstructorStudents.tsx`

**Remove the manual overall progress update flow:**
- Remove the `openProgressDialog` function (lines 370-377) — only used for overall progress
- Remove the `handleUpdateProgress` function (lines 389-500ish) that upserts `skill_name = 'Overall Progress'` rows
- In the progress dialog (line 1128-1175), remove the non-module branch — the dialog should only handle module progress updates via `handleModuleProgressUpdate`
- Remove the "Update Progress" button from the student detail Overview tab (lines 1240-1247)
- Remove the "Update Progress" button from the student card in the list view (line 1045-1048)
- Keep `openModuleProgressDialog` and `handleModuleProgressUpdate` — instructors still control individual module/lesson progress

**Make overall progress display-only:**
- The "Overall Progress" bar in the detail view (lines 1232-1239) stays but becomes read-only — it reflects the auto-calculated average of module progress

### 2. Database cleanup
- Delete the 2 existing "Overall Progress" rows from `student_progress` table (IDs: `41cba8ee-242f-4dcb-9988-1b30d7ea07af`, `b08a5810-98ed-489f-bce6-560512a8064a`)

### 3. No other files need changes
- `useInstructorStudentsSimple.ts` already filters out "Overall Progress" rows and auto-calculates from module completion
- `useInstructorDashboard.ts` already filters them out
- Student-side hooks already filter them out

## Result
Instructors control progress by marking individual lessons complete within modules. Overall progress auto-calculates as the average of all module percentages. No more conflicting manual entries.

