

# Fix 4 Instructor-Side Issues

## Issues

### 1. Profile photo upload not working
**Root cause**: In `InstructorProfile.tsx` (line 187-198), the `AvatarUpload` component only appears when `isEditing` is true. But the upload itself should work — the issue is likely that the instructor needs to click "Edit Profile" first. However, looking at the `AvatarUpload` component, it uses `supabase.storage.from('avatars').upload()` which requires the `avatars` bucket to exist (it does) and proper RLS policies. The upload should work once editing is enabled. The real UX issue is the avatar should always be uploadable without entering edit mode.

**Fix**: Show `AvatarUpload` component always (not only when editing). Remove the conditional that hides it behind `isEditing`.

### 2. Dashboard progress showing percentage twice
**Root cause**: In `StudentTable.tsx` (line 87-91), the `ProgressBar` component has `showPercentage` defaulting to `true` (ProgressBar.tsx line 9), which renders "XX%" above the bar. Then line 91 adds a second `<span>{student.progress}%</span>` next to it — resulting in the percentage appearing twice.

**Fix**: Pass `showPercentage={false}` to the `ProgressBar` in `StudentTable.tsx` since there's already an explicit percentage span next to it.

### 3. Student progress adds 5% more than the changed amount
**Root cause**: In `InstructorStudents.tsx` (line 416), the conversion from percentage to proficiency uses `Math.round(progressValue / 10)`, storing a 1-10 scale value. When reading back in `useInstructorStudentsSimple.ts` (line 99), it multiplies by 10: `(r.proficiency || 1) * 10`. The problem is `Math.round` — setting progress to 45% stores `Math.round(45/10) = Math.round(4.5) = 5`, which reads back as 50%. Setting 35% stores `Math.round(3.5) = 4`, reads back as 40%.

**Fix**: Use `Math.floor` instead of `Math.round` in the conversion, or better yet, store the actual percentage (0-100) directly and stop doing the scale conversion. The cleanest fix: change `Math.round(progressValue / 10)` to `Math.floor(progressValue / 10)` won't fully solve it. Instead, change the proficiency storage to use the raw percentage divided by 10 with `Math.round` BUT also change the read-back to use `Math.round` properly. Actually the simplest fix: just store `progressValue` directly as proficiency (0-100 range) and stop the x10 conversion on read. But the DB column seems designed for 1-10 scale.

Better approach: Use `Math.round(progressValue / 10)` on write (keep as-is) but when reading, acknowledge the rounding. The real issue is the slider step is 5, so values like 45, 35, 55 round up. Fix: change the slider step from 5 to 10, so the values always align with the 1-10 proficiency scale (10, 20, 30... 100).

### 4. Responsive scaling for all screen sizes
**Fix areas**:
- `StudentTable.tsx` dashboard table: use responsive table or card layout on mobile
- `InstructorStudents.tsx` list view: the 8-column grid doesn't work on mobile — switch to stacked cards on small screens
- `InstructorProfile.tsx`: already has `md:grid-cols-3`, looks okay
- `InstructorMessages.tsx`, `InstructorClasses.tsx`: check and fix any fixed-width elements
- `DashboardLayout.tsx`: already uses sidebar collapse, looks okay

## Files to Change

1. **`src/pages/instructor/InstructorProfile.tsx`** — Always show AvatarUpload (remove `isEditing` condition)
2. **`src/components/instructor/dashboard/StudentTable.tsx`** — Pass `showPercentage={false}` to ProgressBar; add responsive card view for mobile
3. **`src/pages/instructor/InstructorStudents.tsx`** — Change progress slider step from 5 to 10; add responsive mobile layout for the student list grid
4. **`src/hooks/instructor/useInstructorStudentsSimple.ts`** — No changes needed (conversion is consistent)
5. **`src/pages/instructor/InstructorDashboard.tsx`** — Minor responsive tweaks if needed

## Technical Details

**Progress fix**: Change slider step from `5` to `10` on line 1054 of InstructorStudents.tsx. This ensures values always map cleanly to the 1-10 proficiency scale (e.g., 40% → proficiency 4 → reads back as 40%).

**Double percentage fix**: Line 88-91 of StudentTable.tsx — add `showPercentage={false}` prop to `<ProgressBar>`.

**Avatar fix**: Lines 187-198 of InstructorProfile.tsx — show `AvatarUpload` always, not conditionally on `isEditing`.

**Responsive fixes**: Replace rigid grid layouts with flex-wrap or stacked layouts on small screens using Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`).

