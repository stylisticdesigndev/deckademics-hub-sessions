
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserRound, Loader2 } from 'lucide-react';
import { useStudentAssignment } from '@/hooks/useStudentAssignment';
import { toast } from 'sonner';

interface StudentAssignmentDialogProps {
  instructorId: string;
  instructorName: string;
  children?: React.ReactNode;
}

export const StudentAssignmentDialog: React.FC<StudentAssignmentDialogProps> = ({
  instructorId,
  instructorName,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const {
    unassignedStudents,
    isLoadingStudents,
    assignStudentsToInstructor
  } = useStudentAssignment();

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === unassignedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(unassignedStudents.map(student => student.id));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      await assignStudentsToInstructor.mutateAsync({
        instructorId,
        studentIds: selectedStudents
      });
      
      setSelectedStudents([]);
      setOpen(false);
    } catch (error) {
      console.error('Error in handleAssignStudents:', error);
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
          <DialogTitle>Assign Students to {instructorName}</DialogTitle>
          <DialogDescription>
            Select unassigned students to assign to this instructor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoadingStudents ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading students...</span>
            </div>
          ) : unassignedStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unassigned students available.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedStudents.length === unassignedStudents.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({unassignedStudents.length} students)
                  </label>
                </div>
                <Badge variant="outline">
                  {selectedStudents.length} selected
                </Badge>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell>{student.level}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500">
                          {student.enrollment_status}
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
            onClick={handleAssignStudents}
            disabled={selectedStudents.length === 0 || assignStudentsToInstructor.isPending}
          >
            {assignStudentsToInstructor.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
