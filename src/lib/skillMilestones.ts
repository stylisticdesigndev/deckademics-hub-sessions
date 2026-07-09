// Shared logic + presentation helpers for the 3-point milestone grading scale.
//
// Skills are scored on a 0–3 scale stored in `student_progress.proficiency`:
//   0 = Not Assessed, 1 = Needs Work, 2 = Proficient, 3 = Mastered
//
// Advancement (Option 1 — Core vs Creative Threshold):
//   A student is "Ready to Advance" from their current level when every
//   Core skill is Mastered (3) AND every non-Core (Creative) skill is at
//   least Proficient (2).

export type Milestone = 0 | 1 | 2 | 3;

export const MILESTONE_LABELS: Record<number, string> = {
  0: 'Not Assessed',
  1: 'Needs Work',
  2: 'Proficient',
  3: 'Mastered',
};

// Border + text color classes for chips/badges (semantic, dark-mode safe).
export const MILESTONE_BADGE_CLASS: Record<number, string> = {
  0: 'border-muted-foreground/40 text-muted-foreground',
  1: 'border-red-500/50 text-red-500',
  2: 'border-amber-500/50 text-amber-500',
  3: 'border-green-500/50 text-green-500',
};

// Fill colors for rings/segments.
export const MILESTONE_FILL: Record<number, string> = {
  0: 'hsl(var(--muted))',
  1: 'hsl(0, 72%, 51%)',
  2: 'hsl(38, 92%, 50%)',
  3: 'hsl(142, 71%, 45%)',
};

export const LEVEL_ORDER = ['novice', 'amateur', 'intermediate', 'advanced'] as const;

export const NEXT_LEVEL: Record<string, string | null> = {
  novice: 'amateur',
  amateur: 'intermediate',
  intermediate: 'advanced',
  advanced: null,
};

/** Normalize a raw level string (handles legacy "beginner" → "novice"). */
export function normalizeLevel(level?: string | null): string {
  const raw = (level || 'novice').toLowerCase();
  return raw === 'beginner' ? 'novice' : raw;
}

export function nextLevelOf(level?: string | null): string | null {
  return NEXT_LEVEL[normalizeLevel(level)] ?? null;
}

export function milestoneLabel(value?: number | null): string {
  return MILESTONE_LABELS[Math.max(0, Math.min(3, value ?? 0))] ?? 'Not Assessed';
}

export interface ReadinessSkill {
  proficiency: number; // 0–3
  is_core: boolean;
}

export interface Readiness {
  masteredCount: number;
  total: number;
  isReady: boolean;
  unmetCore: number;
  unmetCreative: number;
}

/**
 * Compute mastery summary + Core-vs-Creative advancement readiness for a set
 * of skills at a student's current level.
 */
export function computeReadiness(skills: ReadinessSkill[]): Readiness {
  const total = skills.length;
  let masteredCount = 0;
  let unmetCore = 0;
  let unmetCreative = 0;

  for (const s of skills) {
    const p = s.proficiency || 0;
    if (p >= 3) masteredCount++;
    if (s.is_core) {
      if (p < 3) unmetCore++;
    } else if (p < 2) {
      unmetCreative++;
    }
  }

  const isReady = total > 0 && unmetCore === 0 && unmetCreative === 0;
  return { masteredCount, total, isReady, unmetCore, unmetCreative };
}