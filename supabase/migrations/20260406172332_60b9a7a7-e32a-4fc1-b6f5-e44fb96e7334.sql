
-- First delete all existing curriculum data
DELETE FROM curriculum_lessons;
DELETE FROM curriculum_modules;

-- ============ NOVICE ============

-- Novice: General Course Overview
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('General Course Overview', '6 week class, 90 minutes per class', 'novice', 1);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'History of DJing', 'History of DJ''ing as a culture and art form, discussing how it has developed and changed over the years and what it has to offer in the new millennium', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'Equipment Overview', 'Learning what equipment is or can be used and how to use it', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'Functional Training', 'Functional training such as setting up turntables/cdj''s, the mixer, speakers, etc.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'Basic Skillset', 'Learning basic skillset, such as counting BPM''s and typical song structure', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'Basics of Scratching', 'Learning the basics of scratching (baby scratches, rubs, etc)', 5),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'Basics of Mixing', 'Learning the basics of mixing and blending', 6),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), 'Starting on Time', 'Learning to start the record on time (drop it "on the 1")', 7),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=1), '2-Handed Approach', 'Learning the 2-handed approach and "push & pull" method of adjustment', 8);

-- Novice: Week 1
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 1', 'Introduction and fundamentals', 'novice', 2);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=2), 'Introduction & Welcome', 'Give introduction and welcome to the school. Give overview of what will get covered over the duration of 6 weeks, such as what kind of gear we use and how it works, some basic historical background on DJing and how it''s developed over the years and the basics of mixing and scratching.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=2), '8-Count & Song Structure', 'Teach and practice the 8-count. Nod on beat. Discuss basic song structure and intros/breaks (more detailed info on intros/breaks/outros later).', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=2), 'Scratch on Beat', 'Teach to scratch on beat (1-count). Switch hands and scratch on beat (1-count) with opposite hand.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=2), 'Baby Scratches', 'Practice half-time, on-time, and double-time baby scratches on beat. Switch hands.', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=2), 'The Stab', 'Teach and practice the "stab" (formerly known as the "chop")…(keeping hand on the record, not lifting hand off). Practice the stab at slow, even pace.', 5),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=2), '2-2-6 Pattern', 'Teach the beginning of the 2-2-6 (baby-baby-ahhh// baby-baby-ahhh// baby-baby-baby-baby-baby-baby-ahhh) pattern. Have them get the "2" down consistently and at a gradually faster pace before attempting the whole pattern.', 6);

-- Novice: Week 2
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 2', 'Crossfader control and tears', 'novice', 3);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Recap & Warm-Up', 'Recap the basics from Week 1. Warm students up with baby scratching on beat (switch hands, do it again).', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Tear Scratch', 'Practice faderless "tear" scratch for both rhythm and hand control', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Crossfader Control', 'Teach crossfader control with baby scratches with open & closed fader', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Slow Stab', 'Revisit and practice the "slow stab" (with hand on the record).', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Record Release & Flick', 'Teach and practice letting the record go and flicking it back to the beginning of the sound. Use the 2-tap method to flick record backwards.', 5),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), '2-2-6 Pattern', 'Revisit the 2-2-6 "ahhh" pattern. Adjust tempo accordingly.', 6),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Dropping on the 1', 'Teach about "dropping it on the 1". Use same instrumental or song. Discuss the "airplane analogy" of letting the record go (don''t push the record or hesitate; simply release the record calmly).', 7),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=3), 'Transformer Basics', 'Teach the transformer to begin mastering control of opening and closing the fader on command.', 8);

-- Novice: Week 3
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 3', 'Mixing fundamentals and song structure', 'novice', 4);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=4), 'Warm-Up', 'Recap the faderless scratches and 2-2-6. Spend 5 minutes warming up the hands with the faderless baby''s and tear''s.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=4), 'Chop Practice', 'Continue to work on the chop. Try starting with slower tempo and gradually increasing instrumental tempo and frequency of chops in succession.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=4), '2-2-6 Pattern', 'Practice the 2-2-6 pattern. Adjust tempo accordingly.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=4), 'Song Structure', 'Revisit the 8-count and explain song structure and identifying intros/outros/hooks.', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=4), 'Counting Records', 'Practice counting out a few different records with and without intros.', 5),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=4), 'Mixing Practice', 'Practice dropping the song "on the 1" and mixing it on top of same instrumental.', 6);

-- Novice: Week 4
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 4', 'Pitch control and mixing techniques', 'novice', 5);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=5), 'Warm-Up', 'Warm up with the 2-2-6 pattern with each hand.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=5), 'Mixing Progression', 'Revisit mixing basics and dropping a song "on the 1" over the same instrumental first. Once they can let the record go on time and recognize what it sounds like locked in then progress to another instrumental/record with the same BPM.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=5), 'Ear Training', 'Use the ear test: make the student turn around and tell you whether the record was sped up or slowed down with the pitch control. Start with drastic changes (+2 into -6; 0 into +5; etc). Then make smaller, more minute changes to train the ear to hear.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=5), 'Cruise Control Analogy', 'Give the "2 cars on the interstate using cruise control" analogy. Pitch adjustment = cruise control; Pushing the record is the gas or accelerator; Pulling the record is applying the car''s brakes.', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=5), 'Pitch Adjustment Practice', 'Have student practice making adjustments with the pitch control. Using doubles, cover the pitch control of one record with a record sleeve (so they can''t see the +/-) and make them drop the record "on the 1" and then make changes to pitch until it''s locked in.', 5),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=5), '2-Handed Approach', 'Discuss the 2-handed "up high/down low" approach. If you must constantly fix the record manually by speeding up or slowing down, you must adjust the pitch as well.', 6);

-- Novice: Week 5
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 5', 'Hand control and vinyl practice', 'novice', 6);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=6), 'Warm-Up', 'Warm up with the 2-2-6 pattern with each hand.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=6), 'Hand Control Review', 'Revisit the faderless baby scratches, tears and chops to help with hand control', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=6), 'Dropping on the 1', 'Revisit dropping "on the 1" with both hands but throw some baby''s in before dropping.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=6), 'Vinyl Doubles', 'Switch them over to vinyl doubles to practice so that they''re forced to listen and not look.', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=6), 'BPM Variation', 'Revisit the 2-handed approach and start working with records at BPM''s that are further apart', 5);

-- Novice: Week 6
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 6', 'Manual adjustments and final review', 'novice', 7);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=7), 'Warm-Up', 'Warm up with the 2-2-6 pattern with each hand', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=7), 'Manual Adjustments', 'Teach the different methods of adjusting the records manually (touching the record, touching the side of the platter, push-and-pull, etc)', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=7), 'Back-Cueing', 'Continue to work on back-cueing / back-spinning', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=7), 'Mixing Refinement', 'Continue practice with mixing and refining the process', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=7), 'Timed Pitch Test', 'Revisit having student practice making adjustments with the pitch control. Using doubles, cover the pitch control of one record with a record sleeve (so they can''t see the +/-) and make them drop the record "on the 1" and then make changes to pitch until it''s locked in. This time, TIME them over a number of attempts and try to get them to speed up how quickly they can fix and lock in the songs & pitch.', 5);

-- Novice: Course Completion Requirements
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Course Completion Requirements', 'Requirements to advance to Amateur level', 'novice', 8);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=8), 'Equipment Identification', 'Identify the standard parts of turntables and mixers, including: crossfader, up-fader OR volume fader, gain OR trim knob, master knob, headphone cue, pitch adjustment OR pitch control, tonearm, cartridge, needle.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=8), '8-Count Proficiency', 'Proficiency in recognization of the 8-count (loop) and identifying where the "1" falls.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=8), 'Scratch Proficiency', 'Proficiency in performing the baby scratch and chop on time, as well as completing the 2-2-6 pattern at an appropriate tempo.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=8), 'Drop Proficiency', 'Proficiency in dropping a song "on the 1".', 4),
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=8), 'Mixing Understanding', 'Has a solid understanding of basic mixing techniques and the ability to mix particular songs together on beat without major complications or extensive "train wrecking".', 5);

-- Novice: Capstone Event Requirements
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Capstone Event Requirements', 'All students must attend the Capstone event and perform competency items', 'novice', 9);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='novice' AND order_index=9), 'Capstone Performance', 'All students will be required to attend the Capstone event and perform these items to prove competency. If they have a conflict and cannot attend the Capstone, they must make arrangements to show their aptitude in the aforementioned areas in front of 2 or more instructors.', 1);

-- ============ AMATEUR ============

-- Amateur: General Course Overview
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('General Course Overview', '12 week class, 90 minutes per class', 'amateur', 1);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=1), '6 Main Scratches', 'Learn and begin to work on the 6 main scratches', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=1), 'Scratch Combinations', 'Incorporate simple scratch combinations and memorizing basic patterns', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=1), 'Mixing Proficiency', 'Continuing to learn mixing and teaching proficiency in mixing/blending two records together cleanly', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=1), 'Song Structure', 'Learning song structure and identifying intro/verse/hook/outro counts', 4),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=1), 'Backspinning', 'Practice and become proficient in backspinning / looping with hands', 5),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=1), 'Manual Adjustments', 'Practice and become proficient in making manual adjustments (touching the record, the "push & pull" technique, using the pitch adjust, "2 handed top & bottom mixing", etc)', 6);

-- Amateur: Week 1
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 1', 'Chirp scratch introduction', 'amateur', 2);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=2), 'Warm-Up', 'Warm up with the 2-2-6 pattern. Increase the instrumental speed as they progress accordingly.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=2), '6 Main Scratches Overview', 'Discuss the 6 main scratches and how they increase hand control and improve overall DJing.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=2), 'Chirp Introduction', 'Begin working on the chirp (discuss origins coming from the baby scratch).', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=2), 'Baby + Chirp Combo', 'Once student understands the basics of the chirp, have student perform 2 babies + 2 chirps repeatedly.', 4),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=2), 'Chirp Speed', 'If ready, practice doubling up the chirps in pairs and speed.', 5),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=2), 'Mixing Practice', 'Revisit mixing basics. Practice the 2-handed approach using the same and different songs/instrumentals accordingly. As soon as the record is let go, they should put their hands in position to make adjustments as quickly as possible.', 6);

-- Amateur: Week 2
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 2', 'Chirp refinement and mixing', 'amateur', 3);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=3), 'Warm-Up', 'Warm up with the 2-2-6 pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=3), 'Chirp Practice', 'Begin practicing the chirp again. Continue to get clean, sharp sounds and increase the speed and frequency as needed.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=3), 'Mixing with BPM Variation', 'Continue working on mixing. Use different instrumentals that are 4-6 BPM''s apart, but still cover up the pitch and hit the space bar to remove the visuals from the screen.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=3), 'Quick Fix Practice', 'Continuing working on quickly fixing a record by running doubles and deliberately push it forward or hold it back and have the student make adjustments accordingly as quickly as possible and bring the volume back up once back on beat. Repeat with each hand.', 4);

-- Amateur: Week 3
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 3', 'Stab, transformer, and closed fader chirp', 'amateur', 4);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=4), 'Warm-Up', 'Warm up with the 2-2-6 pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=4), 'Stab & Transformer', 'Teach the stab and transformer scratches. Both should help improve the other, so start with either one first.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=4), 'Transformer Clicks', 'When teaching the transformer, have student complete 4 clicks forward and 4 clicks backward continuously.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=4), 'Closed Fader Chirp', 'Revisit the chirp. Once warmed up and producing quality, consistent sounds, then teach the chirp from a closed fader position (reminiscent of a stab on the very first motion hence teaching the stab beforehand).', 4),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=4), 'Mixing with Vinyl', 'Continue working on mixing. Use all vinyl (doubles?) to train the ear.', 5);

-- Amateur: Week 4
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 4', 'Combos, cue points, and blending', 'amateur', 5);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Warm-Up', 'Warm up with the 2-2-6 pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Scratch Improvement', 'Continue working on improving the closed fader chirp, transformer and stab.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Simple Combos', 'Put together some simple combos with those scratches.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Song Structure Practice', 'Practice identifying the breaks in a song (intro, verses, hooks/choruses, outro) and dropping songs at the appropriate times.', 4),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Cue Points', 'Teach how to set and label cue points to identify particular sections of a song.', 5),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Mixing Practice', 'Practice mixing, mixing, mixing!', 6),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=5), 'Holding a Blend', 'Teach the students to really HOLD a blend. Have them ride an instrumental on top of another vocal song from beginning to end. Repeat process with different song/instrumental. Help them recognize the tiny nuanced touches (push & pull) required to keep a beat on.', 7);

-- Amateur: Week 5
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 5', 'Transformer, drag, and song breaks', 'amateur', 6);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=6), 'Warm-Up', 'Warm up with the 2-2-6 pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=6), 'Double-Time Transformers', 'Revisit the transformer. Practice double-time transformers over slower tempo instrumentals as well as regular speed at higher tempo instrumentals.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=6), 'Drag Scratch', 'Teach the drag.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=6), 'Transformer-Drag Combos', 'To improve hand control, focus on combos from the transformers into drags (4 clicks forward, 4 clicks backward, forward drag… repeat.)', 4),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=6), 'Song Structure & Breaks', 'Teach and explain the concept of song structure and "the breaks" in a song and how that helps our mixing (intros, hooks/chorus, verses, outros, etc)', 5),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=6), 'Hitting the Breaks', 'Practice hitting the breaks in their mixes (dropping the intro of song A at the beginning of the same count hook of Song B)!', 6);

-- Amateur: Week 6
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 6', 'Closed fader chirp mastery', 'amateur', 7);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=7), 'Warm-Up', 'Warm up with the 2-2-6 pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=7), 'Chirp Mastery', 'Revisit and continue working on improving the chirp. If showing proficiency to maintain a traditional clean, consistent chirp from a closed fader position, practice the 2-2-6 pattern with closed fader chirps only.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=7), '2-Handed Mixing', 'Continue working on mixing while using the 2-handed approach. As soon as the record is let go, they should put their hands in position to make adjustments as quickly as possible.', 3);

-- Amateur: Week 7
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 7', 'Chirp pattern and transitions', 'amateur', 8);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=8), 'Warm-Up', 'Warm up with the 2-2-6 pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=8), 'Closed Fader Chirp 2-2-6', 'Revisit and continue working on the 2-2-6 pattern with closed fader chirps only. If performing these with more ease, increase the tempo of the instrumental.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=8), 'Hitting the Breaks', 'Continue practicing to "hit the breaks" during the intro/hook/outro sections and tighten up the fluidity of using the upfaders (and potentially EQing, if ready) while exiting in the transition.', 3);

-- Amateur: Week 8
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 8', 'Mixing focus', 'amateur', 9);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=9), 'Warm-Up', 'Warm up with the 2-2-6 and 2-2-6 chirp pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=9), 'Intensive Mixing', 'Mixing, mixing, mixing! Continue working on hitting the breaks seamlessly and transitioning sonically as smooth as possible.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=9), 'BPM Challenge', 'If becoming easier, practice selecting records that are further apart in BPM (3-6 apart?) and continue working on the mixing techniques.', 3);

-- Amateur: Week 9
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 9', 'Tear revisit', 'amateur', 10);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=10), 'Warm-Up', 'Warm up with the 2-2-6 and 2-2-6 chirp pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=10), 'Tear Practice', 'Revisit and practice the "tear" briefly (just a reminder). Practice tearing the "ahhh" sound in 2''s and 4''s both forward and backward.', 2);

-- Amateur: Week 10
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 10', 'Backspinning and looping', 'amateur', 11);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=11), 'Warm-Up', 'Warm up with the 2-2-6 and 2-2-6 chirp pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=11), 'Backspinning Technique', 'Teach "backspinning" / "looping" / "flashing" and how to identify the correlation between # of backspins and how many beats have passed (typical guidelines: 16 beats = 6 or 7 backspins; 8 beats = 3 backspins, 4 beats = 1.5 or 2 backspins, etc)', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=11), 'Manual Looping Practice', 'Start with a 16 count and get into a groove by manually rewinding (NO USING CUE POINTS!) and dropping on the 1. After student becomes comfortable, teach how to break down 16 to 8; 8 to 4; 4 to 2; 2 to 1.', 3);

-- Amateur: Week 11
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 11', 'Advanced scratch combos', 'amateur', 12);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=12), 'Warm-Up', 'Warm up with the 2-2-6 and 2-2-6 chirp pattern.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=12), 'Difficult Scratch Sounds', 'Practice putting together more difficult scratch sounds (chirp-drags, stab-drags, chirp-transforms, etc) to build more hand & fader control.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=12), 'Mix Difficulty', 'Continue to practice mixing, but deliberately use a mix of songs with 1/4/8/16/32/64 count intros and hooks (therefore increasing the "difficulty" and "awareness" of hitting the breaks).', 3);

-- Amateur: Week 12
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 12', 'Final review and blindfold test', 'amateur', 13);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=13), 'Scratch Review', 'Revisit all 7 scratches (baby, chop, chirp, transformer, stab, drag, tear). Have the student name and provide examples of each.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=13), 'Combo Practice', 'Practice putting 2 and 3 combination scratches together in succession. Ex: Baby-Chirps-Transformers; or Stab-Drag-Tears; etc. BE CREATIVE!', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=13), 'Mixing Practice', 'Continue mixing!', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=13), 'Blindfold Mixing Test', 'BLINDFOLD MIXING TEST (provide assistance loading new songs, headphones, resetting cue points, etc)', 4);

-- Amateur: Course Completion Requirements
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Course Completion Requirements', 'Requirements to advance to Intermediate level', 'amateur', 14);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=14), '8-Count Mastery', 'Mastery of the 8-count as well as ability to identify the length of a 4, 8, 16 or 32 count intro or hook by ear alone.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=14), '6 Main Scratches', 'Able to display the 6 main scratches on command (baby, stab, chirp, drag, tear, transformer).', 2),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=14), 'Manual Loops', 'Ability to successfully create manual loops with hands, including ability to break it down from 16 to 8 (and hopefully 8 to 4, etc).', 3),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=14), 'Manual Adjustments', 'Shows proficiency in making manual adjustments during live mixing (2-handed approach / push & pull technique).', 4),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=14), 'Mixing & Breaks', 'Able to cleanly mix songs AND identify and hit breaks the majority of the time (intro/verse, outro/intro, etc).', 5),
  ((SELECT id FROM curriculum_modules WHERE level='amateur' AND order_index=14), 'Capstone Event', 'All students will be required to attend the Capstone event and perform these items to prove competency. If they have a conflict and cannot attend the Capstone, they must make arrangements to show their aptitude in the aforementioned areas in front of 2 or more instructors.', 6);

-- ============ INTERMEDIATE ============

-- Intermediate: General Course Overview
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('General Course Overview', '12 week class, 90 minutes per class', 'intermediate', 1);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'Master 7 Scratches', 'Begin to master the 7 main scratches at various tempos and more progressive combinations (ex: chirp flare, etc)', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'Pick Up Scratch', 'Learning the "pick up" swing note scratch (and Philly-Jersey combination and Military scratch patterns)', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'Digital Effects', 'Learning to effectively use cue points, loops and various digital effects, such as the echo, flanger, phaser, etc.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'Manual Transitions', 'Learning to effectively incorporate manual transition techniques into mixing (manual echo, power downs, upfader stab echo, etc)', 4),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'EQ Techniques', 'Learning what EQ''ing (equalization) is and how to use it most effectively', 5),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'Acapellas', 'Learning to use acapellas both creatively and effectively with other instrumentals (i.e. create your own mash-ups on the fly)', 6),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=1), 'Serato Platform', 'Learn more about Serato as a digital platform and troubleshooting digital issues', 7);

-- Intermediate: Week 1
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 1', 'Serato mastery and Military scratch', 'intermediate', 2);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=2), 'Serato Deep Dive', 'Discuss how to use Serato more effectively as a digital platform using cuepoints, looping, SP-6, shortcuts, and troubleshooting problems as they arise on the fly (grey/red bar = not tracking properly; testing your needles'' sensitivity and tracking; understanding the balancing of the signal; etc.)', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=2), 'Mixing by Ear', 'Continue to master mixing by ear. Eliminate the screen/visual while mixing so it isn''t used as a crutch.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=2), 'Military Scratch', 'Teach the Military scratch (with forwards, chops, or stabs): (Fwd |Baby – Fwd – Fwd | Baby – Fwd – Fwd)(transcribed as: / ^//^// … repeat) … this builds more fader control and understanding patterns.', 3);

-- Intermediate: Week 2
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 2', 'Pick up scratch and EQ basics', 'intermediate', 3);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=3), 'Pick Up Scratch', 'Teach the "pick up" swing note scratch.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=3), 'EQ Basics', 'Discuss the basics of EQ''ing and how to truly utilize a traditional 3-band (low, mid, high) EQ while mixing (allowing the frequencies of opposing songs to work together rather than clash, etc).', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=3), 'Serato EQ Waveform', 'Make sure student is aware of Serato''s EQ Color Waveform and how to activate it in the Setup so they can visually see the changes and understand how the "color/look" affects the "sound" of the file as they adjust EQ.', 3),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=3), 'EQ in Mixing', 'Practice mixing and using the EQ''s as you get in and out of each record during the mixes (cutting the bass, boosting the mids or highs on bass heavy records, etc)', 4);

-- Intermediate: Week 3
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 3', 'Manual transition techniques', 'intermediate', 4);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=4), 'Pick Up Speed', 'Practice the "pick up" at faster tempos.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=4), 'Transition Techniques', 'Teach various manual transition techniques (manual echo, power downs, scratching out on particular sound/drum, etc).', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=4), 'Transitions in Mixing', 'Practice mixing and incorporating manual transition techniques on the fly. What challenges arise with each technique? What must you focus on during each?', 3),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=4), 'Instant Doubles', 'Teach the student how to activate and use the "Instant Doubles" feature in Serato and how/why that can be effective.', 4);

-- Intermediate: Week 4
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 4', 'Philly-Jersey combo and mini-sets', 'intermediate', 5);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=5), 'Philly-Jersey Combo', 'Practice the "pick up" and begin to work on the Philly-Jersey combination (banana-bana-fo-fana…).', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=5), 'Transition Mini-Set', 'Revisit manual transition techniques (manual hand echo, power downs, scratching out on a particular sound/drum, etc) and have student put together a mini-set of 4-5 songs, but MUST attempt a different transition technique during each mix between songs.', 2);

-- Intermediate: Week 5
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 5', 'Digs and precision scratching', 'intermediate', 6);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=6), 'Digs Practice', 'Practice "digs" using the Honeydrippers "Impeach The President" 4 count drum loop. Start them off with scratching only the kick drum on 1 & 3. Then only the snare on 2 & 4. Then try to hit all major sounds (1, 2, 3 & 4). Once they''re getting it down, add the hi-hat in between each major sound.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=6), 'Mixing Practice', 'Continue working on mixing, mixing, mixing.', 2);

-- Intermediate: Week 6
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 6', 'Digital effects and backspinning', 'intermediate', 7);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=7), 'Effects Overview', 'Discuss the various effects that are available on different mixers (hardware = Rane 62 or 57, Pioneer S9 or 900, etc versus software = Serato FX, etc). Teach how to change the parameters to customize each effect, specifically the echo (1 beat, 1/2, 1/4, 2/1, 4/1, etc). Auto BPM versus tapping out BPM, etc.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=7), 'Echo in the Mix', 'Teach how and when to use the echo, especially in the mix. How soon do you activate the echo? How long should it carry? How will it impact the timing of your phrasing/hitting the break? Etc.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=7), 'Manual Backspinning', 'Revisit "backspinning"/ "flashing"/ "looping" with hands manually and breaking down beats from 16 to 8; 8 to 4; 4 to 2; 2 to 1 and how to implement this technique in a song while playing live.', 3);

-- Intermediate: Week 7
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 7', 'Digital loops', 'intermediate', 8);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=8), 'Digital Loops', 'Discuss the function of using digital loops in a song as well as how to implement them. How do you set an auto loop versus a manual loop? Where is the best spot to use a loop and for how long? How do you know when to use them?', 1);

-- Intermediate: Week 8
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 8', 'Set programming', 'intermediate', 9);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=9), 'Programming a Set', 'Discuss "programming" a set, musically and how to get around jumping tempos, styles/genres, etc.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=9), 'Tempo & Genre Navigation', 'Choose a song at a slower tempo of a particular genre and one at a faster tempo of a different genre and make the student choose 4-6 songs of their choice to move up in tempo and gradually build up to not only the tempo but also matching the vibe of the "request" or final song.', 2);

-- Intermediate: Week 9
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 9', 'Digs refinement and variety mixing', 'intermediate', 10);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=10), 'Digs Refinement', 'Revisit "digs". Attempt to get cleaner and cleaner scratches out of the record while in motion. Practice scratching out manually as a transition technique, but at a variety of tempos.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=10), 'Variety Mixing', 'Continue mixing, mixing, mixing, but using a variety of song tempos, transition techniques, digital effects, etc. Use as much variety as possible but still maintaining a solid, "organic" feel to the mix.', 2);

-- Intermediate: Week 10
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 10', 'Acapellas and blending', 'intermediate', 11);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=11), 'Acapella Tempo ID', 'Discuss how to identify the tempo in an acapella record (head nods, hand claps, tap out manually in Serato, etc)', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=11), 'Acapella Techniques', 'Discuss working with acapellas. Start again by using an acapella with the matching vocal version on opposite deck, then drop beat out and bring new beat at the same tempo underneath.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=11), 'Pitch Adjustment with Acapellas', 'Practice this same acapella method but work on bringing in a new beat underneath at a slightly different tempo (requiring a quick adjustment to the pitch fader).', 3),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=11), 'Live Blends', 'Teach how to implement acapellas over different instrumentals by dropping them in cold over a different instrumental (i.e.: "a blend").', 4);

-- Intermediate: Week 11
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 11', 'Flashing and SP-6 sampler', 'intermediate', 12);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=12), 'Flashing Practice', 'Revisit "flashing" or "looping with your hands". Practice performing this in the middle of a song using the instant doubles feature in Serato on a specific phrase or section of the beat.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=12), 'SP-6 Sampler', 'Teach how to use the SP-6 sampler in Serato as a 3rd deck. You can drop a song from a live, running deck into the sampler and it''ll start playing immediately, therefore freeing that previous turntable deck up to add.', 2);

-- Intermediate: Week 12
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Week 12', 'Impromptu set performance', 'intermediate', 13);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=13), 'Full Performance Set', 'Put together an impromptu set utilizing everything you''ve learned to date: phrasing & hitting your breaks, use a variety of transition techniques, incorporate digital effects (loops, rolls, echos, etc), using acapellas, flashing/cutting back and forth, and any other technique that they feel compelled to use.', 1);

-- Intermediate: Course Completion Requirements
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('Course Completion Requirements', 'Requirements to advance to Advanced level', 'intermediate', 14);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=14), 'Manual Looping Mastery', 'Shows proficiency in "backspinning", "flashing" or "looping" manually with hands, including ability to break them down from 16 to 8, 8 to 4, 4 to 2, and 2 to 1.', 1),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=14), 'Serato Digital Tools', 'Shows understanding in how to utilize/activate some of Serato''s main digital components, such as creating and using loops (auto and manual), activating rolls, using echoes and determining how and why to use certain parameters for a specific desired result, etc.', 2),
  ((SELECT id FROM curriculum_modules WHERE level='intermediate' AND order_index=14), 'Acapella Proficiency', 'Shows basic proficiency in utilizing particular acapellas in conjunction with different instrumentals to complete a live remix/blend.', 3);

-- ============ ADVANCED ============

-- Advanced: General Course Overview
INSERT INTO curriculum_modules (title, description, level, order_index) VALUES ('General Course Overview', '6 week class, 90 minutes per class. The Advanced course curriculum is completely open and may be determined by the instructor so long as it focuses on and has the end goal of sharpening specific skills (scratches, patterns, juggling, or any techniques) and proving proficiency or even mastery.', 'advanced', 1);
INSERT INTO curriculum_lessons (module_id, title, description, order_index) VALUES
  ((SELECT id FROM curriculum_modules WHERE level='advanced' AND order_index=1), 'Open Curriculum', 'The Advanced course curriculum is completely open and may be determined by the instructor so long as it focuses on and has the end goal of sharpening specific skills (scratches, patterns, juggling, or any techniques) and proving proficiency or even mastery.', 1);
