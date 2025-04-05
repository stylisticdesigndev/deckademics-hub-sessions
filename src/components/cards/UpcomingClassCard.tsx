
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ClassSession {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  attendees: number;
  isUpcoming: boolean;
  topic?: string;
}

interface UpcomingClassCardProps {
  session: ClassSession;
  className?: string;
  onAddToCalendar?: (id: string) => void;
}

export const UpcomingClassCard: React.FC<UpcomingClassCardProps> = ({ 
  session, 
  className,
  onAddToCalendar
}) => {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={session.isUpcoming ? "default" : "outline"} className={session.isUpcoming ? "bg-deckademics-primary" : ""}>
            {session.isUpcoming ? "Upcoming" : "Past"}
          </Badge>
          <span className="text-xs text-muted-foreground">{session.date}</span>
        </div>
        <CardTitle className="text-base">{session.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {session.topic && (
            <p className="text-sm text-muted-foreground">
              Topic: {session.topic}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{session.time} ({session.duration})</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{session.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Instructor: {session.instructor}</span>
          </div>
        </div>
      </CardContent>
      {session.isUpcoming && onAddToCalendar && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2" 
            onClick={() => onAddToCalendar(session.id)}
          >
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
