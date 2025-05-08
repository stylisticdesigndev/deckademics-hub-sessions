
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard, Announcement } from './AnnouncementCard';

export const AnnouncementList = () => {
  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          published_at,
          author_id,
          profiles:author_id (
            first_name,
            last_name
          )
        `)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <span className="animate-pulse">Loading announcements...</span>
        </CardContent>
      </Card>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">No announcements yet</h3>
          <p className="text-muted-foreground mt-2">
            Create your first announcement to share important information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
};
