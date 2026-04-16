-- Add admin role to Nick (nick@deckademics.com)
INSERT INTO public.user_roles (user_id, role)
VALUES ('a49488db-5346-44c1-ba43-acca16686d27', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add admin role to Evan (djstylistic11@gmail.com)
INSERT INTO public.user_roles (user_id, role)
VALUES ('e1a40615-d306-4533-8ecf-9eb861e4648f', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;