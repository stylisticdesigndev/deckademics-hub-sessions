import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Search, X, Users } from 'lucide-react';
import { format, startOfWeek, addDays, isSameWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useInstructorCalendar,
  type CalendarClass,
} from '@/hooks/instructor/useInstructorCalendar';
import { CalendarClassDetail } from '@/components/instructor/calendar/CalendarClassDetail';

const TIME_SLOTS = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];
const OTHER_SLOT = 'Other';
// Monday-first display order with their JS day index.
const WEEK_DAYS: { label: string; dayIndex: number }[] = [
  { label: 'Monday', dayIndex: 1 },
  { label: 'Tuesday', dayIndex: 2 },
  { label: 'Wednesday', dayIndex: 3 },
  { label: 'Thursday', dayIndex: 4 },
  { label: 'Friday', dayIndex: 5 },
  { label: 'Saturday', dayIndex: 6 },
  { label: 'Sunday', dayIndex: 0 },
];

function slotKey(classTime: string): string {
  return TIME_SLOTS.includes(classTime) ? classTime : OTHER_SLOT;
}

const InstructorCalendar = () => {
  const { data, isLoading } = useInstructorCalendar();
  const [weekRef, setWeekRef] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CalendarClass | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(weekRef, new Date(), { weekStartsOn: 1 });

  const classes = data?.classes ?? [];
  const colorByInstructor = data?.colorByInstructor ?? {};
  const legend = data?.legend ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.studentName.toLowerCase().includes(q) ||
        c.instructors.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [classes, search]);

  // Index classes by dayIndex -> slot.
  const grid = useMemo(() => {
    const map: Record<number, Record<string, CalendarClass[]>> = {};
    WEEK_DAYS.forEach(({ dayIndex }) => {
      map[dayIndex] = {};
    });
    filtered.forEach((c) => {
      const day = map[c.dayIndex];
      if (!day) return;
      const key = slotKey(c.classTime);
      if (!day[key]) day[key] = [];
      day[key].push(c);
    });
    return map;
  }, [filtered]);

  const slotsToShow = useMemo(() => {
    const hasOther = filtered.some((c) => slotKey(c.classTime) === OTHER_SLOT);
    return hasOther ? [...TIME_SLOTS, OTHER_SLOT] : TIME_SLOTS;
  }, [filtered]);

  const openDetail = (c: CalendarClass) => {
    setSelected(c);
    setDetailOpen(true);
  };

  const renderChip = (c: CalendarClass) => {
    const primary = c.instructors[0];
    const color = primary ? colorByInstructor[primary.id] : 'hsl(var(--muted-foreground))';
    return (
      <button
        key={c.studentId}
        onClick={() => openDetail(c)}
        className="w-full text-left rounded-md border bg-card hover:bg-accent transition-colors p-2 flex items-center gap-2"
        style={{ borderLeftColor: color, borderLeftWidth: 3 }}
      >
        <Avatar className="h-6 w-6 shrink-0">
          {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.studentName} />}
          <AvatarFallback className="text-[10px] bg-muted">{c.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-medium truncate leading-tight">{c.studentName}</p>
          <p className="text-[10px] text-muted-foreground truncate leading-tight">
            {c.instructors.map((i) => i.name).join(', ') || 'Unassigned'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Every class across the school. Click a class to view the student's progress and notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekRef((d) => addDays(d, -7))} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isCurrentWeek ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWeekRef(new Date())}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekRef((d) => addDays(d, 7))} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm font-medium">
          Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </p>
        <div className="relative w-full sm:max-w-xs sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search student or instructor..."
            className="pl-10 pr-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      {legend.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {legend.map((l) => (
            <div key={l.id} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-muted-foreground">{l.name}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {classes.length === 0
              ? 'No classes have been scheduled yet.'
              : 'No classes match your search.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: week grid */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-[900px] grid grid-cols-[110px_repeat(7,1fr)] gap-2">
              {/* Header row */}
              <div />
              {WEEK_DAYS.map(({ label, dayIndex }) => {
                const date = addDays(weekStart, WEEK_DAYS.findIndex((d) => d.dayIndex === dayIndex));
                return (
                  <div key={label} className="text-center pb-1">
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{format(date, 'MMM d')}</p>
                  </div>
                );
              })}
              {/* Slot rows */}
              {slotsToShow.map((slot) => (
                <React.Fragment key={slot}>
                  <div className="text-[11px] font-medium text-muted-foreground pt-2 pr-2 text-right">
                    {slot === OTHER_SLOT ? 'Other' : slot}
                  </div>
                  {WEEK_DAYS.map(({ dayIndex }) => {
                    const items = grid[dayIndex]?.[slot] || [];
                    return (
                      <div key={`${slot}-${dayIndex}`} className="space-y-1.5 rounded-md bg-muted/30 p-1.5 min-h-[60px]">
                        {items.map(renderChip)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile / tablet: stacked by day */}
          <div className="lg:hidden space-y-4">
            {WEEK_DAYS.map(({ label, dayIndex }, idx) => {
              const daySlots = slotsToShow
                .map((slot) => ({ slot, items: grid[dayIndex]?.[slot] || [] }))
                .filter((s) => s.items.length > 0);
              if (daySlots.length === 0) return null;
              const date = addDays(weekStart, idx);
              return (
                <Card key={label}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-semibold">{label}</h3>
                      <span className="text-xs text-muted-foreground">{format(date, 'MMM d')}</span>
                    </div>
                    {daySlots.map(({ slot, items }) => (
                      <div key={slot} className="space-y-1.5">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {slot === OTHER_SLOT ? 'Other' : slot}
                        </p>
                        {items.map(renderChip)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {filtered.length} class{filtered.length === 1 ? '' : 'es'} shown
        </p>
      )}

      <CalendarClassDetail classItem={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
};

export default InstructorCalendar;