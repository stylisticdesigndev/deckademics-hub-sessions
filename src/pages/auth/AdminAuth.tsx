
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from 'lucide-react';
import { AuthProvider } from '@/providers/AuthProvider';
import { VideoBackground } from '@/components/background/VideoBackground';

const AdminAuth = () => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent relative">
      {/* Static background image for admin page */}
      <VideoBackground 
        disableVideo={true}
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
          
          <AuthProvider>
            <AuthForm userType="admin" disableSignup={true} />
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

export default AdminAuth;
