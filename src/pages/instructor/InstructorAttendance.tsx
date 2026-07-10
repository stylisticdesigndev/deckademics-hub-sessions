import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';
import { useInstructorMakeups, type MakeupRow, type MakeupStatus } from '@/hooks/instructor/useInstructorMakeups';
import { MakeupControl } from '@/components/instructor/attendance/MakeupControl';
import { AddCoverSessionDialog } from '@/components/instructor/attendance/AddCoverSessionDialog';
import { format, startOfDay, getDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const capitalizeLevel = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);

export default function InstructorAttendance() {
  const { userData } = useAuth();
  const instructorId = userData.user?.id || userData.profile?.id;
  const { currentWeekStudents, pastWeeksData, loading, saving, markAttendance, students, refetch } = useInstructorAttendance(instructorId);
  const { getMakeup, scheduleMakeup, setMakeupStatus, saving: makeupSaving } = useInstructorMakeups(instructorId);
  const [pastOpen, setPastOpen] = useState(false);
  const [pastWeekIndex, setPastWeekIndex] = useState(0);

  // Deep-link support: notifications/pushes link to ?dates=YYYY-MM-DD,YYYY-MM-DD
  // (or legacy ?date=) so the instructor lands on every overdue class.
  const [searchParams] = useSearchParams();
  const focusDates = useMemo(() => {
    const raw = searchParams.get('dates') ?? searchParams.get('date') ?? '';
    return raw.split(',').map((d) => d.trim()).filter(Boolean);
  }, [searchParams]);
  const focusSet = useMemo(() => new Set(focusDates), [focusDates]);
  // Land on the earliest overdue class so the instructor works forward in time.
  const earliestFocus = focusDates.length ? [...focusDates].sort()[0] : null;
  const focusHandled = useRef<string | null>(null);

  const today = startOfDay(new Date());
  const startOfWeekDate = addDays(today, -(getDay(today) === 0 ? 6 : getDay(today) - 1));

  // Group current week by day
  const groupedCurrentWeek = useMemo(() => {
    const items = currentWeekStudents;

    const grouped: Record<string, typeof items> = {};
    items.forEach(item => {
      const dayLabel = format(item.classDate, 'EEEE, MMMM d');
      if (!grouped[dayLabel]) grouped[dayLabel] = [];
      grouped[dayLabel].push(item);
    });
    return grouped;
  }, [currentWeekStudents, startOfWeekDate]);

  // Group past data by week
  const groupedPastWeeks = useMemo(() => {
    const grouped: Record<string, typeof pastWeeksData> = {};
    pastWeeksData.forEach(item => {
      const weekStart = addDays(item.classDate, -(getDay(item.classDate) === 0 ? 6 : getDay(item.classDate) - 1));
      const weekEnd = addDays(weekStart, 6);
      const sameMonth = format(weekStart, 'MMM') === format(weekEnd, 'MMM');
      const weekLabel = sameMonth
        ? `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd')}`
        : `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
      if (!grouped[weekLabel]) grouped[weekLabel] = [];
      grouped[weekLabel].push(item);
    });
    return grouped;
  }, [pastWeeksData]);

  // Sort past weeks chronologically descending (most recent past week first)
  const sortedPastWeeks = useMemo(() => {
    return Object.entries(groupedPastWeeks).sort(([, a], [, b]) => {
      const aDate = a[0]?.classDate?.getTime() ?? 0;
      const bDate = b[0]?.classDate?.getTime() ?? 0;
      return bDate - aDate;
    });
  }, [groupedPastWeeks]);

  // Reset to most recent week when the data set changes.
  useEffect(() => {
    setPastWeekIndex(0);
  }, [sortedPastWeeks.length]);

  // When a focus date is present, open the correct past week (if the class is
  // not in the current week) and scroll it into view. Runs once per date.
  useEffect(() => {
    const key = focusDates.join(',');
    if (!key || focusHandled.current === key) return;
    if (currentWeekStudents.length === 0 && sortedPastWeeks.length === 0) return;

    // Find the earliest overdue class that lives in a past week and open it.
    const pastFocus = focusDates
      .filter((d) => !currentWeekStudents.some((i) => i.dateStr === d))
      .sort();
    if (pastFocus.length > 0) {
      const target = pastFocus[0];
      const idx = sortedPastWeeks.findIndex(([, items]) =>
        items.some((it) => it.dateStr === target),
      );
      if (idx >= 0) {
        setPastOpen(true);
        setPastWeekIndex(idx);
      }
    }
    focusHandled.current = key;
  }, [focusDates, currentWeekStudents, sortedPastWeeks]);

  // Scroll the highlighted class into view once it is rendered.
  useEffect(() => {
    if (!earliestFocus) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-att-date="${earliestFocus}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [earliestFocus, pastOpen, pastWeekIndex, currentWeekStudents.length]);

  const totalPastWeeks = sortedPastWeeks.length;
  const safeIndex = Math.min(pastWeekIndex, Math.max(0, totalPastWeeks - 1));
  const currentPastWeek = sortedPastWeeks[safeIndex];

  // Count highlighted (overdue) classes per past week so the Previous/Next Week
  // controls can badge how many flagged classes sit in adjacent weeks. This
  // matters when overdue classes span more than one past week.
  const pastWeekFocusCounts = useMemo(
    () => sortedPastWeeks.map(([, items]) => items.filter((it) => focusSet.has(it.dateStr)).length),
    [sortedPastWeeks, focusSet],
  );
  const olderFocusCount = pastWeekFocusCounts.slice(safeIndex + 1).reduce((a, b) => a + b, 0);
  const newerFocusCount = pastWeekFocusCounts.slice(0, safeIndex).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const noStudents = students.length === 0;
  const noScheduled = Object.keys(groupedCurrentWeek).length === 0 && students.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Mark and review student attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {instructorId && (
            <AddCoverSessionDialog instructorId={instructorId} onCreated={refetch} />
          )}
        </div>
      </div>

      {/* Empty states */}
      {noStudents && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No students assigned</p>
          <p className="text-sm mt-1">Students will appear here once they are assigned to you.</p>
        </CardContent></Card>
      )}

      {noScheduled && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No classes scheduled this week</p>
          <p className="text-sm mt-1">Students need a class day assigned to appear here.</p>
        </CardContent></Card>
      )}

      {/* Current Week */}
      {Object.keys(groupedCurrentWeek).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">This Week</h2>
          {Object.entries(groupedCurrentWeek).map(([dayLabel, items]) => (
            <div key={dayLabel} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{dayLabel}</h3>
              {items.map(item => (
                <StudentAttendanceRow
                  key={`${item.student.id}-${item.dateStr}`}
                  student={item.student}
                  dateStr={item.dateStr}
                  status={item.status}
                  isPast={item.isPast}
                  saving={saving}
                  highlight={focusSet.has(item.dateStr)}
                  onMark={(status) => markAttendance(item.student.id, item.dateStr, status)}
                  makeup={getMakeup(item.student.id, item.dateStr)}
                  makeupSaving={makeupSaving}
                  onScheduleMakeup={(d) => scheduleMakeup(item.student.id, item.dateStr, format(d, 'yyyy-MM-dd'))}
                  onSetMakeupStatus={(s) => {
                    const m = getMakeup(item.student.id, item.dateStr);
                    if (m) setMakeupStatus(m.id, s);
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Past Weeks */}
      {totalPastWeeks > 0 && (
        <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-muted-foreground">
              <span className="font-semibold">Past Weeks</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', pastOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {currentPastWeek && (
              <div key={currentPastWeek[0]} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{currentPastWeek[0]}</h3>
                {currentPastWeek[1].map(item => (
                  <StudentAttendanceRow
                    key={`${item.student.id}-${item.dateStr}`}
                    student={item.student}
                    dateStr={item.dateStr}
                    status={item.status}
                    isPast={true}
                    saving={saving}
                    highlight={focusSet.has(item.dateStr)}
                    onMark={(status) => markAttendance(item.student.id, item.dateStr, status)}
                    makeup={getMakeup(item.student.id, item.dateStr)}
                    makeupSaving={makeupSaving}
                    onScheduleMakeup={(d) => scheduleMakeup(item.student.id, item.dateStr, format(d, 'yyyy-MM-dd'))}
                    onSetMakeupStatus={(s) => {
                      const m = getMakeup(item.student.id, item.dateStr);
                      if (m) setMakeupStatus(m.id, s);
                    }}
                  />
                ))}
              </div>
            )}

            {totalPastWeeks > 1 && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPastWeekIndex(i => Math.min(totalPastWeeks - 1, i + 1))}
                  disabled={safeIndex >= totalPastWeeks - 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous Week
                  {olderFocusCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-deckademics-primary text-white">
                      {olderFocusCount}
                    </Badge>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Week {safeIndex + 1} of {totalPastWeeks}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPastWeekIndex(i => Math.max(0, i - 1))}
                  disabled={safeIndex <= 0}
                  className="gap-1"
                >
                  Next Week
                  <ChevronRight className="h-4 w-4" />
                  {newerFocusCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 px-1.5 bg-deckademics-primary text-white">
                      {newerFocusCount}
                    </Badge>
                  )}
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function StudentAttendanceRow({
  student,
  dateStr,
  status,
  isPast,
  saving,
  highlight,
  onMark,
  makeup,
  makeupSaving,
  onScheduleMakeup,
  onSetMakeupStatus,
}: {
  student: { id: string; name: string; initials: string; avatar?: string | null; level: string; classDay: string; classTime: string };
  dateStr: string;
  status: 'present' | 'absent' | null;
  isPast: boolean;
  saving: boolean;
  highlight?: boolean;
  onMark: (status: 'present' | 'absent') => void;
  makeup: MakeupRow | null;
  makeupSaving: boolean;
  onScheduleMakeup: (date: Date) => void;
  onSetMakeupStatus: (status: MakeupStatus) => void;
}) {
  return (
    <Card
      data-att-date={dateStr}
      className={cn(
        'p-4 transition-shadow',
        highlight && 'ring-2 ring-deckademics-primary ring-offset-2 ring-offset-background',
      )}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <Avatar className="h-10 w-10">
          {student.avatar && <AvatarImage src={student.avatar} />}
          <AvatarFallback className="text-sm">{student.initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground">
            {capitalizeLevel(student.level)} · {student.classTime}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status !== null ? (
            <StatusBadge status={status} />
          ) : (
            <Badge variant="secondary" className="text-xs bg-muted-foreground/20 text-muted-foreground">
              Not Recorded
            </Badge>
          )}
          {isPast && (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={status === 'present' ? 'default' : 'outline'}
                className={cn(
                  'h-8 gap-1',
                  status === 'present' && 'bg-green-600 hover:bg-green-700 text-white'
                )}
                disabled={saving}
                onClick={() => onMark('present')}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Present
              </Button>
              <Button
                size="sm"
                variant={status === 'absent' ? 'default' : 'outline'}
                className={cn(
                  'h-8 gap-1',
                  status === 'absent' && 'bg-red-600 hover:bg-red-700 text-white'
                )}
                disabled={saving}
                onClick={() => onMark('absent')}
              >
                <XCircle className="h-3.5 w-3.5" />
                Absent
              </Button>
            </div>
          )}
        </div>
        {status === 'absent' && (
          <div className="w-full flex justify-end pt-1">
            <MakeupControl
              makeup={makeup}
              disabled={makeupSaving}
              onSchedule={onScheduleMakeup}
              onSetStatus={onSetMakeupStatus}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: 'present' | 'absent' | null }) {
  if (status === 'present') {
    return <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">Present</Badge>;
  }
  if (status === 'absent') {
    return <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Absent</Badge>;
  }
  return <Badge variant="secondary" className="text-xs bg-muted-foreground/20 text-muted-foreground">Not Recorded</Badge>;
}
