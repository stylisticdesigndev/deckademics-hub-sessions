
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VideoBackground } from '@/components/background/VideoBackground';
import { toast } from 'sonner'; 
import { useAuth } from '@/providers/AuthProvider';

const Index = () => {
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string>('/lovable-uploads/dj-background.mp4');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { userData, session, clearLocalStorage } = useAuth();
  const navigate = useNavigate();
  
  // Log every render for debugging
  console.log("Index page rendering at:", new Date().toISOString(), 
    "Video:", backgroundVideoUrl, 
    "Session:", !!session, 
    "User role:", userData?.role);
  
  // Clean up auth state on initial load of the index page
  useEffect(() => {
    const handleInitialLoad = () => {
      console.log("Index page initial load - checking auth state");
      
      // If we're on the index page but there's inconsistent session data,
      // clear it to ensure a fresh start
      if (session && (!userData || !userData.role)) {
        console.log("Found inconsistent auth state, clearing local storage");
        clearLocalStorage();
      }
      
      // Always set loading to false after initial checks
      setIsLoading(false);
    };

    // Short timeout to ensure page has properly initialized
    const timer = setTimeout(handleInitialLoad, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    if (isLoading) return; // Skip redirect check during initial loading
    
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
    }
  }, [session, userData, navigate, isLoading]);

  // Ensure we're starting with a clean authentication state
  const ensureCleanAuthState = () => {
    console.log("Ensuring clean auth state before navigation");
    if (session) {
      // If there's an active session but we're on the index page,
      // we should clear the local storage to avoid auth issues
      clearLocalStorage();
      toast.success("Authentication state cleared for fresh login");
    }
  };

  // Force the video to reload if needed
  useEffect(() => {
    // This creates a unique URL by appending a timestamp to bypass cache
    const timestamp = Date.now();
    const videoWithTimestamp = `/lovable-uploads/dj-background.mp4?t=${timestamp}`;
    console.log("Setting video URL with cache-busting:", videoWithTimestamp);
    setBackgroundVideoUrl(videoWithTimestamp);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-deckademics-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
