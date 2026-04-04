

# Fix YouTube Link Blocking + Instructor-Side Progress Bar

## Issue 1: YouTube Links Blocked

The `renderTextWithLinks` function opens links with `target="_blank"`. YouTube is blocking the connection because the link is rendered inside an iframe (the Lovable preview). YouTube sets `X-Frame-Options: DENY`, which prevents embedding.

**Fix**: The links need `rel="noopener noreferrer"` (already present) but also need to ensure they break out of any iframe context. The real fix is to add `window.open()` via an onClick handler instead of relying solely on the `<a>` tag's default behavior inside an iframe.

### Changes in `src/components/instructor/messages/ConversationThread.tsx`
- Update `renderTextWithLinks` to use an `onClick` handler that calls `window.open(url, '_blank', 'noopener,noreferrer')` — this ensures the link opens in the user's actual browser tab, not within the iframe context.

### Changes in `src/components/student/messages/StudentConversationThread.tsx`
- Same fix for the student-side conversation thread.

### Changes in `src/pages/student/StudentNotes.tsx`
- Same fix for clickable links in notes content.

## Issue 2: Instructor Dashboard Progress Bars Don't Match Student Progress

**Root cause**: In `src/hooks/instructor/useInstructorDashboard.ts` (line 98-101), the query fetches ALL `student_progress` rows including ones where `skill_name = 'Overall Progress'`. These manual rows skew the average calculation downward or upward compared to what the student sees (which filters them out).

### Changes in `src/hooks/instructor/useInstructorDashboard.ts`
- Add `skill_name` to the select: `.select('student_id, skill_name, proficiency')`
- Filter out rows where `skill_name` is "Overall Progress" (case-insensitive) before calculating the average, matching the student-side logic.

## Files Changed
1. `src/components/instructor/messages/ConversationThread.tsx` — use `window.open()` for links
2. `src/components/student/messages/StudentConversationThread.tsx` — same link fix
3. `src/pages/student/StudentNotes.tsx` — same link fix
4. `src/hooks/instructor/useInstructorDashboard.ts` — filter out "Overall Progress" rows from progress calculation

