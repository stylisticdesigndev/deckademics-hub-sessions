-- Create curriculum_modules table
CREATE TABLE public.curriculum_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create curriculum_lessons table
CREATE TABLE public.curriculum_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for curriculum_modules
CREATE POLICY "Admins can manage all modules"
ON public.curriculum_modules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view modules"
ON public.curriculum_modules
FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Students can view modules"
ON public.curriculum_modules
FOR SELECT
USING (has_role(auth.uid(), 'student'::app_role));

-- RLS Policies for curriculum_lessons
CREATE POLICY "Admins can manage all lessons"
ON public.curriculum_lessons
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructors can view lessons"
ON public.curriculum_lessons
FOR SELECT
USING (has_role(auth.uid(), 'instructor'::app_role));

CREATE POLICY "Students can view lessons"
ON public.curriculum_lessons
FOR SELECT
USING (has_role(auth.uid(), 'student'::app_role));

-- Add trigger for updated_at on curriculum_modules
CREATE TRIGGER update_curriculum_modules_updated_at
BEFORE UPDATE ON public.curriculum_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on curriculum_lessons
CREATE TRIGGER update_curriculum_lessons_updated_at
BEFORE UPDATE ON public.curriculum_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial curriculum data (Beginner Level)
INSERT INTO public.curriculum_modules (title, description, level, order_index) VALUES
('DJ Equipment Basics', 'Learn about essential DJ equipment and setup', 'beginner', 1),
('Music Theory Fundamentals', 'Understanding beats, tempo, and musical structure', 'beginner', 2),
('Basic Mixing Techniques', 'Introduction to beatmatching and transitions', 'beginner', 3);

-- Get module IDs for lessons (using CTEs)
WITH beginner_modules AS (
  SELECT id, title FROM public.curriculum_modules WHERE level = 'beginner'
)
INSERT INTO public.curriculum_lessons (module_id, title, description, order_index)
SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM beginner_modules
CROSS JOIN LATERAL (
  VALUES
    ('Introduction to DJ Controllers', 'Overview of modern DJ controllers and their functions', 1),
    ('Understanding Mixers', 'Learn about mixer channels, EQ, and effects', 2),
    ('Headphone Techniques', 'Proper use of headphones for cueing and monitoring', 3)
) AS lesson_data(title, description, order_index)
WHERE beginner_modules.title = 'DJ Equipment Basics'

UNION ALL

SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM beginner_modules
CROSS JOIN LATERAL (
  VALUES
    ('Beat Structure', 'Understanding bars, phrases, and song structure', 1),
    ('Tempo and BPM', 'Learning about tempo matching and BPM', 2),
    ('Musical Keys', 'Introduction to harmonic mixing', 3)
) AS lesson_data(title, description, order_index)
WHERE beginner_modules.title = 'Music Theory Fundamentals'

UNION ALL

SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM beginner_modules
CROSS JOIN LATERAL (
  VALUES
    ('Basic Beatmatching', 'Learning to match beats manually', 1),
    ('Simple Transitions', 'Creating smooth transitions between tracks', 2),
    ('Volume Control', 'Managing levels and volume during mixing', 3)
) AS lesson_data(title, description, order_index)
WHERE beginner_modules.title = 'Basic Mixing Techniques';

-- Seed Intermediate Level
INSERT INTO public.curriculum_modules (title, description, level, order_index) VALUES
('Advanced Mixing', 'Complex mixing techniques and creative transitions', 'intermediate', 1),
('Effects and Processing', 'Using effects creatively in your mixes', 'intermediate', 2),
('Music Selection', 'Building a music library and reading the crowd', 'intermediate', 3);

WITH intermediate_modules AS (
  SELECT id, title FROM public.curriculum_modules WHERE level = 'intermediate'
)
INSERT INTO public.curriculum_lessons (module_id, title, description, order_index)
SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM intermediate_modules
CROSS JOIN LATERAL (
  VALUES
    ('Harmonic Mixing', 'Advanced key mixing techniques', 1),
    ('Creative Transitions', 'Using loops and samples for transitions', 2),
    ('Three-Deck Mixing', 'Mixing with multiple decks', 3)
) AS lesson_data(title, description, order_index)
WHERE intermediate_modules.title = 'Advanced Mixing'

UNION ALL

SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM intermediate_modules
CROSS JOIN LATERAL (
  VALUES
    ('Delay and Echo', 'Using time-based effects', 1),
    ('Filters and EQ', 'Creative filtering techniques', 2),
    ('Reverb and Space', 'Adding depth with reverb', 3)
) AS lesson_data(title, description, order_index)
WHERE intermediate_modules.title = 'Effects and Processing'

UNION ALL

SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM intermediate_modules
CROSS JOIN LATERAL (
  VALUES
    ('Building Playlists', 'Organizing your music library', 1),
    ('Reading the Crowd', 'Understanding audience response', 2),
    ('Set Planning', 'Creating cohesive DJ sets', 3)
) AS lesson_data(title, description, order_index)
WHERE intermediate_modules.title = 'Music Selection';

-- Seed Advanced Level
INSERT INTO public.curriculum_modules (title, description, level, order_index) VALUES
('Performance Techniques', 'Live performance skills and stage presence', 'advanced', 1),
('Production Integration', 'Incorporating your own productions into sets', 'advanced', 2),
('Professional Development', 'Building your DJ career and brand', 'advanced', 3);

WITH advanced_modules AS (
  SELECT id, title FROM public.curriculum_modules WHERE level = 'advanced'
)
INSERT INTO public.curriculum_lessons (module_id, title, description, order_index)
SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM advanced_modules
CROSS JOIN LATERAL (
  VALUES
    ('Stage Presence', 'Engaging with the audience', 1),
    ('Live Remixing', 'Creating unique versions on the fly', 2),
    ('Technical Troubleshooting', 'Handling technical issues during performances', 3)
) AS lesson_data(title, description, order_index)
WHERE advanced_modules.title = 'Performance Techniques'

UNION ALL

SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM advanced_modules
CROSS JOIN LATERAL (
  VALUES
    ('Mashups and Edits', 'Creating custom edits for your sets', 1),
    ('Original Tracks', 'Integrating your productions', 2),
    ('Exclusive Content', 'Using unreleased material', 3)
) AS lesson_data(title, description, order_index)
WHERE advanced_modules.title = 'Production Integration'

UNION ALL

SELECT 
  id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.order_index
FROM advanced_modules
CROSS JOIN LATERAL (
  VALUES
    ('Marketing and Branding', 'Building your DJ brand', 1),
    ('Networking', 'Building industry connections', 2),
    ('Booking and Promotion', 'Getting gigs and promoting events', 3)
) AS lesson_data(title, description, order_index)
WHERE advanced_modules.title = 'Professional Development';