import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, RotateCcw, ClipboardCheck, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

const capitalizeLevel = (l: string) => (l ? l.charAt(0).toUpperCase() + l.slice(1) : '');

export interface SwipeItem {
  student: {
    id: string;
    name: string;
    initials: string;
    avatar?: string | null;
    level: string;
    classTime: string;
  };
  dateStr: string;
  status: 'present' | 'absent' | null;
}

interface Props {
  items: SwipeItem[];
  saving: boolean;
  onMark: (studentId: string, dateStr: string, status: 'present' | 'absent') => void | Promise<void>;
  /**
   * When true, render as an edge-to-edge full-screen deck (photo fills all
   * available vertical space; no inner heading). Used by the quick-attendance
   * push-notification flow. Defaults to false for compact/embedded usage.
   */
  fullScreen?: boolean;
  /**
   * Called whenever progress changes so the parent (e.g. the full-screen
   * top bar) can display the counter without duplicating a heading.
   */
  onProgress?: (info: { decided: number; total: number; currentTime: string | null }) => void;
}

const SWIPE_THRESHOLD = 110;

export function SwipeAttendanceStack({ items, saving, onMark, fullScreen = false, onProgress }: Props) {
  // Queue: only students not yet marked, in original order
  const initialQueue = useMemo(() => items.filter(i => i.status === null), [items]);
  const totalToday = items.length;

  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<Array<{ item: SwipeItem; status: 'present' | 'absent' }>>([]);
  const lockRef = useRef(false);

  // Reset when the underlying items array identity changes meaningfully
  const queueKey = initialQueue.map(i => i.student.id).join('|');
  const lastKey = useRef(queueKey);
  if (lastKey.current !== queueKey) {
    lastKey.current = queueKey;
    setIndex(0);
    setHistory([]);
  }

  const current = initialQueue[index];
  const next = initialQueue[index + 1];
  const after = initialQueue[index + 2];

  const decidedCount = totalToday - initialQueue.length + index;

  useEffect(() => {
    onProgress?.({
      decided: decidedCount,
      total: totalToday,
      currentTime: current?.student.classTime ?? null,
    });
  }, [decidedCount, totalToday, current?.student.classTime, onProgress]);

  const commit = async (status: 'present' | 'absent') => {
    if (!current || lockRef.current || saving) return;
    lockRef.current = true;
    const item = current;
    setHistory(h => [...h, { item, status }]);
    setIndex(i => i + 1);
    try {
      await onMark(item.student.id, item.dateStr, status);
    } finally {
      setTimeout(() => { lockRef.current = false; }, 250);
    }
  };

  const undo = () => {
    if (!history.length) return;
    setHistory(h => h.slice(0, -1));
    setIndex(i => Math.max(0, i - 1));
  };

  const heading = "Today's Attendance";

  // Empty state (no classes today at all)
  if (totalToday === 0) {
    return (
      <section className={cn(fullScreen ? 'h-full flex items-center justify-center' : 'space-y-3')}>
        {!fullScreen && <h2 className="text-lg font-semibold">{heading}</h2>}
        <Card className={fullScreen ? 'w-full max-w-sm' : ''}>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No classes scheduled today</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (fullScreen) {
    return (
      <div className="h-full w-full flex flex-col">
        <div className="relative flex-1 min-h-0 w-full">
          {!current ? (
            <AllDoneCard fullScreen />
          ) : (
            <>
              {after && (
                <div
                  key={`after-${after.student.id}`}
                  className="absolute inset-0 translate-y-3 scale-[0.94] bg-card border border-border rounded-3xl shadow-sm opacity-40"
                />
              )}
              {next && (
                <div
                  key={`next-${next.student.id}`}
                  className="absolute inset-0 translate-y-1.5 scale-[0.97] bg-card border border-border rounded-3xl shadow-md opacity-70"
                />
              )}
              <AnimatePresence initial={false}>
                <SwipeCard
                  key={current.student.id}
                  item={current}
                  disabled={saving}
                  onDecide={commit}
                />
              </AnimatePresence>
            </>
          )}
        </div>

        {current && (
          <div className="pt-5 pb-2 flex justify-around items-center">
            <ActionButton
              variant="absent"
              disabled={saving}
              onClick={() => commit('absent')}
              label="Absent"
            />
            <ActionButton
              variant="present"
              disabled={saving}
              onClick={() => commit('present')}
              label="Present"
            />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={undo}
              disabled={saving}
              className="flex items-center gap-2 py-2 px-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-tight">Undo last</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold">{heading}</h2>
          <p className="text-xs text-muted-foreground font-medium">
            {current
              ? `${decidedCount + 1} of ${totalToday} · swipe or tap`
              : `${totalToday} of ${totalToday} · all done`}
          </p>
        </div>
        {current && (
          <span className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
            {current.student.classTime}
          </span>
        )}
      </div>

      <div className="mx-auto w-full max-w-sm">
        <div className="relative aspect-[3/4] w-full">
          {!current ? (
            <AllDoneCard />
          ) : (
            <>
              {after && (
                <div
                  key={`after-${after.student.id}`}
                  className="absolute inset-0 translate-y-4 scale-90 bg-card border border-border rounded-3xl shadow-sm opacity-40"
                />
              )}
              {next && (
                <div
                  key={`next-${next.student.id}`}
                  className="absolute inset-0 translate-y-2 scale-95 bg-card border border-border rounded-3xl shadow-md opacity-70"
                />
              )}
              <AnimatePresence initial={false}>
                <SwipeCard
                  key={current.student.id}
                  item={current}
                  disabled={saving}
                  onDecide={commit}
                />
              </AnimatePresence>
            </>
          )}
        </div>

        {/* Action buttons */}
        {current && (
          <div className="mt-6 flex justify-around items-center">
            <ActionButton
              variant="absent"
              disabled={saving}
              onClick={() => commit('absent')}
              label="Absent"
            />
            <ActionButton
              variant="present"
              disabled={saving}
              onClick={() => commit('present')}
              label="Present"
            />
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={undo}
              disabled={saving}
              className="flex items-center gap-2 py-2 px-4 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-tight">Undo last</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function SwipeCard({
  item,
  disabled,
  onDecide,
}: {
  item: SwipeItem;
  disabled: boolean;
  onDecide: (status: 'present' | 'absent') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const presentOpacity = useTransform(x, [40, SWIPE_THRESHOLD], [0, 1]);
  const absentOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (disabled) return;
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 500) {
      onDecide('present');
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -500) {
      onDecide('absent');
    }
  };

  return (
    <motion.div
      className="absolute inset-0 bg-card border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 600 : -600,
        opacity: 0,
        rotate: x.get() > 0 ? 25 : -25,
        transition: { duration: 0.28, ease: 'easeIn' },
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      {/* Photo area */}
      <div className="relative flex-1 bg-muted select-none">
        {item.student.avatar ? (
          <img
            src={item.student.avatar}
            alt={item.student.name}
            draggable={false}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="h-28 w-28">
              <AvatarFallback className="text-3xl">{item.student.initials}</AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Proficiency badge */}
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-md">
            {capitalizeLevel(item.student.level)}
          </span>
        </div>

        {/* Stamp overlays */}
        <motion.div
          style={{ opacity: presentOpacity }}
          className="absolute top-6 right-6 -rotate-12 border-4 border-emerald-500 text-emerald-500 px-4 py-1.5 rounded-lg font-black text-2xl tracking-widest bg-white/70 backdrop-blur"
        >
          PRESENT
        </motion.div>
        <motion.div
          style={{ opacity: absentOpacity }}
          className="absolute top-6 left-6 rotate-12 border-4 border-rose-500 text-rose-500 px-4 py-1.5 rounded-lg font-black text-2xl tracking-widest bg-white/70 backdrop-blur"
        >
          ABSENT
        </motion.div>

        {/* Gradient + name */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white pointer-events-none">
          <h3 className="text-2xl font-bold leading-tight">{item.student.name}</h3>
          <p className="text-white/70 text-sm mt-0.5">{item.student.classTime}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  variant,
  disabled,
  onClick,
  label,
}: {
  variant: 'present' | 'absent';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const isPresent = variant === 'present';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-center gap-2 outline-none disabled:opacity-50"
      aria-label={label}
    >
      <div
        className={cn(
          'w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95',
          isPresent
            ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
            : 'border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'
        )}
      >
        {isPresent ? <Check className="w-8 h-8" strokeWidth={2.5} /> : <X className="w-8 h-8" strokeWidth={2.5} />}
      </div>
      <span
        className={cn(
          'text-[10px] font-bold uppercase text-muted-foreground tracking-widest transition-colors',
          isPresent ? 'group-hover:text-emerald-600' : 'group-hover:text-rose-600'
        )}
      >
        {label}
      </span>
    </button>
  );
}

function AllDoneCard() {
  return (
    <div className="absolute inset-0 bg-card border border-border rounded-3xl shadow-xl flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
        <PartyPopper className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold">All caught up</h3>
      <p className="text-sm text-muted-foreground mt-1">Attendance is marked for every student today.</p>
    </div>
  );
}