INSERT INTO storage.buckets (id, name, public)
VALUES ('bug-screenshots', 'bug-screenshots', true);

CREATE POLICY "Authenticated users can upload bug screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bug-screenshots');

CREATE POLICY "Anyone can view bug screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'bug-screenshots');