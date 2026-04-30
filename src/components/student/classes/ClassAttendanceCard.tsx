import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, XCircle, RotateCcw } from 'lucide-react';
import { cn, formatDateUS } from '@/lib/utils';

interface ClassAttendanceCardProps {
  date: Date;
  title: string;
  time: string;
  duration: string;
  location: string;
  instructor: string;
  isNext?: boolean;
  status?: 'present' | 'absent' | 'upcoming' | 'unmarked';
  onMarkAbsent?: (date: Date, reason?: string) => void;
  onUndoAbsent?: (date: Date) => void;
  marking?: boolean;
}

export const ClassAttendanceCard: React.FC<ClassAttendanceCardProps> = ({
  date,
  title,
  time,
  duration,
  location,
  isNext = false,
  status = 'upcoming',
  onMarkAbsent,
  onUndoAbsent,
  marking = false,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirmAbsent = () => {
    onMarkAbsent?.(date, reason || undefined);
    setDialogOpen(false);
    setReason('');
  };

  const statusBadge = () => {
    switch (status) {
      case 'present':
        return <Badge className="text-white" style={{ backgroundColor: 'hsl(142, 71%, 45%)' }}>Present</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'unmarked':
        return <Badge variant="secondary" className="text-muted-foreground">Not Recorded</Badge>;
      case 'upcoming':
        return isNext
          ? <Badge className="bg-primary text-primary-foreground">Next Class</Badge>
          : <Badge variant="outline">Upcoming</Badge>;
      default:
        return null;
    }
  };

  const isPast = status === 'present' || status === 'absent';

  return (
    <>
      <Card className={cn(
        "transition-all",
        isNext && "border-primary shadow-md",
        status === 'absent' && "opacity-75"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {statusBadge()}
                <span className="text-sm font-medium">
                  {formatDateUS(date)}
                </span>
              </div>

              <h3 className="font-semibold">{title}</h3>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {time} ({duration})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {location}
                </span>
              </div>
            </div>

            {status === 'upcoming' && onMarkAbsent && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setDialogOpen(true)}
                disabled={marking}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Mark Absent
              </Button>
            )}

            {status === 'absent' && onUndoAbsent && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onUndoAbsent(date)}
                disabled={marking}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                I can make it
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Absent for {formatDateUS(date)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Your instructor will be notified and this class will be available for makeup.
          </p>
          <Textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmAbsent} disabled={marking}>
              Confirm Absent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
