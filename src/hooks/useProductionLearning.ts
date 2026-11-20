import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
type Tables = Database['public']['Tables'];
type Action = { kind: 'intake'; value: Tables['production_intakes']['Insert'] } | { kind: 'submission'; value: Tables['production_submissions']['Insert'] } | { kind: 'review'; id: string; status: 'complete' | 'changes_requested'; feedback: string } | { kind: 'catchup'; value: Tables['production_catchups']['Insert'] } | { kind: 'package'; value: Tables['production_packages']['Insert'] };
export function useProductionLearning() {
 const { session } = useAuth(); const client = useQueryClient();
 const query = useQuery({queryKey:['production-learning',session?.user.id], enabled:!!session, refetchInterval:30000, queryFn:async()=>{
  const [intakes,submissions,catchups,packages] = await Promise.all([supabase.from('production_intakes').select('*'),supabase.from('production_submissions').select('*').order('created_at',{ascending:false}),supabase.from('production_catchups').select('*').order('class_date',{ascending:false}),supabase.from('production_packages').select('*').order('start_date')]);
  for(const r of [intakes,submissions,catchups,packages]) if(r.error) throw r.error;
  return {intakes:intakes.data??[],submissions:submissions.data??[],catchups:catchups.data??[],packages:packages.data??[]};
 }});
 const mutation = useMutation({mutationFn:async(action:Action)=>{ let result;
  if(action.kind==='intake') result=await supabase.from('production_intakes').upsert(action.value,{onConflict:'enrollment_id'});
  else if(action.kind==='submission') result=await supabase.from('production_submissions').insert(action.value);
  else if(action.kind==='review') result=await supabase.from('production_submissions').update({status:action.status,feedback:action.feedback,reviewed_by:session?.user.id}).eq('id',action.id);
  else if(action.kind==='catchup') result=await supabase.from('production_catchups').upsert(action.value,{onConflict:'enrollment_id,class_date'});
  else result=await supabase.from('production_packages').insert(action.value);
  if(result.error) throw result.error;
 },onSuccess:()=>client.invalidateQueries({queryKey:['production-learning']}),onError:()=>toast.error('Unable to save. Please try again.')});
 return {...query,...query.data,save:mutation.mutateAsync,saving:mutation.isPending};
}