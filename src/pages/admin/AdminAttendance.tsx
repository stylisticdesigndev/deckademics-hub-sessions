
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Check, X, Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';

type AttendanceStatus = 'missed' | 'attended' | 'made-up';

const AdminAttendance = () => {
  const { 
    missedAttendance, 
    isLoading, 
    updateStatus, 
    scheduleMakeup,
    stats
  } = useAdminAttendance();

  // Format dates in US format (MM/dd/yyyy)
  const formatDateUS = (date: Date) => {
    return format(date, 'MM/dd/yyyy');
  };

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
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
                <div className="text-2xl font-bold">{stats.missedCount}</div>
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
                <div className="text-2xl font-bold">{stats.scheduledMakeups}</div>
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
                {missedAttendance && missedAttendance.length > 0 ? (
                  missedAttendance.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{formatDateUS(student.classDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={student.status} />
                      </TableCell>
                      <TableCell>
                        {student.makeupDate ? (
                          formatDateUS(student.makeupDate)
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
                                onSelect={(date) => date && scheduleMakeup(student.studentId, date, student.id)}
                                initialFocus
                                fromDate={new Date()}
                              />
                            </PopoverContent>
                          </Popover>

                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => updateStatus(student.studentId, student.id, 'attended')}
                              title="Mark as Attended"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => updateStatus(student.studentId, student.id, 'made-up')}
                              title="Mark as Made-up"
                            >
                              <Clock className="h-4 w-4 text-blue-500" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
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
