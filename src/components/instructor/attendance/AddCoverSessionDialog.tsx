import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TIME_SLOTS = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};
const DAY_DISPLAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function normalizeDay(day?: string | null): string {
  const n = (day || '').trim().toLowerCase().replace(/s$/, '');
  const num = DAY_NAME_TO_NUMBER[n];
  return num === undefined ? '' : DAY_DISPLAY[num];
}

interface StudentRow {
  id: string;
  name: string;
  classDay: string;
  classTime: string;
}

interface AddCoverSessionDialogProps {
  instructorId: string;
  onCreated?: () => void;
}

export function AddCoverSessionDialog({ instructorId, onCreated }: AddCoverSessionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [classTime, setClassTime] = useState<string>(TIME_SLOTS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('id, class_day, class_time, profiles!inner(first_name, last_name)')
        .eq('enrollment_status', 'active');
      const rows = ((data as any[]) || []).map(r => ({
        id: r.id,
        name: `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.trim() || 'Student',
        classDay: normalizeDay(r.class_day),
        classTime: (r.class_time || '').trim(),
      }));
      setStudents(rows.sort((a, b) => a.name.localeCompare(b.name)));
    })();
  }, [open]);

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Only show students whose normal class day matches the picked date,
  // grouped by their time slot. (Cover sessions are logged after the class,
  // so the instructor only needs to see who normally attends that day.)
  const pickedDayName = date ? DAY_DISPLAY[date.getDay()] : '';
  const studentsForDay = students.filter(s => s.classDay === pickedDayName);
  const studentsBySlot: Record<string, StudentRow[]> = {};
  TIME_SLOTS.forEach(slot => {
    studentsBySlot[slot] = studentsForDay.filter(s => s.classTime === slot);
  });
  const unscheduled = studentsForDay.filter(s => !TIME_SLOTS.includes(s.classTime));

  const submit = async () => {
    if (!date || !classTime) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Pick a date and time slot.' });
      return;
    }
    if (selectedIds.size === 0) {
      toast({
        variant: 'destructive',
        title: 'Add at least one student',
        description: 'Select every student you taught during this covered slot.',
      });
      return;
    }
    setSaving(true);
    const rows = Array.from(selectedIds).map(sid => ({
      student_id: sid,
      cover_instructor_id: instructorId,
      class_date: format(date, 'yyyy-MM-dd'),
      class_time: classTime,
      created_by: instructorId,
    }));
    const { error } = await supabase
      .from('cover_sessions' as any)
      .insert(rows);
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not add cover', description: error.message });
      return;
    }
    toast({
      title: 'Cover session logged',
      description: `Recorded for ${selectedIds.size} student${selectedIds.size === 1 ? '' : 's'}.`,
    });
    setOpen(false);
    setSelectedIds(new Set());
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Cover Session
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Cover Session</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Log a class slot you covered. Pick the date and time first, then check off the students who attended.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="rounded-md border w-full">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className={cn('p-3 pointer-events-auto w-full')}
                classNames={{
                  months: 'flex w-full',
                  month: 'space-y-4 w-full',
                  table: 'w-full border-collapse',
                  head_row: 'flex w-full',
                  head_cell: 'flex-1 text-muted-foreground rounded-md font-normal text-[0.8rem]',
                  row: 'flex w-full mt-2',
                  cell: 'flex-1 h-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                  day: 'h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md',
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Time slot</Label>
            <Select value={classTime} onValueChange={setClassTime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Students taught</Label>
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} selected
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing students who normally have class on {pickedDayName || 'this day'}.
              Check off whoever attended.
            </p>
            <ScrollArea className="h-56 rounded-md border">
              <div className="p-2 space-y-1">
                {TIME_SLOTS.map(slot => {
                  const slotStudents = studentsBySlot[slot];
                  if (!slotStudents.length) return null;
                  return (
                    <div key={slot} className="space-y-0.5">
                      <div className="px-2 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {slot}
                      </div>
                      {slotStudents.map(s => (
                        <StudentCheckRow
                          key={s.id}
                          student={s}
                          checked={selectedIds.has(s.id)}
                          onToggle={() => toggleStudent(s.id)}
                        />
                      ))}
                    </div>
                  );
                })}
                {unscheduled.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-2 pt-1 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Other
                    </div>
                    {unscheduled.map(s => (
                      <StudentCheckRow
                        key={s.id}
                        student={s}
                        checked={selectedIds.has(s.id)}
                        onToggle={() => toggleStudent(s.id)}
                      />
                    ))}
                  </div>
                )}
                {studentsForDay.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-6">
                    No students normally attend on {pickedDayName || 'this day'}.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Cover'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StudentCheckRow({
  student,
  checked,
  onToggle,
}: {
  student: StudentRow;
  checked: boolean;
  onToggle: () => void;
}) {
  const hint = [student.classDay, student.classTime].filter(Boolean).join(' · ');
  return (
    <label
      className={cn(
        'flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors',
        checked && 'bg-accent'
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{student.name}</p>
        {hint && <p className="text-xs text-muted-foreground truncate">{hint}</p>}
      </div>
    </label>
  );
}