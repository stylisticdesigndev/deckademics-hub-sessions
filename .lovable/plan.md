

# Update Demo Modes + Fix Timeout/Refresh Issue

## Summary
Two issues: (1) Demo modes on student Notes and student Messages pages don't show full mock data for recently added features, and instructor Announcements demo lacks dismiss. (2) The `ProtectedRoute` signs users out after 3 seconds if profile is slow to load, causing the "timeout refresh" issue.

## 1. Fix Timeout Refresh Issue

**File: `src/routes/ProtectedRoute.tsx`**

The current logic starts a 500ms interval and after 3 seconds of no profile, shows an error toast and signs the user out. This fires during normal token refreshes when the profile fetch is momentarily slow.

**Fix**: Increase the timeout from 3s to 8s, and only trigger the sign-out if there's genuinely no session user (not during a TOKEN_REFRESHED event). Also, reset the `waitTime` counter when `userData.role` becomes available, preventing stale timers from firing.

**File: `src/providers/AuthProvider.tsx`**

On `TOKEN_REFRESHED` events, the auth provider re-fetches the profile which can briefly leave `userData.role` as null. Add a guard so that `TOKEN_REFRESHED` events update the session without clearing userData, preventing the ProtectedRoute from thinking the profile is missing.

## 2. Student Notes Demo Mode

**File: `src/pages/student/StudentNotes.tsx`**

Currently, demo mode toggle exists but doesn't swap in mock data. When `demoMode` is true:
- Override `instructorNotes` with `mockNotes` from `mockDashboardData.ts`
- Add mock personal notes to `mockDashboardData.ts` (2-3 sample "My Note" entries)
- Override `personalNotes` with those mock personal notes
- Disable create/edit/delete actions with a demo mode toast

**File: `src/data/mockDashboardData.ts`**

Add `mockPersonalNotes` array with 2-3 entries matching the `PersonalNote` shape:
- "Scratching practice routine" — personal practice plan
- "Saved from Instructor — Mar 25" — simulating a "Save to Notes" action

## 3. Student Messages Demo Mode

**File: `src/pages/student/StudentMessages.tsx`**

Currently, demo mode shows only 2 demo announcements and empty conversations. Add:
- Demo conversations (2 instructor threads with mock messages) so the Messages tab and All tab show conversation items
- Demo thread messages so clicking a demo conversation shows a mock thread with the "Save to Notes" bookmark button visible
- The "Save to Notes" action should show a demo toast instead of actually saving

**File: `src/data/mockDashboardData.ts`**

Add `mockStudentConversations` and `mockStudentMessages` arrays with realistic DJ school instructor-student exchanges.

## 4. Instructor Announcements Dismiss

**File: `src/pages/instructor/InstructorAnnouncements.tsx`**

Add `onDismiss` handler to `AnnouncementCard` matching the student pattern — uses `announcement_reads` table with `dismissed: true`. In demo mode, just filter the announcement out locally.

## Files Changed
1. `src/routes/ProtectedRoute.tsx` — increase timeout, guard against token refresh
2. `src/providers/AuthProvider.tsx` — preserve userData during TOKEN_REFRESHED
3. `src/data/mockDashboardData.ts` — add mock personal notes, mock student conversations/messages
4. `src/pages/student/StudentNotes.tsx` — wire demo mode to mock data
5. `src/pages/student/StudentMessages.tsx` — wire demo mode to show mock conversations + threads
6. `src/pages/instructor/InstructorAnnouncements.tsx` — add dismiss functionality

## Technical Details
- Mock personal notes use the same `PersonalNote` interface shape: `{ id, student_id, title, content, created_at, updated_at }`
- Mock student messages use the existing `Message` interface and feed into the existing `conversations` useMemo
- The ProtectedRoute timeout change from 3s to 8s accounts for slow networks without false sign-outs
- AuthProvider change: on `TOKEN_REFRESHED`, skip the `setUserData` clear and only update session

