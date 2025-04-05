
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Logo } from '@/components/logo/Logo';
import { Disc3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const InstructorAuth = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-deckademics-dark to-deckademics-darker">
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Logo size="md" />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center flex flex-col items-center space-y-2">
            <div className="relative mb-4">
              <Disc3 className="h-16 w-16 text-deckademics-primary animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">DJ</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Instructor Sign In
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Access your teaching dashboard and manage your students
            </p>
          </div>
          <AuthForm userType="instructor" />
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

export default InstructorAuth;
