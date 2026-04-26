-- Extra Pay line items attached to an instructor payment.
-- One instructor_payments row can have many extras (events, gigs, bonuses).
CREATE TABLE public.instructor_payment_extras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.instructor_payments(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  event_date DATE NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_instructor_payment_extras_payment ON public.instructor_payment_extras(payment_id);
CREATE INDEX idx_instructor_payment_extras_instructor ON public.instructor_payment_extras(instructor_id);

ALTER TABLE public.instructor_payment_extras ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage all extras
CREATE POLICY "Admins manage all extras"
  ON public.instructor_payment_extras
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Instructors can view their own extras
CREATE POLICY "Instructors view their own extras"
  ON public.instructor_payment_extras
  FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());

-- Auto-update updated_at
CREATE TRIGGER update_instructor_payment_extras_updated_at
  BEFORE UPDATE ON public.instructor_payment_extras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();