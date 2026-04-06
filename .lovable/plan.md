

# Update Curriculum Data to Match PDF Rubrics

## Summary
Replace all existing curriculum modules and lessons with the actual Deckademics rubric content from the four uploaded PDFs.

## Data Structure

Each level will be organized as follows:
- **Module 1**: "General Course Overview" — overview bullet points become lessons
- **Modules 2+**: One module per week (Week 1, Week 2, etc.) — each bullet point becomes a lesson
- **Final Module**: "Course Completion Requirements" — each requirement becomes a lesson
- For Novice: also a "Capstone Event Requirements" module

| Level | Weeks | Modules | Approx Lessons |
|-------|-------|---------|----------------|
| Novice | 6 | 8 (overview + 6 weeks + completion + capstone) | ~45 |
| Amateur | 12 | 14 (overview + 12 weeks + completion) | ~55 |
| Intermediate | 12 | 14 (overview + 12 weeks + completion) | ~45 |
| Advanced | — | 1 (overview only, open curriculum) | ~1 |

## Steps

1. **Delete existing data** — Remove all current `curriculum_lessons` first (foreign key dependency on modules), then all `curriculum_modules`. Uses the Supabase insert tool for DELETE operations.

2. **Insert new modules** — Insert all ~37 modules across all four levels with correct `level`, `title`, `description`, and `order_index`.

3. **Insert new lessons** — Insert all ~146 lessons linked to their parent modules, with the bullet point content as descriptions and proper `order_index` ordering.

## Technical Notes
- All operations are data mutations (DELETE/INSERT), so they use the Supabase insert tool, not migrations
- Module descriptions will contain the course duration info (e.g., "6 week class, 90 minutes per class")
- Lesson titles will be concise summaries; full bullet text goes in the `description` field
- No schema changes needed — existing `curriculum_modules` and `curriculum_lessons` tables already have the right columns

