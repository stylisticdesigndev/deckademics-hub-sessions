

# Pre-QA Audit: Issues and Improvements

## Summary
After a thorough scan of the codebase, I found issues across six categories: duplicate code, missing functionality, code quality concerns, UX gaps, potential runtime errors, and security considerations.

---

## 1. Duplicate Toast Utility Files

**Issue**: Two identical toast files exist: `src/hooks/use-toast.ts` and `src/components/ui/use-toast.ts`. Both export the same `toast`, `useToast`, `toast.error`, `toast.success`, etc. Different files import from different paths, which is confusing and could lead to subtle bugs.

**Fix**: Delete one file and update all imports to use a single canonical path (`@/hooks/use-toast`).

---

## 2. Excessive console.log Statements in Production Code

**Issue**: There are 100+ `console.log` calls scattered across pages and hooks (Index.tsx, AuthProvider.tsx, InstructorStudents.tsx, AdminSettings.tsx, auth pages, etc.). Many are not gated behind `import.meta.env.DEV`, so they'll appear in production.

**Fix**: Remove or wrap all console.log/console.error calls in DEV-only checks. Keep only essential error logging.

---

## 3. Admin Dashboard "Recent Activity" is Empty

**Issue**: The "Recent Activity" tab on AdminDashboard always shows "No recent activities to display" — it's a static placeholder with no data source.

**Fix**: Either populate it with real data (recent student approvals, payments, announcements) or remove the tab to avoid looking broken.

---

## 4. `progress_skills` Table Typed as `any`

**Issue**: Queries to `progress_skills` use `.from('progress_skills' as any)` in multiple files (StudentProgress.tsx, InstructorStudents.tsx, useInstructorDashboard.ts). This means no TypeScript type safety for these queries.

**Fix**: Regenerate the Supabase types file so `progress_skills` is properly typed, then remove all `as any` casts.

---

## 5. `student_tasks` Table Typed as `any`

**Issue**: Same problem — `student_tasks` queries in InstructorStudents.tsx all use `as any` casts, bypassing type safety.

**Fix**: Same as above — regenerate types.

---

## 6. Profile `phone` Field Not in TypeScript Type

**Issue**: The `Profile` interface in AuthProvider.tsx has `phone?: string | null` but the profiles table schema doesn't show a `phone` column. InstructorProfile accesses `(userData?.profile as any)?.phone`. This suggests either the column exists but isn't in the generated types, or it doesn't exist at all.

**Fix**: Verify if `phone` column exists in profiles table. If not, either add it via migration or remove phone references.

---

## 7. Redundant Auth Checks in Page Components

**Issue**: StudentDashboard.tsx duplicates auth/redirect logic that ProtectedRoute already handles (lines 53-64 check session and redirect). This is unnecessary overhead and potential flickering source.

**Fix**: Remove redundant auth checks from individual page components — ProtectedRoute already gates access.

---

## 8. StudentPhotoUpload `updateProfile` Uses `as any`

**Issue**: Line 26 in StudentPhotoUpload.tsx: `await updateProfile({ avatar_url: avatarUrl } as any)`. The `as any` is needed because `avatar_url` is already in the Profile type — this cast is unnecessary.

**Fix**: Remove the `as any` cast since `avatar_url` is already defined in the Profile interface.

---

## 9. Landing Page Clears Auth on Every Navigation

**Issue**: Index.tsx's `ensureCleanAuthState` function clears localStorage and shows a toast ("Starting fresh login session") every time a logged-in user clicks Student/Instructor buttons. This is aggressive and confusing — it destroys valid sessions.

**Fix**: Only clear auth state if there's actually a stale/inconsistent session, not on every navigation click.

---

## 10. No Error Boundary

**Issue**: There's no React error boundary anywhere in the app. If any component throws during render, the entire app crashes with a white screen.

**Fix**: Add a root-level error boundary component that catches render errors and shows a recovery UI.

---

## Implementation Priority

| Priority | Item | Impact |
|----------|------|--------|
| High | #1 Duplicate toast files | Prevents import confusion |
| High | #4-5 Regenerate Supabase types | Type safety across the app |
| High | #10 Error boundary | Prevents white-screen crashes |
| Medium | #7 Remove redundant auth checks | Reduces flickering |
| Medium | #9 Fix landing page auth clearing | Prevents session destruction |
| Medium | #3 Recent Activity tab | Removes empty placeholder |
| Low | #2 Console.log cleanup | Production cleanliness |
| Low | #6 Phone field verification | Type consistency |
| Low | #8 Remove unnecessary `as any` | Code quality |

## Files to Change

| File | Change |
|------|--------|
| `src/components/ui/use-toast.ts` | Delete (use `src/hooks/use-toast.ts` only) |
| ~15 files importing from `@/components/ui/use-toast` | Update import paths |
| `src/pages/student/StudentDashboard.tsx` | Remove redundant auth redirect logic |
| `src/pages/Index.tsx` | Fix `ensureCleanAuthState` to not destroy valid sessions |
| `src/pages/admin/AdminDashboard.tsx` | Populate or remove "Recent Activity" tab |
| `src/integrations/supabase/types.ts` | Regenerate to include `progress_skills` and `student_tasks` |
| Multiple files with `as any` casts | Remove casts after types are regenerated |
| New: `src/components/ErrorBoundary.tsx` | Create error boundary component |
| `src/App.tsx` | Wrap routes in error boundary |
| Multiple page/hook files | Remove or gate console.log calls |

