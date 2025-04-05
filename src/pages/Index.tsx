
import React from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Logo } from '@/components/logo/Logo';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-deckademics-dark">
      <header className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Logo size="header" />
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
            >
              <Link to="/auth/student">
                Student Sign In
              </Link>
            </Button>
            
            <Button 
              className="w-full py-6 text-lg"
              variant="outline" 
              size="lg"
              asChild
            >
              <Link to="/auth/instructor">
                Instructor Sign In
              </Link>
            </Button>
          </div>
          
          <p className="text-center text-muted-foreground text-sm">
            Choose the appropriate sign in option above
          </p>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Deckademics DJ School. All rights reserved.
        <div className="mt-4">
          <Link 
            to="/auth/admin" 
            className="text-xs text-muted-foreground hover:text-deckademics-primary transition-colors"
          >
            Administrator Access
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Index;
