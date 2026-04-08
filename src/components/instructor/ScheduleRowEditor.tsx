
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

import { CLASS_SLOTS } from '@/utils/instructorSchedule';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const CLASS_SLOT_OPTIONS = CLASS_SLOTS.map((slot) => ({ label: slot, value: slot }));

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
}: Props) => {
  const selectedSlots = item.hours ? item.hours.split(', ').filter(Boolean) : [];

  const toggleSlot = (slot: string) => {
    let updated: string[];
    if (selectedSlots.includes(slot)) {
      updated = selectedSlots.filter(s => s !== slot);
    } else {
      updated = [...selectedSlots, slot];
      // Sort by the order in CLASS_SLOTS
      updated.sort((a, b) => {
        const ai = CLASS_SLOTS.indexOf(a as (typeof CLASS_SLOTS)[number]);
        const bi = CLASS_SLOTS.indexOf(b as (typeof CLASS_SLOTS)[number]);
        return ai - bi;
      });
    }
    onChangeHours(index, updated.join(', '));
  };

  return (
    <div className="space-y-2 border rounded-lg p-3">
      <div className="flex items-center justify-between">
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
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onRemove(index)}
          className="mt-5"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div>
        <Label>Class Slots</Label>
        <div className="space-y-2 mt-1">
          {CLASS_SLOT_OPTIONS.map((slot) => (
            <div key={slot.value} className="flex items-center space-x-2">
              <Checkbox
                id={`slot-${index}-${slot.value}`}
                checked={selectedSlots.includes(slot.value)}
                onCheckedChange={() => toggleSlot(slot.value)}
              />
              <label
                htmlFor={`slot-${index}-${slot.value}`}
                className="text-sm cursor-pointer"
              >
                {slot.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
