import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';

const capitalizeLevel = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);

export function TodayAttendanceSection({ demoMode }: { demoMode: boolean }) {
  const { userData } = useAuth();
  const instructorId = userData.user?.id;
  const { todayStudents, saving, markAttendance, loading } = useInstructorAttendance(instructorId);

  if (loading) return null;

  const items = demoMode
    ? [
        { student: { id: '1', name: 'Alex Rivera', initials: 'AR', avatar: null, level: 'novice', classDay: 'Wednesday', classTime: '3:30 PM - 5:00 PM' }, dateStr: '', status: null as 'present' | 'absent' | null },
        { student: { id: '2', name: 'Jordan Chen', initials: 'JC', avatar: null, level: 'amateur', classDay: 'Wednesday', classTime: '5:30 PM - 7:00 PM' }, dateStr: '', status: 'present' as const },
      ]
    : todayStudents;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Today's Attendance</h2>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No classes scheduled for today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.student.id} className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {item.student.avatar && <AvatarImage src={item.student.avatar} />}
                  <AvatarFallback className="text-sm">{item.student.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {capitalizeLevel(item.student.level)} · {item.student.classTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status !== null ? (
                    <Badge className={cn(
                      'text-xs',
                      item.status === 'present'
                        ? 'bg-green-600/20 text-green-400 border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border-red-600/30'
                    )}>
                      {item.status === 'present' ? 'Present' : 'Absent'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-muted-foreground/20 text-muted-foreground">
                      Not Recorded
                    </Badge>
                  )}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant={item.status === 'present' ? 'default' : 'outline'}
                      className={cn(
                        'h-8 gap-1',
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
                        'h-8 gap-1',
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
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
