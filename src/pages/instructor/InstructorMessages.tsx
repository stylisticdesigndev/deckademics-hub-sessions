
import React, { useState, useEffect } from 'react';
import { MessageSquare, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { mockInstructorMessages } from '@/data/mockInstructorData';

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
}

const InstructorMessages = () => {
  const { userData, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const isNewUser = !userData.profile?.first_name || userData.profile?.first_name === '';
  
  useEffect(() => {
    if (demoMode) return;

    async function fetchAnnouncements() {
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

        if (data && data.length > 0) {
          const formattedAnnouncements = data.map((ann: any) => {
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
          setAnnouncements(formattedAnnouncements);
        }
      } catch (err) {
        console.error('Error in fetchAnnouncements:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, [demoMode]);

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
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark announcement as read.' });
        return;
      }

      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      toast({ title: 'Marked as read', description: 'The announcement has been marked as read.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark announcement as read.' });
    }
  };

  const activeAnnouncements = demoMode ? mockInstructorMessages : announcements;
  const isLoading = !demoMode && loading;

  const filteredAnnouncements = activeTab === 'all'
    ? activeAnnouncements
    : activeAnnouncements.filter(a => a.type === activeTab);
  
  return (
    <div className="space-y-6">
      {demoMode && (
        <Alert className="bg-warning/10 border-warning/30">
          <Eye className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
          <AlertDescription>Showing sample messages. Click "Live Data" to switch back.</AlertDescription>
        </Alert>
      )}

      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages & Updates</h1>
          <p className="text-muted-foreground mt-2">View important announcements and messages from the admin</p>
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
      ) : filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onAcknowledge={handleMarkAsRead}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium">No messages yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            {isNewUser
              ? "Complete your profile to start receiving messages from administrators."
              : "You don't have any messages at the moment."}
          </p>
          {isNewUser && (
            <Button asChild>
              <Link to="/instructor/profile">
                <PlusCircle className="h-4 w-4 mr-2" />
                Complete Your Profile
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorMessages;
