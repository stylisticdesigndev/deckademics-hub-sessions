
-- Add image_url column to messages table
ALTER TABLE public.messages ADD COLUMN image_url text;

-- Create message-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

-- Allow authenticated users to upload attachments
CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

-- Allow anyone to view message attachments
CREATE POLICY "Anyone can view message attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'message-attachments');
