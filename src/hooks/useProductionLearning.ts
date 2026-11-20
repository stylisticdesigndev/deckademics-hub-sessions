import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import type { LearningAction } from '@/lib/productionDemoState';
type Tables = Database['public']['Tables'];
type Action = LearningAction;
export function useProductionLearning() {
 const demo = useProductionDemo();
 const { session } = useAuth(); const client = useQueryClient();
 const query = useQuery({queryKey:['production-learning',session?.user.id], enabled:!!session && !demo, refetchInterval:30000, queryFn:async()=>{
  const [intakes,submissions,catchups,packages] = await Promise.all([supabase.from('production_intakes').select('*'),supabase.from('production_submissions').select('*').order('created_at',{ascending:false}),supabase.from('production_catchups').select('*').order('class_date',{ascending:false}),supabase.from('production_packages').select('*').order('start_date')]);
  for(const r of [intakes,submissions,catchups,packages]) if(r.error) throw r.error;
  return {intakes:intakes.data??[],submissions:submissions.data??[],catchups:catchups.data??[],packages:packages.data??[]};
 }});
 const mutation = useMutation({mutationFn:async(action:Action)=>{ if(demo)return demo.save(action); let result;
  if(action.kind==='intake') result=await supabase.from('production_intakes').upsert(action.value,{onConflict:'enrollment_id'});
  else if(action.kind==='submission') result=await supabase.from('production_submissions').insert(action.value);
  else if(action.kind==='review') result=await supabase.from('production_submissions').update({status:action.status,feedback:action.feedback,reviewed_by:session?.user.id}).eq('id',action.id);
  else if(action.kind==='catchup') result=await supabase.from('production_catchups').upsert(action.value,{onConflict:'enrollment_id,class_date'});
  else result=await supabase.from('production_packages').insert(action.value);
  if(result.error) throw result.error;
 },onSuccess:()=>client.invalidateQueries({queryKey:['production-learning']}),onError:()=>toast.error('Unable to save. Please try again.')});
 return {...query,...(demo?.state??query.data),error:demo?null:query.error,isLoading:demo?false:query.isLoading,save:mutation.mutateAsync,saving:mutation.isPending};
}