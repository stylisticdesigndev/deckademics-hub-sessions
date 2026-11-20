import type { Database } from '@/integrations/supabase/types';
import type { LessonBlock } from './productionLearning';
import { PRODUCTION_LEVELS } from './production';

type Tables = Database['public']['Tables'];
export type DemoStudent = { id: string; name: string; initials: string };
export type DemoMessage = { id: string; studentId: string; sender: 'student' | 'instructor'; content: string; created_at: string };
export type DemoNote = { id: string; studentId: string; content: string; created_at: string };
export type DemoTask = { id: string; studentId: string; title: string; completed: boolean };
export type ProductionDemoState = {
  enrollments: Tables['production_enrollments']['Row'][];
  modules: Tables['production_modules']['Row'][];
  completions: Tables['production_module_completions']['Row'][];
  attendance: Tables['production_attendance']['Row'][];
  intakes: Tables['production_intakes']['Row'][];
  submissions: Tables['production_submissions']['Row'][];
  catchups: Tables['production_catchups']['Row'][];
  packages: Tables['production_packages']['Row'][];
  students: DemoStudent[];
  notes: DemoNote[];
  tasks: DemoTask[];
  messages: DemoMessage[];
};
export type ProductionAction =
  | { kind: 'module'; value: Tables['production_modules']['Insert'] }
  | { kind: 'delete-module'; id: string }
  | { kind: 'reorder'; ids: string[] }
  | { kind: 'enroll'; value: Tables['production_enrollments']['Insert'] }
  | { kind: 'complete'; enrollmentId: string; moduleId: string; complete: boolean }
  | { kind: 'attendance'; enrollmentId: string; date: string; status: 'present' | 'absent' };
export type LearningAction =
  | { kind: 'intake'; value: Tables['production_intakes']['Insert'] }
  | { kind: 'submission'; value: Tables['production_submissions']['Insert'] }
  | { kind: 'review'; id: string; status: 'complete' | 'changes_requested'; feedback: string }
  | { kind: 'catchup'; value: Tables['production_catchups']['Insert'] }
  | { kind: 'package'; value: Tables['production_packages']['Insert'] };
export type DemoAction = ProductionAction | LearningAction
  | { kind: 'note'; studentId: string; content: string }
  | { kind: 'task'; studentId: string; title: string }
  | { kind: 'toggle-task'; id: string }
  | { kind: 'message'; studentId: string; sender: 'student' | 'instructor'; content: string };
export const DEMO_INSTRUCTOR_ID = 'demo-lonegevity';
export const DEMO_STORAGE_KEY = 'deckademics-production-showcase-v1';

export function createProductionDemo(): ProductionDemoState {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const students = [
    { id: 'demo-maya', name: 'Maya Carter', initials: 'MC' },
    { id: 'demo-jordan', name: 'Jordan Ellis', initials: 'JE' },
    { id: 'demo-alex', name: 'Alex Rivera', initials: 'AR' },
    { id: 'demo-riley', name: 'Riley Brooks', initials: 'RB' },
  ];
  const titles: Record<string, string[]> = {
    novice: ['Your workspace & first sounds', 'Build your first drum groove', 'From loop to arrangement'],
    amateur: ['Sample chopping & creative rhythm', 'Bass lines that move', 'Finish your first beat'],
    intermediate: ['Space, depth & balance', 'Automation that tells a story', 'Mix your original track'],
    advanced: ['Develop your signature sound', 'Mix translation & mastering', 'Prepare your release'],
    advanced_plus: ['Your project direction', 'Production feedback session', 'Release-ready listening session'],
  };
  const modules = PRODUCTION_LEVELS.flatMap(level => titles[level].map((title, i) => {
    const id = `demo-${level}-${i + 1}`;
    const blocks: LessonBlock[] = [
      { id: `${id}-heading`, type: 'heading', content: i === 0 ? 'Start with intention' : 'Listen. Experiment. Create.' },
      { id: `${id}-text`, type: 'text', content: `Today's focus: **${title.toLowerCase()}**. Bring your current project and we’ll build on it together.\n\n- Listen to the reference and describe what stands out.\n- Try the technique in your DAW.\n- Save a new version before you experiment.\n\nKeep the process creative. A simple idea with a strong feel beats a complicated idea without one.` },
      { id: `${id}-audio`, type: 'audio', content: 'Reference groove · 90 BPM', url: 'https://demo.invalid/groove.wav', filename: 'Reference groove.wav' },
      { id: `${id}-file`, type: 'file', content: 'Session reference & checklist', url: 'https://demo.invalid/session-guide.pdf', filename: 'Session guide.pdf' },
    ];
    if (i === 1) blocks.splice(2, 0, { id: `${id}-video`, type: 'video', content: 'Reference groove visualizer', url: 'https://demo.invalid/groove.mp4', filename: 'Groove visualizer' });
    if (i > 0) blocks.push({ id: `${id}-homework`, type: 'homework', content: 'Export a 30–60 second MP3 or WAV bounce of your idea. Share your audio or a cloud link, and tell Lonegevity what you want feedback on.' });
    return { id, title, level, order_index: i + 1, description: 'A hands-on session with Lonegevity.', lesson_outline: '', homework_prompt: '', author_id: DEMO_INSTRUCTOR_ID, is_draft: false, blocks, created_at: now, updated_at: now };
  }));
  const levels = ['novice', 'amateur', 'intermediate', 'advanced_plus'];
  const enrollments = students.map((s, i) => ({ id: `enrollment-${s.id}`, student_id: s.id, instructor_id: DEMO_INSTRUCTOR_ID, level: levels[i], class_day: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(), class_time: ['2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'][i], active: true, dj_enabled: false, created_at: now, updated_at: now }));
  return {
    students, modules, enrollments,
    completions: enrollments.map((e, i) => ({ id: `completion-${i}`, enrollment_id: e.id, module_id: `demo-${e.level}-1`, completed_at: now, created_at: now, updated_at: now })),
    attendance: Array.from({ length: 6 }, (_, i) => ({ id: `attendance-${i}`, enrollment_id: 'enrollment-demo-riley', class_date: `2026-10-${String(2 + i * 4).padStart(2, '0')}`, status: 'present', created_at: now, updated_at: now })),
    intakes: enrollments.map((e, i) => ({ id: `intake-${i}`, enrollment_id: e.id, daw: ['Ableton Live', 'FL Studio', 'Logic Pro', 'Ableton Live'][i], hardware: 'Laptop, audio interface, MIDI keyboard & headphones', genres: ['Hip-hop / neo-soul', 'House / electronic', 'R&B / ambient', 'Hip-hop / instrumental'][i], goals: ['Finish my first original beat and learn my DAW.', 'Build a three-track beat collection.', 'Get more confident with mixing and arrangement.', 'Complete and release a five-track EP.'][i], experience: i ? 'Comfortable with basic recording and beat-making.' : 'New to production; some experience playing keys.', created_at: now, updated_at: now })),
    submissions: [{ id: 'demo-submission-1', enrollment_id: 'enrollment-demo-jordan', module_id: 'demo-amateur-2', block_id: 'demo-amateur-2-homework', student_note: 'First bass-line bounce. Is the low end too crowded?', media_url: 'https://demo.invalid/groove.wav', storage_path: null, status: 'pending_review', feedback: '', reviewed_by: null, created_at: now, updated_at: now }],
    catchups: [{ id: 'demo-catchup-1', enrollment_id: 'enrollment-demo-maya', module_id: 'demo-novice-2', class_date: today, note: 'Here is the groove lesson we worked on. Try the exercise before our next session; we’ll listen together.', sent_by: DEMO_INSTRUCTOR_ID, created_at: now, updated_at: now }],
    packages: [{ id: 'demo-package-1', enrollment_id: 'enrollment-demo-riley', sessions: 8, start_date: '2026-10-01', note: 'EP development · initial session block', created_by: DEMO_INSTRUCTOR_ID, created_at: now, updated_at: now }],
    notes: [{ id: 'demo-note-1', studentId: 'demo-maya', content: 'Great sense of rhythm. Next session: build confidence with drum programming and save a reusable template.', created_at: now }],
    tasks: [{ id: 'demo-task-1', studentId: 'demo-maya', title: 'Build a four-bar drum loop at 90 BPM', completed: false }],
    messages: [{ id: 'demo-message-1', studentId: 'demo-maya', sender: 'instructor', content: 'Hey Maya! Bring your latest loop to our next session. Looking forward to hearing what you made.', created_at: now }],
  };
}

export function applyDemoAction(state: ProductionDemoState, action: DemoAction): ProductionDemoState {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const stamp = { id, created_at: now, updated_at: now };
  switch (action.kind) {
    case 'module': {
      const old = state.modules.find(m => m.id === action.value.id);
      const value = { ...stamp, description: '', lesson_outline: '', homework_prompt: '', blocks: [], is_draft: true, author_id: DEMO_INSTRUCTOR_ID, order_index: 1, ...old, ...action.value };
      return { ...state, modules: [...state.modules.filter(m => m.id !== value.id), value].sort((a,b) => a.order_index-b.order_index) };
    }
    case 'delete-module': return { ...state, modules: state.modules.filter(m => m.id !== action.id), completions: state.completions.filter(c => c.module_id !== action.id) };
    case 'reorder': return { ...state, modules: state.modules.map(m => action.ids.includes(m.id) ? { ...m, order_index: action.ids.indexOf(m.id)+1 } : m).sort((a,b) => a.order_index-b.order_index) };
    case 'enroll': return { ...state, enrollments: state.enrollments.map(e => e.id === action.value.id ? { ...e, ...action.value, updated_at: now } : e) };
    case 'complete': return { ...state, completions: [...state.completions.filter(c => c.enrollment_id !== action.enrollmentId || c.module_id !== action.moduleId), ...(action.complete ? [{ ...stamp, completed_at: now, enrollment_id: action.enrollmentId, module_id: action.moduleId }] : [])] };
    case 'attendance': return { ...state, attendance: [...state.attendance.filter(a => a.enrollment_id !== action.enrollmentId || a.class_date !== action.date), { ...stamp, enrollment_id: action.enrollmentId, class_date: action.date, status: action.status }] };
    case 'intake': return { ...state, intakes: [...state.intakes.filter(i => i.enrollment_id !== action.value.enrollment_id), { ...stamp, daw: '', hardware: '', genres: '', goals: '', experience: '', ...action.value }] };
    case 'submission': return { ...state, submissions: [{ ...stamp, student_note: '', media_url: '', storage_path: null, feedback: '', reviewed_by: null, ...action.value, status: 'pending_review' }, ...state.submissions] };
    case 'review': return { ...state, submissions: state.submissions.map(s => s.id === action.id ? { ...s, status: action.status, feedback: action.feedback, reviewed_by: DEMO_INSTRUCTOR_ID, updated_at: now } : s) };
    case 'catchup': return { ...state, catchups: [{ ...stamp, note: '', sent_by: DEMO_INSTRUCTOR_ID, ...action.value }, ...state.catchups.filter(c => c.enrollment_id !== action.value.enrollment_id || c.class_date !== action.value.class_date)] };
    case 'package': return { ...state, packages: [...state.packages, { ...stamp, note: '', created_by: DEMO_INSTRUCTOR_ID, start_date: now.slice(0,10), ...action.value }] };
    case 'note': return { ...state, notes: [{ id, studentId: action.studentId, content: action.content, created_at: now }, ...state.notes] };
    case 'task': return { ...state, tasks: [...state.tasks, { id, studentId: action.studentId, title: action.title, completed: false }] };
    case 'toggle-task': return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, completed: !t.completed } : t) };
    case 'message': return { ...state, messages: [...state.messages, { id, studentId: action.studentId, sender: action.sender, content: action.content, created_at: now }] };
  }
}