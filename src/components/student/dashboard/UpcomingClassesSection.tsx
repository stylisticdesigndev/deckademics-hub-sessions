
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';

interface UpcomingClassesSectionProps {
  classes: ClassSession[];
  onAddToCalendar: (id: string) => void;
}

export const UpcomingClassesSection = ({ classes, onAddToCalendar }: UpcomingClassesSectionProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Upcoming Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map(session => (
              <UpcomingClassCard 
                key={session.id} 
                session={session} 
                onAddToCalendar={onAddToCalendar} 
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No upcoming classes scheduled. Check back soon!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
