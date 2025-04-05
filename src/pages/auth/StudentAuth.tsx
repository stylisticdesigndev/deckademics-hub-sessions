import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Logo } from '@/components/logo/Logo';
import { Link } from 'react-router-dom';

const StudentAuth = () => {
  return (
    <div className="min-h-screen flex flex-col bg-deckademics-dark">
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Logo size="md" />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center flex flex-col items-center space-y-2">
            <div className="mb-4">
              <img 
                src="/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png" 
                alt="Deckademics Logo" 
                className="h-20 w-auto"
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
            <Link to="/auth" className="text-sm text-deckademics-primary hover:underline">
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
