import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const TIME_SLOTS = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];

interface StudentRow {
  id: string;
  name: string;
}

interface AddCoverSessionDialogProps {
  instructorId: string;
  onCreated?: () => void;
}

export function AddCoverSessionDialog({ instructorId, onCreated }: AddCoverSessionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [studentId, setStudentId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [classTime, setClassTime] = useState<string>(TIME_SLOTS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      // Active students at the school. RLS restricts admins; instructors may not see all.
      // For instructor self-service, we surface only the students they already have access to
      // (assigned or previously covered) — admins should add covers for non-assigned students.
      const { data } = await supabase
        .from('students')
        .select('id, profiles!inner(first_name, last_name)')
        .eq('enrollment_status', 'active');
      const rows = ((data as any[]) || []).map(r => ({
        id: r.id,
        name: `${r.profiles?.first_name || ''} ${r.profiles?.last_name || ''}`.trim() || 'Student',
      }));
      setStudents(rows.sort((a, b) => a.name.localeCompare(b.name)));
    })();
  }, [open]);

  const submit = async () => {
    if (!studentId || !date || !classTime) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Pick a student, date, and time slot.' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('cover_sessions' as any)
      .insert({
        student_id: studentId,
        cover_instructor_id: instructorId,
        class_date: format(date, 'yyyy-MM-dd'),
        class_time: classTime,
        created_by: instructorId,
      });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not add cover', description: error.message });
      return;
    }
    toast({ title: 'Cover session added' });
    setOpen(false);
    setStudentId('');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cover Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
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