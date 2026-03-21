
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';

interface Announcement {
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

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  onAcknowledge: (id: string) => void;
}

export const AnnouncementsSection = ({ announcements, onAcknowledge }: AnnouncementsSectionProps) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recent Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onAcknowledge={onAcknowledge}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No announcements yet. Check back soon for updates!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
