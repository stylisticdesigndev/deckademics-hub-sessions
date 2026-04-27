ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS hide_phone boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_email boolean NOT NULL DEFAULT false;