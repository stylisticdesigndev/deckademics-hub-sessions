import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * PushNotificationPrompt — one-time post-onboarding modal that invites the
 * user to enable push notifications. Shows once per user per device (tracked
 * with a localStorage flag), and only when push is actually usable on this
 * device. iPhone users who haven't added the app to their Home Screen are
 * shown an install hint instead of a non-functional enable button.
 */
const flagKey = (userId: string) => `push-prompt-shown:${userId}`;

export const PushNotificationPrompt = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const push = usePushNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userId || push.loading) return;
    // Already subscribed, unsupported device, or already prompted → never show.
    if (push.enabled || !push.supported) return;
    if (localStorage.getItem(flagKey(userId))) return;
    setOpen(true);
  }, [userId, push.loading, push.enabled, push.supported]);

  const markShown = () => {
    if (userId) localStorage.setItem(flagKey(userId), '1');
  };

  const handleEnable = async () => {
    await push.enable();
    markShown();
    setOpen(false);
  };

  const handleSkip = () => {
    markShown();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Stay in the loop</DialogTitle>
          <DialogDescription className="text-center">
            Turn on push notifications to get instant alerts for new messages,
            announcements, and class updates — even when the app is closed.
          </DialogDescription>
        </DialogHeader>

        {push.needsHomeScreen ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              On iPhone, first add this app to your Home Screen
              (Share → Add to Home Screen), then open it from the icon to turn
              on notifications from your Profile.
            </p>
            <DialogFooter>
              <Button className="w-full" onClick={handleSkip}>Got it</Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full" onClick={handleEnable} disabled={push.busy}>
              {push.busy ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enabling...</>
              ) : (
                'Enable notifications'
              )}
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleSkip} disabled={push.busy}>
              Maybe later
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PushNotificationPrompt;
