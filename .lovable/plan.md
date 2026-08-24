# Stop the frequent sign-outs

Feedback says users get logged out too often. Based on reading the auth code, most of this is *not* the token lifetime — the app is actively signing people out on transient failures, and a PWA that sits in the background can miss its token refresh. Fixing both, plus lengthening the Supabase session window, should make sign-in effectively "once and stay in".

## What's causing it

1. **Forced sign-out on slow profile loads.** `ProtectedRoute` starts an 8-second timer whenever a session exists but the profile hasn't loaded yet; when it fires, it shows "Profile issue detected" and calls `signOut()`. On a flaky phone connection (subway, weak LTE, app resuming from background) a slow profile query looks identical to a broken session — and the user gets kicked out.
2. **Sign-out on schedule save errors.** `src/components/instructor/useScheduleActions.ts` calls `signOut()` in three error paths. Any auth hiccup while saving a schedule logs the instructor out.
3. **Missed token refresh in the installed PWA.** The Supabase client auto-refreshes, but when a phone suspends the web app for hours the timer doesn't run; on resume the access token is already expired and there is no explicit "refresh on foreground" step.
4. **Short server-side session window.** Token lifetimes live in the Supabase dashboard, not in this repo, so they're likely still at defaults.

## The fix

**Never sign the user out automatically.**
- Remove the 8s timeout sign-out from `ProtectedRoute`. Instead, keep retrying the profile fetch with backoff and show a non-destructive "Trouble loading your profile — Retry" state. Only sign out if Supabase itself reports the session is invalid.
- Remove the three `signOut()` calls from `useScheduleActions.ts` and surface a plain error toast instead.

**Refresh reliably on resume.**
- In `AuthProvider`, on `visibilitychange` → visible and on `window.focus`, call `supabase.auth.getSession()` (which triggers a refresh when the token is stale) and let the existing `onAuthStateChange` listener pick up the new session.
- Register the Supabase client's `startAutoRefresh` / `stopAutoRefresh` around visibility so timers aren't wasted while backgrounded.
- Treat `TOKEN_REFRESHED` as already handled (it is) and make sure a failed refresh shows a "Session expired, sign in again" prompt rather than a silent redirect.

**Lengthen the session window (Supabase dashboard — I can't change this from code on an external Supabase project).** Recommended settings under Authentication → Sessions / Tokens:
- Access token (JWT) expiry: **3600 s (1 hour)** — this one shouldn't be huge; it's refreshed silently.
- Refresh token expiry / inactivity timeout: **60 days** (or "never expire"). This is the number that decides how often someone must actually type a password.
- Time-box user sessions: **off**.
- Refresh token rotation: **on**, with reuse interval **10–30 s** (protects against two tabs racing a refresh and invalidating each other — a classic "randomly logged out" cause).

Net effect: an instructor or student signs in once and stays signed in for ~2 months of normal use, with Face ID / passkeys as the quick path after that.

## Technical notes

Files touched: `src/routes/ProtectedRoute.tsx`, `src/components/instructor/useScheduleActions.ts`, `src/providers/AuthProvider.tsx`, `src/integrations/supabase/client.ts` (add explicit `storageKey`, `flowType: 'pkce'`, keep `persistSession` / `autoRefreshToken`).

No database or RLS changes. Role checks and the pending-approval gate stay exactly as they are — this only changes *how long a session lives* and *when the app decides to end one*, not who can see what.
