# Fix the remaining random sign-outs

Last time we removed the forced sign-out in the route guard and added refresh-on-resume. There is one more place that still destroys a good session — and it sits on the exact screen the installed app opens to.

## What I found

`src/pages/Index.tsx` (the landing page at `/`) runs this on load:

```text
if (session exists) and (profile/role not loaded yet) -> clearLocalStorage()
```

`clearLocalStorage()` in `AuthProvider` deletes the Supabase auth token from localStorage and wipes the session state. But "role not loaded yet" is the *normal* state for the first second or two after the app opens: the provider restores the session first, then asynchronously calls `get_user_role` and fetches the profile. On a slow or flaky connection (or a cold PWA start), the landing page fires first and throws away a perfectly valid session.

The PWA manifest's `start_url` is `/`, so every time the installed app is launched from the home screen it lands on exactly this page. That matches "logged out three times in one day" — three cold launches on a slow connection.

The same stale-session check is duplicated in an unused `ensureCleanAuthState` helper on that page.

## The fix

- Remove the token-clearing on the landing page. A session that exists but hasn't resolved a role yet is a *loading* state, not a corrupt one — the route guard already handles it correctly with a non-destructive retry screen.
- Delete the dead `ensureCleanAuthState` helper so the pattern can't creep back.
- While signed in, `/` should just show the loader and redirect to the right dashboard once the role resolves, instead of racing it.
- Keep `clearLocalStorage` available for the explicit places that need it (Admin Settings "clear cache" action and the real sign-out flow) — only the automatic call goes away.

After this, nothing in the app removes the session except an explicit sign-out by the user or Supabase itself reporting the refresh token is dead.

## Also worth confirming (outside the code)

If sign-outs continue after this, the remaining cause is server-side. In the Supabase dashboard under Authentication → Sessions:
- Refresh token expiry / inactivity timeout: 60 days
- Time-box user sessions: off
- Refresh token rotation: on, reuse interval 10-30 s (a 0 s reuse interval makes two tabs racing a refresh invalidate each other — a classic random-logout source)

I recommended these previously; worth a quick check that they actually got saved.

## Technical notes

Files touched: `src/pages/Index.tsx` only. No changes to `AuthProvider`, the route guard, the Supabase client, the database, or RLS.
