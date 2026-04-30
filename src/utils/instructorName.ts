export interface InstructorNameLike {
  dj_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * Returns the display name to use for an instructor across the app.
 * Prefers `dj_name` when set; otherwise falls back to "First Last".
 */
export function getInstructorDisplayName(p?: InstructorNameLike | null): string {
  if (!p) return '';
  const dj = (p.dj_name || '').trim();
  if (dj) return dj;
  const fn = (p.first_name || '').trim();
  const ln = (p.last_name || '').trim();
  return `${fn} ${ln}`.trim();
}