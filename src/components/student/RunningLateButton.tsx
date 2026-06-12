import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { notifyStudentEvent } from '@/lib/notifyPush';
import { useToast } from '@/hooks/use-toast';

interface Props {
  studentId?: string;
  disabled?: boolean;
}

export const RunningLateButton = ({ studentId, disabled }: Props) => {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    if (!studentId) return;
    setSending(true);
    try {
      // Action 1: Status update — insert running_late status with 4hr expiry
      const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      const { error: statusErr } = await supabase.from('student_status').insert({
        student_id: studentId,
        status: 'running_late',
        expires_at: expires,
      });
      if (statusErr) throw statusErr;

      // Action 2: Notify ALL instructors (primary + secondary + cover)
      // server-side — reliable in-app message + push.
      await notifyStudentEvent(studentId, 'late');

      toast({
        title: 'Instructor notified',
        description: 'Your status, message, and alert have all been sent.',
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Could not notify', description: e.message ?? 'Try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || sending || !studentId}
      className="gap-2 border-warning/50 text-warning hover:bg-warning/10"
    >
      <Clock className="h-4 w-4" />
      {sending ? 'Sending…' : "I'm Running Late"}
    </Button>
  );
};
