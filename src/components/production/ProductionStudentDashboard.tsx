import { Link } from 'react-router-dom';
import { AudioLines, BookOpen, CheckCircle2, CalendarDays } from 'lucide-react';
import { useProduction } from '@/hooks/useProduction';
import { lessonBlocks } from '@/lib/productionLearning';
import { productionLevelLabel, moduleSummary } from '@/lib/production';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { useAuth } from '@/providers/AuthProvider';
import { ProductionLearningPanel } from './ProductionLearningPanel';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DemoNotebook } from './demo/DemoNotebook';
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
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold flex gap-2 items-center"><AudioLines className="h-6 w-6 text-primary" />Music Production</h1><p className="text-muted-foreground">{productionLevelLabel(enrollment.level)}</p></header><section className="grid md:grid-cols-3 gap-6">{[{ label: 'Modules complete', value: `${roadmap.completed} / ${roadmap.total}`, icon: CheckCircle2 }, { label: 'Class day', value: enrollment.class_day ? enrollment.class_day.charAt(0).toUpperCase()+enrollment.class_day.slice(1) : 'Not scheduled', icon: CalendarDays }, { label: 'Class time', value: enrollment.class_time || 'Not scheduled', icon: AudioLines }].map(item => <Card key={item.label}><CardContent className="p-5"><item.icon className="h-5 w-5 text-primary mb-3" /><p className="text-sm text-muted-foreground">{item.label}</p><p className="font-semibold mt-1">{item.value}</p></CardContent></Card>)}</section><section className="space-y-3 border-y py-6"><h2 className="text-lg font-semibold">{roadmap.next ? `Next: ${roadmap.next.title}` : 'Your Roadmap'}</h2><p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.next ? (roadmap.next.homework_prompt || lessonBlocks(roadmap.next.blocks).find(b=>b.type==='homework')?.content || roadmap.next.description) : (roadmap.total ? 'Your current modules are complete.' : 'Your instructor is preparing your curriculum.')}</p><Button asChild variant="outline"><Link to={curriculumPath}><BookOpen className="h-4 w-4 mr-2" />View Curriculum</Link></Button></section>{packets.length>0&&<section className="space-y-3"><h2 className="text-lg font-semibold">Catch-Up Packets</h2>{packets.map(c=><div key={c.id} className="border-b py-3"><p className="font-medium">{modules.find(m=>m.id===c.module_id)?.title}</p><p className="text-sm whitespace-pre-wrap">{c.note}</p><Button asChild variant="link"><Link to={curriculumPath}>Open Lesson</Link></Button></div>)}</section>}<ProductionLearningPanel enrollment={enrollment}/>{demo ? <DemoNotebook studentId={demo.studentId}/> : <NotesSection studentId={session?.user.id} />}</div>;
}