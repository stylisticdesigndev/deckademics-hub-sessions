import { useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, AudioLines } from 'lucide-react';
import { useProduction, type ProductionModule } from '@/hooks/useProduction';
import { useAuth } from '@/providers/AuthProvider';
import { PRODUCTION_LEVELS, productionLevelLabel } from '@/lib/production';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProductionCurriculum() {
  const { userData, session } = useAuth();
  const { modules = [], enrollments = [], completions = [], isLoading, error, save, saving } = useProduction();
  const [level, setLevel] = useState('novice');
  const [editing, setEditing] = useState<Partial<ProductionModule> | null>(null);
  const [deleting, setDeleting] = useState<ProductionModule | null>(null);
  const staff = userData.role === 'admin' || userData.role === 'instructor';
  const activeLevel = staff ? level : enrollments[0]?.level ?? level;
  const selected = modules.filter(module => module.level === activeLevel);
  const canEdit = (module: ProductionModule) => staff && (userData.role === 'admin' || !module.author_id || module.author_id === session?.user.id);
  if (isLoading) return <p className="text-muted-foreground py-8">Loading production curriculum…</p>;
  if (error) return <Alert variant="destructive"><AlertDescription>Production curriculum could not be loaded.</AlertDescription></Alert>;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><AudioLines className="h-6 w-6 text-primary" />Music Production Curriculum</h1><p className="text-muted-foreground">{productionLevelLabel(activeLevel)} · {selected.length} {selected.length === 1 ? "module" : "modules"}</p></div>
      {staff && <Button onClick={() => setEditing({ level, order_index: selected.reduce((max, module) => Math.max(max, module.order_index), 0) + 1, is_draft: true })}><Plus className="h-4 w-4 mr-2" />Add Module</Button>}
    </div>
    {staff && <Tabs value={level} onValueChange={setLevel}><TabsList className="flex h-auto w-full flex-wrap justify-start">{PRODUCTION_LEVELS.map(item => <TabsTrigger className="flex-1 min-h-10" key={item} value={item}>{productionLevelLabel(item)}</TabsTrigger>)}</TabsList></Tabs>}
    {selected.length === 0 && <div className="border-y py-12 text-center text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-3" />No published modules available.</div>}
    <div className="divide-y border-y">{selected.map(module => <article key={module.id} className="py-6 space-y-4">
      <div className="flex gap-3 items-start"><span className="h-9 w-9 shrink-0 bg-primary/10 text-primary rounded-md flex items-center justify-center font-semibold">{module.order_index}</span><div className="min-w-0 flex-1"><div className="flex gap-2 flex-wrap items-center"><h2 className="text-lg font-semibold break-words">{module.title}</h2>{module.is_draft && <Badge variant="outline">Draft</Badge>}{completions.some(item => item.module_id === module.id) && !staff && <Badge>Complete</Badge>}</div><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{module.description}</p></div>{canEdit(module) && <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label={`Edit ${module.title}`} title="Edit module" onClick={() => setEditing(module)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${module.title}`} title="Delete module" onClick={() => setDeleting(module)}><Trash2 className="h-4 w-4" /></Button></div>}</div>
      <div className="grid gap-4 sm:grid-cols-2 sm:pl-12"><div><h3 className="text-sm font-medium mb-1">Lesson outline</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{module.lesson_outline || 'Not added yet'}</p></div><div><h3 className="text-sm font-medium mb-1">Homework</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{module.homework_prompt || 'Not assigned yet'}</p></div></div>
    </article>)}</div>
    <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?.id ? 'Edit Module' : 'New Module'}</DialogTitle><DialogDescription>Music Production lesson and homework</DialogDescription></DialogHeader>{editing && <form className="space-y-4" onSubmit={async event => { event.preventDefault(); await save({ kind: 'module', value: { ...editing, title: editing.title?.trim() ?? '', level: editing.level ?? level } }); setEditing(null); }}>
      <div className="space-y-2"><Label htmlFor="production-title">Title</Label><Input required id="production-title" value={editing.title ?? ''} onChange={event => setEditing({ ...editing, title: event.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Level</Label><Select value={editing.level} onValueChange={value => setEditing({ ...editing, level: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRODUCTION_LEVELS.map(item => <SelectItem key={item} value={item}>{productionLevelLabel(item)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="production-order">Module order</Label><Input id="production-order" type="number" min="1" required value={editing.order_index ?? 1} onChange={event => setEditing({ ...editing, order_index: Number(event.target.value) })} /></div></div>
      {(['description', 'lesson_outline', 'homework_prompt'] as const).map(field => <div key={field} className="space-y-2"><Label htmlFor={`production-${field}`}>{field === 'description' ? 'Summary' : field === 'lesson_outline' ? 'Lesson outline' : 'Homework prompt'}</Label><Textarea id={`production-${field}`} value={editing[field] ?? ''} onChange={event => setEditing({ ...editing, [field]: event.target.value })} /></div>)}
      <div className="flex items-center gap-2"><Checkbox id="production-published" checked={!editing.is_draft} onCheckedChange={checked => setEditing({ ...editing, is_draft: checked !== true })} /><Label htmlFor="production-published">Published to students</Label></div><DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={saving || !editing.title?.trim()}>Save Module</Button></DialogFooter>
    </form>}</DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={open => { if (!open) setDeleting(null); }}><DialogContent><DialogHeader><DialogTitle>Delete module?</DialogTitle><DialogDescription>This removes {deleting?.title} and its completion records.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={saving} onClick={async () => { if (!deleting) return; await save({ kind: 'delete-module', id: deleting.id }); setDeleting(null); }}>Delete Module</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}