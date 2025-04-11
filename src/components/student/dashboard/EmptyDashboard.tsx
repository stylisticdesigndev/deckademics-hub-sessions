
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BookOpenText } from 'lucide-react';

export const EmptyDashboard = () => {
  return (
    <Alert>
      <BookOpenText className="h-4 w-4" />
      <AlertTitle>Welcome to Deckademics!</AlertTitle>
      <AlertDescription>
        Your dashboard is currently empty. Visit your profile to complete your information and then 
        check back for upcoming classes and announcements.
      </AlertDescription>
    </Alert>
  );
};
