## Goal
Skip the "class notes" push reminder for students marked **absent** that day, since there's nothing to note for a student who wasn't there.

## Current behavior
In `supabase/functions/attendance-inclass-reminder-push/index.ts`, the `end` (notes) reminder currently only skips students the instructor already wrote a note for today. It still counts absent students toward the "pending notes" tally.

## Change
In the notes-kind aggregation loop:
- Load today's attendance for the slot's students (already fetched as `attendance` — currently only used for the `start` kind).
- Build an `absentToday` set of `student_id`s where `status = 'absent'` on `todayStr`.
- When kind is `end`, skip any student in `absentToday` in addition to the existing "already noted" skip.

This means:
- If every remaining primary student in the slot is either absent or already noted, no notes push is sent to that instructor.
- The `unmarkedCount` shown in the push body reflects only present/unmarked students who actually need notes.

No UI changes. No schema changes. Single edge-function edit.

## Files
- `supabase/functions/attendance-inclass-reminder-push/index.ts` — extend the notes skip logic to also skip absent students.
