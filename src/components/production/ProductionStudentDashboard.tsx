import { Link } from 'react-router-dom';
import { AudioLines, BookOpen, CheckCircle2, CalendarDays, ArrowRight, Clock, MessageSquare } from 'lucide-react';
import { useProduction } from '@/hooks/useProduction';
import { lessonBlocks } from '@/lib/productionLearning';
import { productionLevelLabel, moduleSummary } from '@/lib/production';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { useAuth } from '@/providers/AuthProvider';
import { ProductionLearningPanel } from './ProductionLearningPanel';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DemoNotebook } from './demo/DemoNotebook';
import { ProductionTutorialVideo } from './ProductionTutorialVideo';
export function ProductionStudentDashboard() {
  const { session } = useAuth();
  const demo = useProductionDemo();
  const curriculumPath = demo ? '/production/showcase/student/curriculum' : '/student/production/curriculum';
  const { catchups = [] } = useProductionLearning();
  const { enrollments = [], modules = [], completions = [], isLoading, error } = useProduction();
  if (isLoading) return <p className="text-muted-foreground py-8">Loading Music Production…</p>;
  if (error) return <p className="text-destructive">Music Production could not be loaded.</p>;
  const enrollment = enrollments[0];
  if (!enrollment) return <section className="space-y-3 py-6"><h1 className="text-2xl font-bold">Music Production</h1><p className="text-muted-foreground">No active production enrollment.</p></section>;
  const roadmap = moduleSummary(modules, completions.filter(item => item.enrollment_id === enrollment.id).map(item => item.module_id), enrollment.level);
  const packets = catchups.filter(c=>c.enrollment_id===enrollment.id);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold flex items-center gap-2"><AudioLines className="h-6 w-6 text-primary"/>Music Production</h1><p className="text-muted-foreground mt-1">Your learning workspace</p></div><div className="flex flex-wrap items-center gap-3"><Badge variant="outline">{productionLevelLabel(enrollment.level)}</Badge><ProductionTutorialVideo role="student"/></div></header>
    {packets.length > 0 && <section className="border-l-2 border-primary bg-primary/5 p-5 space-y-4"><h2 className="text-sm font-semibold text-primary flex items-center gap-2"><MessageSquare className="h-4 w-4"/>Session recaps from your instructor</h2>{packets.map(c=><div key={c.id} className="space-y-2"><h3 className="font-semibold">{modules.find(m=>m.id===c.module_id)?.title || 'Catch-Up Packet'}</h3><p className="text-sm whitespace-pre-wrap text-muted-foreground">{c.note}</p><Button asChild variant="outline" size="sm"><Link to={`${curriculumPath}?lesson=${c.module_id}`}>Open Packet<ArrowRight className="ml-2 h-4 w-4"/></Link></Button></div>)}</section>}
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">{[{label:'Lessons complete',value:`${roadmap.completed} / ${roadmap.total}`,icon:CheckCircle2},{label:'Class day',value:enrollment.class_day ? enrollment.class_day.charAt(0).toUpperCase()+enrollment.class_day.slice(1) : 'Not scheduled',icon:CalendarDays},{label:'Class time',value:enrollment.class_time || 'Not scheduled',icon:Clock}].map(item=><Card key={item.label}><CardContent className="p-5 flex items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-lg font-semibold mt-2">{item.value}</p></div><item.icon className="h-6 w-6 text-primary shrink-0"/></CardContent></Card>)}</section>
    <section className="border-y py-6 space-y-4"><p className="text-xs text-primary font-medium">CONTINUE LEARNING</p><div className="flex flex-wrap justify-between gap-4 items-start"><div className="min-w-0 flex-1"><h2 className="text-xl font-semibold break-words">{roadmap.next?.title || 'Your Roadmap'}</h2><p className="text-sm text-muted-foreground mt-2">{roadmap.next?.description || (roadmap.total ? 'Your current lessons are complete.' : 'Your instructor is preparing your lessons.')}</p></div><Button asChild><Link to={roadmap.next ? `${curriculumPath}?lesson=${roadmap.next.id}` : curriculumPath}><BookOpen className="mr-2 h-4 w-4"/>{roadmap.next ? 'Open Lesson' : 'View Lessons'}<ArrowRight className="ml-2 h-4 w-4"/></Link></Button></div><Progress className="h-1.5" value={roadmap.total ? roadmap.completed/roadmap.total*100 : 0}/></section>
    <ProductionLearningPanel enrollment={enrollment}/>
    {demo ? <DemoNotebook studentId={demo.studentId}/> : <NotesSection studentId={session?.user.id}/>}
  </div>;
}
