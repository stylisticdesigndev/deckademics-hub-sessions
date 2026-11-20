import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Pencil, Trash2, AudioLines, ArrowUp, ArrowDown, FileText, ChevronRight, ArrowLeft, Check, MoreHorizontal } from 'lucide-react';
import { lessonBlocks } from '@/lib/productionLearning';
import { LessonBlocks } from './LessonBlocks';
import { HomeworkSubmission } from './HomeworkSubmission';
import { useProduction, type ProductionModule } from '@/hooks/useProduction';
import { useAuth } from '@/providers/AuthProvider';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DEMO_INSTRUCTOR_ID } from '@/lib/productionDemoState';
import { PRODUCTION_LEVELS, productionLevelLabel } from '@/lib/production';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FocusedLessons } from './FocusedLessons';

export function ProductionCurriculum() {
  const { userData, session } = useAuth();
  const demo = useProductionDemo();
  const role = demo?.role ?? userData.role;
  const userId = demo ? DEMO_INSTRUCTOR_ID : session?.user.id;
  const { modules = [], enrollments = [], completions = [], isLoading, error, save, saving } = useProduction();
  const [level, setLevel] = useState('novice');
  const [editing, setEditing] = useState<Partial<ProductionModule> | null>(null);
  const [deleting, setDeleting] = useState<ProductionModule | null>(null);
  const [search, setSearch] = useState('');
  const staff = role === 'admin' || role === 'instructor';
  const activeLevel = staff ? level : enrollments[0]?.level ?? level;
  const selected = modules.filter(module => module.level === activeLevel);
  const visible = selected.filter(module => module.title.toLowerCase().includes(search.toLowerCase()));
  const canEdit = (module: ProductionModule) => staff && (role === 'admin' || !module.author_id || module.author_id === userId);
  if (isLoading) return <p className="text-muted-foreground py-8">Loading production curriculum…</p>;
  if (error) return <Alert variant="destructive"><AlertDescription>Production curriculum could not be loaded.</AlertDescription></Alert>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><AudioLines className="h-6 w-6 text-primary" />Music Production Curriculum</h1><p className="text-muted-foreground">{productionLevelLabel(activeLevel)} · {selected.length} {selected.length === 1 ? "module" : "modules"}</p></div>
      {staff && <div className="flex flex-wrap gap-2">{!demo&&<Button asChild variant="outline"><Link to="/production/showcase/instructor"><AudioLines className="h-4 w-4"/>Sean’s Preview</Link></Button>}<Button onClick={() => setEditing({ level, order_index: selected.reduce((max, module) => Math.max(max, module.order_index), 0) + 1, is_draft: true })}><Plus className="h-4 w-4 mr-2" />Add Module</Button></div>}
    </div>
    {staff && <Tabs value={level} onValueChange={setLevel}><TabsList className="flex h-auto w-full flex-wrap justify-start">{PRODUCTION_LEVELS.map(item => <TabsTrigger className="flex-1 min-h-10" key={item} value={item}>{productionLevelLabel(item)}</TabsTrigger>)}</TabsList></Tabs>}
    {selected.length === 0 && <div className="border-y py-12 text-center text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-3" />No published modules available.</div>}
    {staff && <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 border-b pb-3"><p className="text-sm font-medium flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" />Lessons</p><Input aria-label="Search lessons" placeholder="Search lessons…" className="h-8 max-w-52 border-0 bg-transparent shadow-none" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div>{visible.map(module => <div key={module.id} className="group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/60">
        <Button variant="ghost" className="h-auto min-h-14 min-w-0 flex-1 justify-start gap-3 px-1 py-3 text-left" onClick={() => setEditing(module)} aria-label={`Edit ${module.title}`}>
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block whitespace-normal break-words font-medium">{module.title}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">Lesson {module.order_index} · {lessonBlocks(module.blocks).length} blocks</span></span><span className="hidden shrink-0 text-xs font-normal text-muted-foreground sm:block">{module.is_draft ? 'Draft' : 'Published'}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
        {canEdit(module) && <DropdownMenu><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions for ${module.title}`} className="h-9 w-9 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(module)}><Pencil className="mr-2 h-4 w-4" />Edit lesson</DropdownMenuItem>
          {[-1,1].map(direction => <DropdownMenuItem key={direction} disabled={saving || !selected[selected.indexOf(module)+direction]} onSelect={() => { const ids=selected.map(m=>m.id);const i=selected.indexOf(module);[ids[i],ids[i+direction]]=[ids[i+direction],ids[i]];void save({kind:'reorder',ids}); }}>{direction === -1 ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />}{direction === -1 ? 'Move up' : 'Move down'}</DropdownMenuItem>)}
          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(module)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>}
      </div>)}</div>
      {visible.length === 0 && selected.length > 0 && <p className="py-6 text-sm text-muted-foreground">No matching lessons.</p>}
    </div>}
    {!staff && enrollments[0] && <FocusedLessons modules={selected} enrollment={enrollments[0]} />}
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[94dvh] sm:max-h-[94dvh] sm:w-[95vw] sm:max-w-6xl sm:rounded-lg [&>button]:hidden">
      <DialogHeader className="sr-only"><DialogTitle>{editing?.id ? 'Edit lesson' : 'New lesson'}</DialogTitle><DialogDescription>Music Production lesson editor</DialogDescription></DialogHeader>
      {editing && <form className="flex min-h-0 flex-1 flex-col" onSubmit={async event => { event.preventDefault(); try { await save({ kind: 'module', value: { ...editing, title: editing.title?.trim() ?? '', level: editing.level ?? level } }); setEditing(null); } catch { /* Keep unsaved lesson open. */ } }}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2"><Button type="button" size="icon" variant="ghost" aria-label="Close lesson" title="Back to curriculum" onClick={() => setEditing(null)}><ArrowLeft className="h-4 w-4" /></Button><span className="hidden text-sm text-muted-foreground sm:block">Curriculum</span><ChevronRight className="hidden h-3 w-3 text-muted-foreground sm:block" /><span className="truncate text-sm">{editing.title || 'Untitled'}</span></div>
          <Button type="submit" size="sm" disabled={saving || !editing.title?.trim()}><Check className="mr-2 h-4 w-4" />{saving ? 'Saving…' : 'Save'}</Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-10 sm:px-12 sm:pt-16">
            <FileText className="mb-6 h-10 w-10 text-muted-foreground" />
            <textarea required id="production-title" aria-label="Title" placeholder="Untitled" rows={1} ref={el => { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } }} value={editing.title ?? ''} onChange={event => setEditing({ ...editing, title: event.target.value })} className="mb-5 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-3xl font-bold leading-tight text-foreground placeholder:text-muted-foreground focus:outline-none md:text-4xl" />
            <div className="mb-8 space-y-2 border-b pb-5 text-sm">
              <div className="flex items-center gap-3"><Label className="w-20 shrink-0 text-muted-foreground">Level</Label><Select value={editing.level} onValueChange={value => setEditing({ ...editing, level: value })}><SelectTrigger aria-label="Lesson level" className="h-8 w-40 border-0 bg-transparent px-2 shadow-none"><SelectValue /></SelectTrigger><SelectContent>{PRODUCTION_LEVELS.map(item => <SelectItem key={item} value={item}>{productionLevelLabel(item)}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-center gap-3"><Label htmlFor="production-order" className="w-20 shrink-0 text-muted-foreground">Order</Label><Input id="production-order" type="number" min="1" required className="h-8 w-20 border-0 bg-transparent px-2 shadow-none" value={editing.order_index ?? 1} onChange={event => setEditing({ ...editing, order_index: Number(event.target.value) })} /></div>
              <div className="flex items-center gap-3"><span className="w-20 shrink-0 text-muted-foreground">Visibility</span><Checkbox id="production-published" checked={!editing.is_draft} onCheckedChange={checked => setEditing({ ...editing, is_draft: checked !== true })} /><Label htmlFor="production-published" className="font-normal">{editing.is_draft ? 'Draft' : 'Published to students'}</Label></div>
            </div>
            <LessonBlocks blocks={lessonBlocks(editing.blocks ?? (editing.id ? [{id:'legacy-lesson',type:'text',content:editing.lesson_outline??''},...(editing.homework_prompt?[{id:'legacy-homework',type:'homework',content:editing.homework_prompt}]:[])].filter(b=>b.content) : []))} onChange={blocks=>setEditing({...editing,blocks,lesson_outline:'',homework_prompt:''})}/>
          </div>
        </div>
      </form>}
    </DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Delete module?</DialogTitle><DialogDescription>This removes {deleting?.title} and its completion records.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={saving} onClick={async () => { if (!deleting) return; await save({ kind: 'delete-module', id: deleting.id }); setDeleting(null); }}>Delete Module</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}