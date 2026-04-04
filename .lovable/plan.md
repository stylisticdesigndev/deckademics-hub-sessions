

# Fix Student-Side UI Issues

## 1. Progress bars not reflecting percentages (StudentProgress page)

The `ProgressBar` component works correctly — it calculates width from `value/max`. The issue is that the inner `<div>` has no explicit height class. It inherits from the parent container's height class but the fill div itself needs `h-full` to render.

Looking more carefully at the component, line 40: the fill div has no `h-full` class, so it collapses to 0 height despite having width set. The parent sets height via `heightClasses[size]`, but the child div needs `h-full` to fill it.

**Fix**: Add `h-full` to the inner progress fill div in `src/components/progress/ProgressBar.tsx` (line 40).

## 2. Notes should be clickable with modal + character preview

Currently each note card shows full content inline. Change to:
- Truncate note content to ~120 characters with ellipsis in the card view
- Make entire card clickable
- On click, open a read-only dialog showing the full note content
- Keep edit/delete buttons on personal notes (stop propagation so they don't trigger the modal)

**Files**: `src/pages/student/StudentNotes.tsx` — add a `viewingNote` state, a view dialog, truncate content in cards, and make cards clickable.

## 3. Display images inline in notes instead of hyperlinks

When instructors save messages with images to notes, the content stores `📎 Image: <url>`. Currently this renders as plain text.

**Fix**: In the note content rendering (both the card preview and the view modal), detect image URLs (patterns like `📎 Image: https://...` or raw image URLs ending in common extensions) and render them as `<img>` tags instead of plain text.

**Files**: `src/pages/student/StudentNotes.tsx` — create a `renderNoteContent` helper that parses content and renders images inline.

## 4. Make hyperlinks clickable in notes and messages

- **Notes** (`StudentNotes.tsx`): The `renderNoteContent` helper from item 3 will also detect URLs (http/https) and wrap them in `<a>` tags with `target="_blank"`.
- **Messages** (`StudentConversationThread.tsx`): Line 125 renders `msg.content` as plain text. Add URL detection to wrap links in clickable `<a>` tags.

**Files**: 
- `src/pages/student/StudentNotes.tsx`
- `src/components/student/messages/StudentConversationThread.tsx`

A shared `renderTextWithLinks` utility could be created, or inline per component.

## 5. Remove duplicate "Overall Progress" from dashboard

The dashboard shows:
1. `StudentStatsSection` with an "Overall Progress" stat card (small, line 29)
2. `OverallProgressRing` — a larger radial chart also labeled "Overall Progress"

**Fix**: Remove the "Overall Progress" stat from `StudentStatsSection` (the small purple one). Replace it with something else or just remove the entry from the stats array.

**File**: `src/components/student/dashboard/StudentStatsSection.tsx` — remove the `Overall Progress` object from the `stats` array (lines 28-32).

## Files Changed
1. `src/components/progress/ProgressBar.tsx` — add `h-full` to fill div
2. `src/pages/student/StudentNotes.tsx` — clickable cards with truncated preview, view modal, inline images, clickable links
3. `src/components/student/messages/StudentConversationThread.tsx` — clickable links in message content
4. `src/components/student/dashboard/StudentStatsSection.tsx` — remove duplicate Overall Progress stat

