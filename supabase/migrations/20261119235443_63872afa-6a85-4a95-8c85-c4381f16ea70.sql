REVOKE ALL ON public.production_enrollments, public.production_modules, public.production_module_completions, public.production_attendance FROM anon, PUBLIC;
CREATE INDEX production_enrollments_instructor_idx ON public.production_enrollments(instructor_id);
CREATE INDEX production_modules_author_idx ON public.production_modules(author_id);
CREATE INDEX production_completions_module_idx ON public.production_module_completions(module_id);