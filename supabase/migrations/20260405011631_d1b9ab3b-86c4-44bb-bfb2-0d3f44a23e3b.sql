
-- Remove the duplicate Master Roshi instructor record (the one with no students assigned)
DELETE FROM public.instructor_schedules WHERE instructor_id = 'af93c4f3-4fdc-48d9-8e01-985b0f41d737';
DELETE FROM public.instructor_payments WHERE instructor_id = 'af93c4f3-4fdc-48d9-8e01-985b0f41d737';
DELETE FROM public.instructors WHERE id = 'af93c4f3-4fdc-48d9-8e01-985b0f41d737';
DELETE FROM public.user_roles WHERE user_id = 'af93c4f3-4fdc-48d9-8e01-985b0f41d737';
DELETE FROM public.profiles WHERE id = 'af93c4f3-4fdc-48d9-8e01-985b0f41d737';
