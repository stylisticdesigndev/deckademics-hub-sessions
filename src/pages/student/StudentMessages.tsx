import React, { useState, useEffect, useMemo } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import StudentConversationThread from '@/components/student/messages/StudentConversationThread';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  sent_at: string;
  read_at: string | null;
  image_url?: string | null;
}

interface InstructorInfo {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
}

interface Conversation {
  instructorId: string;
  instructorName: string;
  initials: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
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

const StudentMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [instructors, setInstructors] = useState<InstructorInfo[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [activeInstructorId, setActiveInstructorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const isDemoMode = !session || demoMode;

  useEffect(() => {
    if (isDemoMode) {
      setAnnouncements(demoAnnouncements);
      setAllMessages([]);
      setInstructors([]);
      setLoading(false);
      return;
    }
    fetchData();
  }, [isDemoMode]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    try {
      setLoading(true);

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
        setAnnouncements(annData.map((ann: any) => {
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
        }));
      } else {
        setAnnouncements([]);
      }

      // Fetch ALL messages (sent and received) for this student
      const { data: msgData } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, subject, content, sent_at, read_at, image_url')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('sent_at', { ascending: true });

      if (msgData) {
        setAllMessages(msgData as Message[]);

        // Collect unique instructor IDs (the "other" person)
        const otherIds = new Set<string>();
        for (const m of msgData) {
          const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
          otherIds.add(otherId);
        }

        if (otherIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', Array.from(otherIds));

          if (profiles) {
            setInstructors(profiles.map(p => ({
              id: p.id,
              name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Instructor',
              initials: `${(p.first_name || ' ')[0]}${(p.last_name || ' ')[0]}`.toUpperCase(),
              avatarUrl: p.avatar_url,
            })));
          }
        }
      } else {
        setAllMessages([]);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const userId = session?.user?.id;

  // Build conversations grouped by instructor
  const conversations = useMemo((): Conversation[] => {
    if (!userId || isDemoMode) return [];

    const instructorMap = new Map(instructors.map(i => [i.id, i]));
    const grouped = new Map<string, Message[]>();

    for (const msg of allMessages) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!grouped.has(otherId)) grouped.set(otherId, []);
      grouped.get(otherId)!.push(msg);
    }

    const result: Conversation[] = [];
    for (const [instructorId, msgs] of grouped) {
      const instructor = instructorMap.get(instructorId);
      const sorted = msgs.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      const last = sorted[sorted.length - 1];
      const unreadCount = sorted.filter(m => m.receiver_id === userId && !m.read_at).length;

      result.push({
        instructorId,
        instructorName: instructor?.name || 'Instructor',
        initials: instructor?.initials || 'I',
        avatarUrl: instructor?.avatarUrl,
        lastMessage: last.content,
        lastMessageAt: last.sent_at,
        unreadCount,
      });
    }

    return result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [allMessages, instructors, userId, isDemoMode]);

  // Thread messages for active conversation
  const threadMessages = useMemo(() => {
    if (!activeInstructorId || !userId) return [];
    return allMessages
      .filter(m =>
        (m.sender_id === userId && m.receiver_id === activeInstructorId) ||
        (m.sender_id === activeInstructorId && m.receiver_id === userId)
      )
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  }, [activeInstructorId, allMessages, userId]);

  // Mark unread messages as read when opening a thread
  useEffect(() => {
    if (!activeInstructorId || isDemoMode || !userId) return;
    const unread = threadMessages.filter(m => m.receiver_id === userId && !m.read_at);
    if (unread.length === 0) return;

    const markRead = async () => {
      const ids = unread.map(m => m.id);
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', ids);
      setAllMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m));
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    };
    markRead();
  }, [activeInstructorId, threadMessages]);

  const handleSendReply = async (content: string) => {
    if (isDemoMode || !userId || !activeInstructorId) return;
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: activeInstructorId,
        content,
        subject: null,
      });
      if (error) throw error;
      await fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reply.' });
    }
  };

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

  const filteredAnnouncements = announcementFilter === 'all'
    ? announcements
    : announcements.filter(a => a.type === announcementFilter);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const activeConvo = activeInstructorId ? conversations.find(c => c.instructorId === activeInstructorId) : null;

  // Thread view
  if (activeInstructorId && activeConvo) {
    return (
      <div className="space-y-6">
        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>Showing sample data.</AlertDescription>
          </Alert>
        )}
        <StudentConversationThread
          currentUserId={userId || ''}
          instructorName={activeConvo.instructorName}
          instructorInitials={activeConvo.initials}
          instructorAvatarUrl={activeConvo.avatarUrl}
          messages={threadMessages}
          onSendReply={handleSendReply}
          onBack={() => setActiveInstructorId(null)}
        />
      </div>
    );
  }

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              All
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Messages
              {totalUnread > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* ALL TAB — limited to 5 most recent */}
          <TabsContent value="all">
            {(() => {
              const combined: { type: 'conversation' | 'announcement'; date: Date; data: any }[] = [
                ...conversations.map(c => ({ type: 'conversation' as const, date: new Date(c.lastMessageAt), data: c })),
                ...announcements.map(a => ({ type: 'announcement' as const, date: new Date(a.date), data: a })),
              ];
              combined.sort((a, b) => b.date.getTime() - a.date.getTime());
              const recent = combined.slice(0, 5);

              if (recent.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium">No messages or announcements yet</h3>
                    <p className="text-muted-foreground mt-2">Updates from your instructors and school will appear here.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 mt-4">
                  {recent.map(item =>
                    item.type === 'conversation' ? (
                      <ConversationItem key={item.data.instructorId} conversation={item.data} onClick={() => setActiveInstructorId(item.data.instructorId)} />
                    ) : (
                      <AnnouncementCard key={item.data.id} announcement={item.data} onAcknowledge={handleMarkAnnouncementAsRead} />
                    )
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages">
            {conversations.length > 0 ? (
              <div className="space-y-3 mt-4">
                {conversations.map(convo => (
                  <ConversationItem key={convo.instructorId} conversation={convo} onClick={() => setActiveInstructorId(convo.instructorId)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No conversations yet</h3>
                <p className="text-muted-foreground mt-2">Messages from your instructor will appear here.</p>
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
                    <AnnouncementCard key={announcement.id} announcement={announcement} onAcknowledge={handleMarkAnnouncementAsRead} />
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

// Conversation list item component
const ConversationItem = ({ conversation, onClick }: { conversation: Conversation; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
    >
      <Avatar className="h-10 w-10 shrink-0">
        {conversation.avatarUrl && <AvatarImage src={conversation.avatarUrl} alt={conversation.instructorName} />}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {conversation.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{conversation.instructorName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(conversation.lastMessageAt), 'MMM d')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{conversation.lastMessage}</p>
      </div>
      {conversation.unreadCount > 0 && (
        <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center px-1.5 text-xs shrink-0">
          {conversation.unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default StudentMessages;
