import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, capitalizeLevel } from '@/lib/utils';
import { useStudentGlance } from '@/hooks/instructor/useStudentGlance';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface SummaryStudent {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  level: string;
  masteredCount: number;
  skillTotal: number;
  isReady: boolean;
  classDay?: string;
  classTime?: string;
  classRoom?: string | null;
  notes?: { content: string; title?: string | null; created_at: string; authorName?: string }[];
}

interface StudentProfileSummaryProps {
  student: SummaryStudent;
  instructorId?: string;
  onAddNote?: () => void;
  onAddTask?: () => void;
  className?: string;
}

// Each action grows to fill the row so buttons stay evenly spaced with no
// leftover gap on the right, at any screen width.
const actionClass = 'flex-1 basis-[calc(50%-0.25rem)] sm:basis-32 min-w-0';

const Stat = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-lg border bg-card/50 p-3">
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </p>
    <p className="mt-1 text-sm font-semibold leading-tight">{value}</p>
    {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
  </div>
);

export const StudentProfileSummary = ({
  student,
  instructorId,
  onAddNote,
  onAddTask,
  className,
}: StudentProfileSummaryProps) => {
  const navigate = useNavigate();
  const { data: glance } = useStudentGlance(student.id, instructorId);

  const latestNote = student.notes?.[0];
  const nextClass = [student.classDay, student.classTime].filter(Boolean).join(' · ');

  return (
    <section className={cn('space-y-3', className)}>
      {/* Status flags */}
      {(glance?.activeStatus || glance?.absentToday || glance?.pendingScheduleChange || (glance?.unreadFromStudent ?? 0) > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {glance?.activeStatus && (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 capitalize">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {glance.activeStatus.replace(/_/g, ' ')}
            </Badge>
          )}
          {glance?.absentToday && (
            <Badge variant="outline" className="border-red-500/50 text-red-500">Absent today</Badge>
          )}
          {glance?.pendingScheduleChange && (
            <Badge variant="outline" className="border-blue-500/50 text-blue-500">Schedule change pending</Badge>
          )}
          {(glance?.unreadFromStudent ?? 0) > 0 && (
            <Badge variant="outline" className="border-primary/50 text-primary">
              {glance!.unreadFromStudent} unread message{glance!.unreadFromStudent > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* At a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          icon={CalendarClock}
          label="Next class"
          value={nextClass || 'Not assigned'}
          hint={student.classRoom ? `Classroom ${student.classRoom}` : undefined}
        />
        <Stat
          icon={CheckCircle2}
          label="Attendance"
          value={glance?.attendanceRate !== null && glance?.attendanceRate !== undefined
            ? `${glance.attendanceRate}%`
            : 'No records'}
          hint={glance?.presentStreak ? `${glance.presentStreak} in a row present` : undefined}
        />
        <Stat
          icon={TrendingUp}
          label={`${capitalizeLevel(student.level)} progress`}
          value={`${student.masteredCount}/${student.skillTotal} mastered`}
          hint={student.isReady ? 'Ready to advance' : undefined}
        />
      </div>

      {/* Latest note */}
      {latestNote && (
        <div className="rounded-lg border bg-card/50 p-3">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="h-3.5 w-3.5" />
            Latest note
            {latestNote.authorName ? ` · ${latestNote.authorName}` : ''}
            {' · '}
            {(() => {
              try { return format(new Date(latestNote.created_at), 'MM/dd/yyyy'); } catch { return ''; }
            })()}
          </p>
          <p className="mt-1 text-sm line-clamp-2">{latestNote.title ? `${latestNote.title}: ` : ''}{latestNote.content}</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className={actionClass} onClick={() => navigate(`/instructor/messages?to=${student.id}`)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Message
        </Button>
        {onAddNote && (
          <Button size="sm" variant="outline" className={actionClass} onClick={onAddNote}>
            <StickyNote className="h-4 w-4 mr-2" />
            Add note
          </Button>
        )}
        {onAddTask && (
          <Button size="sm" variant="outline" className={actionClass} onClick={onAddTask}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Add task
          </Button>
        )}
        {student.phone && (
          <Button size="sm" variant="outline" className={actionClass} asChild>
            <a href={`tel:${student.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </a>
          </Button>
        )}
        {student.email && (
          <Button size="sm" variant="outline" className={actionClass} asChild>
            <a href={`mailto:${student.email}`}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </a>
          </Button>
        )}
      </div>
    </section>
  );
};
