
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';
// Import VideoBackground
import { VideoBackground } from '@/components/background/VideoBackground';

const InstructorAuth = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent relative">
      {/* Video Background (behind everything) */}
      <VideoBackground 
        videoSrc="/lovable-uploads/dj-background.mp4" 
        fallbackSrc="/lovable-uploads/dj-background.mp4"
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
              Instructor Sign In
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Access your instructor dashboard to manage classes and students
            </p>
          </div>
          
          <AuthProvider>
            <AuthForm userType="instructor" />
          </AuthProvider>
          
          <div className="text-center">
            <Link to="/" className="text-sm text-deckademics-primary hover:underline">
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

export default InstructorAuth;

