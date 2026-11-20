import { useSyncExternalStore } from 'react';
import type { Program } from '@/lib/production';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { studentProgramAccess } from '@/lib/productionLearning';

const subscribe = (callback: () => void) => {
  window.addEventListener('program-change', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('program-change', callback); window.removeEventListener('storage', callback); };
};
export function useProgram() {
  const { session, userData } = useAuth();
  const access = useQuery({queryKey:['production','program-access',session?.user.id],enabled:!!session && userData.role==='student',queryFn:async()=>{const r=await supabase.from('production_enrollments').select('dj_enabled').eq('student_id',session?.user.id??'').eq('active',true).maybeSingle();if(r.error)throw r.error;return r.data;}});
  const key = `deckademics-program-${session?.user.id ?? 'guest'}`;
  const stored = useSyncExternalStore(subscribe, () => localStorage.getItem(key) === 'production' ? 'production' : 'dj') as Program;
  const {dual,onlyProduction}=studentProgramAccess(access.data??undefined);
  const program = userData.role==='student' ? onlyProduction?'production':dual?stored:'dj' : stored;
  const setProgram = (value: Program) => { localStorage.setItem(key, value); window.dispatchEvent(new Event('program-change')); };
  return { program, setProgram, canSwitch:userData.role==='admin'||dual, accessLoading:access.isLoading && userData.role==='student' };
}