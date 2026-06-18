import React, { useState, useEffect, useMemo } from 'react';
import { Mail } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { notifyPush } from '@/lib/notifyPush';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateUS } from '@/lib/utils';
import StudentConversationThread from '@/components/student/messages/StudentConversationThread';
import { useStudentPersonalNotes } from '@/hooks/student/useStudentPersonalNotes';

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

const StudentMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [instructors, setInstructors] = useState<InstructorInfo[]>([]);
  const [activeInstructorId, setActiveInstructorId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [twoWayEnabled, setTwoWayEnabled] = useState<boolean>(true);

  const userId = session?.user?.id;

  const { createNote } = useStudentPersonalNotes(userId);

  useEffect(() => {
    fetchData();
    if (userId) {
      supabase.from('students').select('two_way_messaging').eq('id', userId).maybeSingle()
        .then(({ data }: any) => {
          if (data) setTwoWayEnabled(data.two_way_messaging !== false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Realtime: keep two_way_messaging in sync when instructor flips the toggle
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`student-two-way-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'students', filter: `id=eq.${userId}` },
        (payload: any) => {
          const next = payload?.new?.two_way_messaging;
          if (typeof next === 'boolean') setTwoWayEnabled(next);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

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
            .select('id, first_name, last_name, dj_name, avatar_url')
            .in('id', Array.from(otherIds));

          if (profiles) {
            setInstructors(profiles.map((profile: any) => {
              const dj = (profile.dj_name || '').trim();
              const full = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              const display = dj || full || 'Instructor';
              const initialsSrc = dj || full || ' ';
              const parts = initialsSrc.split(/\s+/).filter(Boolean);
              const initials = ((parts[0]?.[0] || ' ') + (parts[1]?.[0] || '')).toUpperCase();
              return {
                id: profile.id,
                name: display,
                initials,
                avatarUrl: profile.avatar_url,
              };
            }));
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
    if (!userId) return [];
    const effectiveUserId = userId;

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
  }, [allMessages, instructors, userId]);

  // Deep-link: open a specific thread when arriving from a push notification
  useEffect(() => {
    const from = searchParams.get('from');
    if (!from) return;
    if (conversations.some(c => c.instructorId === from)) {
      setActiveInstructorId(from);
      searchParams.delete('from');
      setSearchParams(searchParams, { replace: true });
    }
  }, [conversations, searchParams, setSearchParams]);

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
    if (!activeInstructorId || !userId) return;

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
  }, [activeInstructorId, queryClient, threadMessages, userId]);

  const handleSaveToNotes = (msg: { id: string; content: string; sent_at: string; image_url?: string | null }) => {
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
    if (!userId || !activeInstructorId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: activeInstructorId,
        content,
        subject: null,
      });

      if (error) throw error;
      await fetchData();
      notifyPush(activeInstructorId, 'New message', content.slice(0, 140), `/instructor/messages?from=${userId}`);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reply.' });
    }
  };

  const activeConvo = activeInstructorId ? conversations.find(conversation => conversation.instructorId === activeInstructorId) : null;

  if (activeInstructorId && activeConvo) {
    return (
      <div className="space-y-6">
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
          replyDisabled={!twoWayEnabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            Conversations with your instructors
          </p>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-3">
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
