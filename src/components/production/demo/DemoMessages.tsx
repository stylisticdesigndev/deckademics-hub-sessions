import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DEMO_INSTRUCTOR_ID } from '@/lib/productionDemoState';
import ConversationList from '@/components/instructor/messages/ConversationList';
import ConversationThread from '@/components/instructor/messages/ConversationThread';
import StudentConversationThread from '@/components/student/messages/StudentConversationThread';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function DemoMessages() {
  const demo = useProductionDemo();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('conversations');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  if (!demo) return null;
  const instructor = demo.role === 'instructor';
  const to = params.get('to');
  const activeStudent = instructor ? demo.state.students.find(s => s.id === to) : to === DEMO_INSTRUCTOR_ID ? demo.state.students.find(s => s.id === demo.studentId) : undefined;
  const open = (id: string) => setParams({ to: id });
  const back = () => setParams({});
  const conversations = (instructor ? demo.state.students : demo.state.students.filter(s => s.id === demo.studentId)).flatMap(student => {
    const messages = demo.state.messages.filter(m => m.studentId === student.id).sort((a,b)=>a.created_at.localeCompare(b.created_at));
    const last = messages[messages.length - 1];
    if (!last) return [];
    return [{ studentId: instructor ? student.id : DEMO_INSTRUCTOR_ID, studentName: instructor ? student.name : 'Lonegevity', initials: instructor ? student.initials : 'L', lastMessage: last.content, lastMessageAt: last.created_at, unreadCount: 0 }];
  }).sort((a,b)=>b.lastMessageAt.localeCompare(a.lastMessageAt));
  const send = async (content: string) => {
    if (!activeStudent) return;
    setSending(true);
    try { await demo.save({ kind: 'message', studentId: activeStudent.id, sender: demo.role, content }); } finally { setSending(false); }
  };
  if (activeStudent) {
    const messages = demo.state.messages.filter(m => m.studentId === activeStudent.id).sort((a,b)=>a.created_at.localeCompare(b.created_at)).map(m=>({ id: m.id, sender_id: m.sender === 'instructor' ? DEMO_INSTRUCTOR_ID : activeStudent.id, content: m.content, sent_at: m.created_at, subject: null }));
    const frame = 'flex flex-col h-[calc(100dvh-20rem)] md:h-[calc(100dvh-14rem)] min-h-[320px]';
    return instructor ? <ConversationThread key={activeStudent.id} currentUserId={DEMO_INSTRUCTOR_ID} studentName={activeStudent.name} studentInitials={activeStudent.initials} messages={messages} onSendReply={send} onBack={back} sending={sending} imageAttachmentsEnabled={false} className={frame} /> : <StudentConversationThread key={activeStudent.id} currentUserId={activeStudent.id} instructorName="Lonegevity" instructorInitials="L" messages={messages} onSendReply={send} onBack={back} sending={sending} className={frame} savedMessageIds={saved} onSaveToNotes={message=>{ void demo.save({kind:'note', studentId:activeStudent.id,content:message.content}).then(()=>setSaved(old=>new Set([...old,message.id]))); }} />;
  }
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">Messages</h1><p className="text-muted-foreground mt-1">{instructor ? 'Conversations with your students' : 'Conversations with your instructors'}</p></header>
    {instructor ? <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="conversations"><MessageSquare className="h-3.5 w-3.5 mr-1.5"/>Conversations</TabsTrigger><TabsTrigger value="compose"><Send className="h-3.5 w-3.5 mr-1.5"/>Compose</TabsTrigger></TabsList><TabsContent value="conversations"><ConversationList conversations={conversations} onSelect={open}/></TabsContent><TabsContent value="compose"><form className="space-y-4 border-y py-6" onSubmit={async e=>{e.preventDefault();if(!recipients.length||!body.trim())return;setSending(true);try { for (const studentId of recipients) await demo.save({kind:'message',studentId,sender:'instructor',content:body.trim()});setBody('');setRecipients([]);setTab('conversations'); } finally {setSending(false);} }}><h2 className="text-lg font-semibold">New Message</h2><div className="flex justify-between items-center"><Label>To (select students)</Label><Button type="button" variant="ghost" size="sm" onClick={()=>setRecipients(recipients.length===demo.state.students.length?[]:demo.state.students.map(s=>s.id))}>{recipients.length===demo.state.students.length?'Deselect all':'Select all'}</Button></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{demo.state.students.map(s=><Label key={s.id} className="flex items-center gap-2 p-3 border rounded-md cursor-pointer"><Checkbox checked={recipients.includes(s.id)} onCheckedChange={checked=>setRecipients(old=>checked===true?[...old,s.id]:old.filter(id=>id!==s.id))}/>{s.name}</Label>)}</div><Label htmlFor="showcase-message">Message</Label><Textarea id="showcase-message" placeholder="Write your message…" rows={5} value={body} onChange={e=>setBody(e.target.value)}/><Button disabled={sending||!recipients.length||!body.trim()}><Send className="h-4 w-4 mr-2"/>{sending?'Sending…':`Send to ${recipients.length} student(s)`}</Button></form></TabsContent></Tabs> : <ConversationList conversations={conversations} onSelect={open}/>}
  </div>;
}
