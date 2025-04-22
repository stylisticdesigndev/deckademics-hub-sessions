
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { Database } from '@/integrations/supabase/types';

type TeachingScheduleItem = {
  id?: string;
  day: string;
  hours: string;
};

interface ScheduleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleItems: TeachingScheduleItem[];
  instructorId: string;
  onScheduleUpdated: (newSchedule: TeachingScheduleItem[]) => void;
}

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ScheduleEditor = ({ open, onOpenChange, scheduleItems, instructorId, onScheduleUpdated }: ScheduleEditorProps) => {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<TeachingScheduleItem[]>([...scheduleItems]);
  const [loading, setLoading] = useState(false);
  const { session, signOut } = useAuth();

  // Reset schedule items when props change
  useEffect(() => {
    if (open) {
      setSchedule([...scheduleItems]);
    }
  }, [open, scheduleItems]);

  const handleAddDay = () => {
    setSchedule([...schedule, { day: 'Monday', hours: '2:00 PM - 5:00 PM' }]);
  };

  const handleRemoveDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    setSchedule(newSchedule);
  };

  const handleChangeDay = (index: number, day: string) => {
    const newSchedule = [...schedule];
    newSchedule[index].day = day;
    setSchedule(newSchedule);
  };

  const handleChangeHours = (index: number, hours: string) => {
    const newSchedule = [...schedule];
    newSchedule[index].hours = hours;
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    if (!instructorId) {
      toast({
        title: "Error",
        description: "Unable to identify instructor. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!session) {
      toast({
        title: "Authentication Error",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive"
      });
      setTimeout(() => signOut(), 2000);
      return;
    }

    setLoading(true);
    try {
      // First delete all existing schedule items
      const { error: deleteError } = await supabase
        .from('instructor_schedules')
        .delete()
        .eq('instructor_id', instructorId as any);

      if (deleteError) {
        // Check for auth error
        if (deleteError.message.includes('JWT') || deleteError.message.includes('token') || deleteError.message.includes('auth')) {
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive"
          });
          setTimeout(() => signOut(), 2000);
          return;
        }
        throw deleteError;
      }

      // Only insert if there are schedule items
      if (schedule.length > 0) {
        // Process each item one by one for better type safety
        for (const item of schedule) {
          const scheduleData: Database['public']['Tables']['instructor_schedules']['Insert'] = {
            instructor_id: instructorId,
            day: item.day,
            hours: item.hours
          };
          
          const { error: insertError } = await supabase
            .from('instructor_schedules')
            .insert([scheduleData]);

          if (insertError) {
            // Check for auth error
            if (insertError.message.includes('JWT') || insertError.message.includes('token') || insertError.message.includes('auth')) {
              toast({
                title: "Authentication Error",
                description: "Your session has expired. Please sign in again.",
                variant: "destructive"
              });
              setTimeout(() => signOut(), 2000);
              return;
            }
            throw insertError;
          }
        }
      }

      // Success!
      toast({
        title: "Schedule updated",
        description: "Your teaching schedule has been saved successfully."
      });

      // Update the parent component
      onScheduleUpdated(schedule);
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Error saving schedule",
        description: "There was a problem saving your schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Teaching Schedule</DialogTitle>
          <DialogDescription>
            Set your weekly teaching hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {schedule.map((item, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor={`day-${index}`}>Day</Label>
                <Select
                  value={item.day}
                  onValueChange={(value) => handleChangeDay(index, value)}
                >
                  <SelectTrigger id={`day-${index}`}>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor={`hours-${index}`}>Hours</Label>
                <Input 
                  id={`hours-${index}`} 
                  value={item.hours} 
                  onChange={(e) => handleChangeHours(index, e.target.value)} 
                  placeholder="e.g., 2:00 PM - 8:00 PM" 
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleRemoveDay(index)}
                className="mb-0.5"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {schedule.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No teaching days added yet. Click the button below to add a teaching day.
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleAddDay}
          >
            Add Teaching Day
          </Button>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button
            type="button" 
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
