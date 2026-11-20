import { useState } from 'react';
import { useProduction } from '@/hooks/useProduction';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
export function CatchupDispatch({enrollmentId,level,date,onClose}:{enrollmentId:string;level:string;date:string;onClose:()=>void}) {
 const {modules=[],completions=[]}=useProduction();const {save,saving}=useProductionLearning();const choices=modules.filter(m=>!m.is_draft&&m.level===level);const first=choices.find(m=>!completions.some(c=>c.enrollment_id===enrollmentId&&c.module_id===m.id));const [moduleId,setModuleId]=useState(first?.id??choices[0]?.id??'');const [note,setNote]=useState('');
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent><DialogHeader><DialogTitle>Send Catch-Up Packet?</DialogTitle><DialogDescription>Attendance has been saved as absent.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={async e=>{e.preventDefault();if(!moduleId)return;await save({kind:'catchup',value:{enrollment_id:enrollmentId,module_id:moduleId,class_date:date,note}});onClose();}}><Label>Lesson</Label><Select value={moduleId} onValueChange={setModuleId}><SelectTrigger><SelectValue placeholder="Choose published lesson"/></SelectTrigger><SelectContent>{choices.map(m=><SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent></Select>{!choices.length&&<p className="text-sm text-muted-foreground">No published lessons at this level.</p>}<Label htmlFor="catchup-note">Personal note (optional)</Label><Textarea id="catchup-note" value={note} onChange={e=>setNote(e.target.value)}/><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Not Now</Button><Button disabled={saving||!moduleId}>Send Packet</Button></DialogFooter></form></DialogContent></Dialog>;
}