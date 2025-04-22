
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScheduleRowEditor } from './ScheduleRowEditor';
import { useScheduleActions } from './useScheduleActions';

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

export const ScheduleEditorDialog = ({
  open, onOpenChange, scheduleItems, instructorId, onScheduleUpdated
}: ScheduleEditorProps) => {
  const [schedule, setSchedule] = useState<TeachingScheduleItem[]>([...scheduleItems]);
  const [loading, setLoading] = useState(false);
  const { saveSchedule } = useScheduleActions(schedule, instructorId, onScheduleUpdated, onOpenChange);

  useEffect(() => {
    if (open) setSchedule([...scheduleItems]);
  }, [open, scheduleItems]);

  const handleAddDay = () => setSchedule([...schedule, { day: 'Monday', hours: '2:00 PM - 5:00 PM' }]);
  const handleRemoveDay = (index: number) => setSchedule(schedule.filter((_, i) => i !== index));
  const handleChangeDay = (index: number, day: string) => setSchedule(
    schedule.map((item, i) => i === index ? { ...item, day } : item)
  );
  const handleChangeHours = (index: number, hours: string) => setSchedule(
    schedule.map((item, i) => i === index ? { ...item, hours } : item)
  );

  const handleSave = async () => {
    setLoading(true);
    await saveSchedule();
    setLoading(false);
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
            <ScheduleRowEditor
              key={index}
              item={item}
              index={index}
              onChangeDay={handleChangeDay}
              onChangeHours={handleChangeHours}
              onRemove={handleRemoveDay}
            />
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
