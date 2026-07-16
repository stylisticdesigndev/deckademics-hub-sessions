import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { X, Monitor, PartyPopper, Check, SkipForward } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VinylLoader from '@/components/ui/VinylLoader';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const capitalizeLevel = (l: string) => (l ? l.charAt(0).toUpperCase() + l.slice(1) : '');

function normalizeDay(day?: string | null): string {
  const n = (day || '').trim().toLowerCase().replace(/s$/, '');
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  };
  const num = map[n];
  return num === undefined ? (day || '').trim() : DAY_NAMES[num];
}

interface Student {
  id: string;
  name: string;
  initials: string;
  avatar?: string | null;
  level: string;
  classTime: string;
}

/**
 * Full-screen swipe class-notes experience.
 * Opened via the "Log today's class notes" push notification:
 *   /instructor/notes/quick?classTime=5:30 PM - 7:00 PM
 *
 * Shows one card per PRIMARY (assigned) student in that class slot for today.
 * Cover/makeup students are excluded — those get notes from the student profile.
 */
export default function InstructorQuickNotes() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classTimeFilter = params.get('classTime')?.trim() || null;
  const { userData } = useAuth();
  const { toast } = useToast();
  const instructorId = userData.user?.id || userData.profile?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [index, setIndex] = useState(0);
  const [noteText, setNoteText] = useState('');

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayDayName = DAY_NAMES[today.getDay()];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // PRIMARY/SECONDARY assignments only (no covers).
        const { data: links } = await supabase
          .from('student_instructors' as any)
          .select('student_id')
          .eq('instructor_id', instructorId);
        const ids = ((links as any[]) || []).map(l => l.student_id);
        if (!ids.length) { if (!cancelled) { setStudents([]); setLoading(false); } return; }

        const { data: rows } = await supabase
          .from('students')
          .select('id, level, class_day, class_time, profiles!inner(first_name, last_name, avatar_url, is_mock)')
          .in('id', ids)
          .eq('enrollment_status', 'active')
          .eq('profiles.is_mock', false) as any;

        const list: Student[] = ((rows as any[]) || [])
          .filter(s => normalizeDay(s.class_day) === todayDayName)
          .filter(s => !classTimeFilter || (s.class_time || '').trim() === classTimeFilter)
          .map(s => {
            const p = s.profiles;
            const fn = p?.first_name || '';
            const ln = p?.last_name || '';
            return {
              id: s.id,
              name: `${fn} ${ln}`.trim() || 'Unknown',
              initials: (fn[0] || '') + (ln[0] || ''),
              avatar: p?.avatar_url,
              level: s.level || 'novice',
              classTime: (s.class_time || '').trim(),
            };
          });

        // Skip students already noted today by this instructor
        if (list.length) {
          const { data: existing } = await supabase
            .from('student_notes')
            .select('student_id, created_at')
            .eq('instructor_id', instructorId)
            .in('student_id', list.map(s => s.id))
            .gte('created_at', `${todayStr}T00:00:00Z`)
            .lte('created_at', `${todayStr}T23:59:59Z`);
          const noted = new Set(((existing as any[]) || []).map(n => n.student_id));
          const remaining = list.filter(s => !noted.has(s.id));
          if (!cancelled) setStudents(remaining);
        } else if (!cancelled) {
          setStudents([]);
        }
      } catch (err) {
        console.error('[quick-notes] load failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [instructorId, classTimeFilter, todayDayName, todayStr]);

  const current = students[index];
  const total = students.length;

  const advance = () => {
    setNoteText('');
    setIndex(i => i + 1);
  };

  const handleSave = async () => {
    if (!current || !instructorId) return;
    const content = noteText.trim();
    if (!content) {
      toast({ title: 'Add a note first', description: 'Write something you covered today, or tap Skip.' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('student_notes').insert({
        student_id: current.id,
        instructor_id: instructorId,
        title: `Class notes · ${format(today, 'MMM d, yyyy')}`,
        content,
      } as any);
      if (error) throw error;
      advance();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Could not save', description: err?.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => advance();

  const counter = total > 0
    ? index >= total ? `${total} of ${total} · all done` : `${index + 1} of ${total}`
    : null;
  const topTime = current?.classTime || classTimeFilter;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Desktop notice */}
      <div className="hidden md:flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Monitor className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Best on mobile or tablet</h1>
          <p className="text-muted-foreground">
            The quick class-notes view is built for touch. Open this link on your phone
            or tablet, or add notes from each student's profile on desktop.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/instructor/dashboard')}>
              Back to dashboard
            </Button>
            <Button asChild>
              <Link to="/instructor/students">Open students</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet */}
      <div className="md:hidden h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 py-2.5 bg-background/95 backdrop-blur sticky top-0 z-10 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/instructor/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center leading-tight">
            <p className="text-sm font-bold">Class Notes</p>
            {(topTime || counter) && (
              <p className="text-[11px] text-muted-foreground">
                {topTime}
                {topTime && counter ? ' · ' : ''}
                {counter}
              </p>
            )}
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 min-h-0 flex flex-col px-3 pb-3 pt-1">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <VinylLoader message="Loading students..." />
            </div>
          ) : total === 0 ? (
            <EmptyState message="No primary students to note today" onBack={() => navigate('/instructor/dashboard')} />
          ) : !current ? (
            <EmptyState message="All caught up — notes logged for every student." onBack={() => navigate('/instructor/dashboard')} />
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 bg-card border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col">
                {/* Photo */}
                <div className="relative aspect-[4/3] bg-muted shrink-0">
                  {current.avatar ? (
                    <img src={current.avatar} alt={current.name} className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-3xl">{current.initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
                      {capitalizeLevel(current.level)}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white pointer-events-none">
                    <h3 className="text-xl font-bold leading-tight">{current.name}</h3>
                    <p className="text-white/70 text-xs mt-0.5">{current.classTime}</p>
                  </div>
                </div>
                {/* Note input */}
                <div className="flex-1 min-h-0 flex flex-col p-4 gap-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    What did you cover today?
                  </label>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Beatmatching drills, intro to EQing, worked on transitions..."
                    className="flex-1 min-h-[120px] resize-none text-sm"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pt-4 pb-2 flex justify-around items-center">
                <ActionButton
                  variant="skip"
                  disabled={saving}
                  onClick={handleSkip}
                  label="Skip"
                  icon={<SkipForward className="w-7 h-7" strokeWidth={2.5} />}
                />
                <ActionButton
                  variant="save"
                  disabled={saving || !noteText.trim()}
                  onClick={handleSave}
                  label={saving ? 'Saving…' : 'Save'}
                  icon={<Check className="w-8 h-8" strokeWidth={2.5} />}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-xs text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <PartyPopper className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">All caught up</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onBack}>Back to dashboard</Button>
      </div>
    </div>
  );
}

function ActionButton({
  variant, disabled, onClick, label, icon,
}: {
  variant: 'save' | 'skip';
  disabled: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  const isSave = variant === 'save';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-2 outline-none disabled:opacity-40"
      aria-label={label}
    >
      <div
        className={cn(
          'w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95',
          isSave
            ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
            : 'border-muted bg-muted/40 text-muted-foreground hover:bg-muted'
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          'text-[10px] font-bold uppercase text-muted-foreground tracking-widest transition-colors',
          isSave && 'group-hover:text-emerald-600'
        )}
      >
        {label}
      </span>
    </button>
  );
}