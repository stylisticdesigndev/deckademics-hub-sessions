# Fix being asked to log in again after leaving the app

This is the same thing you're describing: use the app, go back to the home screen, come back a few minutes later, and it wants a login. Below is the exact code that causes it.

## What I found

When you leave the installed app and return, the phone usually discards the page and relaunches it at the manifest's `start_url`, which is `/` — the landing page. That page, `src/pages/Index.tsx`, runs this on load:

```text
if (session exists) and (profile/role not loaded yet) -> clearLocalStorage()
```

`clearLocalStorage()` in `AuthProvider` deletes the Supabase auth token from localStorage and wipes the session state. But "role not loaded yet" is the *normal* state for the first second or two after the app opens: the provider restores the saved session first, then asynchronously calls `get_user_role` and fetches the profile. The landing page checks before that finishes, decides the session looks broken, and throws away a perfectly valid login — so you get the sign-in screen.

That's why it feels random: it depends on whether the profile query wins the race. Slow connection or cold relaunch means you lose it. Three times in one day matches three relaunches.

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
