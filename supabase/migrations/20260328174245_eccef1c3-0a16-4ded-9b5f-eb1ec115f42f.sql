
-- Allow receivers to mark messages as read (update read_at)
CREATE POLICY "Receivers can update their messages"
ON public.messages FOR UPDATE TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- Remove instructor announcement creation ability
DROP POLICY IF EXISTS "Instructors can create announcements" ON public.announcements;
