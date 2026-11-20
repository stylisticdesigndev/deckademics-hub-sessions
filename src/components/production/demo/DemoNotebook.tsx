import { useState } from 'react';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
export function DemoNotebook({studentId,staff=false}:{studentId:string;staff?:boolean}) {
  const demo=useProductionDemo();const [note,setNote]=useState('');const [task,setTask]=useState('');
  if(!demo)return null;
  return <div className="space-y-6"><section className="space-y-3"><h3 className="font-semibold">Session Notes</h3>{demo.state.notes.filter(n=>n.studentId===studentId).map(n=><p key={n.id} className="border-b py-3 text-sm whitespace-pre-wrap">{n.content}</p>)}{staff&&<form className="space-y-2" onSubmit={e=>{e.preventDefault();if(!note.trim())return;void demo.save({kind:'note',studentId,content:note.trim()});setNote('');}}><Textarea aria-label="Session note" placeholder="Note from today's session…" value={note} onChange={e=>setNote(e.target.value)}/><Button disabled={!note.trim()} variant="outline">Add Note</Button></form>}</section><section className="space-y-3"><h3 className="font-semibold">Creative Tasks</h3>{demo.state.tasks.filter(t=>t.studentId===studentId).map(t=><div key={t.id} className="flex items-start gap-3"><Checkbox id={t.id} checked={t.completed} onCheckedChange={()=>demo.save({kind:'toggle-task',id:t.id})}/><Label htmlFor={t.id} className={`leading-5 ${t.completed?'line-through text-muted-foreground':''}`}>{t.title}</Label></div>)}{staff&&<form className="flex gap-2" onSubmit={e=>{e.preventDefault();if(!task.trim())return;void demo.save({kind:'task',studentId,title:task.trim()});setTask('');}}><Input aria-label="New creative task" placeholder="New creative task" value={task} onChange={e=>setTask(e.target.value)}/><Button disabled={!task.trim()} variant="outline">Add Task</Button></form>}</section></div>;
}