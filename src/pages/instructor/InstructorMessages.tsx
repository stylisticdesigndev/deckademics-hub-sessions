
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Inbox, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockInstructorDirectMessages, mockInstructorStudentList } from '@/data/mockInstructorData';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  sent_at: string;
  read_at: string | null;
  sender_name?: string;
  receiver_name?: string;
}

interface StudentOption {
  id: string;
  name: string;
  initials: string;
}

const InstructorMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');

  // Compose state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');

  // Data state
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);

  // Thread view
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);

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
          .select('id, first_name, last_name')
          .in('id', studentIds);

        if (profiles) {
          setStudents(profiles.map(p => ({
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
            initials: `${(p.first_name || ' ')[0]}${(p.last_name || ' ')[0]}`.toUpperCase(),
          })));
        }
      }

      // Fetch inbox (messages received by instructor)
      const { data: inbox } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', session.user.id)
        .order('sent_at', { ascending: false });

      if (inbox) {
        const senderIds = [...new Set(inbox.map(m => m.sender_id))];
        const { data: senderProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', senderIds);

        const profileMap = new Map((senderProfiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));
        setInboxMessages(inbox.map(m => ({ ...m, sender_name: profileMap.get(m.sender_id) || 'Unknown' })));
      }

      // Fetch sent messages
      const { data: sent } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', session.user.id)
        .order('sent_at', { ascending: false });

      if (sent) {
        const receiverIds = [...new Set(sent.map(m => m.receiver_id))];
        const { data: receiverProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', receiverIds);

        const profileMap = new Map((receiverProfiles || []).map(p => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()]));
        setSentMessages(sent.map(m => ({ ...m, receiver_name: profileMap.get(m.receiver_id) || 'Unknown' })));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
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
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (msg: Message) => {
    if (demoMode || msg.read_at) return;
    try {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id);
      setInboxMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAllStudents = () => {
    const activeStudents = demoMode ? mockInstructorStudentList : students;
    if (selectedStudents.length === activeStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(activeStudents.map(s => s.id));
    }
  };

  const activeStudents = demoMode ? mockInstructorStudentList : students;
  const activeInbox = demoMode ? mockInstructorDirectMessages.inbox : inboxMessages;
  const activeSent = demoMode ? mockInstructorDirectMessages.sent : sentMessages;
  const isLoading = !demoMode && loading;

  if (selectedThread) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => { setSelectedThread(null); }} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Messages
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedThread.subject || '(No subject)'}</CardTitle>
              <span className="text-sm text-muted-foreground">
                {format(new Date(selectedThread.sent_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              From: {selectedThread.sender_name || 'You'} → To: {selectedThread.receiver_name || 'You'}
            </p>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{selectedThread.content}</p>
          </CardContent>
        </Card>
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
          <p className="text-muted-foreground mt-1">Send direct messages to your students</p>
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
          <TabsTrigger value="compose" className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" /> Compose
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> Inbox
            {activeInbox.filter(m => !m.read_at).length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {activeInbox.filter(m => !m.read_at).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Sent
          </TabsTrigger>
        </TabsList>

        {/* Compose */}
        <TabsContent value="compose">
          <Card className={demoMode ? 'opacity-60 pointer-events-none' : ''}>
            <CardHeader>
              <CardTitle className="text-lg">New Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student picker */}
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
              <Button onClick={handleSend} disabled={sending || selectedStudents.length === 0 || !messageBody.trim()} className="flex items-center gap-2">
                <Send className="h-4 w-4" /> {sending ? 'Sending...' : `Send to ${selectedStudents.length} student(s)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inbox */}
        <TabsContent value="inbox">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : activeInbox.length > 0 ? (
            <div className="space-y-2">
              {activeInbox.map(msg => (
                <Card
                  key={msg.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/30 ${!msg.read_at ? 'border-primary/40 bg-primary/5' : ''}`}
                  onClick={() => { handleMarkAsRead(msg); setSelectedThread(msg); }}
                >
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!msg.read_at && <Badge variant="default" className="text-xs">New</Badge>}
                        <span className="font-semibold text-sm truncate">{msg.subject || '(No subject)'}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">From: {msg.sender_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{msg.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(msg.sent_at), 'MMM d')}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">No messages</h3>
              <p className="text-muted-foreground mt-2">Your inbox is empty.</p>
            </div>
          )}
        </TabsContent>

        {/* Sent */}
        <TabsContent value="sent">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : activeSent.length > 0 ? (
            <div className="space-y-2">
              {activeSent.map(msg => (
                <Card
                  key={msg.id}
                  className="cursor-pointer transition-colors hover:bg-accent/30"
                  onClick={() => setSelectedThread(msg)}
                >
                  <CardContent className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm truncate">{msg.subject || '(No subject)'}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">To: {msg.receiver_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {msg.read_at && <Check className="h-3.5 w-3.5 text-primary" />}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(msg.sent_at), 'MMM d')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium">No sent messages</h3>
              <p className="text-muted-foreground mt-2">You haven't sent any messages yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorMessages;
