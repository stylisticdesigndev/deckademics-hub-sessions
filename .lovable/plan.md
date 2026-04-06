# Extract Curriculum Skills into Progress Skills

## Summary

Delete existing placeholder progress_skills and replace them with meaningful skills extracted from each level's curriculum (General Course Overview + Course Completion Requirements).

## Skills to Create

### Novice (10 skills)

1. Equipment Knowledge — Identify turntable/mixer components
2. BPM Counting — Count BPMs and understand song structure
3. Baby Scratch — Perform baby scratch on time
4. Chop Scratch — Perform chop scratch on time
5. 2-2-6 Pattern — Complete the 2-2-6 pattern at appropriate tempo
6. Dropping on the 1 — Start a record on time
7. 8-Count Recognition — Recognize the 8-count loop and identify the "1"
8. Basic Mixing — Mix songs together on beat without major complications
9. 2-Handed Approach — Use the push & pull method of adjustment
10. Equipment Setup — Set up turntables/CDJs, mixer, speakers

### Amateur (11 skills)

1. Chirp Scratch — Clean, consistent chirp from open and closed fader
2. Transformer Scratch — Forward/backward transformer clicks
3. Stab Scratch — Stab scratch technique
4. Drag Scratch — Drag scratch technique
5. Tear Scratch — Tear the sound in 2s and 4s
6. Scratch Combinations — 2-3 scratch combos in succession
7. Song Structure — Identify intro/verse/hook/outro by ear
8. Mixing Proficiency — Cleanly blend two records and hit the breaks
9. Manual Adjustments — 2-handed push & pull during live mixing
10. Backspinning — Manual looping, break down 16 to 8, 8 to 4, etc.
11. 8-Count Mastery — Identify 4/8/16/32 count intros/hooks by ear

### Intermediate (10 skills)

1. 7 Scratches Mastery — All 7 scratches at various tempos with combos
2. Pick Up Scratch — Swing note scratch and Philly-Jersey combo
3. Military Scratch — Military scratch pattern with fader control
4. EQ Techniques — Use 3-band EQ effectively while mixing
5. Digital Effects — Echo, flanger, phaser with correct parameters
6. Manual Transitions — Manual echo, power downs, scratch-outs
7. Digital Loops — Set auto/manual loops, implement in live sets
8. Acapella Blending — Live remixes using acapellas over instrumentals
9. Serato Platform — Cue points, loops, SP-6, troubleshooting
10. Manual Looping Mastery — Backspin breakdowns 16→8→4→2→1

### Advanced (1 skill)

1. Open Proficiency — Instructor-determined skill mastery focus. Instruct instructors to add the skill for each student in the Task section

## Steps

1. **Delete existing progress_skills** — Remove the 6 current placeholder records (using Supabase insert tool for DELETE)
2. **Insert 32 new skills** — One INSERT with all skills, proper `level`, `order_index`, `name`, and `description` fields

## Technical Details

- Uses Supabase insert tool (data mutation, not schema change)
- No code changes needed — the AdminSkills page and instructor assessment views already dynamically fetch from `progress_skills`
- Skills will immediately appear in the Skills management page and instructor student assessments