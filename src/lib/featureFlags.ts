/**
 * Feature flags for scheduled launches.
 *
 * Walkthroughs (page tours + first-time grading modal) are gated until the
 * public launch on Monday, July 20, 2026 at 00:00 America/New_York
 * (04:00 UTC).
 *
 * Override for local QA by running in the browser console:
 *   localStorage.setItem('walkthroughs-force-enabled', 'true')
 */
export const WALKTHROUGH_LAUNCH_UTC = new Date('2026-07-20T04:00:00Z');

export function isWalkthroughEnabled(now: Date = new Date()): boolean {
  try {
    if (typeof window !== 'undefined' &&
        window.localStorage?.getItem('walkthroughs-force-enabled') === 'true') {
      return true;
    }
  } catch {
    // ignore storage errors
  }
  return now.getTime() >= WALKTHROUGH_LAUNCH_UTC.getTime();
}