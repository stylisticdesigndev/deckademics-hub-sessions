import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';

const capitalizeLevel = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);

export function TodayAttendanceSection({ demoMode }: { demoMode: boolean }) {
  const { userData } = useAuth();
  const instructorId = userData.user?.id || userData.profile?.id;
  const { todayStudents, currentWeekStudents, saving, markAttendance, loading } = useInstructorAttendance(instructorId);

  if (loading) return null;

  const items = demoMode
    ? [
        { student: { id: '1', name: 'Alex Rivera', initials: 'AR', avatar: null, level: 'novice', classDay: 'Wednesday', classTime: '3:30 PM - 5:00 PM' }, dateStr: '', status: null as 'present' | 'absent' | null },
        { student: { id: '2', name: 'Jordan Chen', initials: 'JC', avatar: null, level: 'amateur', classDay: 'Wednesday', classTime: '5:30 PM - 7:00 PM' }, dateStr: '', status: 'present' as const },
      ]
    : (todayStudents.length > 0 ? todayStudents : currentWeekStudents);

  const hasToday = demoMode || todayStudents.length > 0;
  const heading = hasToday ? "Today's Attendance" : "This Week's Attendance";

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{heading}</h2>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No classes scheduled this week</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.student.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Identity row */}
                <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                  <Avatar className="h-10 w-10 shrink-0">
                    {item.student.avatar && <AvatarImage src={item.student.avatar} />}
                    <AvatarFallback className="text-sm">{item.student.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.student.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {capitalizeLevel(item.student.level)} · {item.student.classTime}
                    </p>
                  </div>
                </div>
                {/* Action buttons: full-width grid on mobile, inline on sm+ */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-1.5">
                  <Button
                    size="sm"
                    variant={item.status === 'present' ? 'default' : 'outline'}
                    className={cn(
                      'h-9 gap-1 sm:h-8',
                      item.status === 'present' && 'bg-green-600 hover:bg-green-700 text-white'
                    )}
                    disabled={saving || demoMode}
                    onClick={() => markAttendance(item.student.id, item.dateStr, 'present')}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Present
                  </Button>
                  <Button
                    size="sm"
                    variant={item.status === 'absent' ? 'default' : 'outline'}
                    className={cn(
                      'h-9 gap-1 sm:h-8',
                      item.status === 'absent' && 'bg-red-600 hover:bg-red-700 text-white'
                    )}
                    disabled={saving || demoMode}
                    onClick={() => markAttendance(item.student.id, item.dateStr, 'absent')}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Absent
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
