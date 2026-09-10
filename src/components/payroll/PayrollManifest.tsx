import { useEffect } from 'react';

/**
 * Swaps the document's web app manifest to the Payroll manifest while the
 * user is inside /payroll, so the browser offers "Deckademics Payroll" as a
 * separate installable app. Restores the main manifest on unmount.
 */
export const PayrollManifest = () => {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;
    const previous = link.getAttribute('href');
    link.setAttribute('href', '/payroll.webmanifest');
    const previousTitle = document.title;
    document.title = 'Deckademics Payroll';
    return () => {
      if (previous) link.setAttribute('href', previous);
      document.title = previousTitle;
    };
  }, []);

  return null;
};
