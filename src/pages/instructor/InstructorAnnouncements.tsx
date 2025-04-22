
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { AnnouncementCard, Announcement } from '@/components/cards/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Edit, Plus, Megaphone, Calendar, Info, Trash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AnnouncementDb = {
  id: string;
  title: string;
  content: string;
  created_at: string | null;
  published_at: string | null;
  author_id: string | null;
  // backend doesn't have 'type', so we infer it below
};

type InstructorProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

function getInitials(first: string | null, last: string | null) {
  return (first?.[0] ?? '') + (last?.[0] ?? '');
}

// Helper: determine announcement type heuristically from title/content or add a future backend mapping
function inferType(title: string, content: string): 'event' | 'announcement' | 'update' {
  // This can be improved if database includes a proper type column.
  if (/event|workshop/i.test(title + content)) return 'event';
  if (/update/i.test(title + content)) return 'update';
  return 'announcement';
}

const getInstructor = async (author_id: string): Promise<InstructorProfile | null> => {
  if (!author_id) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id,first_name,last_name,avatar_url')
    .eq('id', author_id)
    .maybeSingle();
  if (error) return null;
  return data;
};

const fetchAnnouncements = async () => {
  // Only pull announcements for instructor's students if needed- for now assume all announcements.
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('published_at', { ascending: false });
  if (error) throw error;
  return data as AnnouncementDb[];
};

const InstructorAnnouncements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [announcementType, setAnnouncementType] = useState<'announcement' | 'event' | 'update'>('announcement');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });

  // Fetch announcements
  const { data: announcementsDb, isLoading: loadingAnnouncements, error: errorAnnouncements } = useQuery({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
  });

  // Cache of instructor info (reduce repeated requests)
  const [instructorCache, setInstructorCache] = useState<Record<string, InstructorProfile>>({});

  // Helper: get instructor details and cache
  const getInstructorInfo = async (author_id: string | null) => {
    if (!author_id) return null;
    if (instructorCache[author_id]) return instructorCache[author_id];
    const profile = await getInstructor(author_id);
    if (profile) {
      setInstructorCache((prev) => ({ ...prev, [author_id]: profile }));
    }
    return profile;
  };

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async ({
      title,
      content,
      type,
    }: {
      title: string;
      content: string;
      type: 'announcement' | 'event' | 'update';
    }) => {
      // Get current user (should be instructor)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // Insert into announcements
      const { data, error } = await supabase.from('announcements').insert([
        {
          title,
          content,
          author_id: user.id,
        },
      ]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setIsCreating(false);
      setNewAnnouncement({ title: '', content: '' });
      toast({
        title: 'Announcement Created',
        description: 'Your announcement has been published to students.',
      });
    },
    onError: () => {
      toast({
        title: 'Error Creating Announcement',
        description: 'Could not publish announcement.',
        variant: 'destructive'
      });
    }
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast({
        title: 'Announcement Deleted',
        description: 'The announcement has been removed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error Deleting Announcement',
        description: 'Could not delete announcement.',
        variant: 'destructive'
      });
    }
  });

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both a title and content for your announcement.',
        variant: 'destructive'
      });
      return;
    }
    createAnnouncementMutation.mutate({
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      type: announcementType,
    });
  };

  // UI: transform DB items to AnnouncementCard items with instructor info
  const [announcementCards, setAnnouncementCards] = useState<Announcement[]>([]);

  React.useEffect(() => {
    if (!announcementsDb) return;
    let cancelled = false;

    async function process() {
      const results: Announcement[] = [];
      for (let dbAnn of announcementsDb) {
        // Use cache or fetch for instructor
        let instructor: InstructorProfile | null = null;
        if (dbAnn.author_id) {
          instructor = instructorCache[dbAnn.author_id] || (await getInstructor(dbAnn.author_id));
          if (instructor && !instructorCache[dbAnn.author_id]) {
            setInstructorCache((prev) => ({ ...prev, [dbAnn.author_id!]: instructor! }));
          }
        }
        results.push({
          id: dbAnn.id,
          title: dbAnn.title,
          content: dbAnn.content,
          date: dbAnn.published_at
            ? timeAgo(dbAnn.published_at)
            : dbAnn.created_at
              ? timeAgo(dbAnn.created_at)
              : '',
          instructor: {
            name:
              ((instructor?.first_name ?? '') + ' ' + (instructor?.last_name ?? '')).trim() || 'Unknown',
            initials: getInitials(instructor?.first_name ?? '', instructor?.last_name ?? ''),
            avatar: instructor?.avatar_url ?? undefined,
          },
          type: inferType(dbAnn.title, dbAnn.content),
          isNew: false,
        });
      }
      if (!cancelled) setAnnouncementCards(results);
    }
    process();
    return () => {
      cancelled = true;
    };
    // we want to rerun when announcementsDb or instructorCache changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementsDb, Object.keys(instructorCache).join(',')]);

  // Helper: timeAgo formatter
  function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hrs ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return date.toLocaleDateString();
  }

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage announcements for your students
            </p>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          )}
        </section>
        {isCreating ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Announcement</CardTitle>
              <CardDescription>
                This will be visible to all your students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Announcement Type</label>
                <Select
                  value={announcementType}
                  onValueChange={(value: 'announcement' | 'event' | 'update') => setAnnouncementType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        General Announcement
                      </div>
                    </SelectItem>
                    <SelectItem value="event">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Event
                      </div>
                    </SelectItem>
                    <SelectItem value="update">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Update
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Write your announcement here..."
                  rows={5}
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewAnnouncement({ title: '', content: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnnouncement}
                disabled={createAnnouncementMutation.isPending}
              >
                {createAnnouncementMutation.isPending ? 'Publishing...' : 'Publish Announcement'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>

            {/* ALL */}
            <TabsContent value="all">
              <div className="space-y-4">
                {loadingAnnouncements ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="animate-pulse">Loading...</span>
                    </CardContent>
                  </Card>
                ) : !announcementCards.length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium">No announcements</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any announcements yet. Click the "Create Announcement" button to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  announcementCards.map((announcement) => (
                    <div key={announcement.id} className="relative">
                      <AnnouncementCard announcement={announcement} />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                          disabled={deleteAnnouncementMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            {/* EVENTS */}
            <TabsContent value="events">
              <div className="space-y-4">
                {loadingAnnouncements ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="animate-pulse">Loading...</span>
                    </CardContent>
                  </Card>
                ) : !announcementCards.filter((a) => a.type === 'event').length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium">No events</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any events yet. Click the "Create Announcement" button to add an event.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  announcementCards
                    .filter((a) => a.type === 'event')
                    .map((announcement) => (
                      <div key={announcement.id} className="relative">
                        <AnnouncementCard announcement={announcement} />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                            disabled={deleteAnnouncementMutation.isPending}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>
            {/* ANNOUNCEMENTS/UPDATES */}
            <TabsContent value="announcements">
              <div className="space-y-4">
                {loadingAnnouncements ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <span className="animate-pulse">Loading...</span>
                    </CardContent>
                  </Card>
                ) : !announcementCards.filter((a) => a.type === 'announcement' || a.type === 'update').length ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium">No announcements</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        You haven't created any announcements yet. Click the "Create Announcement" button to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  announcementCards
                    .filter((a) => a.type === 'announcement' || a.type === 'update')
                    .map((announcement) => (
                      <div key={announcement.id} className="relative">
                        <AnnouncementCard announcement={announcement} />
                        <div className="absolute top-4 right-4 flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                            disabled={deleteAnnouncementMutation.isPending}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorAnnouncements;
