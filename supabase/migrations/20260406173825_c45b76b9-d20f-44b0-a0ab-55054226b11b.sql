
-- Delete all existing progress_skills
DELETE FROM progress_skills;

-- Insert Novice skills (10)
INSERT INTO progress_skills (name, level, order_index, description) VALUES
('Equipment Knowledge', 'novice', 1, 'Identify turntable/mixer components'),
('BPM Counting', 'novice', 2, 'Count BPMs and understand song structure'),
('Baby Scratch', 'novice', 3, 'Perform baby scratch on time'),
('Chop Scratch', 'novice', 4, 'Perform chop scratch on time'),
('2-2-6 Pattern', 'novice', 5, 'Complete the 2-2-6 pattern at appropriate tempo'),
('Dropping on the 1', 'novice', 6, 'Start a record on time'),
('8-Count Recognition', 'novice', 7, 'Recognize the 8-count loop and identify the "1"'),
('Basic Mixing', 'novice', 8, 'Mix songs together on beat without major complications'),
('2-Handed Approach', 'novice', 9, 'Use the push & pull method of adjustment'),
('Equipment Setup', 'novice', 10, 'Set up turntables/CDJs, mixer, speakers');

-- Insert Amateur skills (11)
INSERT INTO progress_skills (name, level, order_index, description) VALUES
('Chirp Scratch', 'amateur', 1, 'Clean, consistent chirp from open and closed fader'),
('Transformer Scratch', 'amateur', 2, 'Forward/backward transformer clicks'),
('Stab Scratch', 'amateur', 3, 'Stab scratch technique'),
('Drag Scratch', 'amateur', 4, 'Drag scratch technique'),
('Tear Scratch', 'amateur', 5, 'Tear the sound in 2s and 4s'),
('Scratch Combinations', 'amateur', 6, '2-3 scratch combos in succession'),
('Song Structure', 'amateur', 7, 'Identify intro/verse/hook/outro by ear'),
('Mixing Proficiency', 'amateur', 8, 'Cleanly blend two records and hit the breaks'),
('Manual Adjustments', 'amateur', 9, '2-handed push & pull during live mixing'),
('Backspinning', 'amateur', 10, 'Manual looping, break down 16 to 8, 8 to 4, etc.'),
('8-Count Mastery', 'amateur', 11, 'Identify 4/8/16/32 count intros/hooks by ear');

-- Insert Intermediate skills (10)
INSERT INTO progress_skills (name, level, order_index, description) VALUES
('7 Scratches Mastery', 'intermediate', 1, 'All 7 scratches at various tempos with combos'),
('Pick Up Scratch', 'intermediate', 2, 'Swing note scratch and Philly-Jersey combo'),
('Military Scratch', 'intermediate', 3, 'Military scratch pattern with fader control'),
('EQ Techniques', 'intermediate', 4, 'Use 3-band EQ effectively while mixing'),
('Digital Effects', 'intermediate', 5, 'Echo, flanger, phaser with correct parameters'),
('Manual Transitions', 'intermediate', 6, 'Manual echo, power downs, scratch-outs'),
('Digital Loops', 'intermediate', 7, 'Set auto/manual loops, implement in live sets'),
('Acapella Blending', 'intermediate', 8, 'Live remixes using acapellas over instrumentals'),
('Serato Platform', 'intermediate', 9, 'Cue points, loops, SP-6, troubleshooting'),
('Manual Looping Mastery', 'intermediate', 10, 'Backspin breakdowns 16→8→4→2→1');

-- Insert Advanced skill (1)
INSERT INTO progress_skills (name, level, order_index, description) VALUES
('Open Proficiency', 'advanced', 1, 'Instructor-determined skill mastery focus. Instructors should add specific skills for each student in the Task section.');
