

# Fix Logo Flicker on Section Navigation

## Problem
When navigating between sections (e.g., Classes → Progress → Profile), the `ProtectedRoute` component re-mounts and its `isWaitingForProfile` state starts as `true`. This briefly shows the full-screen skeleton loader instead of the `DashboardLayout`, causing the logo to disappear and the navbar to shift until the profile check resolves (typically within one render cycle).

## Root Cause
In `src/routes/ProtectedRoute.tsx` (line 14), `isWaitingForProfile` is initialized to `true` every time the component mounts. Combined with the loading check on line 97, this causes a brief flash of the skeleton screen even when auth data is already available in context.

## Fix

**File: `src/routes/ProtectedRoute.tsx`**

Initialize `isWaitingForProfile` based on whether we already have the data we need. If `isLoading` is already `false` and `userData.role` is already set, there's no reason to wait.

Change line 14 from:
```ts
const [isWaitingForProfile, setIsWaitingForProfile] = useState(true);
```
To:
```ts
const [isWaitingForProfile, setIsWaitingForProfile] = useState(() => {
  // If auth is already loaded and we have a role, no need to wait
  return isLoading || (!userData.role && !!session);
});
```

This ensures that on subsequent navigations (when auth data is already cached in the AuthProvider context), the skeleton loader is skipped entirely and the `DashboardLayout` with the logo renders immediately.

### Files Changed
- `src/routes/ProtectedRoute.tsx` — 1 line change

