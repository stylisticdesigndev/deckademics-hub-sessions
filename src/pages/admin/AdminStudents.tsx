
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Check, X } from 'lucide-react';

const AdminStudents = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('all');
  
  // Mock student data
  const activeStudents = [
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', instructor: 'Professor Smith', level: 'Beginner', paymentStatus: 'paid' },
    { id: 2, name: 'Maria Garcia', email: 'maria@example.com', instructor: 'DJ Mike', level: 'Intermediate', paymentStatus: 'paid' },
    { id: 3, name: 'James Wilson', email: 'james@example.com', instructor: 'Sarah Jones', level: 'Advanced', paymentStatus: 'overdue' },
    { id: 4, name: 'Emma Brown', email: 'emma@example.com', instructor: 'Professor Smith', level: 'Beginner', paymentStatus: 'paid' },
    { id: 5, name: 'Michael Davis', email: 'michael@example.com', instructor: 'Robert Williams', level: 'Intermediate', paymentStatus: 'pending' },
  ];

  const pendingStudents = [
    { id: 6, name: 'Olivia Taylor', email: 'olivia@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 7, name: 'William Thomas', email: 'william@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 8, name: 'Sophia Moore', email: 'sophia@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 9, name: 'Liam Anderson', email: 'liam@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 10, name: 'Isabella White', email: 'isabella@example.com', instructor: null, level: null, paymentStatus: 'pending' },
  ];

  const instructors = [
    { id: 1, name: 'Professor Smith' },
    { id: 2, name: 'DJ Mike' },
    { id: 3, name: 'Sarah Jones' },
    { id: 4, name: 'Robert Williams' },
    { id: 5, name: 'Laura Thompson' },
  ];

  const handleApprove = (id: number) => {
    toast({
      title: 'Student Approved',
      description: 'The student account has been approved.',
    });
  };

  const handleDecline = (id: number) => {
    toast({
      title: 'Student Declined',
      description: 'The student account has been declined.',
    });
  };

  const handleDeactivate = (id: number) => {
    toast({
      title: 'Student Deactivated',
      description: 'The student account has been deactivated.',
    });
  };

  const filteredActiveStudents = activeStudents.filter(
    student => (student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
               (instructorFilter === 'all' || student.instructor === instructorFilter)
  );

  const filteredPendingStudents = pendingStudents.filter(
    student => student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      sidebarContent={<AdminNavigation />}
      userType="admin"
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students Management</h1>
            <p className="text-muted-foreground">
              Manage all students, approve new registrations, and track payments.
            </p>
          </div>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={instructorFilter} onValueChange={setInstructorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instructors</SelectItem>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.name}>
                  {instructor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active Students ({filteredActiveStudents.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval ({filteredPendingStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Students</CardTitle>
                <CardDescription>
                  Manage currently enrolled students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Instructor</th>
                        <th className="px-4 py-3 text-left font-medium">Level</th>
                        <th className="px-4 py-3 text-center font-medium">Payment</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActiveStudents.map((student) => (
                        <tr key={student.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                          <td className="px-4 py-3">{student.instructor}</td>
                          <td className="px-4 py-3">{student.level}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={
                              student.paymentStatus === 'paid' 
                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500'
                                : student.paymentStatus === 'pending'
                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500'
                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500'
                            }>
                              {student.paymentStatus === 'paid' ? 'Paid' : 
                               student.paymentStatus === 'pending' ? 'Pending' : 'Overdue'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                Assign
                              </Button>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeactivate(student.id)}
                              >
                                Deactivate
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredActiveStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                            No students found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Students</CardTitle>
                <CardDescription>
                  Review and approve student registration requests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingStudents.map((student) => (
                        <tr key={student.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{student.email}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500">
                              Pending
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleApprove(student.id)}
                                className="bg-green-500 text-white hover:bg-green-600"
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDecline(student.id)}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Decline
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredPendingStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            No pending students found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminStudents;
