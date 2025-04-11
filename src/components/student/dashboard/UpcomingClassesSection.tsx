
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';

interface UpcomingClassesSectionProps {
  classes: ClassSession[];
  onAddToCalendar: (id: string) => void;
}

export const UpcomingClassesSection = ({ classes, onAddToCalendar }: UpcomingClassesSectionProps) => {
  return (
    <>
      <h2 className="text-xl font-semibold">Upcoming Classes</h2>
      {classes.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {classes.map(session => (
            <UpcomingClassCard 
              key={session.id} 
              session={session} 
              onAddToCalendar={onAddToCalendar} 
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No upcoming classes scheduled. Check back soon!</p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
