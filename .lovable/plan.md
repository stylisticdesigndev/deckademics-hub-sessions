

# Four Changes: Dashboard Flicker, Slider Style, Remove Google Auth, Photo Requirement

## 1. Fix Dashboard Flickering (Instructor + Student)

**Root cause**: The instructor dashboard shows a loading skeleton that flashes because `useInstructorDashboard` sets `loading: true` on mount, then the component re-renders multiple times as auth state settles (userData changes trigger refetch). The `instructorId` memo depends on `userData` which updates multiple times during auth initialization.

**Fix**:
- In `useInstructorDashboard.ts`: Don't start fetching until `userData.role` is confirmed as `'instructor'`. Gate the `useEffect` on role being set, not just having a user ID. This prevents the fetch-cancel-refetch cycle.
- In `InstructorDashboard.tsx`: Keep showing skeletons until data is truly ready, but prevent the flash between skeleton→content→skeleton by ensuring a single fetch cycle.
- In `useStudentDashboardCore.ts`: Apply the same pattern — don't fetch student info until role is confirmed, preventing multiple loading state transitions.

**Files**: `src/hooks/instructor/useInstructorDashboard.ts`, `src/hooks/student/useStudentDashboardCore.ts`

## 2. Restyle Skill Proficiency Slider to Green Progress Bar

**Current**: Uses the default shadcn `Slider` component with purple (`bg-primary`) track and range.

**Fix**: Override the slider's classes inline in `InstructorStudents.tsx` where it's used for skill proficiency. Change the range fill to green (`bg-green-500`) and the track to gray (`bg-gray-200 dark:bg-gray-700`). Change the thumb to a smaller green circle. This makes it look like a draggable progress bar rather than a purple slider.

**File**: `src/pages/instructor/InstructorStudents.tsx` (lines ~769-775)

## 3. Remove Google Sign-In from All Auth Pages

Remove the Google OAuth button, divider ("or"), and the `handleGoogleAuth` function from `AuthForm.tsx`. Delete the `SocialAuthButton` component file entirely.

**Files to edit**: `src/components/auth/AuthForm.tsx` (remove `SocialAuthButton` import, `handleGoogleAuth` function, `AuthFormDivider`, and the button render)
**Files to delete**: `src/components/auth/SocialAuthButton.tsx`, `src/components/auth/AuthFormDivider.tsx`

## 4. Require Photo Upload Before Dashboard Access (After Approval)

Add a gate in `ProtectedRoute.tsx`: after confirming the user is approved (not pending), check if the student's profile has an `avatar_url`. If not, redirect to a new `/student/photo-upload` page that requires them to upload a profile photo before proceeding.

**New file**: `src/pages/student/StudentPhotoUpload.tsx` — a simple page with the existing `AvatarUpload` component and a "Continue to Dashboard" button that only enables after upload.
**Edit**: `src/routes/ProtectedRoute.tsx` — after approval check passes for students, check `avatar_url` on profile; if null, render redirect to photo upload page.
**Edit**: `src/App.tsx` — add the `/student/photo-upload` route (protected, student role, but outside the layout route so it renders standalone).

## Files Summary

| File | Action |
|------|--------|
| `src/hooks/instructor/useInstructorDashboard.ts` | Gate fetch on confirmed role |
| `src/hooks/student/useStudentDashboardCore.ts` | Gate fetch on confirmed role |
| `src/pages/instructor/InstructorStudents.tsx` | Restyle slider to green progress bar |
| `src/components/auth/AuthForm.tsx` | Remove Google auth button, divider, handler |
| `src/components/auth/SocialAuthButton.tsx` | Delete file |
| `src/components/auth/AuthFormDivider.tsx` | Delete file |
| `src/pages/student/StudentPhotoUpload.tsx` | New — mandatory photo upload page |
| `src/routes/ProtectedRoute.tsx` | Add avatar_url check for students post-approval |
| `src/App.tsx` | Add `/student/photo-upload` route |

