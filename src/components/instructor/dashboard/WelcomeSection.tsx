
import React, { memo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { getInstructorDisplayName } from '@/utils/instructorName';

export const WelcomeSection: React.FC = memo(() => {
  const { userData, session } = useAuth();
  
  // Get instructor name from auth provider, with consistent fallback strategy
  const getInstructorName = () => {
    // Prefer DJ name everywhere on the instructor side.
    const profile = userData.profile as any;
    const fromProfile = getInstructorDisplayName(profile);
    if (fromProfile) return fromProfile;

    const metadata = session?.user?.user_metadata as any;
    if (metadata) {
      const fromSession = getInstructorDisplayName({
        dj_name: metadata.dj_name,
        first_name: metadata.first_name,
        last_name: metadata.last_name,
      });
      if (fromSession) return fromSession;
    }

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
