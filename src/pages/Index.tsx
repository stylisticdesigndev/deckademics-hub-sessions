
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VideoBackground } from '@/components/background/VideoBackground';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner'; 
import { useAuth } from '@/providers/AuthProvider';

const Index = () => {
  // Hard-code an image fallback path since the video might be problematic
  const [backgroundVideoUrl] = useState<string>('/lovable-uploads/dj-background.mp4');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { userData, session, clearLocalStorage } = useAuth();
  const navigate = useNavigate();
  
  console.log("Index page rendering with fallback image for background");
  
  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    console.log("Index page - Session check:", !!session, "User role:", userData?.role);
    
    if (session && userData?.role) {
      console.log("User already logged in, redirecting to dashboard");
      const role = userData.role;
      
      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'instructor') {
        navigate('/instructor/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      }
    } else {
      console.log("No active session found or missing role, showing login options");
      // Set loading to false as we're not redirecting
      setIsLoading(false);
    }
  }, [session, userData, navigate]);

  // Function to ensure we're starting with a clean authentication state
  const ensureCleanAuthState = useCallback(() => {
    console.log("Ensuring clean auth state before navigation");
    if (session) {
      // If there's an active session but we're on the index page,
      // we should clear the local storage to avoid auth issues
      clearLocalStorage();
    }
  }, [session, clearLocalStorage]);

  return (
    <div className="min-h-screen flex flex-col bg-black relative">
      <VideoBackground 
        videoSrc={backgroundVideoUrl} 
        fallbackSrc="/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png" 
      />
      
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 z-10 relative">
        {/* Header content */}
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
              Welcome to Deckademics DJ School
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Sign in to access your personalized DJ learning experience
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button 
              className="w-full py-6 text-lg" 
              variant="outline" 
              size="lg"
              asChild
              onClick={ensureCleanAuthState}
            >
              <Link to="/auth/student" replace={true}>
                Student Sign In
              </Link>
            </Button>
            
            <Button 
              className="w-full py-6 text-lg"
              variant="outline" 
              size="lg"
              asChild
              onClick={ensureCleanAuthState}
            >
              <Link to="/auth/instructor" replace={true}>
                Instructor Sign In
              </Link>
            </Button>
          </div>
          
          <p className="text-center text-muted-foreground text-sm">
            Choose the appropriate sign in option above
          </p>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground z-10 relative bg-black/50 backdrop-blur-sm">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
        <div className="mt-4">
          <Link 
            to="/auth/admin" 
            className="text-xs text-muted-foreground hover:text-deckademics-primary transition-colors"
            onClick={ensureCleanAuthState}
          >
            Administrator Access
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
