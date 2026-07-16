import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';

/**
 * InstallAppPrompt — one-tap "Install app" banner.
 *
 * - Android / Chrome / Edge / desktop Chromium: listens for the native
 *   `beforeinstallprompt` event and calls prompt() on click.
 * - iOS Safari: shows a small instructions sheet (Share → Add to Home Screen)
 *   since Apple does not expose a programmatic install API.
 * - Hides when the app is already installed (display-mode: standalone) or
 *   after the user dismisses it (remembered for 14 days).
 */

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'install-prompt-dismissed-at';
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true);

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
};

// iOS Safari (not Chrome/Firefox in-app browsers, which cannot install PWAs).
const isIOSSafari = () => {
  if (!isIOS()) return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
};

const recentlyDismissed = () => {
  const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
  return last && Date.now() - last < DISMISS_MS;
};

export const InstallAppPrompt = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari: no native event — show a delayed hint banner.
    let iosTimer: number | undefined;
    if (isIOSSafari()) {
      iosTimer = window.setTimeout(() => {
        setShowIOS(true);
        setVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setDeferred(null);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-[9998] mx-auto max-w-md rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:inset-x-auto sm:right-4"
      role="dialog"
      aria-label="Install Deckademics app"
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Deckademics</p>
          {showIOS ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Tap <Share className="mx-1 inline h-3.5 w-3.5 align-text-bottom" />
              Share, then <span className="font-medium">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Add the app to your home screen for one-tap access and push
              notifications.
            </p>
          )}

          {!showIOS && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={install} className="h-8">
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss} className="h-8">
                Not now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallAppPrompt;