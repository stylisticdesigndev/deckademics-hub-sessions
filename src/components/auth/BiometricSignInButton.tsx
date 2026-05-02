import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { signInWithPasskey } from '@/lib/passkeys';
import { usePasskeySupport } from '@/hooks/usePasskeys';

interface Props {
  email?: string;
  redirectRole?: 'student' | 'instructor' | 'admin';
}

export const BiometricSignInButton: React.FC<Props> = ({ email, redirectRole }) => {
  const supported = usePasskeySupport();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (supported !== true) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      await signInWithPasskey(email);
      // On success, navigate to dashboard. AuthProvider will pick up SIGNED_IN.
      setTimeout(() => {
        if (redirectRole === 'student') navigate('/student/dashboard');
        else if (redirectRole === 'instructor' || redirectRole === 'admin')
          navigate('/instructor/dashboard');
        else navigate('/');
      }, 100);
    } catch (err: any) {
      const msg = err?.message || 'Biometric sign-in failed';
      // User-cancelled is not an error worth shouting about
      if (!/cancel|abort|NotAllowed/i.test(msg)) {
        toast({
          title: 'Biometric sign-in failed',
          description: msg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full mt-2 gap-2"
      onClick={handleClick}
      disabled={loading}
    >
      <Fingerprint className="h-4 w-4" />
      {loading ? 'Authenticating…' : 'Sign in with Biometrics'}
    </Button>
  );
};
