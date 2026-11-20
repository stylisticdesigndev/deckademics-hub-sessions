import { Link } from 'react-router-dom';
import { AudioLines, BookOpen, CheckCircle2, CalendarDays } from 'lucide-react';
import { useProduction } from '@/hooks/useProduction';
import { productionLevelLabel, moduleSummary } from '@/lib/production';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotesSection } from '@/components/student/dashboard/NotesSection';
import { useAuth } from '@/providers/AuthProvider';
export function ProductionStudentDashboard() {
  const { session } = useAuth();
  const { enrollments = [], modules = [], completions = [], isLoading, error } = useProduction();
  if (isLoading) return <p className="text-muted-foreground py-8">Loading Music Production…</p>;
  if (error) return <p className="text-destructive">Music Production could not be loaded.</p>;
  const enrollment = enrollments[0];
  if (!enrollment) return <section className="space-y-3 py-6"><h1 className="text-2xl font-bold">Music Production</h1><p className="text-muted-foreground">No active production enrollment.</p></section>;
  const roadmap = moduleSummary(modules, completions.filter(item => item.enrollment_id === enrollment.id).map(item => item.module_id), enrollment.level);
  return <div className="space-y-6"><header><h1 className="text-2xl font-bold flex gap-2 items-center"><AudioLines className="h-6 w-6 text-primary" />Music Production</h1><p className="text-muted-foreground">{productionLevelLabel(enrollment.level)}</p></header><section className="grid md:grid-cols-3 gap-6">{[{ label: 'Modules complete', value: `${roadmap.completed} / ${roadmap.total}`, icon: CheckCircle2 }, { label: 'Class day', value: enrollment.class_day || 'Not scheduled', icon: CalendarDays }, { label: 'Class time', value: enrollment.class_time || 'Not scheduled', icon: AudioLines }].map(item => <Card key={item.label}><CardContent className="p-5"><item.icon className="h-5 w-5 text-primary mb-3" /><p className="text-sm text-muted-foreground">{item.label}</p><p className="font-semibold mt-1">{item.value}</p></CardContent></Card>)}</section><section className="space-y-3 border-y py-6"><h2 className="text-lg font-semibold">{roadmap.next ? `Next: ${roadmap.next.title}` : 'Your Roadmap'}</h2><p className="text-sm text-muted-foreground whitespace-pre-wrap">{roadmap.next?.homework_prompt || (roadmap.total ? 'Your current modules are complete.' : 'Your instructor is preparing your curriculum.')}</p><Button asChild variant="outline"><Link to="/student/curriculum"><BookOpen className="h-4 w-4 mr-2" />View Curriculum</Link></Button></section><NotesSection studentId={session?.user.id} /></div>;
}