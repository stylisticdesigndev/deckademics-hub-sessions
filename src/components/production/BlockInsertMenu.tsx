import { useState } from 'react';
import { Type, Heading1, Video, AudioLines, FileText, ClipboardList, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { LessonBlock } from '@/lib/productionLearning';

export const BLOCK_TYPES = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'audio', label: 'Audio', icon: AudioLines },
  { type: 'file', label: 'File', icon: FileText },
  { type: 'homework', label: 'Homework', icon: ClipboardList },
] as const;

export function BlockInsertMenu({ onInsert, compact = false, open, onOpenChange }: {
  onInsert: (type: LessonBlock['type']) => void; compact?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const setOpen = (value: boolean) => { setLocalOpen(value); onOpenChange?.(value); if (!value) setSearch(''); };
  return <Popover open={open ?? localOpen} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button type="button" variant="ghost" size={compact ? 'icon' : 'default'} className={compact ? 'h-8 w-8 text-muted-foreground' : 'justify-start px-2 text-muted-foreground'} aria-label="Add block" title="Add block"><Plus className="h-4 w-4" />{!compact && <span className="ml-2">Add block</span>}</Button></PopoverTrigger>
    <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] p-2">
      <div className="flex items-center gap-2 border-b px-2 pb-2"><Search className="h-4 w-4 text-muted-foreground" /><Input autoFocus aria-label="Search blocks" placeholder="Search blocks…" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <p className="px-2 pb-1 pt-3 text-xs font-medium text-muted-foreground">{search ? 'Results' : 'Blocks'}</p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-1">{BLOCK_TYPES.filter(item => item.label.toLowerCase().includes(search.toLowerCase())).map(({ type, label, icon: Icon }) => <Button key={type} type="button" variant="ghost" className="h-11 justify-start px-2 font-normal" onClick={() => { onInsert(type); setOpen(false); }}><Icon className="mr-3 h-5 w-5 text-muted-foreground" />{label}</Button>)}</div>
      {!BLOCK_TYPES.some(item => item.label.toLowerCase().includes(search.toLowerCase())) && <p className="px-2 py-4 text-sm text-muted-foreground">No blocks found.</p>}
    </PopoverContent>
  </Popover>;
}