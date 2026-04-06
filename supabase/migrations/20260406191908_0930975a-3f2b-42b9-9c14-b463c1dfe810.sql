-- S1: Restrict instructor profile access to assigned students + own profile
DROP POLICY IF EXISTS "Instructors can view student profiles" ON public.profiles;
CREATE POLICY "Instructors can view assigned student profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'instructor'::app_role)
    AND id IN (SELECT s.id FROM public.students s WHERE s.instructor_id = auth.uid())
  );

-- S2: Restrict instructor student record access
DROP POLICY IF EXISTS "Instructors can view student records" ON public.students;
CREATE POLICY "Instructors can view assigned student records" ON public.students
  FOR SELECT TO authenticated
  USING (instructor_id = auth.uid());

-- S3: Prevent role escalation via profile update
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = get_profile_role(auth.uid()));

-- S5: Restrict message-attachments to authenticated users
DROP POLICY IF EXISTS "Anyone can view message attachments" ON storage.objects;
CREATE POLICY "Authenticated users can view message attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'message-attachments');

-- S6: Fix student table policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can create student records" ON public.students;
CREATE POLICY "Admins can create student records" ON public.students
  FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete any student record" ON public.students;
CREATE POLICY "Admins can delete any student record" ON public.students
  FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any student record" ON public.students;
CREATE POLICY "Admins can update any student record" ON public.students
  FOR UPDATE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admins can view all student records" ON public.students;

DROP POLICY IF EXISTS "Admins can view any student record" ON public.students;
CREATE POLICY "Admins can view any student record" ON public.students
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Instructors can update their assigned students" ON public.students;

DROP POLICY IF EXISTS "Instructors can update assigned students" ON public.students;
CREATE POLICY "Instructors can update assigned students" ON public.students
  FOR UPDATE TO authenticated USING (instructor_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own information" ON public.students;
CREATE POLICY "Students can update their own information" ON public.students
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own student record" ON public.students;
CREATE POLICY "Users can view their own student record" ON public.students
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- S7: Restrict background video uploads to admins
DROP POLICY IF EXISTS "Anyone can upload background videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Admins can upload background videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'background-videos' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view background videos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

DROP POLICY IF EXISTS "Users can delete their own background videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own background videos" ON storage.objects;

-- S8: Fix instructor schedule policy
DROP POLICY IF EXISTS "Instructors can manage their own schedules" ON public.instructor_schedules;
CREATE POLICY "Instructors can manage their own schedules" ON public.instructor_schedules
  FOR ALL TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- B2: Fix instructor self-update policy
DROP POLICY IF EXISTS "Instructors can update their own information" ON public.instructors;
CREATE POLICY "Instructors can update their own information" ON public.instructors
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- B8: Restrict announcements/courses/classes to authenticated
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements viewable by authenticated" ON public.announcements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses viewable by authenticated" ON public.courses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Classes are viewable by everyone" ON public.classes;
CREATE POLICY "Classes viewable by authenticated" ON public.classes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Instructors can update their own classes" ON public.classes;
CREATE POLICY "Instructors can update their own classes" ON public.classes
  FOR UPDATE TO authenticated USING (instructor_id = auth.uid());

-- Fix remaining {public} policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Fix student_progress policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Instructors can delete progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can delete progress for their students" ON public.student_progress
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_progress.student_id AND s.instructor_id = auth.uid()));

DROP POLICY IF EXISTS "Instructors can insert progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can insert progress for their students" ON public.student_progress
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = student_progress.student_id AND s.instructor_id = auth.uid()));

DROP POLICY IF EXISTS "Instructors can update progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can update progress for their students" ON public.student_progress
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_progress.student_id AND s.instructor_id = auth.uid()));

DROP POLICY IF EXISTS "Instructors can view progress for their students" ON public.student_progress;
CREATE POLICY "Instructors can view progress for their students" ON public.student_progress
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = student_progress.student_id AND s.instructor_id = auth.uid()));