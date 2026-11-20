import { useState } from 'react';
import { useProductionLearning } from '@/hooks/useProductionLearning';
import { useProduction, type ProductionEnrollment } from '@/hooks/useProduction';
import { sessionBalance } from '@/lib/productionLearning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SubmissionReview } from './SubmissionReview';
import { ProducerIdentity } from './ProducerIdentity';
import { SessionMeter } from './SessionMeter';
export function ProductionLearningPanel({enrollment,staff=false}:{enrollment:ProductionEnrollment;staff?:boolean}) {
 const {intakes=[],submissions=[],packages=[],save,saving,error}=useProductionLearning();const {attendance=[],modules=[]}=useProduction();
 const intake=intakes.find(i=>i.enrollment_id===enrollment.id);const [draft,setDraft]=useState({daw:'',hardware:'',genres:'',goals:'',experience:''});const [editing,setEditing]=useState(false);const [credits,setCredits]=useState('');const [packageNote,setPackageNote]=useState('');const [start,setStart]=useState(new Date().toLocaleDateString('en-CA'));const [feedback,setFeedback]=useState<Record<string,string>>({});
 const balance=sessionBalance(packages.filter(p=>p.enrollment_id===enrollment.id),attendance.filter(a=>a.enrollment_id===enrollment.id));
 if(error)return <p className="text-destructive">Learning records could not be loaded.</p>;
 return <div className="space-y-6">
 {enrollment.level==='advanced_plus'&&<section className="space-y-3 border-y py-4"><h3 className="font-semibold">Session Package</h3><SessionMeter balance={balance}/>{staff&&<form className="space-y-3" onSubmit={async e=>{e.preventDefault();await save({kind:'package',value:{enrollment_id:enrollment.id,sessions:Number(credits),start_date:start,note:packageNote}});setCredits('');setPackageNote('');}}><Label htmlFor={`credits-${enrollment.id}`}>Add session credits</Label><Input id={`credits-${enrollment.id}`} type="number" min="1" step="1" required value={credits} onChange={e=>setCredits(e.target.value)}/><Label>Package starts</Label><Input aria-label="Package start date" type="date" required value={start} onChange={e=>setStart(e.target.value)}/><Input aria-label="Package note" placeholder="Renewal note" value={packageNote} onChange={e=>setPackageNote(e.target.value)}/><Button disabled={saving}>Add / Renew Package</Button></form>}</section>}
 <section className="space-y-3"><div className="flex justify-between items-center"><h3 className="font-semibold">Producer Profile</h3>{staff&&<Button size="sm" variant="outline" onClick={()=>{setDraft({daw:intake?.daw??'',hardware:intake?.hardware??'',genres:intake?.genres??'',goals:intake?.goals??'',experience:intake?.experience??''});setEditing(true);}}>Edit Intake</Button>}</div>{editing?<form className="space-y-3" onSubmit={async e=>{e.preventDefault();await save({kind:'intake',value:{enrollment_id:enrollment.id,...draft}});setEditing(false);}}>{(['daw','hardware','genres','experience','goals'] as const).map(field=><div key={field}><Label htmlFor={`intake-${field}`}>{field==='daw'?'DAW':field.charAt(0).toUpperCase()+field.slice(1)}</Label><Textarea id={`intake-${field}`} value={draft[field]} onChange={e=>setDraft({...draft,[field]:e.target.value})}/></div>)}<Button disabled={saving}>Save Intake</Button><Button type="button" variant="ghost" onClick={()=>setEditing(false)}>Cancel</Button></form>:intake?<ProducerIdentity daw={intake.daw} hardware={intake.hardware} genres={intake.genres} goals={intake.goals} experience={intake.experience}/>:<p className="text-sm text-muted-foreground">Not completed yet.</p>}</section>
 <section className="space-y-3"><h3 className="font-semibold">Homework {staff?'Review':'Submissions'}</h3>{submissions.filter(s=>s.enrollment_id===enrollment.id).map((s,index,all)=><div key={s.id} className="border-b py-5"><SubmissionReview submission={s} title={modules.find(m=>m.id===s.module_id)?.title || 'Homework bounce'} staff={staff} version={all.filter(v=>v.module_id===s.module_id&&v.block_id===s.block_id).length-all.slice(0,index).filter(v=>v.module_id===s.module_id&&v.block_id===s.block_id).length}/></div>)}{!submissions.some(s=>s.enrollment_id===enrollment.id)&&<p className="text-sm text-muted-foreground">No submissions yet.</p>}</section>
 </div>;
}
