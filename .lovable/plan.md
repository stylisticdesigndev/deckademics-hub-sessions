

# Fix Student Side Not Reflecting Instructor Updates

## Problems Found

### 1. Student progress not visible — Missing RLS policy
The `student_progress` table has NO SELECT policy for students. Only instructors can read progress data. This means the student dashboard's progress ring, skill breakdown, and progress page all return empty results even when the instructor has updated them.

### 2. Student Messages page shows only announcements, not direct messages
The instructor sends messages via the `messages` table, but `StudentMessages.tsx` only queries the `announcements` table. Students have no way to see direct messages from their instructor.

---

## Changes

### Database Migration — Add student SELECT policy on student_progress
```sql
CREATE POLICY "Students can view their own progress"
  ON public.student_progress
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());
```

### Rewrite `src/pages/student/StudentMessages.tsx`
Transform from announcements-only to a tabbed view with two sections:
- **Messages tab** (default): Queries `messages` table where `receiver_id = auth.uid()`, shows subject, content, sender name (joined from profiles), sent date, and read/unread status. Clicking a message marks it as read (updates `read_at`).
- **Announcements tab**: Keeps existing announcements logic (query announcements targeted at students).

Add an unread messages count badge on the Messages nav item in `StudentNavigation.tsx`.

### Update `src/components/navigation/StudentNavigation.tsx`
Add unread message count badge to the Messages nav item by querying `messages` where `receiver_id = user.id AND read_at IS NULL`.

### Files Changed
- SQL migration (new RLS policy on `student_progress`)
- `src/pages/student/StudentMessages.tsx` — add direct messages inbox alongside announcements
- `src/components/navigation/StudentNavigation.tsx` — add unread messages badge

