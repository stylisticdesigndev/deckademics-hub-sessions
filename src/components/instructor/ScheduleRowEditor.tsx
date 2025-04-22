
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type TeachingScheduleItem = {
  id?: string;
  day: string;
  hours: string;
};

interface Props {
  item: TeachingScheduleItem;
  index: number;
  onChangeDay: (index: number, day: string) => void;
  onChangeHours: (index: number, hours: string) => void;
  onRemove: (index: number) => void;
}

export const ScheduleRowEditor = ({
  item,
  index,
  onChangeDay,
  onChangeHours,
  onRemove
}: Props) => (
  <div className="flex items-end gap-2">
    <div className="flex-1">
      <Label htmlFor={`day-${index}`}>Day</Label>
      <Select
        value={item.day}
        onValueChange={(value) => onChangeDay(index, value)}
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
        onChange={(e) => onChangeHours(index, e.target.value)} 
        placeholder="e.g., 2:00 PM - 8:00 PM" 
      />
    </div>
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => onRemove(index)}
      className="mb-0.5"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
);
