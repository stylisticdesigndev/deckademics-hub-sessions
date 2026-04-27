
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { RunningLateButton } from '@/components/student/RunningLateButton';
import { formatDateUS } from '@/lib/utils';

interface UpcomingClassesSectionProps {
  classes: ClassSession[];
  onAddToCalendar: (id: string) => void;
  studentId?: string;
  demoMode?: boolean;
}

export const UpcomingClassesSection = ({ classes, onAddToCalendar, studentId, demoMode }: UpcomingClassesSectionProps) => {
  const today = formatDateUS(new Date());
  const todaysClasses = classes.filter(c => c.date === today);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-semibold">Today's Class</CardTitle>
        {todaysClasses.length > 0 && (
          <RunningLateButton studentId={studentId} disabled={demoMode} />
        )}
      </CardHeader>
      <CardContent>
        {todaysClasses.length > 0 ? (
          <div className="space-y-3">
            {todaysClasses.map(session => (
              <UpcomingClassCard 
                key={session.id} 
                session={session} 
                onAddToCalendar={onAddToCalendar} 
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No class scheduled for today.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
