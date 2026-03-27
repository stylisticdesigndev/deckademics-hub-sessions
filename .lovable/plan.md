

# Fix: Tab Switch Redirects to Dashboard

## Root Cause

In `src/providers/AuthProvider.tsx` (line 96-137), the `onAuthStateChange` listener redirects to the dashboard on every `SIGNED_IN` event (line 119-121). When Supabase refreshes the token after tab focus, it can re-emit `SIGNED_IN`, triggering `redirectBasedOnRole()` which always navigates to `/{role}/dashboard` — overriding the current page.

## Fix

**File: `src/providers/AuthProvider.tsx`**

In the `onAuthStateChange` callback (around line 119), add a check so the redirect only happens when the user is currently on an auth page (e.g. `/auth/student`). If they're already on a protected route, skip the redirect.

Change:
```ts
if (event === 'SIGNED_IN') {
  redirectBasedOnRole(profile.role);
}
```

To:
```ts
if (event === 'SIGNED_IN' && window.location.pathname.includes('/auth/')) {
  redirectBasedOnRole(profile.role);
}
```

This mirrors the existing guard on line 155 used during `initializeAuth`. The user will only be redirected to their dashboard when signing in from an auth page — not when returning to the tab or on token refresh.

### Files Changed
- `src/providers/AuthProvider.tsx` (1 line change)

