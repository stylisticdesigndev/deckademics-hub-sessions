import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Send, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockInstructorDirectMessages, mockInstructorStudentList } from '@/data/mockInstructorData';
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
}

interface StudentOption {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
}

const InstructorMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
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

  useEffect(() => {
    if (demoMode) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [demoMode, session]);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      // Fetch assigned students
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('instructor_id', session.user.id);

      if (studentData && studentData.length > 0) {
        const studentIds = studentData.map(s => s.id);
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
          })));
        }
      }

      // Fetch ALL messages involving this instructor
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
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
    const userId = demoMode ? 'demo-instructor' : session?.user?.id;
    if (!userId) return [];

    const msgs = demoMode
      ? [...mockInstructorDirectMessages.inbox, ...mockInstructorDirectMessages.sent]
      : allMessages;

    const studentMap = demoMode
      ? new Map(mockInstructorStudentList.map(s => [s.id, s]))
      : new Map(students.map(s => [s.id, s]));

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
  }, [allMessages, students, demoMode, session]);

  // Get messages for the active thread
  const threadMessages = useMemo(() => {
    if (!activeStudentId) return [];
    const userId = demoMode ? 'demo-instructor' : session?.user?.id;
    if (!userId) return [];

    const msgs = demoMode
      ? [...mockInstructorDirectMessages.inbox, ...mockInstructorDirectMessages.sent]
      : allMessages;

    return (msgs as Message[])
      .filter(m =>
        (m.sender_id === userId && m.receiver_id === activeStudentId) ||
        (m.sender_id === activeStudentId && m.receiver_id === userId)
      )
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  }, [activeStudentId, allMessages, demoMode, session]);

  // Mark unread messages as read when opening a thread
  useEffect(() => {
    if (!activeStudentId || demoMode || !session?.user?.id) return;
    const unread = threadMessages.filter(m => m.receiver_id === session.user.id && !m.read_at);
    if (unread.length === 0) return;

    const markRead = async () => {
      const ids = unread.map(m => m.id);
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', ids);
      setAllMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m));
    };
    markRead();
  }, [activeStudentId, threadMessages]);

  const handleSendReply = async (content: string) => {
    if (demoMode || !session?.user?.id || !activeStudentId) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: session.user.id,
        receiver_id: activeStudentId,
        content,
        subject: null,
      });
      if (error) throw error;
      await fetchData();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    } finally {
      setSending(false);
    }
  };

  const handleComposeSend = async () => {
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'Cannot send messages in demo mode.' });
      return;
    }
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
    const active = demoMode ? mockInstructorStudentList : students;
    setSelectedStudents(prev => prev.length === active.length ? [] : active.map(s => s.id));
  };

  const activeStudents = demoMode ? mockInstructorStudentList : students;
  const isLoading = !demoMode && loading;

  const activeConvo = activeStudentId ? conversations.find(c => c.studentId === activeStudentId) : null;

  // Thread view
  if (activeStudentId && activeConvo) {
    return (
      <div className="space-y-6">
        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>Showing sample messages.</AlertDescription>
          </Alert>
        )}
        <ConversationThread
          currentUserId={demoMode ? 'demo-instructor' : session?.user?.id || ''}
          studentName={activeConvo.studentName}
          studentInitials={activeConvo.initials}
          studentAvatarUrl={activeConvo.avatarUrl}
          messages={threadMessages}
          onSendReply={handleSendReply}
          onBack={() => setActiveStudentId(null)}
          sending={sending}
        />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">Conversations with your students</p>
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
          <Card className={demoMode ? 'opacity-60 pointer-events-none' : ''}>
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
