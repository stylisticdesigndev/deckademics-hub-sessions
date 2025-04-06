
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Link } from 'react-router-dom';

const InstructorAuth = () => {
  return (
    <div className="min-h-screen flex flex-col bg-deckademics-dark">
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
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
              Instructor Sign In
            </h1>
            <p className="text-muted-foreground max-w-xs mx-auto">
              Access your teaching dashboard and manage your students
            </p>
          </div>
          <AuthForm userType="instructor" disableSignup={true} />
          <div className="text-center">
            <Link to="/auth" className="text-sm text-deckademics-primary hover:underline">
              Back to sign in options
            </Link>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Instructor accounts can only be created by administrators.
              <br />
              Please contact the school if you need access.
            </p>
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
