
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const StudentAuth = () => {
  console.log("Rendering StudentAuth page");
  const navigate = useNavigate();
  const { session, userData, isLoading } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Improved session validation logic with debugging but avoid infinite redirects
  useEffect(() => {
    // Skip redirect if we're still loading
    if (isLoading) {
      return;
    }
    
    console.log("StudentAuth - Auth check complete:", { 
      sessionExists: !!session, 
      userId: session?.user?.id,
      userRole: userData.role,
      isLoading
    });
    
    // Only proceed with redirects if we have session and role info
    if (session && session.user) {
      console.log("Session detected on student auth page:", session.user.email);
      const role = userData.role || session.user.user_metadata?.role;
      
      if (role) {
        console.log(`User has ${role} role, redirecting appropriately`);
        if (role === 'student') {
          navigate('/student/dashboard', { replace: true });
        } else if (role === 'instructor') {
          navigate('/instructor/dashboard', { replace: true });
        } else if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        }
      }
    }
      
    setIsCheckingAuth(false);
  }, [session, userData, navigate, isLoading]);

  // Show loading state while checking auth
  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-black relative">
        <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 z-10 relative">
          {/* Header logo removed */}
        </header>
        
        <main className="flex-1 flex items-center justify-center px-4 py-12 z-10 relative">
          <div className="w-full max-w-md space-y-6 bg-black/70 p-6 rounded-xl backdrop-blur-sm">
            <div className="text-center flex flex-col items-center space-y-4">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </main>
        
        <footer className="py-6 text-center text-sm text-muted-foreground z-10 relative bg-black/50 backdrop-blur-sm">
          © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black relative">
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 z-10 relative">
        {/* Header logo removed */}
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10 relative">
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
              Student Sign In
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Access your DJ learning dashboard and track your progress
            </p>
          </div>
          
          <AuthForm userType="student" disableSignup={false} />
          
          <div className="text-center">
            <Link 
              to="/" 
              className="text-sm text-deckademics-primary hover:underline"
            >
              Back to sign in options
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground z-10 relative bg-black/50 backdrop-blur-sm">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
      </footer>
    </div>
  );
};

export default StudentAuth;
