
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClassSession {
  id: string;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  attendees: number;
  isUpcoming: boolean;
  topic?: string;
}

interface UpcomingClassCardProps {
  session: ClassSession;
  className?: string;
  studentId?: string;
  demoMode?: boolean;
}

export const UpcomingClassCard: React.FC<UpcomingClassCardProps> = ({ 
  session, 
  className,
  studentId,
  demoMode,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [marking, setMarking] = useState(false);

  const handleConfirmAbsent = async () => {
    if (!studentId) return;
    setMarking(true);
    try {
      // session.date is MM/DD/YYYY — convert to YYYY-MM-DD for Postgres date
      const [mm, dd, yyyy] = session.date.split('/');
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const { error } = await supabase.from('attendance').insert({
        student_id: studentId,
        status: 'absent',
        date: isoDate,
        notes: reason || null,
      });
      if (error) throw error;
      toast.success('Marked absent. Your instructor has been notified.');
      setDialogOpen(false);
      setReason('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to mark absent');
    } finally {
      setMarking(false);
    }
  };

  return (
    <>
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={session.isUpcoming ? "default" : "outline"} className={session.isUpcoming ? "bg-deckademics-primary" : ""}>
            {session.isUpcoming ? "Upcoming" : "Past"}
          </Badge>
          <span className="text-xs text-muted-foreground">{session.date}</span>
        </div>
        <CardTitle className="text-base">{session.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-3">
          {session.topic && (
            <p className="text-sm text-muted-foreground">
              Topic: {session.topic}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{session.time} ({session.duration})</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{session.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Instructor: {session.instructor}</span>
          </div>
        </div>
      </CardContent>
      {session.isUpcoming && studentId && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline"
            size="sm"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setDialogOpen(true)}
            disabled={demoMode || marking}
          >
            <XCircle className="h-4 w-4" />
            Mark Absent
          </Button>
        </CardFooter>
      )}
    </Card>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Absent for {session.date}</DialogTitle>
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
