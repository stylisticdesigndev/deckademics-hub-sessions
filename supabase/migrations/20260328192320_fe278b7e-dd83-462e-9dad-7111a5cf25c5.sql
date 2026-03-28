CREATE POLICY "Users can update their own read records"
ON public.announcement_reads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);