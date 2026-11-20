import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AudioLines, BookOpen, CheckCircle2, CalendarDays, Plus, ArrowUpRight, MessageSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { useProduction, type ProductionEnrollment } from '@/hooks/useProduction';
import { useInstructorStudentsSimple } from '@/hooks/instructor/useInstructorStudentsSimple';
import { PRODUCTION_LEVELS, productionLevelLabel, moduleSummary, nextProductionLevel } from '@/lib/production';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InstructorStudentDetailDialog } from '@/components/instructor/students/InstructorStudentDetailDialog';
import { ProductionLearningPanel } from './ProductionLearningPanel';
import { CatchupDispatch } from './CatchupDispatch';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sessionBalance } from '@/lib/productionLearning';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DemoNotebook } from './demo/DemoNotebook';
import { ReviewInbox } from './ReviewInbox';
import { Progress } from '@/components/ui/progress';
import { ProductionTutorialVideo } from './ProductionTutorialVideo';

export function ProductionInstructorDashboard() {
  const { session } = useAuth();
  const demo = useProductionDemo();
  const base = demo ? '/production/showcase/instructor' : '/instructor/production';
  const instructorId = demo ? undefined : session?.user.id;
  const { students, refetch } = useInstructorStudentsSimple(instructorId);
  const { enrollments = [], modules = [], completions = [], attendance = [], isLoading, error, save, saving } = useProduction();
  const [adding, setAdding] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [level, setLevel] = useState('novice');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [selected, setSelected] = useState<ProductionEnrollment | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [catchup, setCatchup] = useState<ProductionEnrollment | null>(null);
  const { submissions = [], packages = [], intakes = [] } = useProductionLearning();
  const {data: productionProfiles = []} = useQuery({queryKey:['production-profiles',enrollments.map(e=>e.student_id)],enabled:enrollments.length>0 && !demo,queryFn:async()=>{const r=await supabase.from('profiles').select('id,first_name,last_name').in('id',enrollments.map(e=>e.student_id));if(r.error)throw r.error;return r.data??[];}});
  const date = format(new Date(), 'yyyy-MM-dd');
  const today = format(new Date(), 'EEEE').toLowerCase();
  const todayEnrollments = enrollments.filter(item => item.class_day?.toLowerCase().replace(/s$/, '') === today);
  const published = modules.filter(module => !module.is_draft);
  const liveRecentNotes = students.filter(student => enrollments.some(item => item.student_id === student.id)).flatMap(student => (student.notes ?? []).map(note => ({ ...note, studentName: student.name, studentId: student.id }))).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  const recentNotes = demo ? demo.state.notes.slice(0,4).map(n=>({...n,studentName:demo.state.students.find(s=>s.id===n.studentId)?.name??'Student',title:''})) : liveRecentNotes;
  const name = (id: string) => { if(demo)return demo.state.students.find(s=>s.id===id)?.name??'Student'; const profile=productionProfiles.find(p=>p.id===id);return profile?`${profile.first_name??''} ${profile.last_name??''}`.trim():students.find(student => student.id === id)?.name ?? 'Student'; };
  const summary = (item: ProductionEnrollment) => moduleSummary(published, completions.filter(completion => completion.enrollment_id === item.id).map(completion => completion.module_id), item.level);
  const available = students.filter(student => !enrollments.some(item => item.student_id === student.id));
  if (isLoading) return <p className="py-8 text-muted-foreground">Loading Music Production…</p>;
  if (error) return <Alert variant="destructive"><AlertDescription>Music Production could not be loaded. Please reopen this page.</AlertDescription></Alert>;
  return <div className="space-y-6">
    <header className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-2xl font-bold flex gap-2 items-center"><AudioLines className="h-6 w-6 text-primary" />Music Production</h1><p className="text-muted-foreground">{format(new Date(), 'MM/dd/yyyy')} · Instructor dashboard</p></div><div className="flex flex-wrap gap-2"><ProductionTutorialVideo role="instructor"/><Button asChild variant="outline"><Link to={`${base}/curriculum`}><BookOpen className="mr-2 h-4 w-4"/>Curriculum</Link></Button></div></header>
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">{[
      { label: 'Active students', value: enrollments.length, icon: AudioLines },
      { label: "Today's sessions", value: todayEnrollments.length, icon: CalendarDays },
      { label: 'Modules completed', value: completions.filter(item => enrollments.some(enrollment => enrollment.id === item.enrollment_id)).length, icon: CheckCircle2 },
    ].map(item => <Card key={item.label}><CardContent className="p-5 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-3xl font-bold mt-2">{item.value}</p></div><item.icon className="h-8 w-8 text-primary" /></CardContent></Card>)}</section>
    <ReviewInbox studentName={name} />
    <section className="space-y-3"><h2 className="text-lg font-semibold">Today's Attendance</h2>{!todayEnrollments.length && <p className="py-6 border-y text-muted-foreground text-sm">No production sessions scheduled today.</p>}{todayEnrollments.map(item => {
      const status = attendance.find(record => record.enrollment_id === item.id && record.class_date === date)?.status;
      return <div key={item.id} className="border rounded-md p-4 flex flex-wrap gap-3 items-center"><div className="flex-1 min-w-40"><Button variant="link" className="p-0 h-auto text-foreground" onClick={() => setSelected(item)}>{name(item.student_id)}<ArrowUpRight className="h-4 w-4 ml-1" /></Button><p className="text-sm text-muted-foreground">{productionLevelLabel(item.level)} · {item.class_time || 'Time not set'}</p></div><div className="flex gap-2">{(['present','absent'] as const).map(value => <Button key={value} size="sm" disabled={saving} variant={status === value ? value === 'absent' ? 'destructive' : 'default' : 'outline'} onClick={async () => { await save({ kind: 'attendance', enrollmentId: item.id, date, status: value }); if (value === 'absent') setCatchup(item); }}>{value === 'present' ? 'Present' : 'Absent'}</Button>)}</div></div>;
    })}</section>
    <section className="space-y-3"><div className="flex flex-wrap gap-2 items-center justify-between"><h2 className="text-lg font-semibold">Student Roadmaps</h2><Button variant="outline" size="sm" asChild><Link to={`${base}/curriculum`}><BookOpen className="h-4 w-4 mr-2" />Curriculum</Link></Button></div>{!enrollments.length && <div className="border-y py-8 text-muted-foreground text-center"><AudioLines className="h-9 w-9 mx-auto mb-2" /><p>No production students enrolled yet.</p></div>}<div className="grid grid-cols-1 md:grid-cols-3 gap-6">{enrollments.map(item => { const progress = summary(item); return <Card key={item.id}><CardContent className="p-5 space-y-4"><div className="flex justify-between gap-2"><div><h3 className="font-semibold break-words">{name(item.student_id)}</h3><Badge variant="outline" className="mt-2">{productionLevelLabel(item.level)}</Badge><p className="text-xs text-muted-foreground mt-2">{intakes.find(i=>i.enrollment_id===item.id)?.daw || "DAW not recorded"}</p></div><Button size="icon" variant="outline" aria-label={`Open ${name(item.student_id)} roadmap`} onClick={() => setSelected(item)}><ArrowUpRight className="h-4 w-4" /></Button></div><div className="space-y-2"><Progress value={progress.total ? progress.completed / progress.total * 100 : 0} className="h-1.5" /><p className="text-sm font-medium">{progress.completed} of {progress.total} modules complete</p><p className="text-sm text-muted-foreground mt-1">{progress.next ? `Next: ${progress.next.title}` : progress.total ? 'Current modules complete' : 'Awaiting published curriculum'}</p></div><div className="flex flex-wrap gap-2">{submissions.some(s=>s.enrollment_id===item.id&&s.status==='pending_review')&&<Badge variant="outline">Bounce pending</Badge>}{item.level==='advanced_plus'&&sessionBalance(packages.filter(p=>p.enrollment_id===item.id),attendance.filter(a=>a.enrollment_id===item.id)).low&&<Badge variant="destructive">Renewal due</Badge>}</div><p className="text-xs text-muted-foreground capitalize">{item.class_day || 'Unscheduled'} · {item.class_time || 'Time not set'}</p><div className="flex gap-2"><Button className="flex-1" size="sm" variant="outline" onClick={() => setProfileId(item.student_id)}><FileText className="h-4 w-4 mr-1" />Notes & Tasks</Button><Button size="icon" variant="outline" asChild aria-label={`Message ${name(item.student_id)}`}><Link to={`${base}/messages?to=${item.student_id}`}><MessageSquare className="h-4 w-4" /></Link></Button></div></CardContent></Card>; })}</div></section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Recent Student Notes</h2><div className="divide-y border-y">{recentNotes.length ? recentNotes.map(note => <div key={note.id} className="py-3"><Button className="p-0 h-auto" variant="link" onClick={() => setProfileId(note.studentId)}>{note.studentName}<ArrowUpRight className="h-4 w-4 ml-1" /></Button><p className="text-sm text-muted-foreground line-clamp-2 mt-1">{note.title || note.content}</p></div>) : <p className="py-6 text-sm text-muted-foreground">No production student notes yet.</p>}</div></section>
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{selected ? name(selected.student_id) : ''} · Production</DialogTitle><DialogDescription>{selected ? productionLevelLabel(selected.level) : ''} roadmap</DialogDescription></DialogHeader>{selected && <div className="space-y-4"><div className="space-y-2"><Label>Production level</Label><Select value={selected.level} onValueChange={async value => { await save({ kind: 'enroll', value: { ...selected, level: value } }); setSelected({ ...selected, level: value }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRODUCTION_LEVELS.map(item => <SelectItem key={item} value={item}>{productionLevelLabel(item)}</SelectItem>)}</SelectContent></Select></div>{published.filter(module => module.level === selected.level).map(module => <div key={module.id} className="flex items-start gap-3 border-b pb-3"><Checkbox id={`complete-${module.id}`} disabled={saving} checked={completions.some(completion => completion.enrollment_id === selected.id && completion.module_id === module.id)} onCheckedChange={checked => save({ kind: 'complete', enrollmentId: selected.id, moduleId: module.id, complete: checked === true })} /><Label className="leading-5" htmlFor={`complete-${module.id}`}>{module.order_index}. {module.title}</Label></div>)}{!published.some(module => module.level === selected.level) && <p className="text-sm text-muted-foreground">No published modules for this level.</p>}{nextProductionLevel(selected.level) && <Button disabled={saving} className="w-full" onClick={async () => { const next = nextProductionLevel(selected.level); if (!next) return; await save({ kind: 'enroll', value: { ...selected, level: next } }); setSelected({ ...selected, level: next }); }}>Advance to {productionLevelLabel(nextProductionLevel(selected.level) ?? '')}<ArrowUpRight className="ml-2 h-4 w-4" /></Button>}<ProductionLearningPanel key={selected.id} enrollment={selected} staff/><Button variant="outline" className="w-full" onClick={() => { setProfileId(selected.student_id); setSelected(null); }}>Open Notes & Tasks</Button></div>}</DialogContent></Dialog>
    {demo ? <Dialog open={!!profileId} onOpenChange={open=>{if(!open)setProfileId(null);}}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{profileId ? name(profileId) : ''} · Notes & Tasks</DialogTitle><DialogDescription>Session notes and creative tasks</DialogDescription></DialogHeader>{profileId&&<DemoNotebook studentId={profileId} staff/>}</DialogContent></Dialog> : <InstructorStudentDetailDialog program="production" open={!!profileId} onOpenChange={open => { if (!open) setProfileId(null); }} student={(() => { const student = students.find(student => student.id === profileId); const enrollment = enrollments.find(item => item.student_id === profileId); return student && enrollment ? { ...student, level: productionLevelLabel(enrollment.level), classDay: enrollment.class_day ?? undefined, classTime: enrollment.class_time ?? undefined } : null; })()} instructorId={instructorId} refetch={refetch} />}
    {catchup&&<CatchupDispatch enrollmentId={catchup.id} level={catchup.level} date={date} onClose={()=>setCatchup(null)}/>}
  </div>;
}