-- Add bio field to profiles table for student's personal bio
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;