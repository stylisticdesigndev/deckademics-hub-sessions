
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';

type TeachingScheduleItem = {
  id?: string;
  day: string;
  hours: string;
};

export function useScheduleActions(
  schedule: TeachingScheduleItem[], 
  instructorId: string, 
  onScheduleUpdated: (newSchedule: TeachingScheduleItem[]) => void, 
  closeDialog: (state: boolean) => void
) {
  const { toast } = useToast();
  const { session, signOut } = useAuth();

  const saveSchedule = async () => {
    if (!instructorId) {
      toast({
        title: "Error",
        description: "Unable to identify instructor. Please try again.",
        variant: "destructive"
      });
      return false;
    }
    if (!session) {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive"
      });
      setTimeout(() => signOut(), 2000);
      return false;
    }
    try {
      // Delete existing schedule
      const { error: deleteError } = await supabase
        .from('instructor_schedules')
        .delete()
        .eq('instructor_id', instructorId as any);

      if (deleteError) {
        if (deleteError.message.includes('JWT') || deleteError.message.includes('token') || deleteError.message.includes('auth')) {
            toast({
              title: "Authentication Error",
              description: "Your session has expired. Please sign in again.",
              variant: "destructive"
            });
            setTimeout(() => signOut(), 2000);
            return false;
          }
        throw deleteError;
      }

      if (schedule.length > 0) {
        // Create properly typed schedule data
        const scheduleData = schedule.map(item => ({
          instructor_id: instructorId,
          day: item.day,
          hours: item.hours
        }));
        
        const { error: insertError } = await supabase
          .from('instructor_schedules')
          .insert(scheduleData as any);
          
        if (insertError) {
          if (insertError.message.includes('JWT') || insertError.message.includes('token') || insertError.message.includes('auth')) {
            toast({
              title: "Authentication Error",
              description: "Your session has expired. Please sign in again.",
              variant: "destructive"
            });
            setTimeout(() => signOut(), 2000);
            return false;
          }
          throw insertError;
        }
      }
      toast({
        title: "Schedule updated",
        description: "Your teaching schedule has been saved successfully."
      });
      onScheduleUpdated(schedule);
      closeDialog(false);
      return true;
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error saving schedule",
        description: "There was a problem saving your schedule. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };
  return { saveSchedule };
}
