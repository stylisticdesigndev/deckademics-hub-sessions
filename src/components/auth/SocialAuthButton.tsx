
import React from 'react';
import { Button } from '@/components/ui/button';

interface SocialAuthButtonProps {
  provider: 'google';
  userType: 'student' | 'instructor' | 'admin';
  isLoading: boolean;
  onClick: () => void;
}

export const SocialAuthButton = ({ 
  provider, 
  userType, 
  isLoading, 
  onClick 
}: SocialAuthButtonProps) => {
  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={onClick}
      disabled={isLoading}
    >
      {provider === 'google' && (
        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 11v2h5.5c-.22 1.15-1.2 3.36-5.5 3.36-3.31 0-6-2.74-6-6.12 0-3.37 2.69-6.11 6-6.11 1.88 0 3.14.8 3.85 1.5l2.56-2.47C17.02 1.97 14.72 1 12 1c-6.08 0-11 4.92-11 11s4.92 11 11 11c6.35 0 10.56-4.47 10.56-10.75 0-.72-.06-1.27-.15-1.82H12z"/>
        </svg>
      )}
      {userType === 'instructor' ? 'Login with Google' : 'Continue with Google'}
    </Button>
  );
};
