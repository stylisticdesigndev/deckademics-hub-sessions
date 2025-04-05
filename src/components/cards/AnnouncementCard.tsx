
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  instructor: {
    name: string;
    avatar?: string;
    initials: string;
  };
  isNew?: boolean;
  type: 'event' | 'announcement' | 'update';
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onAcknowledge?: (id: string) => void;
  className?: string;
}

export const AnnouncementCard = ({ 
  announcement, 
  onAcknowledge,
  className 
}: AnnouncementCardProps) => {
  const typeBadgeColor = {
    event: "bg-blue-600 hover:bg-blue-700",
    announcement: "bg-amber-600 hover:bg-amber-700",
    update: "bg-green-600 hover:bg-green-700",
  };
  
  const typeLabel = {
    event: "Event",
    announcement: "Announcement",
    update: "Update",
  };

  return (
    <Card className={cn(
      "border-l-4", 
      announcement.isNew ? "border-l-deckademics-primary" : "border-l-transparent",
      className
    )}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className={typeBadgeColor[announcement.type]}>
              {typeLabel[announcement.type]}
            </Badge>
            {announcement.isNew && (
              <Badge variant="outline" className="text-xs bg-deckademics-primary/10 text-deckademics-primary border-deckademics-primary/30">
                New
              </Badge>
            )}
          </div>
          <h4 className="text-sm font-semibold">{announcement.title}</h4>
        </div>
        <span className="text-xs text-muted-foreground">{announcement.date}</span>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm">{announcement.content}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-0 items-center">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {announcement.instructor.avatar ? (
              <img src={announcement.instructor.avatar} alt={announcement.instructor.name} />
            ) : (
              <AvatarFallback className="text-xs bg-deckademics-accent/20 text-deckademics-accent">
                {announcement.instructor.initials}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {announcement.instructor.name}
          </span>
        </div>
        
        {onAcknowledge && announcement.isNew && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => onAcknowledge(announcement.id)}
          >
            Mark as read
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
