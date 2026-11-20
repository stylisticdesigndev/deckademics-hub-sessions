import { useState } from 'react';
import { Inbox, CheckCircle2, Search } from 'lucide-react';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { useProduction } from '@/hooks/useProduction';
import { SubmissionReview } from './SubmissionReview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ReviewInbox({ studentName }: { studentName: (id: string) => string }) {
  const { submissions = [], isLoading, error } = useProductionLearning();
  const { enrollments = [], modules = [] } = useProduction();
  const [mode, setMode] = useState('pending_review');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const label = (id: string) => { const e = enrollments.find(e => e.id === id); return e ? studentName(e.student_id) : 'Student'; };
  const list = submissions.filter(s => enrollments.some(e => e.id === s.enrollment_id) && (mode === 'all' || s.status === mode) && `${label(s.enrollment_id)} ${modules.find(m => m.id === s.module_id)?.title ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const active = list.find(s => s.id === selected) ?? list[0];
  return <section className="space-y-4 border-y py-6">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold flex items-center gap-2"><Inbox className="h-5 w-5 text-primary" />Review Inbox</h2><span className="text-xs text-muted-foreground">{submissions.filter(s => s.status === 'pending_review' && enrollments.some(e => e.id === s.enrollment_id)).length} pending</span></div>
    <div className="flex flex-wrap justify-between gap-3"><div className="flex flex-wrap gap-1" role="group" aria-label="Review filters">{[{ id: 'pending_review', label: 'Pending' }, { id: 'changes_requested', label: 'Revisions' }, { id: 'all', label: 'All' }].map(m => <Button key={m.id} size="sm" variant={mode === m.id ? 'default' : 'ghost'} onClick={() => setMode(m.id)}>{m.label}</Button>)}</div><div className="relative w-full sm:w-56"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search reviews" placeholder="Search reviews…" value={query} onChange={e => setQuery(e.target.value)} /></div></div>
    {isLoading ? <p className="py-6 text-muted-foreground">Loading reviews…</p> : error ? <p className="text-destructive">Reviews could not be loaded.</p> : active ? <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6"><div className="space-y-1">{list.map(s => <Button key={s.id} variant="ghost" className={`h-auto min-h-16 py-3 w-full text-left justify-start ${active.id === s.id ? 'bg-primary/10 text-primary hover:bg-primary/15' : ''}`}  onClick={() => setSelected(s.id)}><span className="min-w-0"><span className="block font-semibold whitespace-normal">{label(s.enrollment_id)}</span><span className="block mt-1 text-xs text-muted-foreground whitespace-normal">{modules.find(m => m.id === s.module_id)?.title || 'Homework bounce'}</span></span></Button>)}</div><div className="lg:border-l lg:pl-6 min-w-0"><SubmissionReview key={active.id + active.updated_at} submission={active} title={`${label(active.enrollment_id)} · ${modules.find(m => m.id === active.module_id)?.title || 'Homework'}`} staff /></div></div> : <div className="py-8 flex items-center gap-3 text-muted-foreground"><CheckCircle2 className="h-7 w-7 text-primary" /><p className="text-sm">{query ? 'No matching reviews.' : mode === 'pending_review' ? 'You’re all caught up. No bounces awaiting review.' : 'No submissions in this view.'}</p></div>}
  </section>;
}