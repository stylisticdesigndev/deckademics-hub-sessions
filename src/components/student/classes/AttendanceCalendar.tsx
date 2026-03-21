import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceDay {
  date: Date;
  status: 'present' | 'absent' | 'upcoming';
}

interface AttendanceCalendarProps {
  attendanceDays: AttendanceDay[];
  onDayClick?: (date: Date) => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  attendanceDays,
  onDayClick,
}) => {
  const [month, setMonth] = useState(new Date());

  const presentDays = attendanceDays.filter(d => d.status === 'present').map(d => d.date);
  const absentDays = attendanceDays.filter(d => d.status === 'absent').map(d => d.date);
  const upcomingDays = attendanceDays.filter(d => d.status === 'upcoming').map(d => d.date);

  const modifiers = {
    present: presentDays,
    absent: absentDays,
    upcoming: upcomingDays,
  };

  const modifiersStyles = {
    present: {
      backgroundColor: 'hsl(142, 71%, 45%)',
      color: 'white',
      borderRadius: '50%',
    },
    absent: {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'white',
      borderRadius: '50%',
    },
    upcoming: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '50%',
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Attendance Calendar</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMonth(subMonths(month, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {format(month, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          onDayClick={(day) => onDayClick?.(day)}
          className={cn("p-0 pointer-events-auto")}
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-1",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: "h-9 w-9 p-0 font-normal text-sm hover:bg-accent rounded-full flex items-center justify-center cursor-pointer",
            day_today: "font-bold border border-primary rounded-full",
            day_outside: "text-muted-foreground opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
          }}
        />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }} />
            Present
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--destructive))' }} />
            Absent
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
            Upcoming
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full" style={{ border: '2px solid hsl(var(--primary))', backgroundColor: 'transparent' }} />
            Today
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
