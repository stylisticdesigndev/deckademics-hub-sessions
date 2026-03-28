
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Megaphone, Inbox } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard } from '@/components/cards/AnnouncementCard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCard } from '@/components/student/messages/MessageCard';

interface DirectMessage {
  id: string;
  subject: string | null;
  content: string;
  sent_at: string;
  read_at: string | null;
  sender_id: string;
  senderName: string;
  senderInitials: string;
  image_url?: string | null;
}

interface AuthorProfile {
  first_name?: string;
  last_name?: string;
}

const demoAnnouncements = [
  {
    id: 'demo-1',
    title: 'Spring Showcase Performance — Sign Up Now!',
    content: 'Our annual Spring Showcase is coming up on April 19th! All students are invited to perform a 5-minute set.',
    date: new Date().toLocaleDateString(),
    instructor: { name: 'Admin', initials: 'DA' },
    isNew: true,
    type: 'event' as const,
  },
  {
    id: 'demo-2',
    title: 'New Equipment in Classroom B',
    content: "We've upgraded Classroom B with new Pioneer DDJ-REV7 controllers and KRK studio monitors.",
    date: new Date(Date.now() - 2 * 86400000).toLocaleDateString(),
    instructor: { name: 'DJ Marcus', initials: 'DM' },
    isNew: true,
    type: 'announcement' as const,
  },
];

const demoMessages: DirectMessage[] = [
  {
    id: 'demo-msg-1',
    subject: 'Great progress on beat matching!',
    content: 'Hey, just wanted to say your beat matching has improved a lot this week. Keep it up!',
    sent_at: new Date().toISOString(),
    read_at: null,
    sender_id: 'demo',
    senderName: 'DJ Marcus',
    senderInitials: 'DM',
  },
  {
    id: 'demo-msg-2',
    subject: 'Homework for next class',
    content: 'Please practice the transition techniques we covered today. Try at least 3 different songs.',
    sent_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    read_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    sender_id: 'demo',
    senderName: 'DJ Marcus',
    senderInitials: 'DM',
  },
];

const StudentMessages = () => {
  const { userData, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [announcementFilter, setAnnouncementFilter] = useState('all');

  const isDemoMode = !session || demoMode;

  useEffect(() => {
    if (isDemoMode) {
      setAnnouncements(demoAnnouncements);
      setMessages(demoMessages);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAnnouncements(demoAnnouncements);
          setMessages(demoMessages);
          setLoading(false);
          return;
        }

        // Fetch announcements
        const { data: annData } = await supabase
          .from('announcements')
          .select(`
            id, title, content, published_at, author_id, type,
            profiles:author_id (first_name, last_name),
            announcement_reads!left (id, read_at, user_id)
          `)
          .contains('target_role', ['student'])
          .order('published_at', { ascending: false });

        if (annData && annData.length > 0) {
          const formatted = annData.map((ann: any) => {
            const authorProfile = ann.profiles as AuthorProfile;
            const readRecords = Array.isArray(ann.announcement_reads)
              ? ann.announcement_reads.filter((r: any) => r.user_id === user.id)
              : [];
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
        } else {
          setAnnouncements([]);
        }

        // Fetch direct messages (received by student)
        const { data: msgData } = await supabase
          .from('messages')
          .select(`
            id, subject, content, sent_at, read_at, sender_id, image_url,
            profiles:sender_id (first_name, last_name)
          `)
          .eq('receiver_id', user.id)
          .order('sent_at', { ascending: false });

        if (msgData && msgData.length > 0) {
          const formattedMsgs: DirectMessage[] = msgData.map((msg: any) => {
            const senderProfile = msg.profiles as AuthorProfile;
            const firstName = senderProfile?.first_name || '';
            const lastName = senderProfile?.last_name || '';
            return {
              id: msg.id,
              subject: msg.subject,
              content: msg.content,
              sent_at: msg.sent_at,
              read_at: msg.read_at,
              sender_id: msg.sender_id,
              senderName: `${firstName} ${lastName}`.trim() || 'Instructor',
              senderInitials: `${(firstName || ' ')[0]}${(lastName || ' ')[0]}`.trim().toUpperCase() || 'I',
              image_url: msg.image_url,
            };
          });
          setMessages(formattedMsgs);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [isDemoMode]);

  const handleMarkAnnouncementAsRead = async (id: string) => {
    if (isDemoMode || id.startsWith('demo-')) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      toast({ title: 'Marked as read' });
      return;
    }
    const { error } = await supabase
      .from('announcement_reads')
      .insert({ announcement_id: id, user_id: session?.user?.id });
    if (!error) {
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isNew: false } : a));
      toast({ title: 'Marked as read' });
    }
  };

  const handleMarkMessageAsRead = async (id: string) => {
    if (isDemoMode || id.startsWith('demo-')) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read_at: new Date().toISOString() } : m));
      return;
    }
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read_at: new Date().toISOString() } : m));
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    }
  };

  const handleReply = async (messageId: string, content: string) => {
    if (isDemoMode) {
      toast({ title: 'Reply sent (demo)' });
      return;
    }
    // Find the original message to get the sender (instructor) as receiver
    const originalMsg = messages.find(m => m.id === messageId);
    if (!originalMsg || !session?.user?.id) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: session.user.id,
        receiver_id: originalMsg.sender_id,
        subject: originalMsg.subject ? `Re: ${originalMsg.subject}` : null,
        content,
      });

    if (error) {
      toast({ title: 'Failed to send reply', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reply sent!' });
    }
  };

  const filteredAnnouncements = announcementFilter === 'all'
    ? announcements
    : announcements.filter(a => a.type === announcementFilter);

  const unreadMsgCount = messages.filter(m => !m.read_at).length;

  // Build "All" feed: merge messages and announcements sorted by date
  const allItems = [
    ...messages.map(m => ({ kind: 'message' as const, date: new Date(m.sent_at), data: m })),
    ...announcements.map(a => ({ kind: 'announcement' as const, date: new Date(a.date), data: a })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages & Updates</h1>
          <p className="text-muted-foreground mt-1">
            View messages from your instructors and school announcements
          </p>
        </div>
        {session && (
          <Button
            variant={demoMode ? "default" : "outline"}
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
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Messages
              {unreadMsgCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                  {unreadMsgCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* ALL TAB */}
          <TabsContent value="all">
            {allItems.length > 0 ? (
              <div className="space-y-3 mt-4">
                {allItems.map(item => {
                  if (item.kind === 'message') {
                    const msg = item.data as DirectMessage;
                    return (
                      <MessageCard
                        key={msg.id}
                        message={msg}
                        onMarkAsRead={handleMarkMessageAsRead}
                        onReply={handleReply}
                        isDemoMode={isDemoMode}
                      />
                    );
                  }
                  const ann = item.data as any;
                  return (
                    <AnnouncementCard
                      key={ann.id}
                      announcement={ann}
                      onAcknowledge={handleMarkAnnouncementAsRead}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No messages or announcements yet</h3>
                <p className="text-muted-foreground mt-2">
                  Updates from your instructors and school will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages">
            {messages.length > 0 ? (
              <div className="space-y-3 mt-4">
                {messages.map(msg => (
                  <MessageCard
                    key={msg.id}
                    message={msg}
                    onMarkAsRead={handleMarkMessageAsRead}
                    onReply={handleReply}
                    isDemoMode={isDemoMode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No messages yet</h3>
                <p className="text-muted-foreground mt-2">
                  Messages from your instructor will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* ANNOUNCEMENTS TAB */}
          <TabsContent value="announcements">
            <div className="mt-4 space-y-4">
              <Tabs value={announcementFilter} onValueChange={setAnnouncementFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="event">Events</TabsTrigger>
                  <TabsTrigger value="announcement">Announcements</TabsTrigger>
                  <TabsTrigger value="update">Updates</TabsTrigger>
                </TabsList>
              </Tabs>

              {filteredAnnouncements.length > 0 ? (
                <div className="space-y-4">
                  {filteredAnnouncements.map(announcement => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onAcknowledge={handleMarkAnnouncementAsRead}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium">No announcements yet</h3>
                  <p className="text-muted-foreground mt-2">
                    School announcements will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default StudentMessages;
