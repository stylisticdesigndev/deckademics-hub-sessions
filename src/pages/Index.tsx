
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VideoBackground } from '@/components/background/VideoBackground';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';

const Index = () => {
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { userData, session, clearLocalStorage } = useAuth();
  const navigate = useNavigate();
  
  // Clear any potential authentication errors on load
  useEffect(() => {
    localStorage.removeItem('auth-error');
  }, []);
  
  // Load background video
  useEffect(() => {
    const videoPath = '/background-video.mp4';
    setBackgroundVideoUrl(videoPath);
    setIsLoading(false);
  }, []);
  
  // Check authentication state and clean up if necessary
  useEffect(() => {
    if (isLoading) return;
    
    const handleInitialLoad = () => {
      if (session && (!userData || !userData.role)) {
        clearLocalStorage();
      }
    };

    handleInitialLoad();
  }, [session, userData, clearLocalStorage, isLoading]);
  
  // Handle redirection if user is already logged in
  // Admins always route to instructor dashboard first
  const checkAndRedirect = useCallback(() => {
    if (isLoading) return;
    
    if (session && userData?.role) {
      const role = userData.role;
      switch (role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'instructor':
        case 'admin':
          navigate('/instructor/dashboard');
          break;
      }
    }
  }, [session, userData, navigate, isLoading]);
  
  // Run the redirect check when dependencies change
  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  // Only clear auth if session is stale/inconsistent
  const ensureCleanAuthState = () => {
    if (session && (!userData || !userData.role)) {
      clearLocalStorage();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-deckademics-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {backgroundVideoUrl && (
        <VideoBackground 
          videoSrc={backgroundVideoUrl} 
          fallbackSrc="/lovable-uploads/5b45c1a0-05de-4bcc-9876-74d76c697871.png" 
        />
      )}
      
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8 z-10 relative">
        
      </header>
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10 relative">
        <div className="w-full max-w-md space-y-6 bg-black/70 p-6 rounded-xl backdrop-blur-sm">
          <div className="text-center flex flex-col items-center space-y-2">
            <div className="mb-4">
              <img 
                src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png" 
                alt="Deckademics Logo" 
                className="h-28 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
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
                Student
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
                Instructor
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
      </footer>
    </div>
  );
};

export default Index;
