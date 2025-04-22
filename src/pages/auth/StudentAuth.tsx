import React from 'react';
import { Link } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, InfoIcon, HelpCircle, ShieldCheck } from 'lucide-react';
import { AuthProvider } from '@/providers/AuthProvider';

const StudentAuth = () => {
  console.log("Rendering StudentAuth page");
  
  return (
    <div className="min-h-screen flex flex-col bg-deckademics-dark">
      <header className="container flex h-16 items-center px-4 sm:px:6 lg:px-8">
        {/* Header logo removed */}
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
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
          
          <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Student Access</AlertTitle>
            <AlertDescription>
              Sign in with your student credentials or create a new account.
              <div className="mt-1 text-sm">
                Admin users can also sign in here with admin credentials.
              </div>
            </AlertDescription>
          </Alert>
          
          <AuthProvider>
            <AuthForm userType="student" disableSignup={false} />
          </AuthProvider>
          
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-sm">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">Signup Information</h3>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  When registering, please use a password with at least 6 characters.
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-2">
                  Each email address can only be used for one account. If you've already registered, please use the login tab instead.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-md bg-green-50 dark:bg-green-900 p-4 mt-4">
            <div className="flex items-start">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-300">Security Information</h3>
                <p className="text-sm mt-1 text-green-700 dark:text-green-300">
                  Your account is secure with us. We use industry-standard encryption and never share your personal information.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-md bg-slate-50 dark:bg-slate-800 p-4 mt-4">
            <div className="flex items-start">
              <HelpCircle className="h-5 w-5 text-slate-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Trouble signing up?</h3>
                <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
                  Try using a password with at least 6 characters. If you continue to experience issues, please contact support at support@deckademics.com
                </p>
              </div>
            </div>
          </div>
          
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
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
      </footer>
    </div>
  );
};

export default StudentAuth;
