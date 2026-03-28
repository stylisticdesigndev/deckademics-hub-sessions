

# Restructure Instructor Messages and Announcements

## Summary
- **Messages page** becomes a direct messaging tool for instructors to send individual messages to their assigned students (1-to-1 or 1-to-many individually). No global announcements here.
- **Announcements page** becomes a read-only feed of admin-sent announcements/notifications (no instructor creation form). Instructor-created announcements are removed.

## Changes

### 1. Rewrite `src/pages/instructor/InstructorMessages.tsx`
Replace the current announcements feed with a proper messaging UI:
- **Compose section**: Form with multi-select student picker (from assigned students), subject, and message body. Sends individual `messages` table rows for each selected student.
- **Inbox/Sent tabs**: Show conversations using the existing `messages` table (sender_id/receiver_id).
- **Message thread view**: Click a conversation to see the thread.
- **Demo mode**: Mock conversations with demo students showing sample messages back and forth.
- Uses the existing `messages` table (columns: sender_id, receiver_id, subject, content, sent_at, read_at, is_archived).

### 2. Rewrite `src/pages/instructor/InstructorAnnouncements.tsx`
Convert from create+list to read-only list:
- Remove the announcement creation form entirely.
- Show announcements targeted at instructors (from the `announcements` table where `target_role` contains 'instructor'), with read tracking via `announcement_reads`.
- Keep demo mode with mock admin announcements.
- Add tab filtering (All/Events/Announcements/Updates) like the student messages page.
- Add "mark as read" functionality.

### 3. Update `src/components/navigation/InstructorNavigation.tsx`
- Update Messages tooltip to "Message your students"
- Update Announcements tooltip to "View admin announcements"

### 4. Add RLS policy for messages UPDATE
The `messages` table currently blocks UPDATE. We need a policy so users can mark messages as read (update `read_at`):
- Add UPDATE policy: receivers can update their own received messages (for read_at).

### 5. Update `src/data/mockInstructorData.ts`
- Replace `mockInstructorMessages` with demo direct messages (conversations with students).
- Replace `mockInstructorAnnouncements` with read-only admin announcements.
- Add mock data for inbox/sent conversations.

### 6. Remove instructor INSERT policy on announcements
Since instructors should no longer create announcements, remove the "Instructors can create announcements" RLS policy from the `announcements` table via migration.

## Database Migration
```sql
-- Allow receivers to mark messages as read
CREATE POLICY "Receivers can update their messages"
ON public.messages FOR UPDATE TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- Remove instructor announcement creation ability
DROP POLICY IF EXISTS "Instructors can create announcements" ON public.announcements;
```

## Files Changed
- `src/pages/instructor/InstructorMessages.tsx` (full rewrite)
- `src/pages/instructor/InstructorAnnouncements.tsx` (full rewrite)
- `src/components/navigation/InstructorNavigation.tsx` (tooltip updates)
- `src/data/mockInstructorData.ts` (new mock message data)
- SQL migration (messages UPDATE policy, remove instructor announcement INSERT policy)

