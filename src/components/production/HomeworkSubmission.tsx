import { useState } from 'react';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { useAuth } from '@/providers/AuthProvider';
import { uploadProductionFile } from '@/lib/productionUpload';
import { safeMediaUrl } from '@/lib/productionLearning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ProductionMedia } from './ProductionMedia';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { Upload, Link2, Send, Music2 } from 'lucide-react';
import { SubmissionReview } from './SubmissionReview';
export function HomeworkSubmission({enrollmentId,moduleId,blockId}:{enrollmentId:string;moduleId:string;blockId:string}) {
 const demo = useProductionDemo();
 const {session}=useAuth(); const {submissions=[],save,saving}=useProductionLearning();const [url,setUrl]=useState('');const [note,setNote]=useState('');const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);
 const previous=submissions.find(s=>s.enrollment_id===enrollmentId&&s.module_id===moduleId&&s.block_id===blockId);
 const [method,setMethod]=useState('file');
 const history=submissions.filter(s=>s.enrollment_id===enrollmentId&&s.module_id===moduleId&&s.block_id===blockId);
 return <div className="space-y-5">{previous&&<SubmissionReview key={previous.id} submission={previous} title="Your latest bounce" version={history.length}/>} {previous?.status!=='complete'&&<form className="space-y-4 border-t pt-4" onSubmit={async e=>{e.preventDefault();const userId=demo?.studentId??session?.user.id;if(!userId||(!file&&!safeMediaUrl(url)))return;setBusy(true);let path:string|undefined;try{if(file)path=await uploadProductionFile(file,userId,true,!!demo);await save({kind:'submission',value:{enrollment_id:enrollmentId,module_id:moduleId,block_id:blockId,media_url:file?'':safeMediaUrl(url),storage_path:path,student_note:note}});setUrl('');setNote('');setFile(null);}catch(err){if(path&&!demo)await supabaseCleanup(path);toast.error(err instanceof Error?err.message:'Unable to submit.');}finally{setBusy(false);}}}>
 <div className="flex gap-1" role="group" aria-label="Submission source"><Button type="button" size="sm" variant={method==='file'?'default':'ghost'} onClick={()=>{setMethod('file');setUrl('');}}><Upload className="h-4 w-4 mr-2"/>Audio file</Button><Button type="button" size="sm" variant={method==='link'?'default':'ghost'} onClick={()=>{setMethod('link');setFile(null);}}><Link2 className="h-4 w-4 mr-2"/>Cloud link</Button></div>
 {method==='link'?<Input aria-label="Audio submission link" type="url" placeholder="SoundCloud, Dropbox, or Google Drive link" value={url} onChange={e=>{setUrl(e.target.value);setFile(null);}}/>:<div className="border border-dashed rounded-md p-5 space-y-3"><Music2 className="h-6 w-6 text-primary"/><p className="text-sm font-medium">{file?.name || 'MP3 or WAV · up to 25 MB'}</p><Input key={file?.name??'empty'} aria-label="Upload audio submission" type="file" accept=".mp3,.wav" onChange={e=>{setFile(e.target.files?.[0]??null);setUrl('');}}/></div>}
 <Textarea aria-label="Submission note" placeholder="What would you like feedback on?" value={note} onChange={e=>setNote(e.target.value)}/><Button disabled={busy||saving||(!file&&!safeMediaUrl(url))}><Send className="h-4 w-4 mr-2"/>{busy?'Submitting…':previous?'Resubmit for Review':'Submit for Review'}</Button></form>}
 {history.length>1&&<details className="border-t pt-4"><summary className="cursor-pointer text-sm text-muted-foreground">Previous bounces · {history.length-1}</summary><div className="space-y-6 mt-4">{history.slice(1).map((s,i)=><SubmissionReview key={s.id} submission={s} title="Previous bounce" version={history.length-i-1}/>)}</div></details>}
 </div>;
}
import { supabase } from '@/integrations/supabase/client';
async function supabaseCleanup(path:string){await supabase.storage.from('production-media').remove([path]);}