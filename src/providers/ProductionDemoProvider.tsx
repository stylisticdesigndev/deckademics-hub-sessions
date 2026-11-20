import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { applyDemoAction, createProductionDemo, DEMO_STORAGE_KEY, type DemoAction, type ProductionDemoState } from '@/lib/productionDemoState';
import { clearDemoFiles } from '@/lib/productionDemoMedia';

type DemoContext = { state: ProductionDemoState; role: 'instructor' | 'student'; studentId: string; setStudentId: (id: string) => void; save: (action: DemoAction) => Promise<void>; reset: () => void };
const Context = createContext<DemoContext | null>(null);
export const useProductionDemo = () => useContext(Context);
export function ProductionDemoProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [state, setState] = useState<ProductionDemoState>(() => {
    try { const stored = localStorage.getItem(DEMO_STORAGE_KEY); if (stored) { const value = JSON.parse(stored); if (value.modules && value.students && value.messages && value.tasks) return value; } } catch { /* Start fresh when storage is unavailable. */ }
    return createProductionDemo();
  });
  const [studentId, setStudent] = useState(() => sessionStorage.getItem('production-showcase-student') || 'demo-maya');
  const setStudentId = (id: string) => { setStudent(id); sessionStorage.setItem('production-showcase-student', id); };
  const persist = (value: ProductionDemoState) => { try { localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(value)); } catch { /* In-memory showcase still works. */ } };
  const save = async (action: DemoAction) => { setState(old => { const next = applyDemoAction(old, action); persist(next); return next; }); };
  const reset = () => { const fresh = createProductionDemo(); setState(fresh); persist(fresh); setStudentId('demo-maya'); void clearDemoFiles(); };
  return <Context.Provider value={{ state, role: pathname.includes('/student') ? 'student' : 'instructor', studentId, setStudentId, save, reset }}>{children}</Context.Provider>;
}