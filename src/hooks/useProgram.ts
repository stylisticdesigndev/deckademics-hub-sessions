import { useSyncExternalStore } from 'react';
import type { Program } from '@/lib/production';
import { useAuth } from '@/providers/AuthProvider';

const subscribe = (callback: () => void) => {
  window.addEventListener('program-change', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('program-change', callback); window.removeEventListener('storage', callback); };
};
export function useProgram() {
  const { session } = useAuth();
  const key = `deckademics-program-${session?.user.id ?? 'guest'}`;
  const program = useSyncExternalStore(subscribe, () => localStorage.getItem(key) === 'production' ? 'production' : 'dj') as Program;
  const setProgram = (value: Program) => { localStorage.setItem(key, value); window.dispatchEvent(new Event('program-change')); };
  return { program, setProgram };
}