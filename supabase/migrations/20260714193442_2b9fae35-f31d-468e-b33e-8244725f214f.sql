CREATE TABLE public.user_onboarding (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tour_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_onboarding TO authenticated;
GRANT ALL ON public.user_onboarding TO service_role;

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding"
  ON public.user_onboarding FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding"
  ON public.user_onboarding FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding"
  ON public.user_onboarding FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding"
  ON public.user_onboarding FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);