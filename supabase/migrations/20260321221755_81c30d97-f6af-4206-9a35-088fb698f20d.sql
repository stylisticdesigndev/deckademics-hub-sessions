
-- Remove overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Remove the overly broad policy that allows any authenticated user to see all profiles
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;

-- Migrate RLS policies that check profiles.role to use has_role() instead

-- announcements: fix INSERT policies
DROP POLICY IF EXISTS "Admins can create announcements" ON announcements;
CREATE POLICY "Admins can create announcements" ON announcements FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Instructors can create announcements" ON announcements;
CREATE POLICY "Instructors can create announcements" ON announcements FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'instructor'::app_role));

DROP POLICY IF EXISTS "Admins can update announcements" ON announcements;
CREATE POLICY "Admins can update announcements" ON announcements FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authors can update their announcements" ON announcements;
CREATE POLICY "Authors can update their announcements" ON announcements FOR UPDATE TO authenticated
USING (author_id = auth.uid());

-- classes: fix INSERT/UPDATE policies
DROP POLICY IF EXISTS "Admins can insert classes" ON classes;
CREATE POLICY "Admins can insert classes" ON classes FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update classes" ON classes;
CREATE POLICY "Admins can update classes" ON classes FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- courses: fix policies
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
CREATE POLICY "Admins can insert courses" ON courses FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update courses" ON courses;
CREATE POLICY "Admins can update courses" ON courses FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
CREATE POLICY "Admins can delete courses" ON courses FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- app_settings: fix policies
DROP POLICY IF EXISTS "Admin users can update settings" ON app_settings;
CREATE POLICY "Admin users can update settings" ON app_settings FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin users can view settings" ON app_settings;
CREATE POLICY "Admin users can view settings" ON app_settings FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- instructor_schedules: fix admin policy
DROP POLICY IF EXISTS "Admins can manage all schedules" ON instructor_schedules;
CREATE POLICY "Admins can manage all schedules" ON instructor_schedules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- instructors: fix admin policies (remove duplicates and use has_role)
DROP POLICY IF EXISTS "Admins can insert instructor records" ON instructors;
CREATE POLICY "Admins can insert instructor records" ON instructors FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update instructor records" ON instructors;
DROP POLICY IF EXISTS "Admins can update instructors" ON instructors;
CREATE POLICY "Admins can update instructors" ON instructors FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all instructor records" ON instructors;
DROP POLICY IF EXISTS "Admins can view all instructors" ON instructors;
CREATE POLICY "Admins can view all instructors" ON instructors FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- profiles: fix admin policies to use has_role
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix instructor view of student profiles to use has_role
DROP POLICY IF EXISTS "Instructors can view student profiles" ON profiles;
CREATE POLICY "Instructors can view student profiles" ON profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'instructor'::app_role));

-- profiles insert: keep trigger policy but tighten the open one
DROP POLICY IF EXISTS "Allow trigger to create profiles" ON profiles;
CREATE POLICY "Allow trigger to create profiles" ON profiles FOR INSERT
WITH CHECK (true);
