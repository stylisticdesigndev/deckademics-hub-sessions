
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserRound, Loader2 } from 'lucide-react';
import { useInstructorAssignment } from '@/hooks/useInstructorAssignment';
import { toast } from 'sonner';

interface InstructorAssignmentDialogProps {
  studentId: string;
  studentName: string;
  currentInstructorId?: string;
  children?: React.ReactNode;
}

export const InstructorAssignmentDialog: React.FC<InstructorAssignmentDialogProps> = ({
  studentId,
  studentName,
  currentInstructorId,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(currentInstructorId || null);
  
  const {
    activeInstructors,
    isLoadingInstructors,
    assignInstructorToStudent
  } = useInstructorAssignment();

  const handleAssignInstructor = async () => {
    if (!selectedInstructorId) {
      toast.error('Please select an instructor');
      return;
    }

    try {
      await assignInstructorToStudent.mutateAsync({
        studentId,
        instructorId: selectedInstructorId
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error in handleAssignInstructor:', error);
    }
  };

  const handleRemoveInstructor = async () => {
    try {
      await assignInstructorToStudent.mutateAsync({
        studentId,
        instructorId: null
      });
      
      setSelectedInstructorId(null);
      setOpen(false);
    } catch (error) {
      console.error('Error in handleRemoveInstructor:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <UserRound className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Instructor to {studentName}</DialogTitle>
          <DialogDescription>
            Select an instructor to assign to this student.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoadingInstructors ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading instructors...</span>
            </div>
          ) : activeInstructors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active instructors available.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Available Instructors ({activeInstructors.length})
                </div>
                {currentInstructorId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveInstructor}
                    disabled={assignInstructorToStudent.isPending}
                  >
                    Remove Current Instructor
                  </Button>
                )}
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeInstructors.map((instructor) => (
                    <TableRow 
                      key={instructor.id}
                      className={selectedInstructorId === instructor.id ? 'bg-muted' : 'cursor-pointer hover:bg-muted/50'}
                      onClick={() => setSelectedInstructorId(instructor.id)}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          name="instructor"
                          checked={selectedInstructorId === instructor.id}
                          onChange={() => setSelectedInstructorId(instructor.id)}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {instructor.profile.first_name} {instructor.profile.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {instructor.profile.email}
                      </TableCell>
                      <TableCell>{instructor.years_experience || 0} years</TableCell>
                      <TableCell>${instructor.hourly_rate || 0}/hr</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          {instructor.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignInstructor}
            disabled={!selectedInstructorId || assignInstructorToStudent.isPending}
          >
            {assignInstructorToStudent.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Instructor'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
