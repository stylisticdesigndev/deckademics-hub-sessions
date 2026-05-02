-- =====================================================
-- Passkey / WebAuthn support
-- =====================================================

-- 1. Add dismissal flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passkey_prompt_dismissed boolean NOT NULL DEFAULT false;

-- 2. user_passkeys table
CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credential_id text NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT ARRAY[]::text[],
  device_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passkeys_credential_id ON public.user_passkeys(credential_id);

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

-- Users can see their own passkeys
CREATE POLICY "Users can view own passkeys"
  ON public.user_passkeys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own passkeys
CREATE POLICY "Users can delete own passkeys"
  ON public.user_passkeys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT or UPDATE policies — only service role (edge functions) writes.

-- Cascade delete on auth user removal (via trigger since we don't FK to auth.users)
CREATE OR REPLACE FUNCTION public.cleanup_user_passkeys_on_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_passkeys WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_passkeys_on_profile_delete ON public.profiles;
CREATE TRIGGER trg_cleanup_passkeys_on_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_passkeys_on_profile_delete();

-- 3. passkey_challenges table (service role only)
CREATE TABLE IF NOT EXISTS public.passkey_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  challenge text NOT NULL,
  type text NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_passkey_challenges_challenge ON public.passkey_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON public.passkey_challenges(expires_at);

ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

-- No client policies at all — only service role (edge functions) accesses this table.