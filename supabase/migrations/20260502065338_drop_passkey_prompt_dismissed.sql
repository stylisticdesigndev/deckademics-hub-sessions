-- Remove the proactive biometric prompt tracking column.
-- Biometric enrollment is now manual-only via the Profile page.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS passkey_prompt_dismissed;
