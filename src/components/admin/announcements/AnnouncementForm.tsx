
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { asDatabaseParam } from '@/utils/supabaseHelpers';

interface AnnouncementFormProps {
  isOpen: boolean;
  onClose: () => void;
  authorId?: string;
}

interface NewAnnouncement {
  title: string;
  content: string;
}

export const AnnouncementForm = ({ isOpen, onClose, authorId }: AnnouncementFormProps) => {
  const { toast } = useToast();
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncement>({
    title: '',
    content: ''
  });
  const queryClient = useQueryClient();

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async ({ title, content }: NewAnnouncement) => {
      // Create announcement with proper typing
      const announcementData = {
        title,
        content,
        author_id: authorId ? asDatabaseParam(authorId) : null,
        target_role: ['student', 'instructor', 'admin']
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert(announcementData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      onClose();
      setNewAnnouncement({ title: '', content: '' });
      toast({
        title: 'Announcement Created',
        description: 'Your announcement has been published successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Could not create announcement. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating announcement:', error);
    }
  });

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a title and content for your announcement.',
        variant: 'destructive',
      });
      return;
    }

    createAnnouncementMutation.mutate(newAnnouncement);
  };

  const handleClose = () => {
    setNewAnnouncement({ title: '', content: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>
            Add a new announcement that will be visible to students and staff.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input
              id="title"
              placeholder="Announcement title"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="content" className="text-sm font-medium">Content</label>
            <Textarea
              id="content"
              placeholder="Write your announcement here..."
              rows={5}
              value={newAnnouncement.content}
              onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAnnouncement}
            disabled={createAnnouncementMutation.isPending}
          >
            {createAnnouncementMutation.isPending ? 'Creating...' : 'Create Announcement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
