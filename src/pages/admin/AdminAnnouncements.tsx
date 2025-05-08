
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

interface ProfileData {
  first_name?: string;
  last_name?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  author_id?: string;
  profiles?: ProfileData;
}

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const { userData } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: ''
  });
  const queryClient = useQueryClient();

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
      return data;
    }
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string, content: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title,
          content,
          author_id: userData?.profile?.id,
          target_role: ['student', 'instructor', 'admin']
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsDialogOpen(false);
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

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

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

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage school-wide announcements
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <span className="animate-pulse">Loading announcements...</span>
              </CardContent>
            </Card>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No announcements yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first announcement to share important information.
                </p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription>
                    {/* Fix: Access the first element of profiles array if it's an array, otherwise use it directly */}
                    Posted by {Array.isArray(announcement.profiles) 
                      ? announcement.profiles[0]?.first_name || 'Admin' 
                      : announcement.profiles?.first_name || 'Admin'} {Array.isArray(announcement.profiles)
                      ? announcement.profiles[0]?.last_name || ''
                      : announcement.profiles?.last_name || ''} on {new Date(announcement.published_at).toLocaleDateString()}
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
            ))
          )}
        </div>

        {/* Create Announcement Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewAnnouncement({ title: '', content: '' });
                }}
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
      </div>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
