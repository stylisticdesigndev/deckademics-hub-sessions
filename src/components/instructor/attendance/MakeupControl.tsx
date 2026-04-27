import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, CheckCircle, XCircle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { MakeupRow, MakeupStatus } from '@/hooks/instructor/useInstructorMakeups';

interface Props {
  makeup: MakeupRow | null;
  disabled?: boolean;
  onSchedule: (date: Date) => void;
  onSetStatus: (status: MakeupStatus) => void;
}

export function MakeupControl({ makeup, disabled, onSchedule, onSetStatus }: Props) {
  const [open, setOpen] = useState(false);

  const handleSelect = (d: Date | undefined) => {
    if (!d) return;
    onSchedule(d);
    setOpen(false);
  };

  if (!makeup) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 gap-1" disabled={disabled}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule Make-up
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            onSelect={handleSelect}
            fromDate={new Date()}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    );
  }

  const makeupDate = parseISO(makeup.makeup_date);
  const statusBadge =
    makeup.status === 'attended' ? (
      <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">Made up</Badge>
    ) : makeup.status === 'not_attended' ? (
      <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">Missed Make-up</Badge>
    ) : (
      <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">Scheduled</Badge>
    );

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarIcon className="h-3.5 w-3.5" />
        Make-up: <span className="font-medium text-foreground">{format(makeupDate, 'MMM d, yyyy')}</span>
      </div>
      {statusBadge}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant={makeup.status === 'attended' ? 'default' : 'outline'}
          className={cn('h-8 gap-1', makeup.status === 'attended' && 'bg-green-600 hover:bg-green-700 text-white')}
          disabled={disabled}
          onClick={() => onSetStatus('attended')}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Attended
        </Button>
        <Button
          size="sm"
          variant={makeup.status === 'not_attended' ? 'default' : 'outline'}
          className={cn('h-8 gap-1', makeup.status === 'not_attended' && 'bg-red-600 hover:bg-red-700 text-white')}
          disabled={disabled}
          onClick={() => onSetStatus('not_attended')}
        >
          <XCircle className="h-3.5 w-3.5" />
          Not Attended
        </Button>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" disabled={disabled}>
              Reschedule
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={makeupDate}
              onSelect={handleSelect}
              fromDate={new Date()}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}