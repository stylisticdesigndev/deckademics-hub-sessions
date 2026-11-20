import { AudioLines, Headphones, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
export function ProducerIdentity({ daw, hardware, genres, goals, experience }: { daw: string; hardware: string; genres: string; goals: string; experience: string }) {
  return <div className="grid md:grid-cols-3 gap-6 py-3">
    <div className="space-y-3"><AudioLines className="h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">Your sound</p><p className="font-semibold">{daw || 'DAW not recorded'}</p><div className="flex flex-wrap gap-2">{genres.split(/[,/]/).filter(g=>g.trim()).map(g=><Badge variant="outline" key={g}>{g.trim()}</Badge>)}</div></div>
    <div className="space-y-3"><Headphones className="h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">Your setup</p><p className="text-sm whitespace-pre-wrap break-words">{hardware || 'Not recorded'}</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{experience}</p></div>
    <div className="space-y-3"><Target className="h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">Creative goals</p><p className="text-sm whitespace-pre-wrap break-words">{goals || 'Not recorded'}</p></div>
  </div>;
}