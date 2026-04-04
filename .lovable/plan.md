

# Mirror Student-Side Fixes to Instructor Side

## What needs changing

After reviewing both sides, there is **one key gap**: the instructor's message conversation thread renders message content as plain text, while the student side now has clickable hyperlinks via `renderTextWithLinks`.

Line 160 of `src/components/instructor/messages/ConversationThread.tsx` currently renders:
```
{msg.content && msg.content}
```

The student side (`StudentConversationThread.tsx`) already uses a `renderTextWithLinks` helper that detects URLs and wraps them in clickable `<a>` tags.

All other student-side fixes either use shared components (ProgressBar `h-full` fix already applies everywhere) or are student-specific features (notes modal, dashboard stats layout, instructor display on profile).

## Changes

### 1. `src/components/instructor/messages/ConversationThread.tsx`
- Add the same `URL_REGEX` and `renderTextWithLinks` helper function used in the student conversation thread
- Replace `{msg.content && msg.content}` (line 160) with `{msg.content && renderTextWithLinks(msg.content)}`
- This ensures instructors can also click on links shared in messages

### One file, ~15 lines added.

