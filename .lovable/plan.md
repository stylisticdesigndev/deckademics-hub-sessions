## Goal

Move the "Allow this student to reply" toggle into the instructor's conversation view (the chat thread with a specific student), and remove/hide it from the student detail page. The toggle only appears once the instructor has initiated the conversation (i.e. there is at least one message sent by the instructor in this thread).

## Where it lives

- **Shown in:** `src/components/instructor/messages/ConversationThread.tsx` — in the thread header, to the right of the student's name.
- **Removed from:** `src/pages/instructor/InstructorStudentDetail.tsx` (the existing toggle block + its handler).

## Visibility rule

The toggle renders only when `messages.some(m => m.sender_id === currentUserId)` is true — meaning the instructor has sent at least one message in this thread. Until then, the header shows just the avatar + name (current behavior).

## UI in the thread header

```text
[← back] [avatar] Student Name                    [Switch] Allow replies
```

- Use the existing `Switch` + small `Label` pattern from the student detail page.
- Compact form: small label "Allow replies" + `Switch`, right-aligned via `ml-auto`.
- On mobile (390px), label stays visible but truncates if needed; Switch never wraps.

## Data + behavior

`ConversationThread` needs three new props:
- `studentId: string`
- `twoWayMessaging: boolean`
- `onToggleTwoWayMessaging: (next: boolean) => Promise<void>`
- `canToggle: boolean` (already derivable from `instructorHasSent`, but pass it for clarity and to support demo mode read-only)

`InstructorMessages.tsx` will:
1. Fetch each conversation's `two_way_messaging` value alongside the student profile (extend the `students` select to include `id, two_way_messaging`).
2. Store it in the `StudentOption` shape (add `twoWayMessaging: boolean`).
3. Pass current value + handler into `ConversationThread`.
4. Handler calls `supabase.from('students').update({ two_way_messaging: next }).eq('id', activeStudentId)`, then optimistically updates local `students` state and shows a toast (matching the wording used today on the detail page).
5. In demo mode the Switch is disabled (no DB write).

## Cleanup of student detail page

In `src/pages/instructor/InstructorStudentDetail.tsx`:
- Remove the entire "Allow this student to reply" `<div>` block, the `Switch`/`Label` imports if unused elsewhere on the page, the `MessageSquare` import (if only used here), `savingToggle` state, and `handleToggleMessaging`.
- Keep `two_way_messaging` in the fetched data object only if still referenced; otherwise drop it from the select to keep the page lean.

## Files to modify

- `src/components/instructor/messages/ConversationThread.tsx` — add Switch in header, gated by `instructorHasSent`.
- `src/pages/instructor/InstructorMessages.tsx` — fetch `two_way_messaging`, pass props + handler to thread.
- `src/pages/instructor/InstructorStudentDetail.tsx` — remove the toggle block and its handler.

## Out of scope

- No DB schema or RLS changes (the column and `protect_two_way_messaging` trigger already exist).
- Student-side read-only banner behavior is unchanged.
