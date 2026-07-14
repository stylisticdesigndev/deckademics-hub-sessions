import { useCallback, useEffect, useRef } from 'react';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/lib/tour/driver-theme.css';
import { useOnboardingState } from '@/hooks/useOnboardingState';

export type TourStep = DriveStep & {
  /** Optional selector to test presence. Steps whose element is missing are skipped. */
  requireElement?: boolean;
};

function filterAvailableSteps(steps: TourStep[]): DriveStep[] {
  return steps.filter((s) => {
    if (s.requireElement === false) return true;
    const el = s.element;
    if (!el) return true; // no element = center popover, always valid
    if (typeof el === 'string') return !!document.querySelector(el);
    return true;
  });
}

/**
 * Coach-mark tour bound to a persisted tour id.
 * - Auto-plays once (on first visit) when `autoStart` is true AND the tour is unseen.
 * - Always exposes `start()` for manual replay.
 */
export function useTour(
  tourId: string,
  steps: TourStep[],
  options: { autoStart?: boolean; enabled?: boolean; delayMs?: number } = {},
) {
  const { autoStart = true, enabled = true, delayMs = 400 } = options;
  const { hasSeen, markSeen, loaded } = useOnboardingState();
  const driverRef = useRef<Driver | null>(null);
  const startedRef = useRef(false);

  const start = useCallback(() => {
    const available = filterAvailableSteps(steps);
    if (available.length === 0) {
      // Nothing to show — still mark seen so we don't retry endlessly.
      void markSeen(tourId);
      return;
    }
    // Destroy any existing driver first.
    if (driverRef.current) {
      try { driverRef.current.destroy(); } catch { /* noop */ }
      driverRef.current = null;
    }
    const d = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 8,
      popoverClass: 'deckademics-tour',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      progressText: '{{current}} of {{total}}',
      steps: available,
      onDestroyStarted: () => {
        // User skipped or finished; mark seen either way.
        void markSeen(tourId);
        d.destroy();
      },
      onDestroyed: () => {
        driverRef.current = null;
      },
    });
    driverRef.current = d;
    d.drive();
  }, [tourId, steps, markSeen]);

  useEffect(() => {
    if (!autoStart || !enabled || !loaded) return;
    if (startedRef.current) return;
    if (hasSeen(tourId)) return;
    startedRef.current = true;
    const t = window.setTimeout(() => start(), delayMs);
    return () => window.clearTimeout(t);
  }, [autoStart, enabled, loaded, hasSeen, tourId, start, delayMs]);

  useEffect(() => () => {
    if (driverRef.current) {
      try { driverRef.current.destroy(); } catch { /* noop */ }
      driverRef.current = null;
    }
  }, []);

  return { start, hasSeen: hasSeen(tourId) };
}