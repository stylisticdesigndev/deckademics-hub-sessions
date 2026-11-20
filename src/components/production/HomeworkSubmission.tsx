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
export function HomeworkSubmission({enrollmentId,moduleId,blockId}:{enrollmentId:string;moduleId:string;blockId:string}) {
 const {session}=useAuth(); const {submissions=[],save,saving}=useProductionLearning();const [url,setUrl]=useState('');const [note,setNote]=useState('');const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);
 const previous=submissions.find(s=>s.enrollment_id===enrollmentId&&s.module_id===moduleId&&s.block_id===blockId);
 return <div className="space-y-3 border-l-2 border-primary pl-4">{previous&&<><Badge variant="outline">{previous.status==='pending_review'?'Pending Review':previous.status==='complete'?'Complete':'Changes Requested'}</Badge><ProductionMedia type="audio" url={previous.media_url} path={previous.storage_path}/>{previous.feedback&&<p className="text-sm">{previous.feedback}</p>}</>}{previous?.status!=='complete'&&<form className="space-y-3" onSubmit={async e=>{e.preventDefault();if(!session||(!file&&!safeMediaUrl(url)))return;setBusy(true);let path:string|undefined;try{if(file)path=await uploadProductionFile(file,session.user.id,true);await save({kind:'submission',value:{enrollment_id:enrollmentId,module_id:moduleId,block_id:blockId,media_url:file?'':safeMediaUrl(url),storage_path:path,student_note:note}});setUrl('');setNote('');setFile(null);}catch(err){if(path)await supabaseCleanup(path);toast.error(err instanceof Error?err.message:'Unable to submit.');}finally{setBusy(false);}}}><Input aria-label="Audio submission link" type="url" placeholder="SoundCloud, Dropbox, or Google Drive link" value={url} onChange={e=>{setUrl(e.target.value);setFile(null);}}/><Input key={file?.name??'empty'} aria-label="Upload audio submission" type="file" accept=".mp3,.wav" onChange={e=>{setFile(e.target.files?.[0]??null);setUrl('');}}/><Textarea aria-label="Submission note" placeholder="Note for your instructor" value={note} onChange={e=>setNote(e.target.value)}/><Button disabled={busy||saving||(!file&&!safeMediaUrl(url))}>{busy?'Submitting…':previous?'Resubmit for Review':'Submit for Review'}</Button></form>}</div>;
}
import { supabase } from '@/integrations/supabase/client';
async function supabaseCleanup(path:string){await supabase.storage.from('production-media').remove([path]);}