
import React, { useState, useEffect } from 'react';
import { Bell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { mockInstructorAnnouncements } from '@/data/mockInstructorData';

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
}

const InstructorAnnouncements = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (demoMode) { setLoading(false); return; }
    fetchAnnouncements();
  }, [demoMode, session]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('announcements')
        .select(`
          id, title, content, published_at, author_id, type,
          profiles:author_id (first_name, last_name),
          announcement_reads!left (id, read_at)
        `)
        .contains('target_role', ['instructor'])
        .order('published_at', { ascending: false });

      if (error) { console.error('Error fetching announcements:', error); return; }

      if (data) {
        const formatted = data.map((ann: any) => {
          const authorProfile = ann.profiles as AuthorProfile;
          const readRecords = Array.isArray(ann.announcement_reads) ? ann.announcement_reads : [];
          return {
            id: ann.id,
            title: ann.title || 'Announcement',
            content: ann.content || '',
            date: new Date(ann.published_at).toLocaleDateString(),
            instructor: {
              name: authorProfile ? `${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() : 'Admin',
              initials: authorProfile ? `${(authorProfile.first_name || ' ')[0]}${(authorProfile.last_name || ' ')[0]}`.trim().toUpperCase() : 'A'
            },
            isNew: readRecords.length === 0,
            type: ann.type || 'announcement',
          };
        });
        setAnnouncements(formatted);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (demoMode) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      return;
    }
    try {
      const { error } = await supabase
        .from('announcement_reads')
        .insert({ announcement_id: id, user_id: session?.user?.id });
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark as read.' });
        return;
      }
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      toast({ title: 'Marked as read' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark as read.' });
    }
  };

  const handleDismiss = async (id: string) => {
    if (demoMode) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Announcement removed' });
      return;
    }
    try {
      const userId = session?.user?.id;
      if (!userId) return;

      const { data: existing } = await supabase
        .from('announcement_reads')
        .select('id')
        .eq('announcement_id', id)
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('announcement_reads')
          .update({ dismissed: true, read_at: new Date().toISOString() })
          .eq('id', existing[0].id);
      } else {
        await supabase
          .from('announcement_reads')
          .insert({ announcement_id: id, user_id: userId, dismissed: true, read_at: new Date().toISOString() });
      }

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Announcement removed' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to dismiss announcement.' });
    }
  };

  const activeAnnouncements = demoMode ? mockInstructorAnnouncements : announcements;
  const isLoading = !demoMode && loading;
  const filtered = activeTab === 'all' ? activeAnnouncements : activeAnnouncements.filter(a => a.type === activeTab);

  return (
    <div className="space-y-6">
      {demoMode && (
        <Alert className="bg-warning/10 border-warning/30">
          <Eye className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
          <AlertDescription>Showing sample announcements. Click "Live Data" to switch back.</AlertDescription>
        </Alert>
      )}

      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground mt-1">View announcements and updates from administration</p>
        </div>
        <Button
          variant={demoMode ? "default" : "outline"} size="sm"
          onClick={() => setDemoMode(!demoMode)} className="flex items-center gap-2"
        >
          {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {demoMode ? 'Live Data' : 'Demo'}
        </Button>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="event">Events</TabsTrigger>
          <TabsTrigger value="announcement">Announcements</TabsTrigger>
          <TabsTrigger value="update">Updates</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[100px] w-full rounded-lg" />)}
        </div>
      ) : filtered.length > 0 ? (
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
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">No announcements</h3>
          <p className="text-muted-foreground mt-2">No announcements from administration at the moment.</p>
        </div>
      )}
    </div>
  );
};

export default InstructorAnnouncements;
