ALTER TABLE public.announcements ADD COLUMN type text NOT NULL DEFAULT 'announcement';

CREATE POLICY "Admins can delete announcements" 
ON public.announcements FOR DELETE TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));