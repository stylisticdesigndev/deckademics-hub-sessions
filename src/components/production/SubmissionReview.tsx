import { useState } from 'react';
import { Check, MessageSquare, RotateCcw } from 'lucide-react';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import type { Database } from '@/integrations/supabase/types';
import { ProductionMedia } from './ProductionMedia';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTimeUS } from '@/lib/utils';

type Submission = Database['public']['Tables']['production_submissions']['Row'];
export function SubmissionReview({ submission: s, title, staff = false, version }: { submission: Submission; title: string; staff?: boolean; version?: number }) {
  const { save, saving } = useProductionLearning();
  const [feedback, setFeedback] = useState(s.feedback);
  const [failure, setFailure] = useState(false);
  const review = async (status: 'complete' | 'changes_requested') => {
    setFailure(false);
    try { await save({ kind: 'review', id: s.id, status, feedback }); } catch { setFailure(true); }
  };
  return <article className="space-y-4 min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold break-words">{title}</h3><p className="text-xs text-muted-foreground mt-1">{version ? `Bounce ${version} · ` : ''}{formatDateTimeUS(s.created_at)}</p></div><Badge variant={s.status === 'complete' ? 'default' : 'outline'} className="shrink-0">{s.status === 'pending_review' ? 'Pending Review' : s.status === 'complete' ? 'Complete' : 'Changes Requested'}</Badge></div>
    <ProductionMedia type="audio" url={s.media_url} path={s.storage_path} filename={title} />
    {s.student_note && <div className="border-l-2 border-border pl-3"><p className="text-xs text-muted-foreground mb-1">Student note</p><p className="text-sm whitespace-pre-wrap break-words">{s.student_note}</p></div>}
    {staff ? <div className="space-y-3"><Textarea aria-label="Homework feedback" placeholder="Share feedback on this bounce…" rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} /><div className="flex flex-wrap gap-2"><Button disabled={saving} onClick={() => void review('complete')}><Check className="h-4 w-4 mr-2" />Approve</Button><Button variant="outline" disabled={saving} onClick={() => void review('changes_requested')}><RotateCcw className="h-4 w-4 mr-2" />Request Changes</Button></div>{failure && <p className="text-sm text-destructive">Review could not be saved. Your feedback is still here.</p>}</div> : s.feedback && <div className="bg-primary/5 border-l-2 border-primary p-4"><p className="text-xs font-medium text-primary flex items-center gap-2 mb-2"><MessageSquare className="h-3 w-3" />Mentor feedback</p><p className="text-sm whitespace-pre-wrap break-words">{s.feedback}</p></div>}
  </article>;
}