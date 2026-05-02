import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fingerprint, Trash2, Plus } from 'lucide-react';
import {
  useUserPasskeys,
  useRegisterPasskey,
  useDeletePasskey,
} from '@/hooks/usePasskeys';
import { toast } from '@/hooks/use-toast';
import { formatDateUS } from '@/lib/utils';
import { isPasskeySupported } from '@/lib/passkeys';

export const PasskeyManager: React.FC = () => {
  const { data: passkeys, isLoading } = useUserPasskeys();
  const register = useRegisterPasskey();
  const remove = useDeletePasskey();

  const handleAdd = async () => {
    // Defer ALL WebAuthn API access until the user explicitly clicks the
    // button. Calling `isUserVerifyingPlatformAuthenticatorAvailable()` on
    // mount could surface a native biometric/passkey sheet on iOS Safari,
    // which is exactly what we are trying to prevent.
    try {
      const supported = await isPasskeySupported();
      if (!supported) {
        toast({
          title: 'Not supported on this device',
          description: "This device doesn't support biometric sign-in.",
        });
        return;
      }
      const { deviceLabel } = await register.mutateAsync();
      toast({
        title: 'Device registered',
        description: `${deviceLabel} is ready for Quick Login.`,
      });
    } catch (err: any) {
      const msg = err?.message || 'Could not register this device';
      if (!/cancel|abort|NotAllowed/i.test(msg)) {
        toast({ title: 'Registration failed', description: msg, variant: 'destructive' });
      }
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast({ title: 'Device removed' });
    } catch (err: any) {
      toast({
        title: 'Could not remove',
        description: err?.message || 'Try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Quick Login</CardTitle>
            <CardDescription>
              Sign in with your face or fingerprint instead of a password.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading devices…</p>
        ) : passkeys && passkeys.length > 0 ? (
          <ul className="space-y-2">
            {passkeys.map((pk) => (
              <li
                key={pk.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {pk.device_label || 'Registered device'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatDateUS(pk.created_at)}
                    {pk.last_used_at ? ` · Last used ${formatDateUS(pk.last_used_at)}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(pk.id)}
                  disabled={remove.isPending}
                  aria-label="Remove device"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No devices registered yet.</p>
        )}

        <Button
          type="button"
          onClick={handleAdd}
          disabled={register.isPending}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          {register.isPending ? 'Registering…' : 'Add this device'}
        </Button>
      </CardContent>
    </Card>
  );
};
