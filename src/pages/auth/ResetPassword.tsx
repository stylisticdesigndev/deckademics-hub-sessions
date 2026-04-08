
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LockKeyhole, EyeIcon, EyeOffIcon, Check, X } from 'lucide-react';
import { VideoBackground } from '@/components/background/VideoBackground';

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const passedCount = PASSWORD_REQUIREMENTS.filter(r => r.test(password)).length;
  const allPassed = passedCount === PASSWORD_REQUIREMENTS.length;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allPassed && passwordsMatch && !loading;

  const getBarColor = () => {
    if (passedCount <= 1) return 'bg-red-500';
    if (passedCount <= 2) return 'bg-orange-500';
    if (passedCount <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been reset successfully. Please log in.',
      });

      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const pageWrapper = (children: React.ReactNode) => (
    <div className="min-h-screen flex flex-col relative">
      <VideoBackground
        videoSrc="/background-video.mp4"
        fallbackSrc="/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png"
      />
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10 relative">
        <div className="w-full max-w-md space-y-6 bg-black/70 p-6 rounded-xl backdrop-blur-sm">
          <div className="text-center flex flex-col items-center mb-4">
            <img
              src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png"
              alt="Deckademics Logo"
              className="h-20 w-auto mb-2"
            />
          </div>
          {children}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground z-10 relative bg-black/50 backdrop-blur-sm">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
      </footer>
    </div>
  );

  if (!isRecovery) {
    return pageWrapper(
      <Card className="bg-transparent border-0 shadow-none text-white">
        <CardHeader>
          <CardTitle>Invalid Link</CardTitle>
          <CardDescription className="text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate('/')}>
            Return to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return pageWrapper(
    <Card className="bg-transparent border-0 shadow-none text-white">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-0 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>

            {password && (
              <div className="mt-2 space-y-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getBarColor()} transition-all duration-300`}
                    style={{ width: `${(passedCount / PASSWORD_REQUIREMENTS.length) * 100}%` }}
                  />
                </div>
                <ul className="space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req, i) => {
                    const passed = req.test(password);
                    return (
                      <li key={i} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirm New Password</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="confirm-new-password"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-0 text-muted-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-400 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ResetPassword;
