import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, EyeOff, CheckCircle, XCircle, ChevronDown, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';
import { useInstructorMakeups, type MakeupRow, type MakeupStatus } from '@/hooks/instructor/useInstructorMakeups';
import { MakeupControl } from '@/components/instructor/attendance/MakeupControl';
import { format, startOfDay, getDay, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const DEMO_STUDENTS = [
  { student: { id: '1', name: 'Alex Rivera', initials: 'AR', avatar: null, level: 'novice', classDay: 'Monday', classTime: '3:30 PM - 5:00 PM' }, status: 'present' as const },
  { student: { id: '2', name: 'Jordan Chen', initials: 'JC', avatar: null, level: 'amateur', classDay: 'Monday', classTime: '5:30 PM - 7:00 PM' }, status: null },
  { student: { id: '3', name: 'Sam Williams', initials: 'SW', avatar: null, level: 'intermediate', classDay: 'Wednesday', classTime: '3:30 PM - 5:00 PM' }, status: 'absent' as const },
  { student: { id: '4', name: 'Taylor Brooks', initials: 'TB', avatar: null, level: 'novice', classDay: 'Wednesday', classTime: '5:30 PM - 7:00 PM' }, status: null },
];

const capitalizeLevel = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);

export default function InstructorAttendance() {
  const { userData } = useAuth();
  const instructorId = userData.user?.id || userData.profile?.id;
  const { currentWeekStudents, pastWeeksData, loading, saving, markAttendance, students } = useInstructorAttendance(instructorId);
  const { getMakeup, scheduleMakeup, setMakeupStatus, saving: makeupSaving } = useInstructorMakeups(instructorId);
  const [demoMode, setDemoMode] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);

  const today = startOfDay(new Date());
  const startOfWeekDate = addDays(today, -(getDay(today) === 0 ? 6 : getDay(today) - 1));

  // Group current week by day
  const groupedCurrentWeek = useMemo(() => {
    const items = demoMode
      ? DEMO_STUDENTS.map((d, i) => ({
          student: d.student,
          classDate: addDays(startOfWeekDate, d.student.classDay === 'Monday' ? 0 : 2),
          dateStr: format(addDays(startOfWeekDate, d.student.classDay === 'Monday' ? 0 : 2), 'yyyy-MM-dd'),
          isPast: true,
          isThisWeek: true,
          status: d.status,
        }))
      : currentWeekStudents;

    const grouped: Record<string, typeof items> = {};
    items.forEach(item => {
      const dayLabel = format(item.classDate, 'EEEE, MMMM d');
      if (!grouped[dayLabel]) grouped[dayLabel] = [];
      grouped[dayLabel].push(item);
    });
    return grouped;
  }, [demoMode, currentWeekStudents, startOfWeekDate]);

  // Group past data by week
  const groupedPastWeeks = useMemo(() => {
    if (demoMode) return {};
    const grouped: Record<string, typeof pastWeeksData> = {};
    pastWeeksData.forEach(item => {
      const weekLabel = `Week of ${format(addDays(item.classDate, -(getDay(item.classDate) === 0 ? 6 : getDay(item.classDate) - 1)), 'MMM d')}`;
      if (!grouped[weekLabel]) grouped[weekLabel] = [];
      grouped[weekLabel].push(item);
    });
    return grouped;
  }, [demoMode, pastWeeksData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  const noStudents = !demoMode && students.length === 0;
  const noScheduled = !demoMode && Object.keys(groupedCurrentWeek).length === 0 && students.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Mark and review student attendance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDemoMode(!demoMode)}
          className="gap-1.5"
        >
          {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {demoMode ? 'Live Data' : 'Demo'}
        </Button>
      </div>

      {demoMode && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>Showing sample data. Toggle off to see real attendance.</AlertDescription>
        </Alert>
      )}

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
                  demoMode={demoMode}
                  onMark={(status) => markAttendance(item.student.id, item.dateStr, status)}
                  makeup={demoMode ? null : getMakeup(item.student.id, item.dateStr)}
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
      {Object.keys(groupedPastWeeks).length > 0 && (
        <Collapsible open={pastOpen} onOpenChange={setPastOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-muted-foreground">
              <span className="font-semibold">Past Weeks</span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', pastOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-2">
            {Object.entries(groupedPastWeeks).map(([weekLabel, items]) => (
              <div key={weekLabel} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{weekLabel}</h3>
                {items.map(item => (
                  <StudentAttendanceRow
                    key={`${item.student.id}-${item.dateStr}`}
                    student={item.student}
                    dateStr={item.dateStr}
                    status={item.status}
                    isPast={true}
                    saving={saving}
                    demoMode={demoMode}
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
  demoMode,
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
  demoMode: boolean;
  onMark: (status: 'present' | 'absent') => void;
  makeup: MakeupRow | null;
  makeupSaving: boolean;
  onScheduleMakeup: (date: Date) => void;
  onSetMakeupStatus: (status: MakeupStatus) => void;
}) {
  return (
    <Card className="p-4">
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
                disabled={saving || demoMode}
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
                disabled={saving || demoMode}
                onClick={() => onMark('absent')}
              >
                <XCircle className="h-3.5 w-3.5" />
                Absent
              </Button>
            </div>
          )}
        </div>
        {status === 'absent' && !demoMode && (
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
