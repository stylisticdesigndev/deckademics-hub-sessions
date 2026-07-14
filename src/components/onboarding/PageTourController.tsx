import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/lib/tour/driver-theme.css';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { STUDENT_TOURS, INSTRUCTOR_TOURS, ADMIN_TOURS, type Role } from '@/lib/tour/tours';

interface PageTourControllerProps {
  role: Role;
}

const TOUR_MAP: Record<Role, Record<string, { id: string; steps: any[] }>> = {
  student: Object.fromEntries(Object.values(STUDENT_TOURS).map((t) => [t.path, t])),
  instructor: Object.fromEntries(Object.values(INSTRUCTOR_TOURS).map((t) => [t.path, t])),
  admin: Object.fromEntries(Object.values(ADMIN_TOURS).map((t) => [t.path, t])),
};

/**
 * Mount once inside each role's layout. Watches the route; when the user
 * lands on a page that has a registered tour AND hasn't seen it yet,
 * auto-plays the tour after a short delay so the page can render its DOM.
 */
export const PageTourController: React.FC<PageTourControllerProps> = ({ role }) => {
  const { pathname } = useLocation();
  const { hasSeen, markSeen, loaded } = useOnboardingState();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!loaded) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const tour = TOUR_MAP[role][pathname];
    if (!tour) return;
    if (hasSeen(tour.id)) return;

    const timer = window.setTimeout(() => {
      // Filter steps whose element selector isn't in the DOM.
      const steps = (tour.steps as any[]).filter((s) => {
        if (!s.element) return true;
        if (typeof s.element === 'string') return !!document.querySelector(s.element);
        return true;
      });
      if (steps.length === 0) {
        void markSeen(tour.id);
        return;
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
        steps,
        onDestroyStarted: () => {
          void markSeen(tour.id);
          d.destroy();
        },
      });
      d.drive();
    }, 500);

    return () => window.clearTimeout(timer);
  }, [pathname, role, loaded, hasSeen, markSeen]);

  return null;
};

export default PageTourController;