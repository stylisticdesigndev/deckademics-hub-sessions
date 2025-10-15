import React, { useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Define the admin email as a constant that can be easily updated
const ADMIN_EMAIL = 'whadhannen@gmail.com';

const AdminAuthContent = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (session && session.user) {
      const role = session.user.user_metadata?.role;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role) {
        // If they have a different role, redirect to appropriate page
        console.log(`User has ${role} role, redirecting appropriately`);
        if (role === 'student') {
          navigate('/student/dashboard');
        } else if (role === 'instructor') {
          navigate('/instructor/dashboard');
        }
      }
    }
  }, [session, navigate]);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsResetting(true);
      const response = await fetch(
        'https://qeuzosggikxwnpyhulox.supabase.co/functions/v1/reset-admin-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({
        title: 'Success',
        description: 'Password reset successfully! You can now login.',
      });
      setShowPasswordReset(false);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-black/70 p-6 rounded-xl backdrop-blur-sm">
      <div className="text-center flex flex-col items-center space-y-2">
        <div className="mb-4">
          <img 
            src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png" 
            alt="Deckademics Logo" 
            className="h-28 w-auto"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Admin Sign In
        </h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Access the administrative controls for Deckademics DJ School
        </p>
      </div>
      
      <Alert variant="default" className="bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Restricted Access</AlertTitle>
        <AlertDescription>
          This area is restricted to authorized administrative staff only. 
          Unauthorized access attempts are logged and monitored.
        </AlertDescription>
      </Alert>
      
      {!showPasswordReset && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>First Time Setup</AlertTitle>
          <AlertDescription>
            Need to set the admin password? Use the "Set Admin Password" button below.
          </AlertDescription>
        </Alert>
      )}
      
      <AuthForm userType="admin" disableSignup={true} adminEmail={ADMIN_EMAIL} />
      
      <div className="text-center space-y-4">
        {!showPasswordReset ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowPasswordReset(true)}
          >
            Set Admin Password
          </Button>
        ) : (
          <div className="space-y-3 bg-white/10 p-4 rounded-lg">
            <Input
              type="password"
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleResetPassword}
                disabled={isResetting}
                className="flex-1"
              >
                {isResetting ? 'Setting Password...' : 'Set Password'}
              </Button>
              <Button
                onClick={() => {
                  setShowPasswordReset(false);
                  setNewPassword('');
                }}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        <div>
          <Link to="/" className="text-sm text-deckademics-primary hover:underline">
            Back to sign in options
          </Link>
        </div>
      </div>
    </div>
  );
};

const AdminAuth = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black relative">
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 z-10 relative">
        {/* Header content */}
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10 relative">
        <AuthProvider>
          <AdminAuthContent />
        </AuthProvider>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground z-10 relative bg-black/50 backdrop-blur-sm">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
      </footer>
    </div>
  );
};

export default AdminAuth;
