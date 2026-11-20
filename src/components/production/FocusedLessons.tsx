import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight, List, Upload } from 'lucide-react';
import { useProduction, type ProductionEnrollment, type ProductionModule } from '@/hooks/useProduction';
import { lessonBlocks } from '@/lib/productionLearning';
import { LessonBlocks } from './LessonBlocks';
import { HomeworkSubmission } from './HomeworkSubmission';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export function FocusedLessons({ modules, enrollment }: { modules: ProductionModule[]; enrollment: ProductionEnrollment }) {
  const { completions = [] } = useProduction();
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [homework, setHomework] = useState(false);
  const completed = (id: string) => completions.some(c => c.enrollment_id === enrollment.id && c.module_id === id);
  const ordered = [...modules].filter(m => !m.is_draft).sort((a, b) => a.order_index - b.order_index);
  const active = ordered.find(m => m.id === params.get('lesson')) ?? ordered.find(m => !completed(m.id)) ?? ordered[0];
  if (!active) return null;
  const index = ordered.indexOf(active);
  const blocks = lessonBlocks(active.blocks);
  const assignments = blocks.filter(b => b.type === 'homework');
  const choose = (id: string) => { setParams({ lesson: id }); setDrawer(false); setHomework(false); };
  const navigation = <nav aria-label="Lesson syllabus" className="space-y-1"><p className="text-xs text-muted-foreground pb-3">{ordered.filter(m => completed(m.id)).length} / {ordered.length} lessons complete</p>{ordered.map((m, i) => <Button key={m.id} variant="ghost" className={`w-full h-auto min-h-14 justify-start gap-3 text-left py-3 ${active.id === m.id ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}`}  onClick={() => choose(m.id)} aria-current={active.id === m.id ? 'page' : undefined}>{completed(m.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <span className="text-xs tabular-nums text-muted-foreground w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>}<span className="whitespace-normal break-words text-sm">{m.title}</span></Button>)}</nav>;
  return <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start border-t pt-6">
    <aside className="hidden lg:block sticky top-6"><h2 className="font-semibold flex items-center gap-2 mb-4"><BookOpen className="h-4 w-4" />Your lessons</h2>{navigation}</aside>
    <article className="min-w-0 space-y-6 lg:border-l lg:pl-8">
      <div className="flex flex-wrap gap-2 items-center justify-between"><Button className="lg:hidden" variant="outline" size="sm" onClick={() => setDrawer(true)}><List className="h-4 w-4 mr-2" />Lessons · {index + 1} / {ordered.length}</Button><p className="text-xs text-muted-foreground">Lesson {index + 1} of {ordered.length}</p>{completed(active.id) && <Badge><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>}</div>
      <header><h2 className="text-2xl font-bold break-words">{active.title}</h2><p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{active.description}</p></header>
      <LessonBlocks blocks={blocks.filter(b => b.type !== 'homework')} />
      {!blocks.length && <p className="whitespace-pre-wrap leading-7">{active.lesson_outline}</p>}
      {(assignments.length > 0 || active.homework_prompt) && <section className="border-y py-5 space-y-3"><div className="flex items-start gap-3"><Upload className="h-5 w-5 text-primary shrink-0 mt-1" /><div><h3 className="font-semibold">Your assignment</h3><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{assignments[0]?.content || active.homework_prompt}</p></div></div><Button onClick={() => setHomework(true)}><Upload className="h-4 w-4 mr-2" />Open Homework</Button></section>}
      <footer className="flex justify-between gap-3 border-t pt-4"><Button variant="outline" disabled={index === 0} onClick={() => { const m = ordered[index - 1]; if (m) choose(m.id); }}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button><Button variant="outline" disabled={index === ordered.length - 1} onClick={() => { const m = ordered[index + 1]; if (m) choose(m.id); }}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button></footer>
    </article>
    <Sheet open={drawer} onOpenChange={setDrawer}><SheetContent side="left" className="w-full sm:max-w-sm overflow-y-auto"><SheetHeader className="mb-6"><SheetTitle>Your lessons</SheetTitle><SheetDescription>Music Production</SheetDescription></SheetHeader>{navigation}</SheetContent></Sheet>
    <Sheet open={homework} onOpenChange={setHomework}><SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto"><SheetHeader className="mb-6"><SheetTitle>Homework</SheetTitle><SheetDescription>{active.title}</SheetDescription></SheetHeader><div className="space-y-6">{assignments.length ? assignments.map(b => <section key={b.id} className="space-y-4"><p className="text-sm whitespace-pre-wrap">{b.content}</p><HomeworkSubmission enrollmentId={enrollment.id} moduleId={active.id} blockId={b.id} /></section>) : <><p className="text-sm">{active.homework_prompt}</p><HomeworkSubmission enrollmentId={enrollment.id} moduleId={active.id} blockId="legacy-homework" /></>}</div></SheetContent></Sheet>
  </div>;
}