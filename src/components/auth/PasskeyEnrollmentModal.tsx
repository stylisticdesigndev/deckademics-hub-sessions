import React from 'react';
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
import {
  useRegisterPasskey,
  useDismissPasskeyPrompt,
} from '@/hooks/usePasskeys';
import { toast } from '@/hooks/use-toast';

/**
 * Controlled one-time proactive enrollment modal.
 * The parent (DashboardLayout) decides whether this modal exists at all,
 * based on route, auth-loading, and passkey eligibility. This avoids the
 * brief flash that occurred when the modal mounted, then closed itself.
 */
interface PasskeyEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasskeyEnrollmentModal: React.FC<PasskeyEnrollmentModalProps> = ({
  open,
  onOpenChange,
}) => {
  const register = useRegisterPasskey();
  const dismiss = useDismissPasskeyPrompt();

  const handleEnable = async () => {
    try {
      await register.mutateAsync();
      onOpenChange(false);
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
    onOpenChange(false);
    try {
      await dismiss.mutateAsync();
    } catch {
      // best-effort
    }
    toast({
      title: 'No problem — you can enable it later',
      description:
        'To set up Quick Login later, open your Profile page and find the "Quick Login" section. Click "Add this device" and follow your device\'s prompt to register your fingerprint or face.',
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
