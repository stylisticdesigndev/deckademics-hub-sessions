
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <>
      <h2 className="text-xl font-semibold mb-4">Recent Announcements</h2>
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
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No announcements yet. Check back soon for updates!</p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
