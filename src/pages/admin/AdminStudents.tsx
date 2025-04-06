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
import { Search, UserPlus, Check, X, Eye, UserRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

const AdminStudents = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [showViewStudentDialog, setShowViewStudentDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignInstructor, setAssignInstructor] = useState('');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  
  // Mock student data
  const [activeStudents, setActiveStudents] = useState([
    { id: 1, name: 'Alex Johnson', email: 'alex@example.com', instructor: 'Professor Smith', level: 'Novice', paymentStatus: 'paid' },
    { id: 2, name: 'Maria Garcia', email: 'maria@example.com', instructor: 'DJ Mike', level: 'Intermediate', paymentStatus: 'paid' },
    { id: 3, name: 'James Wilson', email: 'james@example.com', instructor: 'Sarah Jones', level: 'Advanced', paymentStatus: 'overdue' },
    { id: 4, name: 'Emma Brown', email: 'emma@example.com', instructor: 'Professor Smith', level: 'Novice', paymentStatus: 'paid' },
    { id: 5, name: 'Michael Davis', email: 'michael@example.com', instructor: 'Robert Williams', level: 'Intermediate', paymentStatus: 'pending' },
  ]);

  const [pendingStudents, setPendingStudents] = useState([
    { id: 6, name: 'Olivia Taylor', email: 'olivia@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 7, name: 'William Thomas', email: 'william@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 8, name: 'Sophia Moore', email: 'sophia@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 9, name: 'Liam Anderson', email: 'liam@example.com', instructor: null, level: null, paymentStatus: 'pending' },
    { id: 10, name: 'Isabella White', email: 'isabella@example.com', instructor: null, level: null, paymentStatus: 'pending' },
  ]);

  const instructors = [
    { id: 1, name: 'Professor Smith' },
    { id: 2, name: 'DJ Mike' },
    { id: 3, name: 'Sarah Jones' },
    { id: 4, name: 'Robert Williams' },
    { id: 5, name: 'Laura Thompson' },
  ];

  const handleApprove = (id: number) => {
    // Find the student in pending list
    const student = pendingStudents.find(s => s.id === id);
    if (!student) return;
    
    // Remove from pending and add to active with initial values
    setPendingStudents(pendingStudents.filter(s => s.id !== id));
    setActiveStudents([...activeStudents, {
      ...student,
      level: 'Novice', // Default level changed from Beginner to Novice
      paymentStatus: 'pending' // Default payment status
    }]);

    toast({
      title: 'Student Approved',
      description: 'The student account has been approved.',
    });
  };

  const handleDecline = (id: number) => {
    setPendingStudents(pendingStudents.filter(s => s.id !== id));
    
    toast({
      title: 'Student Declined',
      description: 'The student account has been declined.',
    });
  };

  const handleDeactivate = (id: number) => {
    setSelectedStudent(id);
    setShowDeactivateDialog(true);
  };
  
  const confirmDeactivate = () => {
    if (!selectedStudent) return;
    
    setActiveStudents(activeStudents.filter(s => s.id !== selectedStudent));
    
    toast({
      title: 'Student Deactivated',
      description: 'The student account has been deactivated.',
    });
    
    setShowDeactivateDialog(false);
    setSelectedStudent(null);
  };
  
  const handleView = (id: number) => {
    setSelectedStudent(id);
    setShowViewStudentDialog(true);
  };
  
  const handleAssign = (id: number) => {
    setSelectedStudent(id);
    setShowAssignDialog(true);
    
    // Find the student's current instructor if any
    const student = activeStudents.find(s => s.id === id);
    if (student && student.instructor) {
      setAssignInstructor(student.instructor);
    } else {
      setAssignInstructor('');
    }
  };
  
  const confirmAssign = () => {
    if (!selectedStudent || !assignInstructor) {
      toast({
        title: 'Error',
        description: 'Please select an instructor.',
        variant: 'destructive'
      });
      return;
    }
    
    // Update the student's instructor
    setActiveStudents(activeStudents.map(student => 
      student.id === selectedStudent 
        ? { ...student, instructor: assignInstructor } 
        : student
    ));
    
    toast({
      title: 'Instructor Assigned',
      description: `The student has been assigned to ${assignInstructor}.`,
    });
    
    setShowAssignDialog(false);
    setSelectedStudent(null);
    setAssignInstructor('');
  };

  const getStudentById = (id: number) => {
    return activeStudents.find(student => student.id === id) || 
           pendingStudents.find(student => student.id === id);
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
      <TooltipProvider>
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
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleAssign(student.id)}
                                      className="h-8 w-8"
                                    >
                                      <UserRound className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Assign Instructor</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleView(student.id)}
                                      className="h-8 w-8"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>View Details</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDeactivate(student.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deactivate Student</p>
                                  </TooltipContent>
                                </Tooltip>
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
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleApprove(student.id)}
                                      className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve Student</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDecline(student.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Decline Student</p>
                                  </TooltipContent>
                                </Tooltip>
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

        {/* View Student Dialog */}
        <Dialog open={showViewStudentDialog} onOpenChange={setShowViewStudentDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p>{getStudentById(selectedStudent)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{getStudentById(selectedStudent)?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                    <p>{getStudentById(selectedStudent)?.instructor || "Not assigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Level</p>
                    <p>{getStudentById(selectedStudent)?.level || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                    <Badge variant="outline" className={
                      getStudentById(selectedStudent)?.paymentStatus === 'paid' 
                        ? 'bg-green-500/10 text-green-500'
                        : getStudentById(selectedStudent)?.paymentStatus === 'pending'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-500'
                    }>
                      {getStudentById(selectedStudent)?.paymentStatus === 'paid' ? 'Paid' : 
                       getStudentById(selectedStudent)?.paymentStatus === 'pending' ? 'Pending' : 'Overdue'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowViewStudentDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Instructor Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Instructor</DialogTitle>
              <DialogDescription>
                Select an instructor for {selectedStudent && getStudentById(selectedStudent)?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={assignInstructor} onValueChange={setAssignInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.name}>
                      {instructor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAssign}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Deactivate Confirmation Dialog */}
        <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Deactivate Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate this student account? This action will remove them from all classes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeactivateDialog(false);
                  setSelectedStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDeactivate}
              >
                Deactivate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default AdminStudents;
