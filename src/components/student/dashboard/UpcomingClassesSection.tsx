
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { RunningLateButton } from '@/components/student/RunningLateButton';
import { formatDateUS } from '@/lib/utils';

interface UpcomingClassesSectionProps {
  classes: ClassSession[];
  onAddToCalendar?: (id: string) => void;
  studentId?: string;
  demoMode?: boolean;
}

// Parse "3:00 PM" / "03:00 PM" / "15:00" into minutes-since-midnight
const parseTimeToMinutes = (time: string): number | null => {
  if (!time) return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const period = m[3]?.toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

// Parse "1h", "1h 30m", "90m" into minutes
const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 60;
  let total = 0;
  const hMatch = duration.match(/(\d+)\s*h/i);
  const mMatch = duration.match(/(\d+)\s*m/i);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  return total || 60;
};

// Active from 60 min before start through end of class
const isWithinLateWindow = (session: ClassSession): boolean => {
  const startMin = parseTimeToMinutes(session.time);
  if (startMin === null) return false;
  const durMin = parseDurationToMinutes(session.duration);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin - 60 && nowMin <= startMin + durMin;
};

export const UpcomingClassesSection = ({ classes, studentId, demoMode }: UpcomingClassesSectionProps) => {
  const today = formatDateUS(new Date());
  const todaysClasses = classes.filter(c => c.date === today);
  const lateEligible = todaysClasses.some(isWithinLateWindow);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm font-semibold">Today's Class</CardTitle>
        {lateEligible && (
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
                studentId={studentId}
                demoMode={demoMode}
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
