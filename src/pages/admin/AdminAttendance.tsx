
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Check, X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type AttendanceStatus = 'missed' | 'attended' | 'made-up';

interface Student {
  id: string;
  name: string;
  email: string;
  classDate: Date;
  status: AttendanceStatus;
  makeupDate: Date | null;
}

const AdminAttendance = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      classDate: new Date(2025, 3, 1), // April 1, 2025
      status: 'missed',
      makeupDate: null
    },
    {
      id: '2',
      name: 'Maya Rodriguez',
      email: 'maya.r@example.com',
      classDate: new Date(2025, 3, 3), // April 3, 2025
      status: 'missed',
      makeupDate: new Date(2025, 3, 10) // April 10, 2025
    },
    {
      id: '3',
      name: 'Tyler Washington',
      email: 't.wash@example.com',
      classDate: new Date(2025, 3, 2), // April 2, 2025
      status: 'missed',
      makeupDate: null
    }
  ]);

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId ? { ...student, status } : student
      )
    );
    
    toast({
      title: "Status updated",
      description: `Student attendance status updated to ${status}`,
    });

    // If marked as made-up, we'll remove it after a short delay to show the update to the user
    if (status === 'made-up') {
      setTimeout(() => {
        setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
      }, 1500);
    }
  };

  const scheduleMakeup = (studentId: string, date: Date) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId ? { ...student, makeupDate: date } : student
      )
    );
    
    toast({
      title: "Makeup scheduled",
      description: `Makeup class scheduled for ${format(date, 'PPP')}`,
    });
  };
  
  // Stats calculations
  const missedCount = students.filter(s => s.status === 'missed').length;
  const scheduledMakeups = students.filter(s => s.makeupDate !== null).length;

  return (
    <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage student attendance records
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
              <CardDescription>Attendance records for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{90 - (missedCount * 5)}%</div>
                <span className="ml-2 text-muted-foreground">attendance rate</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Missed Classes</CardTitle>
              <CardDescription>Students with missed classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{missedCount}</div>
                <span className="ml-2 text-muted-foreground">missed classes this week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Make-ups</CardTitle>
              <CardDescription>Upcoming make-up sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-bold">{scheduledMakeups}</div>
                <span className="ml-2 text-muted-foreground">scheduled make-ups</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Missed Classes This Week</CardTitle>
            <CardDescription>Students who missed classes and require follow-up</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Missed Class Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Make-up Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{format(student.classDate, 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell>
                      {student.makeupDate ? (
                        format(student.makeupDate, 'MMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground text-sm">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {student.makeupDate ? 'Reschedule' : 'Schedule'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                              mode="single"
                              selected={student.makeupDate || undefined}
                              onSelect={(date) => date && scheduleMakeup(student.id, date)}
                              initialFocus
                              fromDate={new Date()}
                            />
                          </PopoverContent>
                        </Popover>

                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateStatus(student.id, 'attended')}
                            title="Mark as Attended"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => updateStatus(student.id, 'made-up')}
                            title="Mark as Made-up"
                          >
                            <Clock className="h-4 w-4 text-blue-500" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No missed classes this week.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Helper component for status badge
const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  switch (status) {
    case 'attended':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Attended</Badge>;
    case 'made-up':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Made up</Badge>;
    case 'missed':
    default:
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Missed</Badge>;
  }
};

export default AdminAttendance;
