
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

interface StudentNoteDialogProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNote?: string;
  onSaveNote: (studentId: string, note: string) => void;
}

export const StudentNoteDialog = ({
  studentId,
  studentName,
  open,
  onOpenChange,
  existingNote = '',
  onSaveNote
}: StudentNoteDialogProps) => {
  const [note, setNote] = useState(existingNote);
  
  const handleSave = () => {
    onSaveNote(studentId, note);
    toast({
      title: 'Note Saved',
      description: `Note for ${studentName} has been saved successfully.`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span>Class Notes for {studentName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter notes for today's class..."
            className="min-h-[150px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
