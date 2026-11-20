import ReactMarkdown from 'react-markdown';
import { useState, useRef, useEffect } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Trash2, Upload, Loader2, Bold, Italic, List, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { type LessonBlock, moveItem } from '@/lib/productionLearning';
import { uploadProductionFile } from '@/lib/productionUpload';
import { useAuth } from '@/providers/AuthProvider';
import { ProductionMedia } from './ProductionMedia';
import { BlockInsertMenu, BLOCK_TYPES } from './BlockInsertMenu';
import { toast } from 'sonner';

export function LessonBlocks({ blocks, onChange }: { blocks: LessonBlock[]; onChange?: (blocks: LessonBlock[]) => void }) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [slashId, setSlashId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const textRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  useEffect(() => {
    const resize = () => { for (const el of Object.values(textRefs.current)) { if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } } };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const change = (index: number, patch: Partial<LessonBlock>) => onChange?.(blocks.map((b, i) => i === index ? { ...b, ...patch } : b));
  const insert = (index: number, type: LessonBlock['type']) => {
    const id = crypto.randomUUID();
    const next = [...blocks]; next.splice(index, 0, { id, type, content: '' }); onChange?.(next); setActiveId(id);
    requestAnimationFrame(() => textRefs.current[id]?.focus());
  };
  const format = (block: LessonBlock, index: number, prefix: string, suffix = '') => {
    const el = textRefs.current[block.id]; if (!el) return;
    const start = el.selectionStart; const end = el.selectionEnd;
    change(index, { content: block.content.slice(0, start) + prefix + block.content.slice(start, end) + suffix + block.content.slice(end) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + prefix.length, end + prefix.length); });
  };
  return <div className={onChange ? 'space-y-1 pb-16' : 'space-y-5'}>{blocks.map((block, index) => <div key={block.id} className={onChange ? 'group flex items-start gap-1 rounded-sm py-1' : 'space-y-3'}>
    {onChange && <div className="flex shrink-0 items-center pt-1 text-muted-foreground">
      <BlockInsertMenu compact open={slashId === block.id ? true : undefined} onOpenChange={open => { if (!open) setSlashId(null); }} onInsert={type => { if (slashId === block.id) { change(index, { type, content: '' }); setSlashId(null); } else insert(index, type); }} />
      <DropdownMenu><DropdownMenuTrigger asChild><Button type="button" size="icon" variant="ghost" className="h-8 w-6" title="Block actions" aria-label={`Block ${index + 1} actions`}><GripVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="start">
        <DropdownMenuLabel>Turn into</DropdownMenuLabel>{BLOCK_TYPES.map(({ type, label, icon: Icon }) => <DropdownMenuItem key={type} onSelect={() => change(index, { type })}><Icon className="mr-2 h-4 w-4" />{label}</DropdownMenuItem>)}<DropdownMenuSeparator />
        <DropdownMenuItem disabled={index === 0} onSelect={() => onChange(moveItem(blocks, index, -1))}><ArrowUp className="mr-2 h-4 w-4" />Move up</DropdownMenuItem>
        <DropdownMenuItem disabled={index === blocks.length - 1} onSelect={() => onChange(moveItem(blocks, index, 1))}><ArrowDown className="mr-2 h-4 w-4" />Move down</DropdownMenuItem>
        <DropdownMenuSeparator /><DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onChange(blocks.filter(b => b.id !== block.id))}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
      </DropdownMenuContent></DropdownMenu>
    </div>}
    <div className="min-w-0 flex-1">{onChange ? <>
      {['text', 'heading', 'homework'].includes(block.type) ? <div className={block.type === 'homework' ? 'border-l-2 border-primary pl-4' : ''}>
        {block.type === 'homework' && <p className="mb-1 text-xs font-medium text-primary">Homework</p>}
        {activeId === block.id && block.type !== 'heading' && <div className="flex w-fit items-center gap-0.5 rounded-md border bg-popover p-0.5 text-popover-foreground">
          {[{ icon: Bold, name: 'Bold', prefix: '**', suffix: '**' }, { icon: Italic, name: 'Italic', prefix: '_', suffix: '_' }, { icon: List, name: 'Bulleted list', prefix: '\n- ', suffix: '' }, { icon: Link2, name: 'Link', prefix: '[', suffix: '](https://)' }].map(({ icon: Icon, name, prefix, suffix }) => <Button key={name} type="button" size="icon" variant="ghost" className="h-8 w-8" title={name} aria-label={name} onMouseDown={e => e.preventDefault()} onClick={() => format(block, index, prefix, suffix)}><Icon className="h-4 w-4" /></Button>)}
        </div>}
        <Textarea ref={el => { textRefs.current[block.id] = el; if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } }} rows={1} aria-label={`${block.type} content`} placeholder={block.type === 'heading' ? 'Heading' : block.type === 'homework' ? 'Assignment prompt…' : 'Write something…'} value={block.content} className={`min-h-10 resize-none overflow-hidden rounded-none border-0 bg-transparent px-1 py-2 shadow-none focus-visible:ring-0 ${block.type === 'heading' ? 'text-2xl md:text-2xl font-semibold' : 'text-base md:text-base leading-7'}`} onFocus={() => setActiveId(block.id)} onChange={e => { change(index, { content: e.target.value }); if (e.target.value === '/') setSlashId(block.id); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && block.type === 'heading') { e.preventDefault(); insert(index + 1, 'text'); } }} />
      </div> : <div className="space-y-3 rounded-md border bg-muted/20 p-4">
        <p className="flex items-center gap-2 text-sm font-medium">{(() => { const Icon = BLOCK_TYPES.find(b => b.type === block.type)?.icon; return Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null; })()}{BLOCK_TYPES.find(b => b.type === block.type)?.label}</p>
        <Input type="url" aria-label="Media link" placeholder="Paste a link…" value={block.url ?? ''} onChange={e => change(index, { url: e.target.value, storage_path: undefined })} />
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-muted-foreground"><Upload className="h-4 w-4" />{uploading === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload file'}<input className="sr-only" type="file" disabled={!!uploading} accept={block.type === 'audio' ? '.mp3,.wav' : block.type === 'video' ? '.mp4,.webm' : '.pdf,.txt,.zip,.docx,.png,.jpg,.jpeg'} onChange={async e => { const file = e.target.files?.[0]; const id = session?.user.id; if (!file || !id) return; setUploading(block.id); try { const path = await uploadProductionFile(file, id); change(index, { storage_path: path, filename: file.name, url: '' }); } catch (err) { toast.error(err instanceof Error ? err.message : 'Upload failed.'); } finally { setUploading(null); } }} /></label>
        {(block.url || block.storage_path) && <ProductionMedia type={block.type} url={block.url} path={block.storage_path} filename={block.filename} />}
        <Input aria-label="Media caption" placeholder="Add a caption…" className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" value={block.content} onChange={e => change(index, { content: e.target.value })} />
      </div>}
    </> : block.type === 'heading' ? <h3 className="break-words text-xl font-semibold">{block.content}</h3> : block.type === 'text' || block.type === 'homework' ? <div className="prose prose-sm max-w-none break-words dark:prose-invert"><ReactMarkdown components={{ a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{block.content}</ReactMarkdown></div> : <><p className="text-sm font-medium">{block.content}</p><ProductionMedia type={block.type} url={block.url} path={block.storage_path} filename={block.filename} /></>}
    </div>
  </div>)}{onChange && <div className={blocks.length ? 'pl-14 pt-2' : 'pt-2'}><BlockInsertMenu onInsert={type => insert(blocks.length, type)} /></div>}</div>;
}
