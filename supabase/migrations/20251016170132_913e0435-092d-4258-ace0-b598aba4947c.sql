-- Add sample payment data for existing students with valid payment types and statuses
INSERT INTO public.payments (student_id, amount, payment_date, payment_type, status, description)
SELECT 
  s.id,
  (ARRAY[150.00, 200.00, 250.00, 300.00])[floor(random() * 4 + 1)]::numeric,
  CURRENT_DATE - (floor(random() * 60)::int || ' days')::interval,
  (ARRAY['tuition', 'materials', 'other'])[floor(random() * 3 + 1)],
  (ARRAY['pending', 'pending', 'completed'])[floor(random() * 3 + 1)],
  'Monthly payment for DJ classes'
FROM public.students s
WHERE s.enrollment_status = 'active'
LIMIT 10;

-- Add some upcoming payments
INSERT INTO public.payments (student_id, amount, payment_date, payment_type, status, description)
SELECT 
  s.id,
  (ARRAY[150.00, 200.00, 250.00])[floor(random() * 3 + 1)]::numeric,
  CURRENT_DATE + (floor(random() * 30 + 1)::int || ' days')::interval,
  'tuition',
  'pending',
  'Upcoming monthly payment'
FROM public.students s
WHERE s.enrollment_status = 'active'
LIMIT 5;

-- Add some past due payments
INSERT INTO public.payments (student_id, amount, payment_date, payment_type, status, description)
SELECT 
  s.id,
  (ARRAY[200.00, 250.00, 300.00])[floor(random() * 3 + 1)]::numeric,
  CURRENT_DATE - (floor(random() * 30 + 15)::int || ' days')::interval,
  'tuition',
  'pending',
  'Past due payment'
FROM public.students s
WHERE s.enrollment_status = 'active'
LIMIT 8;