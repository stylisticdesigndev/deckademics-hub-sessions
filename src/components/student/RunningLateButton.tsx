import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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

      // Action 2: Automated message to instructor
      const { data: studentRow } = await supabase
        .from('students')
        .select('instructor_id, profiles!inner(first_name, last_name)')
        .eq('id', studentId)
        .maybeSingle() as any;

      const instructorId = studentRow?.instructor_id;
      const studentName = `${studentRow?.profiles?.first_name ?? ''} ${studentRow?.profiles?.last_name ?? ''}`.trim() || 'Your student';

      if (instructorId) {
        await supabase.from('messages').insert({
          sender_id: studentId,
          receiver_id: instructorId,
          subject: 'Running Late',
          content: `Heads up — I'm running late to today's class.`,
        });

        // Action 3: Push notification — invoke edge function (in-app + future FCM hook)
        try {
          await supabase.functions.invoke('notify-instructor-late', {
            body: { instructor_id: instructorId, student_id: studentId, student_name: studentName },
          });
        } catch (pushErr) {
          // Push is best-effort — don't fail the whole flow
          console.warn('Push notification failed:', pushErr);
        }
      }

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
