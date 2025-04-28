
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';

export const WelcomeSection: React.FC = () => {
  const { userData } = useAuth();
  
  // Get instructor name from auth provider
  const instructorName = userData.profile 
    ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() 
    : 'Instructor';
  
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Welcome, {instructorName}</h1>
      <p className="text-muted-foreground">
        Your dashboard is ready for you to start managing your students and classes.
      </p>
    </section>
  );
};
