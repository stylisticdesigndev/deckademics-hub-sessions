
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/database.types';

// Define profile type to accommodate both object and array structures from Supabase
interface ProfileData {
  first_name?: string;
  last_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id?: string;
  profiles?: ProfileData | ProfileData[];
}

interface AnnouncementCardProps {
  announcement: Announcement;
}

// Helper function to safely extract author name from profiles data
const getAuthorName = (profiles: ProfileData | ProfileData[] | undefined): { firstName: string, lastName: string } => {
  if (!profiles) {
    return { firstName: 'Admin', lastName: '' };
  }

  if (Array.isArray(profiles)) {
    return {
      firstName: profiles[0]?.first_name || 'Admin',
      lastName: profiles[0]?.last_name || ''
    };
  }
  
  return {
    firstName: profiles.first_name || 'Admin',
    lastName: profiles.last_name || ''
  };
};

export const AnnouncementCard = ({ announcement }: AnnouncementCardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authorInfo = getAuthorName(announcement.profiles);

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({
        title: 'Announcement Deleted',
        description: 'The announcement has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Could not delete announcement. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting announcement:', error);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{announcement.title}</CardTitle>
        <CardDescription>
          Posted by {authorInfo.firstName} {authorInfo.lastName} on {new Date(announcement.published_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{announcement.content}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="destructive" 
          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
          disabled={deleteAnnouncementMutation.isPending}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
