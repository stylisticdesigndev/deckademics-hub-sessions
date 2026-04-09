

# Fix Realtime Auth, Personal Notes Privacy & OG Image

## 1. Realtime Channel Authorization

**Problem**: `student_notes` is published to Supabase Realtime, meaning any authenticated user who subscribes with the right filter can receive events. Realtime doesn't enforce RLS on subscriptions by default unless you enable **Realtime RLS** (Row Level Security for Realtime).

**Fix**: Remove `student_notes` from the Realtime publication. The app already uses `queryClient.invalidateQueries()` to refresh data — the Realtime channel in `useNotesNotifications.ts` is a convenience but creates an authorization gap. We'll remove the Realtime subscription and instead rely on polling or query invalidation.

- **Migration**: `ALTER PUBLICATION supabase_realtime DROP TABLE public.student_notes;`
- **Code**: Remove the Realtime channel subscription from `useNotesNotifications.ts`. Replace with a periodic polling approach (refetchInterval on the notes query) so students still get timely updates without the security gap.
- Similarly, `student_progress` is subscribed via Realtime in `useStudentProgress.ts` but is NOT in the publication — so it silently does nothing. We'll clean up that dead subscription too.

## 2. Instructor Access to Student Personal Notes

**Problem**: The `student_personal_notes` table has an RLS SELECT policy allowing instructors to read their assigned students' personal notes. Personal notes should be private to the student only.

**Fix**: Drop the instructor SELECT policy on `student_personal_notes`.

- **Migration**: `DROP POLICY "Instructors can view assigned student personal notes" ON public.student_personal_notes;`

## 3. OG Image — Replace Lovable Default with Branded Image

**Problem**: `index.html` lines 24 and 28 point to `https://lovable.dev/opengraph-image-p98pqg.png` (the default Lovable placeholder).

**Fix**: Use the app icon as the OG image. Update both `og:image` and `twitter:image` meta tags to point to `/app-icon.png`. Since OG images need an absolute URL to work when shared, we'll use a relative path that works in production (the published domain will resolve it). Alternatively, if the user has a hosted URL we can use that.

- Update `index.html` lines 24 and 28: change the image URLs to `/app-icon.png`

## Files Changed

| File | Change |
|---|---|
| Migration SQL | Drop `student_notes` from Realtime publication; drop instructor policy on `student_personal_notes` |
| `src/hooks/student/useNotesNotifications.ts` | Remove Realtime channel, add polling interval note |
| `src/hooks/student/dashboard/useStudentProgress.ts` | Remove dead Realtime subscription |
| `index.html` | Update `og:image` and `twitter:image` to `/app-icon.png` |

