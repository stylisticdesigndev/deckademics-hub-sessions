
import React, { useEffect, useState } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AdminAuthContent = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  
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

  const handleSendPasswordReset = async () => {
    const adminEmail = 'admin@deckademics.com';
    
    try {
      setIsResetting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
        redirectTo: `${window.location.origin}/auth/admin`
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password reset email sent',
        description: `A password reset link has been sent to ${adminEmail}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email',
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
      
      <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Issue</AlertTitle>
        <AlertDescription>
          The displayed admin credentials need to be reset in Supabase. 
          Please use the Supabase dashboard to reset the password for admin@deckademics.com 
          to match "Admin123!" or update the shown credentials to match the actual password.
        </AlertDescription>
      </Alert>
      
      <AuthForm userType="admin" disableSignup={true} />
      
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <a href="https://supabase.com/dashboard/project/qeuzosggikxwnpyhulox/auth/users" target="_blank" rel="noopener noreferrer">
              Supabase User Management
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSendPasswordReset}
            disabled={isResetting}
          >
            {isResetting ? 'Sending...' : 'Send Password Reset'}
          </Button>
        </div>
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
