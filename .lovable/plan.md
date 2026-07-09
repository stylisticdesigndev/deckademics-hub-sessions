# 3-Point Milestone Grading (Option 1: Core vs Creative Threshold)

Replace the current 0–100% proficiency sliders with a 3-point milestone scale and add the Core-vs-Creative advancement rule.

## The milestone scale
Each skill is scored on 4 states stored in `student_progress.proficiency`:

```text
0 = Not Assessed
1 = Needs Work
2 = Proficient
3 = Mastered
```

## The advancement rule (Core vs Creative)
A student is **Ready to Advance** from their current level when:
- **Every Core skill** at that level is at **3 (Mastered)**, AND
- **Every non-Core (Creative) skill** at that level is at least **2 (Proficient)**.

When met, a **"Ready to Advance"** badge appears on the student in the instructor/admin views, and an instructor/admin clicks **Advance to [next level]** to actually change the level (leveling stays manual — no automatic bump).

## Decisions confirmed
- Advancement: readiness badge + manual confirm button.
- Overall metric replaces "% progress" with a **mastered count** ("X of Y Mastered") for the current level.
- Existing 0–100 scores auto-convert: `<50 → 1`, `50–84 → 2`, `85–100 → 3`, `0 → 0 (unassessed)`.

---

## Database changes (one migration)
1. Add `is_core boolean NOT NULL DEFAULT true` to `progress_skills` (Critical Core Metric flag).
2. Drop the existing `proficiency >= 0 AND proficiency <= 100` CHECK on `student_progress`; add `proficiency >= 0 AND proficiency <= 3`.
3. Data conversion on existing `student_progress` rows: bucket old values into 0/1/2/3 by the ranges above.

## Admin — Skills Management (`src/pages/admin/AdminSkills.tsx`)
- Add a **"Critical Core skill"** toggle to the Add and Edit dialogs.
- Show a **Core** / **Creative** badge on each skill card.
- Update the "How Skills Work" helper text to explain the milestone scale and Core vs Creative.
- Extend hooks `useCreateProgressSkill` / `useUpdateProgressSkill` and the `ProgressSkill` interface with `is_core`.

## Instructor — assessment UI (`InstructorStudentDetailDialog.tsx`)
- Replace the 0–100 `Slider` with a 3-button segmented control: **Needs Work · Proficient · Mastered** (plus a Clear/Not-Assessed option).
- `handleSkillProficiencyUpdate` writes 1/2/3 instead of the slider value; toast reads "set to Mastered" etc.
- Per-skill row shows a milestone chip instead of `%`.
- Show the **Ready to Advance** badge + **Advance to [next level]** button (uses existing `useUpdateStudentLevel`) when the threshold is met; the button is disabled otherwise with a short "needs all Core mastered" hint.

## Shared readiness helper (new `src/lib/skillMilestones.ts`)
- `MILESTONE_LABELS` and color map (1 red, 2 amber, 3 green) for reuse.
- `computeReadiness(skills)` → returns `{ masteredCount, total, isReady, unmetCore[], unmetCreative[] }` given the level's skills + the student's scores and each skill's `is_core`.
- `NEXT_LEVEL` map (novice→amateur→intermediate→advanced; advanced has none).

## Student-facing display
- **`src/pages/student/StudentProgress.tsx`**: replace per-skill `%` bars with milestone chips; replace the "Overall Progress %" card with **"X of Y Mastered"** for their level plus the Ready-to-Advance status.
- **`SkillBreakdownChart.tsx`**: rings become 3-segment milestone indicators (or milestone-colored chips) instead of `%` rings.
- **`OverallProgressRing.tsx` / `ProgressSection.tsx`**: show mastered-count / milestone summary instead of averaged `%`.
- **`CalendarClassDetail.tsx`** (read-only): milestone chips instead of `%`.

## Averaging / overview logic to convert
Replace the 5 averaging sites so "progress" = milestone summary, not `%`:
- `useStudentClassDetail.ts`, `useInstructorStudentsSimple.ts`, `useStudentDashboardCore.ts`, `student/dashboard/useStudentProgress.ts`, `StudentProgress.tsx` — return `{ masteredCount, total, isReady }` per student instead of an averaged number.
- `useAdminProgress.ts` + `AdminProgress.tsx`: switch the "Overall Progress" column to a mastered count / Ready-to-Advance indicator for the student's current level (drops the lesson-completion percentage method).
- Carry `is_core` through the queries that already fetch `progress_skills`.

## Notes
- `ProgressBar` (0–100) stays available for any non-skill usage but is removed from skill rows.
- Small pre-existing fix: include `level` in the `useStudentClassDetail` query key to avoid stale data when a level changes mid-session.

## Technical touch list
- Migration: `progress_skills.is_core`, `student_progress` CHECK swap + data bucketing.
- Hooks: `useProgressSkills`, `useCreateProgressSkill`, `useUpdateProgressSkill`, `useStudentProgress` (both), `useAdminProgress`, `useInstructorStudentsSimple`, `useStudentClassDetail`, `useStudentDashboardCore`.
- New: `src/lib/skillMilestones.ts`.
- Components/pages: `AdminSkills.tsx`, `InstructorStudentDetailDialog.tsx`, `StudentProgress.tsx`, `SkillBreakdownChart.tsx`, `OverallProgressRing.tsx`, `ProgressSection.tsx`, `CalendarClassDetail.tsx`, `AdminProgress.tsx`.
- Memory: update the Progress Skills System memory to reflect the 3-point milestone scale + Core/Creative rule (replaces the 0–100 note).
