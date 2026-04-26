import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Mail, Megaphone, Inbox } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnnouncementCard, type Announcement } from '@/components/cards/AnnouncementCard';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { formatDateUS, formatDateTimeUS } from '@/lib/utils';
import StudentConversationThread from '@/components/student/messages/StudentConversationThread';
import { useStudentPersonalNotes } from '@/hooks/student/useStudentPersonalNotes';
import { mockStudentConversations, mockStudentMessages } from '@/data/mockDashboardData';

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

interface AnnouncementReadRecord {
  id: string;
  read_at: string | null;
  user_id: string;
  dismissed?: boolean;
}

type StudentAnnouncement = Announcement & {
  publishedAt: string;
};

type RecentFeedItem =
  | { type: 'conversation'; data: Conversation; sortDate: Date }
  | { type: 'announcement'; data: StudentAnnouncement; sortDate: Date };

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

const StudentMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<StudentAnnouncement[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [instructors, setInstructors] = useState<InstructorInfo[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [announcementFilter, setAnnouncementFilter] = useState('all');
  const [activeInstructorId, setActiveInstructorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [twoWayEnabled, setTwoWayEnabled] = useState<boolean>(true);

  const isDemoMode = !session || demoMode;
  const userId = session?.user?.id;

  const { createNote } = useStudentPersonalNotes(userId);

  useEffect(() => {
    if (isDemoMode) {
      setAnnouncements(demoAnnouncements);
      setAllMessages(
        Object.values(mockStudentMessages).flat() as Message[]
      );
      setInstructors(
        mockStudentConversations.map(c => ({
          id: c.instructorId,
          name: c.instructorName,
          initials: c.initials,
          avatarUrl: c.avatarUrl,
        }))
      );
      setLoading(false);
      return;
    }
    fetchData();
    if (userId) {
      supabase.from('students').select('two_way_messaging').eq('id', userId).maybeSingle()
        .then(({ data }: any) => {
          if (data) setTwoWayEnabled(data.two_way_messaging !== false);
        });
    }
  }, [isDemoMode]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: annData } = await supabase
        .from('announcements')
        .select(`
          id, title, content, published_at, author_id, type,
          profiles:author_id (first_name, last_name),
          announcement_reads!left (id, read_at, user_id, dismissed)
        `)
        .contains('target_role', ['student'])
        .order('published_at', { ascending: false });

      if (annData && annData.length > 0) {
        const visibleAnnouncements = annData.reduce((items: StudentAnnouncement[], ann: any) => {
          const authorProfile = ann.profiles as AuthorProfile;
          const readRecords: AnnouncementReadRecord[] = Array.isArray(ann.announcement_reads)
            ? ann.announcement_reads.filter((record: AnnouncementReadRecord) => record.user_id === user.id)
            : [];

          if (readRecords.some(record => record.dismissed)) {
            return items;
          }

          items.push({
            id: ann.id,
            title: ann.title || 'Announcement',
            content: ann.content || '',
            date: formatDateUS(ann.published_at),
            publishedAt: ann.published_at,
            instructor: {
              name: authorProfile ? `${authorProfile.first_name || ''} ${authorProfile.last_name || ''}`.trim() : 'Admin',
              initials: authorProfile ? `${(authorProfile.first_name || ' ')[0]}${(authorProfile.last_name || ' ')[0]}`.trim().toUpperCase() : 'A',
            },
            isNew: readRecords.length === 0,
            type: ann.type || 'announcement',
          });

          return items;
        }, []);

        setAnnouncements(visibleAnnouncements);
      } else {
        setAnnouncements([]);
      }

      const { data: msgData } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, subject, content, sent_at, read_at, image_url')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('sent_at', { ascending: true });

      if (msgData) {
        setAllMessages(msgData as Message[]);

        const otherIds = new Set<string>();
        for (const message of msgData) {
          const otherId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
          otherIds.add(otherId);
        }

        if (otherIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url')
            .in('id', Array.from(otherIds));

          if (profiles) {
            setInstructors(profiles.map(profile => ({
              id: profile.id,
              name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Instructor',
              initials: `${(profile.first_name || ' ')[0]}${(profile.last_name || ' ')[0]}`.toUpperCase(),
              avatarUrl: profile.avatar_url,
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

  const conversations = useMemo((): Conversation[] => {
    if (!userId && !isDemoMode) return [];
    const effectiveUserId = userId || 'mock-student';

    const instructorMap = new Map(instructors.map(instructor => [instructor.id, instructor]));
    const grouped = new Map<string, Message[]>();

    for (const message of allMessages) {
      const otherId = message.sender_id === effectiveUserId ? message.receiver_id : message.sender_id;
      if (!grouped.has(otherId)) grouped.set(otherId, []);
      grouped.get(otherId)!.push(message);
    }

    const result: Conversation[] = [];
    for (const [instructorId, messages] of grouped) {
      const instructor = instructorMap.get(instructorId);
      const sorted = messages.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      const last = sorted[sorted.length - 1];
      const unreadCount = sorted.filter(message => message.receiver_id === effectiveUserId && !message.read_at).length;

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

  const recentItems = useMemo((): RecentFeedItem[] => {
    return [
      ...conversations.map(conversation => ({
        type: 'conversation' as const,
        data: conversation,
        sortDate: new Date(conversation.lastMessageAt),
      })),
      ...announcements.map(announcement => ({
        type: 'announcement' as const,
        data: announcement,
        sortDate: new Date(announcement.publishedAt),
      })),
    ]
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 5);
  }, [announcements, conversations]);

  const threadMessages = useMemo(() => {
    if (!activeInstructorId || !userId) return [];

    return allMessages
      .filter(message =>
        (message.sender_id === userId && message.receiver_id === activeInstructorId) ||
        (message.sender_id === activeInstructorId && message.receiver_id === userId)
      )
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  }, [activeInstructorId, allMessages, userId]);

  useEffect(() => {
    if (!activeInstructorId || isDemoMode || !userId) return;

    const unread = threadMessages.filter(message => message.receiver_id === userId && !message.read_at);
    if (unread.length === 0) return;

    const markRead = async () => {
      const ids = unread.map(message => message.id);
      const now = new Date().toISOString();

      await supabase.from('messages').update({ read_at: now }).in('id', ids);
      setAllMessages(prev => prev.map(message => ids.includes(message.id) ? { ...message, read_at: now } : message));
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    };

    markRead();
  }, [activeInstructorId, isDemoMode, queryClient, threadMessages, userId]);

  const saveAnnouncementReadState = async (
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

    const existingRecord = existingRecords?.[0];

    if (existingRecord) {
      const { error: updateError } = await supabase
        .from('announcement_reads')
        .update(values)
        .eq('id', existingRecord.id);

      if (updateError) throw updateError;
      return;
    }

    const { error: insertError } = await supabase
      .from('announcement_reads')
      .insert({
        announcement_id: announcementId,
        user_id: userId,
        ...values,
      });

    if (insertError) throw insertError;
  };

  const handleSaveToNotes = (msg: { id: string; content: string; sent_at: string; image_url?: string | null }) => {
    if (isDemoMode) {
      setSavedMessageIds(prev => new Set(prev).add(msg.id));
      toast({ title: 'Saved to notes', description: 'Message saved to your personal notes. (Demo)' });
      return;
    }
    if (!userId) return;
    const activeInstructor = instructors.find(i => i.id === activeInstructorId);
    const title = `From ${activeInstructor?.name || 'Instructor'} — ${formatDateUS(msg.sent_at)}`;
    const content = msg.image_url
      ? `${msg.content}\n\n📎 Image: ${msg.image_url}`
      : msg.content;

    createNote.mutate({ title, content }, {
      onSuccess: () => {
        setSavedMessageIds(prev => new Set(prev).add(msg.id));
        toast({ title: 'Saved to notes', description: 'Message saved to your personal notes.' });
      },
      onError: () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to save note.' });
      },
    });
  };

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
      setAnnouncements(prev => prev.map(announcement => announcement.id === id ? { ...announcement, isNew: false } : announcement));
      toast({ title: 'Marked as read' });
      return;
    }

    try {
      await saveAnnouncementReadState(id, { read_at: new Date().toISOString(), dismissed: false });
      setAnnouncements(prev => prev.map(announcement => announcement.id === id ? { ...announcement, isNew: false } : announcement));
      toast({ title: 'Marked as read' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark announcement as read.' });
    }
  };

  const handleDismissAnnouncement = async (id: string) => {
    if (isDemoMode || id.startsWith('demo-')) {
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
      toast({ title: 'Announcement removed' });
      return;
    }

    try {
      await saveAnnouncementReadState(id, {
        read_at: new Date().toISOString(),
        dismissed: true,
      });
      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
      toast({ title: 'Announcement removed' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to remove announcement.' });
    }
  };

  const filteredAnnouncements = announcementFilter === 'all'
    ? announcements
    : announcements.filter(announcement => announcement.type === announcementFilter);

  const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
  const activeConvo = activeInstructorId ? conversations.find(conversation => conversation.instructorId === activeInstructorId) : null;

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
          onSaveToNotes={handleSaveToNotes}
          savedMessageIds={savedMessageIds}
          replyDisabled={!isDemoMode && !twoWayEnabled}
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

          <TabsContent value="all">
            {recentItems.length > 0 ? (
              <div className="space-y-3 mt-4">
                {recentItems.map(item =>
                  item.type === 'conversation' ? (
                    <ConversationItem
                      key={item.data.instructorId}
                      conversation={item.data}
                      onClick={() => setActiveInstructorId(item.data.instructorId)}
                    />
                  ) : (
                    <AnnouncementCard
                      key={item.data.id}
                      announcement={item.data}
                      onAcknowledge={handleMarkAnnouncementAsRead}
                      onDismiss={handleDismissAnnouncement}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No messages or announcements yet</h3>
                <p className="text-muted-foreground mt-2">Updates from your instructors and school will appear here.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages">
            {conversations.length > 0 ? (
              <div className="space-y-3 mt-4">
                {conversations.map(conversation => (
                  <ConversationItem
                    key={conversation.instructorId}
                    conversation={conversation}
                    onClick={() => setActiveInstructorId(conversation.instructorId)}
                  />
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
                      onDismiss={handleDismissAnnouncement}
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

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
            {formatDateUS(conversation.lastMessageAt)}
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
