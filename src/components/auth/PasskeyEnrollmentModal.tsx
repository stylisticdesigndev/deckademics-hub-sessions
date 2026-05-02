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
import { Fingerprint } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  usePasskeySupport,
  useUserPasskeys,
  useRegisterPasskey,
  useDismissPasskeyPrompt,
} from '@/hooks/usePasskeys';
import { toast } from '@/hooks/use-toast';

/**
 * One-time proactive enrollment modal. Shows once per user when:
 * - logged in
 * - device supports platform authenticator
 * - user has zero registered passkeys
 * - user hasn't clicked "Maybe Later" before
 */
export const PasskeyEnrollmentModal: React.FC = () => {
  const { session, userData } = useAuth();
  const supported = usePasskeySupport();
  const { data: passkeys, isLoading: passkeysLoading } = useUserPasskeys();
  const register = useRegisterPasskey();
  const dismiss = useDismissPasskeyPrompt();
  const [open, setOpen] = useState(false);

  const dismissed = (userData.profile as any)?.passkey_prompt_dismissed === true;

  useEffect(() => {
    if (!session?.user) return;
    if (supported !== true) return;
    if (passkeysLoading) return;
    if ((passkeys?.length ?? 0) > 0) return;
    if (dismissed) return;
    setOpen(true);
  }, [session, supported, passkeysLoading, passkeys, dismissed]);

  const handleEnable = async () => {
    try {
      await register.mutateAsync();
      setOpen(false);
      toast({
        title: 'Quick Login enabled',
        description: 'You can now sign in with your fingerprint or face.',
      });
    } catch (err: any) {
      const msg = err?.message || 'Could not enable Quick Login';
      if (!/cancel|abort|NotAllowed/i.test(msg)) {
        toast({ title: 'Failed to enable', description: msg, variant: 'destructive' });
      }
    }
  };

  const handleLater = async () => {
    setOpen(false);
    try {
      await dismiss.mutateAsync();
    } catch {
      // best-effort
    }
    toast({
      title: 'No problem — you can enable it later',
      description:
        'To set up Quick Login later, open your Profile page and find the "Quick Login" section. Click "Add this device" and follow your device\'s prompt to register your fingerprint or face.',
      duration: 10000,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleLater()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Fingerprint className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">Enable Quick Login?</DialogTitle>
          <DialogDescription className="text-center">
            Use your face or fingerprint to sign in faster next time.
          </DialogDescription>
        </DialogHeader>
      <p className="text-center text-xs text-muted-foreground -mt-2">
        You can always enable this later from your Profile page under "Quick Login."
      </p>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button onClick={handleEnable} disabled={register.isPending} className="w-full">
            {register.isPending ? 'Setting up…' : 'Enable'}
          </Button>
          <Button
            variant="ghost"
            onClick={handleLater}
            disabled={register.isPending}
            className="w-full"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
