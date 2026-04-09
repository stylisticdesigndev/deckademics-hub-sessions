/**
 * IOSSplashScreen — Displays a branded splash screen on iOS (and Android)
 * when the app is launched in standalone / "Add to Home Screen" mode.
 *
 * Behaviour:
 * - Only renders when `display-mode: standalone` is active (i.e. installed PWA).
 * - Shows the Deckademics logo centred on the brand background colour (#222730).
 * - Auto-fades out after 1.5 s, then unmounts itself from the DOM.
 */
import { useEffect, useState } from 'react';

const IOSSplashScreen = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Only show in standalone mode (installed PWA)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  useEffect(() => {
    if (!isStandalone) {
      setVisible(false);
      return;
    }

    // Begin fade-out after 1.5 s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1500);
    // Fully unmount after fade animation (0.5 s)
    const hideTimer = setTimeout(() => setVisible(false), 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [isStandalone]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#222730',
        transition: 'opacity 0.5s ease-out',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      <img
        src="/app-icon.png"
        alt="Deckademics"
        style={{ width: 160, height: 160, borderRadius: 32 }}
      />
    </div>
  );
};

export default IOSSplashScreen;
