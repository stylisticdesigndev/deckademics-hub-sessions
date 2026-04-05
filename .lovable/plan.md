

# Audit: Student vs Instructor Side Consistency

## Findings

After reviewing all pages, hooks, navigation, and shared utilities across both the student and instructor sides, here is what I found:

---

### 1. Console Error: `data-lov-id` on `React.Fragment` (Bug)

**File**: `src/utils/renderTextWithLinks.tsx` (line 40)

The Lovable editor injects a `data-lov-id` prop onto JSX elements for tracking. `React.Fragment` does not accept any props other than `key` and `children`, causing a React warning on every message that contains a URL. This is a dev-mode-only cosmetic warning but clutters the console.

**Fix**: Replace the `React.Fragment` wrapper with a plain `<span>` element, which accepts arbitrary props without warnings. This applies to lines 40 and 51 in the function, and similarly around lines 89 and 104 in `renderNoteTextWithLinks`.

---

### 2. Instructor Navigation: No Unread Message Badge (Inconsistency)

**Student side** (`StudentNavigation.tsx`): Shows badge counts for unread notes and unread messages on the sidebar nav items.

**Instructor side** (`InstructorNavigation.tsx`): Has no badge counts at all -- no unread message indicator.

**Fix**: Add an unread message count badge to the instructor Messages nav item. This requires querying `messages` where `receiver_id = instructorId` and `read_at IS NULL`, similar to the student-side `useUnreadMessages` hook.

---

### 3. Everything Else: Consistent

The following areas are already aligned between both sides:

- **Link rendering**: Both `ConversationThread` (instructor) and `StudentConversationThread` (student) use the shared `renderTextWithLinks` utility with `isSentByMe` for bubble-aware colors. Native `<a target="_blank">` anchors are used on both.
- **Image attachments**: Both threads handle `image_url` identically with native anchor wrappers.
- **Overall progress calculation**: Both `useInstructorDashboard` and `useInstructorStudentsSimple` filter out "Overall Progress" rows and auto-calculate averages, matching the student-side logic in `useStudentProgress` and `useStudentDashboardCore`.
- **Demo mode**: All pages on both sides have consistent demo/live toggle buttons with warning banners.
- **Profile pages**: Both have avatar upload, edit mode, and similar field structures.
- **Curriculum**: Both sides use the same `useCurriculumModules` and `useCurriculumLessons` hooks. Student side additionally filters by the student's level.
- **Classes**: Both sides have class views with appropriate filtering.
- **Notes**: Student side has the notes page with `renderNoteContent`. Instructor side manages notes per-student in the Students page. No gap here.

---

## Plan Summary

| # | Change | File(s) |
|---|--------|---------|
| 1 | Fix `React.Fragment` warning by switching to `<span>` wrappers | `src/utils/renderTextWithLinks.tsx` |
| 2 | Add unread message badge to instructor sidebar navigation | `src/components/navigation/InstructorNavigation.tsx` + new hook or inline query |

### Technical Details

**Fix 1** -- In `renderTextWithLinks`, replace all `<React.Fragment key={...}>` wrapping URL + trailing punctuation with `<span key={...}>`. Same change in `renderNoteTextWithLinks`. About 4 lines changed total.

**Fix 2** -- Add a `useEffect` + Supabase query in `InstructorNavigation` (or a dedicated hook) to count messages where `receiver_id = currentUserId AND read_at IS NULL`. Display the count as a `<Badge>` on the Messages nav item, matching the student-side pattern. Approximately 20-25 new lines.

