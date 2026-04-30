import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Megaphone } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AnnouncementCard, type Announcement } from '@/components/cards/AnnouncementCard';
import { formatDateUS } from '@/lib/utils';

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
  dj_name?: string;
}

interface AnnouncementReadRecord {
  id: string;
  read_at: string | null;
  user_id: string;
  dismissed?: boolean;
}

type StudentAnnouncement = Announcement & { publishedAt: string };

const demoAnnouncements: StudentAnnouncement[] = [
  {
    id: 'demo-1',
    title: 'Spring Showcase Performance — Sign Up Now!',
    content: 'Our annual Spring Showcase is coming up on April 19th! All students are invited to perform a 5-minute set.',
    date: formatDateUS(new Date()),
    publishedAt: new Date().toISOString(),
    instructor: { name: 'Admin', initials: 'DA' },
    isNew: true,
    type: 'event',
  },
  {
    id: 'demo-2',
    title: 'New Equipment in Classroom B',
    content: "We've upgraded Classroom B with new Pioneer DDJ-REV7 controllers and KRK studio monitors.",
    date: formatDateUS(new Date(Date.now() - 2 * 86400000)),
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    instructor: { name: 'DJ Marcus', initials: 'DM' },
    isNew: true,
    type: 'announcement',
  },
];

const StudentAnnouncements = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'event' | 'announcement' | 'update'>('all');

  const isDemoMode = !session || demoMode;
  const userId = session?.user?.id;

  useEffect(() => {
    if (isDemoMode) {
      setAnnouncements(demoAnnouncements);
      setLoading(false);
      return;
    }
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  const fetchAnnouncements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: annData, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, published_at, author_id, type,
          profiles:author_id (first_name, last_name, dj_name),
          announcement_reads!left (id, read_at, user_id, dismissed)
        `)
        .contains('target_role', ['student'])
        .order('published_at', { ascending: false });

      if (error) throw error;

      if (annData && annData.length > 0) {
        const visible = annData.reduce((items: StudentAnnouncement[], ann: any) => {
          const author = ann.profiles as AuthorProfile;
          const authorDj = (author?.dj_name || '').trim();
          const authorDisplay = authorDj || (author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : '');
          const reads: AnnouncementReadRecord[] = Array.isArray(ann.announcement_reads)
            ? ann.announcement_reads.filter((r: AnnouncementReadRecord) => r.user_id === user.id)
            : [];
          if (reads.some(r => r.dismissed)) return items;

          items.push({
            id: ann.id,
            title: ann.title || 'Announcement',
            content: ann.content || '',
            date: formatDateUS(ann.published_at),
            publishedAt: ann.published_at,
            instructor: {
              name: authorDisplay || 'Admin',
              initials: (() => {
                if (authorDj) {
                  const parts = authorDj.split(/\s+/).filter(Boolean);
                  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'I';
                }
                return author
                  ? `${(author.first_name || ' ')[0]}${(author.last_name || ' ')[0]}`.trim().toUpperCase() || 'A'
                  : 'A';
              })(),
            },
            isNew: reads.length === 0,
            type: ann.type || 'announcement',
          });
          return items;
        }, []);
        setAnnouncements(visible);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveReadState = async (
    announcementId: string,
    values: { read_at?: string; dismissed?: boolean },
  ) => {
    if (!userId) return;
    const { data: existingRecords, error: existingError } = await supabase
      .from('announcement_reads')
      .select('id')
      .eq('announcement_id', announcementId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingError) throw existingError;
    const existing = existingRecords?.[0];

    if (existing) {
      const { error } = await supabase
        .from('announcement_reads')
        .update(values)
        .eq('id', existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from('announcement_reads')
      .insert({ announcement_id: announcementId, user_id: userId, ...values });
    if (error) throw error;
  };

  const handleMarkAsRead = async (id: string) => {
    if (isDemoMode || id.startsWith('demo-')) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      toast({ title: 'Marked as read' });
      return;
    }
    try {
      await saveReadState(id, { read_at: new Date().toISOString(), dismissed: false });
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
      toast({ title: 'Marked as read' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark announcement as read.' });
    }
  };

  const handleDismiss = async (id: string) => {
    if (isDemoMode || id.startsWith('demo-')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Announcement removed' });
      return;
    }
    try {
      await saveReadState(id, { read_at: new Date().toISOString(), dismissed: true });
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      queryClient.invalidateQueries({ queryKey: ['unread-announcements-count'] });
      toast({ title: 'Announcement removed' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove announcement.' });
    }
  };

  const filtered = useMemo(
    () => filter === 'all' ? announcements : announcements.filter(a => a.type === filter),
    [announcements, filter],
  );

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            School-wide updates, events, and important notices
          </p>
        </div>
        {session && (
          <Button
            variant={demoMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        )}
      </section>

      {demoMode && (
        <Alert className="bg-warning/10 border-warning/30">
          <Eye className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
          <AlertDescription>Showing sample data. Click "Live Data" to switch back.</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="event">Events</TabsTrigger>
              <TabsTrigger value="announcement">Announcements</TabsTrigger>
              <TabsTrigger value="update">Updates</TabsTrigger>
            </TabsList>
          </Tabs>

          {filtered.length > 0 ? (
            <div className="space-y-4">
              {filtered.map(announcement => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  onAcknowledge={handleMarkAsRead}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">No announcements yet</h3>
              <p className="text-muted-foreground mt-2">School announcements will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;