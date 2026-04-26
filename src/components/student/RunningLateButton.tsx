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
      const expires = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('student_status').insert({
        student_id: studentId,
        status: 'running_late',
        expires_at: expires,
      });
      if (error) throw error;
      toast({ title: 'Instructor notified', description: 'Your instructor knows you’re running late.' });
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
