-- Remove overly-broad instructor SELECT policies; scoped (assigned-only) policies already exist
DROP POLICY IF EXISTS "Instructors can view all student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Instructors can view all student_instructors" ON public.student_instructors;
DROP POLICY IF EXISTS "Instructors can view all student notes" ON public.student_notes;
DROP POLICY IF EXISTS "Instructors can view all student progress" ON public.student_progress;
DROP POLICY IF EXISTS "Instructors can view all student records" ON public.students;

-- Remove broad admin read of notification preferences (contains phone numbers); users still read their own
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.notification_preferences;

-- Scope bug-screenshots uploads to the uploader's own folder
DROP POLICY IF EXISTS "Authenticated users can upload bug screenshots" ON storage.objects;
CREATE POLICY "Users upload own bug screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'bug-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Scope message-attachments uploads to the uploader's own folder
DROP POLICY IF EXISTS "Authenticated users can upload message attachments" ON storage.objects;
CREATE POLICY "Users upload own message attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );