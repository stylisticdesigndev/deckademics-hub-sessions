import React, { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
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

interface UserOption {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  role: string;
}

const AdminMessages = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState('conversations');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [session]);

  const fetchData = async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      // Fetch all non-admin profiles as potential recipients
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, dj_name, avatar_url, role')
        .neq('id', session.user.id);

      if (profiles) {
        setUsers(profiles.map((p: any) => {
          const dj = (p.dj_name || '').trim();
          const isInstructor = p.role === 'instructor';
          const displayName = isInstructor && dj
            ? dj
            : (`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown');
          const initialsParts = isInstructor && dj
            ? dj.split(/\s+/).filter(Boolean)
            : [p.first_name || ' ', p.last_name || ' '];
          const initials = `${(initialsParts[0] || ' ')[0]}${(initialsParts[1] || ' ')[0]}`.toUpperCase();
          return {
            id: p.id,
            name: displayName,
            initials,
            avatarUrl: p.avatar_url,
            role: p.role,
          };
        }));
      }

      const { data: messages } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, subject, content, sent_at, read_at, is_archived, image_url')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('sent_at', { ascending: true });

      if (messages) setAllMessages(messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const conversations = useMemo((): Conversation[] => {
    const userId = session?.user?.id;
    if (!userId) return [];

    const userMap = new Map(users.map(u => [u.id, u]));
    const grouped = new Map<string, Message[]>();

    for (const msg of allMessages) {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!grouped.has(otherId)) grouped.set(otherId, []);
      grouped.get(otherId)!.push(msg);
    }

    const result: Conversation[] = [];
    for (const [otherUserId, msgs] of grouped) {
      const user = userMap.get(otherUserId);
      const sorted = msgs.sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
      const last = sorted[sorted.length - 1];
      const unreadCount = sorted.filter(m => m.receiver_id === userId && !m.read_at).length;

      result.push({
        studentId: otherUserId,
        studentName: user ? `${user.name} (${user.role})` : 'Unknown',
        initials: user?.initials || '??',
        avatarUrl: user?.avatarUrl,
        lastMessage: last.content,
        lastMessageAt: last.sent_at,
        unreadCount,
      });
    }

    return result.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [allMessages, users, session]);

  const threadMessages = useMemo(() => {
    if (!activeUserId || !session?.user?.id) return [];
    return allMessages
      .filter(m =>
        (m.sender_id === session.user.id && m.receiver_id === activeUserId) ||
        (m.sender_id === activeUserId && m.receiver_id === session.user.id)
      )
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
  }, [activeUserId, allMessages, session]);

  useEffect(() => {
    if (!activeUserId || !session?.user?.id) return;
    const unread = threadMessages.filter(m => m.receiver_id === session.user.id && !m.read_at);
    if (unread.length === 0) return;
    const markRead = async () => {
      const ids = unread.map(m => m.id);
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', ids);
      setAllMessages(prev => prev.map(m => ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m));
    };
    markRead();
  }, [activeUserId, threadMessages]);

  const handleSendReply = async (content: string, imageUrl?: string) => {
    if (!session?.user?.id || !activeUserId) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: session.user.id,
        receiver_id: activeUserId,
        content: content || '',
        subject: null,
        image_url: imageUrl || null,
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
    if (!session?.user?.id || selectedUsers.length === 0 || !messageBody.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Select at least one user and write a message.' });
      return;
    }
    setSending(true);
    try {
      const rows = selectedUsers.map(userId => ({
        sender_id: session.user.id,
        receiver_id: userId,
        subject: subject.trim() || null,
        content: messageBody.trim(),
      }));
      const { error } = await supabase.from('messages').insert(rows);
      if (error) throw error;
      toast({ title: 'Sent!', description: `Message sent to ${selectedUsers.length} user(s).` });
      setSelectedUsers([]);
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

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const activeConvo = activeUserId ? conversations.find(c => c.studentId === activeUserId) : null;

  if (activeUserId && activeConvo) {
    return (
      <div className="space-y-6">
        <ConversationThread
          currentUserId={session?.user?.id || ''}
          studentName={activeConvo.studentName}
          studentInitials={activeConvo.initials}
          studentAvatarUrl={activeConvo.avatarUrl}
          messages={threadMessages}
          onSendReply={handleSendReply}
          onBack={() => setActiveUserId(null)}
          sending={sending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with instructors and students</p>
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
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              onSelect={(id) => setActiveUserId(id)}
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
                <Label>To (select recipients)</Label>
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users found.</p>
                ) : (
                  <Tabs defaultValue="students">
                    <TabsList className="mb-2">
                      <TabsTrigger value="students">
                        Students {users.filter(u => u.role === 'student').length > 0 && `(${users.filter(u => u.role === 'student').length})`}
                      </TabsTrigger>
                      <TabsTrigger value="instructors">
                        Instructors {users.filter(u => u.role === 'instructor').length > 0 && `(${users.filter(u => u.role === 'instructor').length})`}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="students">
                      {users.filter(u => u.role === 'student').length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No students found.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {users.filter(u => u.role === 'student').map(user => (
                            <label
                              key={user.id}
                              className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => toggleUser(user.id)}
                              />
                              <span className="text-sm font-medium truncate">{user.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="instructors">
                      {users.filter(u => u.role === 'instructor').length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">No instructors found.</p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {users.filter(u => u.role === 'instructor').map(user => (
                            <label
                              key={user.id}
                              className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                              <Checkbox
                                checked={selectedUsers.includes(user.id)}
                                onCheckedChange={() => toggleUser(user.id)}
                              />
                              <span className="text-sm font-medium truncate">{user.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
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
              <Button onClick={handleComposeSend} disabled={sending || selectedUsers.length === 0 || !messageBody.trim()} className="flex items-center gap-2">
                <Send className="h-4 w-4" /> {sending ? 'Sending...' : `Send to ${selectedUsers.length} user(s)`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMessages;
