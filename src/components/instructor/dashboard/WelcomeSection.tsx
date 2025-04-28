
import React, { memo } from 'react';
import { useAuth } from '@/providers/AuthProvider';

export const WelcomeSection: React.FC = memo(() => {
  const { userData, session } = useAuth();
  
  // Get instructor name from auth provider, with consistent fallback strategy
  const getInstructorName = () => {
    // First try profile data
    if (userData.profile && userData.profile.first_name) {
      return `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim();
    }
    
    // Then try session metadata
    if (session?.user?.user_metadata) {
      const metadata = session.user.user_metadata;
      return `${metadata.first_name || ''} ${metadata.last_name || ''}`.trim();
    }
    
    // Fallback
    return 'Instructor';
  };
  
  const instructorName = getInstructorName();
  
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Welcome, {instructorName}</h1>
      <p className="text-muted-foreground">
        Your dashboard is ready for you to start managing your students and classes.
      </p>
    </section>
  );
});

WelcomeSection.displayName = 'WelcomeSection';
