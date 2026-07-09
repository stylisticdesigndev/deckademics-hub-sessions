import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { notifyPush } from '@/lib/notifyPush';
import { useToast } from '@/hooks/use-toast';
import ConversationList, { Conversation } from '@/components/instructor/messages/ConversationList';
import ConversationThread from '@/components/instructor/messages/ConversationThread';

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

interface StudentOption {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  twoWayMessaging?: boolean;
}

const InstructorMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');

  // Compose state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');

  // Data state
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);

  // Thread view
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      // Resolve every student connected to this instructor — primary AND
      // secondary assignments (student_instructors), the legacy primary column
      // (students.instructor_id), and cover sessions. Otherwise students
      // assigned only as secondary would show up as "Unknown" with no photo.
      const studentIdSet = new Set<string>();

      const [{ data: siRows }, { data: legacyRows }, { data: coverRows }] = await Promise.all([
        supabase
          .from('student_instructors' as any)
          .select('student_id')
          .eq('instructor_id', session.user.id),
        supabase
          .from('students')
          .select('id')
          .eq('instructor_id', session.user.id),
        supabase
          .from('cover_sessions' as any)
          .select('student_id')
          .eq('cover_instructor_id', session.user.id),
      ]);

      (siRows ?? []).forEach((r: any) => r?.student_id && studentIdSet.add(r.student_id));
      (legacyRows ?? []).forEach((r: any) => r?.id && studentIdSet.add(r.id));
      (coverRows ?? []).forEach((r: any) => r?.student_id && studentIdSet.add(r.student_id));

      const studentIds = Array.from(studentIdSet);

      if (studentIds.length > 0) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id, two_way_messaging')
          .in('id', studentIds);
        const twoWayMap = new Map((studentData ?? []).map((s: any) => [s.id, s.two_way_messaging ?? true]));
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', studentIds);

        if (profiles) {
          setStudents(profiles.map(p => ({
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
            initials: `${(p.first_name || ' ')[0]}${(p.last_name || ' ')[0]}`.toUpperCase(),
            avatarUrl: p.avatar_url,
            twoWayMessaging: twoWayMap.get(p.id) ?? true,
          })));
        }
      }

      // Fetch ALL messages involving this instructor
      const { data: messages } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, subject, content, sent_at, read_at, is_archived, image_url')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('sent_at', { ascending: true });

      if (messages) {
        setAllMessages(messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Build conversations from all messages
  const conversations = useMemo((): Conversation[] => {
    const userId = session?.user?.id;
    if (!userId) return [];

    const msgs = allMessages;

    const studentMap = new Map(students.map(s => [s.id, s]));

    // Group by student
    const grouped = new Map<string, Message[]>();
    for (const msg of msgs) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!grouped.has(otherId)) grouped.set(otherId, []);
      grouped.get(otherId)!.push(msg as Message);
    }

    const result: Conversation[] = [];
    for (const [studentId, studentMsgs] of grouped) {
      const student = studentMap.get(studentId);
      const sorted = studentMsgs.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      const last = sorted[sorted.length - 1];
      const unreadCount = sorted.filter(m => m.receiver_id === userId && !m.read_at).length;

      result.push({
        studentId,
        studentName: student?.name || 'Unknown',
        initials: student?.initials || '??',
        avatarUrl: (student as StudentOption)?.avatarUrl,
        lastMessage: last.content,
        lastMessageAt: last.sent_at,
        unreadCount,
      });
    }

    return result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [allMessages, students, session]);

  // Deep-link: open a specific thread when arriving from a push notification
  useEffect(() => {
    const from = searchParams.get('from');
    if (!from) return;
    if (conversations.some(c => c.studentId === from)) {
      setActiveStudentId(from);
      setActiveTab('conversations');
      searchParams.delete('from');
      setSearchParams(searchParams, { replace: true });
    }
  }, [conversations, searchParams, setSearchParams]);

  // Get messages for the active thread
  const threadMessages = useMemo(() => {
    if (!activeStudentId) return [];
    const userId = session?.user?.id;
    if (!userId) return [];

    const msgs = allMessages;

    return (msgs as Message[])
      .filter(m =>
        (m.sender_id === userId && m.receiver_id === activeStudentId) ||
        (m.sender_id === activeStudentId && m.receiver_id === userId)
      )
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  }, [activeStudentId, allMessages, session]);

  // Mark unread messages as read when opening a thread
  useEffect(() => {
    if (!activeStudentId || !session?.user?.id) return;
    const unread = threadMessages.filter(m => m.receiver_id === session.user.id && !m.read_at);
    if (unread.length === 0) return;

    const markRead = async () => {
      const ids = unread.map(m => m.id);
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', ids);
      setAllMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m));
    };
    markRead();
  }, [activeStudentId, threadMessages]);

  const handleSendReply = async (content: string, imageUrl?: string) => {
    if (!session?.user?.id || !activeStudentId) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: session.user.id,
        receiver_id: activeStudentId,
        content: content || '',
        subject: null,
        image_url: imageUrl || null,
      });
      if (error) throw error;
      await fetchData();
      notifyPush(activeStudentId, 'New message', (content || 'Photo').slice(0, 140), `/student/messages?from=${session.user.id}`);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    } finally {
      setSending(false);
    }
  };

  const handleComposeSend = async () => {
    if (!session?.user?.id || selectedStudents.length === 0 || !messageBody.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Select at least one student and write a message.' });
      return;
    }

    setSending(true);
    try {
      const rows = selectedStudents.map(studentId => ({
        sender_id: session.user.id,
        receiver_id: studentId,
        subject: subject.trim() || null,
        content: messageBody.trim(),
      }));

      const { error } = await supabase.from('messages').insert(rows);
      if (error) throw error;

      toast({ title: 'Sent!', description: `Message sent to ${selectedStudents.length} student(s).` });
      selectedStudents.forEach((studentId) =>
        notifyPush(studentId, 'New message', messageBody.trim().slice(0, 140), `/student/messages?from=${session.user.id}`)
      );
      setSelectedStudents([]);
      setSubject('');
      setMessageBody('');
      setActiveTab('conversations');
      fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
      setSending(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAllStudents = () => {
    const active = students;
    setSelectedStudents(prev => prev.length === active.length ? [] : active.map(s => s.id));
  };

  const activeStudents = students;
  const isLoading = loading;

  const activeConvo = activeStudentId ? conversations.find(c => c.studentId === activeStudentId) : null;
  const activeStudent = activeStudentId ? students.find(s => s.id === activeStudentId) : null;

  const handleToggleTwoWayMessaging = async (next: boolean) => {
    if (!activeStudentId) {
      return;
    }
    const { error } = await supabase
      .from('students')
      .update({ two_way_messaging: next } as any)
      .eq('id', activeStudentId);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not save', description: error.message });
      return;
    }
    setStudents(prev => prev.map(s => s.id === activeStudentId ? { ...s, twoWayMessaging: next } : s));
    toast({
      title: next ? 'Replies enabled' : 'Replies disabled',
      description: next
        ? 'This student can now reply to your messages.'
        : 'This student is now read-only — they can receive but not send messages.',
    });
  };

  // Thread view
  if (activeStudentId && activeConvo) {
    return (
      <div className="space-y-6">
        <ConversationThread
          currentUserId={session?.user?.id || ''}
          studentName={activeConvo.studentName}
          studentInitials={activeConvo.initials}
          studentAvatarUrl={activeConvo.avatarUrl}
          messages={threadMessages}
          onSendReply={handleSendReply}
          onBack={() => setActiveStudentId(null)}
          sending={sending}
          twoWayMessaging={activeStudent?.twoWayMessaging ?? true}
          onToggleTwoWayMessaging={handleToggleTwoWayMessaging}
          canToggleTwoWayMessaging={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Conversations with your students</p>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="conversations" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Conversations
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" /> Compose
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              onSelect={(id) => setActiveStudentId(id)}
            />
          )}
        </TabsContent>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>To (select students)</Label>
                  <Button variant="ghost" size="sm" onClick={selectAllStudents} type="button">
                    {selectedStudents.length === activeStudents.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                {activeStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assigned students found.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {activeStudents.map(student => (
                      <label
                        key={student.id}
                        className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                        />
                        <span className="text-sm font-medium">{student.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject (optional)</Label>
                <Input id="subject" placeholder="Message subject..." value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea id="body" placeholder="Write your message..." value={messageBody} onChange={e => setMessageBody(e.target.value)} rows={5} />
              </div>
              <Button onClick={handleComposeSend} disabled={sending || selectedStudents.length === 0 || !messageBody.trim()} className="flex items-center gap-2">
                <Send className="h-4 w-4" /> {sending ? 'Sending...' : `Send to ${selectedStudents.length} student(s)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorMessages;
