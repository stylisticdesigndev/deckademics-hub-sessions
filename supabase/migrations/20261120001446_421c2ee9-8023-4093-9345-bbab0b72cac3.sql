CREATE TABLE public.instructor_programs (
 instructor_id uuid PRIMARY KEY REFERENCES public.instructors(id) ON DELETE CASCADE,
 program text NOT NULL CHECK (program IN ('dj','production')),
 is_lead boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.instructor_programs TO authenticated;
GRANT ALL ON public.instructor_programs TO service_role;
ALTER TABLE public.instructor_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY instructor_program_read ON public.instructor_programs FOR SELECT TO authenticated USING (instructor_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY instructor_program_admin ON public.instructor_programs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER instructor_program_updated BEFORE UPDATE ON public.instructor_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.instructor_programs(instructor_id,program,is_lead) SELECT id, CASE WHEN id='b9207cd6-3966-4db6-bfb9-30f3cdb10dd4'::uuid THEN 'production' ELSE 'dj' END, id='b9207cd6-3966-4db6-bfb9-30f3cdb10dd4'::uuid FROM public.instructors;
CREATE FUNCTION public.is_production_instructor(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_role(_user_id,'instructor') AND EXISTS (SELECT 1 FROM public.instructor_programs WHERE instructor_id=_user_id AND program='production') $$;
REVOKE ALL ON FUNCTION public.is_production_instructor(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_production_instructor(uuid) TO authenticated,service_role;
ALTER POLICY production_enrollment_read ON public.production_enrollments USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR (instructor_id=auth.uid() AND public.is_production_instructor(auth.uid())));
ALTER POLICY production_enrollment_staff ON public.production_enrollments USING (public.has_role(auth.uid(),'admin') OR (instructor_id=auth.uid() AND public.is_production_instructor(auth.uid()) AND public.can_instructor_access_student(auth.uid(),student_id))) WITH CHECK (public.has_role(auth.uid(),'admin') OR (instructor_id=auth.uid() AND public.is_production_instructor(auth.uid()) AND public.can_instructor_access_student(auth.uid(),student_id)));
ALTER POLICY production_module_read ON public.production_modules USING (public.has_role(auth.uid(),'admin') OR public.is_production_instructor(auth.uid()) OR (NOT is_draft AND public.has_role(auth.uid(),'student')));
ALTER POLICY production_module_staff ON public.production_modules USING (public.has_role(auth.uid(),'admin') OR (public.is_production_instructor(auth.uid()) AND (author_id=auth.uid() OR author_id IS NULL))) WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.is_production_instructor(auth.uid()) AND author_id=auth.uid()));
ALTER POLICY production_completion_staff ON public.production_module_completions USING (public.has_role(auth.uid(),'admin') OR (public.is_production_instructor(auth.uid()) AND EXISTS (SELECT 1 FROM public.production_enrollments e WHERE e.id=enrollment_id AND e.instructor_id=auth.uid()))) WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.is_production_instructor(auth.uid()) AND EXISTS (SELECT 1 FROM public.production_enrollments e WHERE e.id=enrollment_id AND e.instructor_id=auth.uid())));
ALTER POLICY production_attendance_staff ON public.production_attendance USING (public.has_role(auth.uid(),'admin') OR (public.is_production_instructor(auth.uid()) AND EXISTS (SELECT 1 FROM public.production_enrollments e WHERE e.id=enrollment_id AND e.instructor_id=auth.uid()))) WITH CHECK (public.has_role(auth.uid(),'admin') OR (public.is_production_instructor(auth.uid()) AND EXISTS (SELECT 1 FROM public.production_enrollments e WHERE e.id=enrollment_id AND e.instructor_id=auth.uid())));