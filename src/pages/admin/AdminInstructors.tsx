
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
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Check, X, Eye, UserRound } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

// Define a student type for instructor's students
interface Student {
  id: number;
  name: string;
  email: string;
  level: string;
  assignedTo?: number | null;
}

// Extend the instructor type to include students detail
interface Instructor {
  id: number;
  name: string;
  email: string;
  students: number;
  classes: number;
  status: 'active' | 'pending' | 'inactive';
  specialization: string;
  studentsList?: Student[];
}

const AdminInstructors = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [viewInstructorId, setViewInstructorId] = useState<number | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [instructorToDeactivate, setInstructorToDeactivate] = useState<number | null>(null);
  
  // New state for student assignment
  const [studentAssignments, setStudentAssignments] = useState<{[key: number]: string}>({});
  const [showStudentReassignment, setShowStudentReassignment] = useState(false);
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [instructorToAssign, setInstructorToAssign] = useState<number | null>(null);
  
  // State for unassigned students
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([
    { id: 201, name: 'Alex Miller', email: 'alex@example.com', level: 'Beginner', assignedTo: null },
    { id: 202, name: 'Blake Taylor', email: 'blake@example.com', level: 'Intermediate', assignedTo: null },
    { id: 203, name: 'Chris Jordan', email: 'chris@example.com', level: 'Advanced', assignedTo: null }
  ]);
  
  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    specialization: '',
  });
  
  // Mock instructor data with updated status property and sample students
  const [instructors, setInstructors] = useState<Instructor[]>([
    { 
      id: 1, 
      name: 'Professor Smith', 
      email: 'smith@example.com', 
      students: 3, 
      classes: 3, 
      status: 'active', 
      specialization: 'Turntablism',
      studentsList: [
        { id: 101, name: 'John Doe', email: 'john@example.com', level: 'Beginner' },
        { id: 102, name: 'Jane Smith', email: 'jane@example.com', level: 'Intermediate' },
        { id: 103, name: 'Mike Johnson', email: 'mike@example.com', level: 'Advanced' }
      ]
    },
    { 
      id: 2, 
      name: 'DJ Mike', 
      email: 'mike@example.com', 
      students: 2, 
      classes: 2, 
      status: 'active', 
      specialization: 'Scratching',
      studentsList: [
        { id: 104, name: 'Sarah Williams', email: 'sarah@example.com', level: 'Beginner' },
        { id: 105, name: 'Tom Brown', email: 'tom@example.com', level: 'Intermediate' }
      ]
    },
    { 
      id: 3, 
      name: 'Sarah Jones', 
      email: 'sarah@example.com', 
      students: 2, 
      classes: 4, 
      status: 'active', 
      specialization: 'Beat Mixing',
      studentsList: [
        { id: 106, name: 'Lisa Chen', email: 'lisa@example.com', level: 'Intermediate' },
        { id: 107, name: 'David Kim', email: 'david@example.com', level: 'Advanced' }
      ]
    },
    { id: 4, name: 'Robert Williams', email: 'robert@example.com', students: 0, classes: 2, status: 'active', specialization: 'Production' },
    { id: 5, name: 'Laura Thompson', email: 'laura@example.com', students: 0, classes: 1, status: 'active', specialization: 'Music Theory' },
    { id: 6, name: 'David Carter', email: 'david@example.com', students: 0, classes: 0, status: 'pending', specialization: 'Beat Making' },
    { id: 7, name: 'Emily Wilson', email: 'emily@example.com', students: 0, classes: 0, status: 'pending', specialization: 'Digital DJing' },
    { id: 8, name: 'Michael Johnson', email: 'michael@example.com', students: 0, classes: 0, status: 'inactive', specialization: 'Music Production' },
  ]);

  const activeInstructors = instructors.filter(instructor => instructor.status === 'active');
  const pendingInstructors = instructors.filter(instructor => instructor.status === 'pending');
  const inactiveInstructors = instructors.filter(instructor => instructor.status === 'inactive');

  const handleApprove = (id: number) => {
    setInstructors(instructors.map(instructor => 
      instructor.id === id ? { ...instructor, status: 'active' } : instructor
    ));
    
    toast({
      title: 'Instructor Approved',
      description: 'The instructor account has been approved.',
    });
  };

  const handleDecline = (id: number) => {
    setInstructors(instructors.map(instructor => 
      instructor.id === id ? { ...instructor, status: 'inactive' } : instructor
    ));
    
    toast({
      title: 'Instructor Declined',
      description: 'The instructor account has been declined.',
    });
  };

  // Modified handleDeactivate function to always show the reassignment dialog
  const handleDeactivate = (id: number) => {
    const instructor = instructors.find(i => i.id === id);
    
    if (!instructor) {
      toast({
        title: 'Error',
        description: 'Instructor not found.',
        variant: 'destructive',
      });
      return;
    }

    setInstructorToDeactivate(id);
    
    // Initialize the student assignments
    if (instructor.studentsList && instructor.studentsList.length > 0) {
      const initialAssignments: {[key: number]: string} = {};
      instructor.studentsList.forEach(student => {
        initialAssignments[student.id] = '';
      });
      setStudentAssignments(initialAssignments);
    } else {
      // Even if there are no students, initialize empty assignments
      setStudentAssignments({});
    }
    
    // Always show the student reassignment dialog, even if there are no students
    setShowStudentReassignment(true);
  };
  
  const completeDeactivation = (id: number) => {
    setInstructors(instructors.map(instructor => {
      if (instructor.id === id) {
        return { ...instructor, status: 'inactive', students: 0, classes: 0, studentsList: [] };
      }
      return instructor;
    }));
    
    toast({
      title: 'Instructor Deactivated',
      description: 'The instructor account has been deactivated.',
    });
    
    setReassignDialogOpen(false);
    setInstructorToDeactivate(null);
    setShowStudentReassignment(false);
  };
  
  const handleReassignStudents = () => {
    if (!instructorToDeactivate) {
      toast({
        title: 'Error',
        description: 'No instructor selected for deactivation.',
        variant: 'destructive',
      });
      return;
    }
    
    // Get the instructor being deactivated
    const deactivatingInstructor = instructors.find(i => i.id === instructorToDeactivate);
    
    if (!deactivatingInstructor) {
      completeDeactivation(instructorToDeactivate);
      return;
    }
    
    // Only check for unassigned students if instructor actually has students
    if (deactivatingInstructor.studentsList && deactivatingInstructor.studentsList.length > 0) {
      // Check if all students have been assigned
      const unassignedStudents = deactivatingInstructor.studentsList.filter(
        student => !studentAssignments[student.id] || studentAssignments[student.id] === ''
      );
      
      if (unassignedStudents.length > 0) {
        toast({
          title: 'Missing Assignments',
          description: `Please assign all students to new instructors.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Process student reassignments
      const newInstructors = [...instructors];
      
      // For each student, find their new instructor and add them
      deactivatingInstructor.studentsList.forEach(student => {
        const newInstructorName = studentAssignments[student.id];
        const newInstructorIndex = newInstructors.findIndex(i => i.name === newInstructorName);
        
        if (newInstructorIndex >= 0) {
          // Add student to new instructor
          if (!newInstructors[newInstructorIndex].studentsList) {
            newInstructors[newInstructorIndex].studentsList = [];
          }
          
          newInstructors[newInstructorIndex].studentsList?.push(student);
          newInstructors[newInstructorIndex].students += 1;
          
          toast({
            title: 'Student Reassigned',
            description: `${student.name} has been reassigned to ${newInstructorName}.`,
          });
        }
      });
      
      // Update instructors after reassignment
      setInstructors(newInstructors);
    }
    
    // Now complete the deactivation
    completeDeactivation(instructorToDeactivate);
  };

  const handleActivate = (id: number) => {
    setInstructors(instructors.map(instructor => {
      if (instructor.id === id) {
        toast({
          title: 'Instructor Activated',
          description: 'The instructor account has been activated.',
        });
        
        // Show the student assignment dialog when an instructor is activated
        setInstructorToAssign(id);
        setShowStudentAssignment(true);
        
        return { ...instructor, status: 'active' };
      }
      return instructor;
    }));
  };

  // New function to handle assigning students to an instructor
  const handleAssignStudents = () => {
    if (!instructorToAssign) {
      toast({
        title: 'Error',
        description: 'No instructor selected for assignment.',
        variant: 'destructive',
      });
      return;
    }
    
    // Get the selected students for this instructor
    const selectedStudentIds = Object.entries(studentAssignments)
      .filter(([_, instructorId]) => instructorId === instructorToAssign.toString())
      .map(([studentId, _]) => parseInt(studentId));
      
    if (selectedStudentIds.length === 0) {
      toast({
        title: 'No Students Selected',
        description: 'No students were selected for assignment.',
      });
      setShowStudentAssignment(false);
      setInstructorToAssign(null);
      setStudentAssignments({});
      return;
    }
    
    // Update the instructor's student list
    const newInstructors = [...instructors];
    const instructorIndex = newInstructors.findIndex(i => i.id === instructorToAssign);
    
    if (instructorIndex >= 0) {
      // Get selected students from unassigned list
      const studentsToAssign = unassignedStudents.filter(
        student => selectedStudentIds.includes(student.id)
      );
      
      // Add students to instructor
      if (!newInstructors[instructorIndex].studentsList) {
        newInstructors[instructorIndex].studentsList = [];
      }
      
      newInstructors[instructorIndex].studentsList?.push(...studentsToAssign);
      newInstructors[instructorIndex].students += studentsToAssign.length;
      
      // Update the instructor array
      setInstructors(newInstructors);
      
      // Remove students from unassigned list
      setUnassignedStudents(
        unassignedStudents.filter(student => !selectedStudentIds.includes(student.id))
      );
      
      toast({
        title: 'Students Assigned',
        description: `${studentsToAssign.length} student(s) have been assigned to ${newInstructors[instructorIndex].name}.`,
      });
    }
    
    // Reset state
    setShowStudentAssignment(false);
    setInstructorToAssign(null);
    setStudentAssignments({});
  };

  // New function to manually open the student assignment dialog for any instructor
  const handleOpenAssignStudents = (id: number) => {
    setInstructorToAssign(id);
    setShowStudentAssignment(true);
  };

  const handleAddInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newInstructor.name || !newInstructor.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    
    // Add new instructor to the list
    const newId = Math.max(...instructors.map(i => i.id)) + 1;
    const instructorToAdd = {
      id: newId,
      name: newInstructor.name,
      email: newInstructor.email,
      specialization: newInstructor.specialization,
      students: 0,
      classes: 0,
      status: 'active' as const,
    };
    
    setInstructors([...instructors, instructorToAdd]);
    
    toast({
      title: 'Instructor Added',
      description: `${newInstructor.name} has been added as an instructor.`,
    });
    
    // Reset form and close dialog
    setNewInstructor({ name: '', email: '', specialization: '' });
    setAddInstructorOpen(false);
  };

  const viewInstructor = (id: number) => {
    setViewInstructorId(id);
  };

  const closeViewInstructor = () => {
    setViewInstructorId(null);
  };

  const getInstructorById = (id: number) => {
    return instructors.find(instructor => instructor.id === id);
  };

  const currentViewedInstructor = viewInstructorId ? getInstructorById(viewInstructorId) : null;

  const filteredActiveInstructors = activeInstructors.filter(
    instructor => instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingInstructors = pendingInstructors.filter(
    instructor => instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredInactiveInstructors = inactiveInstructors.filter(
    instructor => instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  instructor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get active instructors for reassignment dropdown (exclude the one being deactivated)
  const availableInstructors = activeInstructors
    .filter(instructor => instructor.id !== instructorToDeactivate)
    .map(instructor => instructor.name);

  return (
    <DashboardLayout
      sidebarContent={<AdminNavigation />}
      userType="admin"
    >
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Instructors Management</h1>
              <p className="text-muted-foreground">
                Manage all instructors, approve new requests, and assign students.
              </p>
            </div>
            
            <Dialog open={addInstructorOpen} onOpenChange={setAddInstructorOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Instructor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddInstructor}>
                  <DialogHeader>
                    <DialogTitle>Add New Instructor</DialogTitle>
                    <DialogDescription>
                      Create a new instructor account. The instructor will receive an email to set up their password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name" className="text-left">Name</Label>
                      <Input
                        id="name"
                        value={newInstructor.name}
                        onChange={(e) => setNewInstructor({...newInstructor, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-left">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newInstructor.email}
                        onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="specialization" className="text-left">Specialization</Label>
                      <Input
                        id="specialization"
                        value={newInstructor.specialization}
                        onChange={(e) => setNewInstructor({...newInstructor, specialization: e.target.value})}
                        placeholder="E.g., Turntablism, Scratching, Beat Mixing"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddInstructorOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Instructor</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            {/* Individual Student Reassignment Dialog - Updated to handle empty student lists */}
            <Dialog open={showStudentReassignment} onOpenChange={setShowStudentReassignment}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Reassign Students</DialogTitle>
                  <DialogDescription>
                    {instructorToDeactivate && 
                     instructors.find(i => i.id === instructorToDeactivate)?.studentsList?.length ?
                     "Please assign each student to a new instructor before deactivating." :
                     "This instructor has no students to reassign. You can proceed with deactivation."}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {instructorToDeactivate && 
                   instructors.find(i => i.id === instructorToDeactivate)?.studentsList?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>New Instructor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instructorToDeactivate && 
                         instructors.find(i => i.id === instructorToDeactivate)?.studentsList?.map(student => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{student.level}</TableCell>
                            <TableCell>
                              <Select
                                value={studentAssignments[student.id] || ''}
                                onValueChange={(value) => 
                                  setStudentAssignments({
                                    ...studentAssignments,
                                    [student.id]: value
                                  })
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select instructor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableInstructors.map((name) => (
                                    <SelectItem key={name} value={name}>
                                      {name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No students to reassign</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowStudentReassignment(false);
                      setInstructorToDeactivate(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleReassignStudents}>
                    {instructorToDeactivate && 
                     instructors.find(i => i.id === instructorToDeactivate)?.studentsList?.length ?
                     "Reassign & Deactivate" : "Deactivate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Dialog for Assigning Students to Instructor */}
            <Dialog open={showStudentAssignment} onOpenChange={setShowStudentAssignment}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Assign Students to Instructor</DialogTitle>
                  <DialogDescription>
                    {instructorToAssign && instructors.find(i => i.id === instructorToAssign)?.name 
                      ? `Select students to assign to ${instructors.find(i => i.id === instructorToAssign)?.name}`
                      : "Select students to assign to this instructor"}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  {unassignedStudents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unassignedStudents.map(student => (
                          <TableRow key={student.id}>
                            <TableCell>
                              <input 
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={studentAssignments[student.id] === instructorToAssign?.toString()}
                                onChange={(e) => {
                                  setStudentAssignments({
                                    ...studentAssignments,
                                    [student.id]: e.target.checked ? instructorToAssign!.toString() : ''
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.name}</div>
                                <div className="text-sm text-muted-foreground">{student.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{student.level}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No unassigned students available</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowStudentAssignment(false);
                      setInstructorToAssign(null);
                      setStudentAssignments({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAssignStudents} disabled={unassignedStudents.length === 0}>
                    Assign Students
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search instructors..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active Instructors ({filteredActiveInstructors.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Approval ({filteredPendingInstructors.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive Instructors ({filteredInactiveInstructors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Instructors</CardTitle>
                  <CardDescription>
                    Manage your current instructor team.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">Name</th>
                          <th className="px-4 py-3 text-left font-medium">Email</th>
                          <th className="px-4 py-3 text-center font-medium">Students</th>
                          <th className="px-4 py-3 text-center font-medium">Classes</th>
                          <th className="px-4 py-3 text-center font-medium">Status</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActiveInstructors.map((instructor) => (
                          <tr key={instructor.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">{instructor.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{instructor.email}</td>
                            <td className="px-4 py-3 text-center">{instructor.students}</td>
                            <td className="px-4 py-3 text-center">{instructor.classes}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 hover:text-green-500">
                                Active
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleOpenAssignStudents(instructor.id)}
                                      className="h-8 w-8"
                                    >
                                      <UserRound className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Assign Students</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => viewInstructor(instructor.id)}
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
                                      onClick={() => handleDeactivate(instructor.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Deactivate Instructor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredActiveInstructors.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                              No instructors found matching your search.
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
                  <CardTitle>Pending Instructors</CardTitle>
                  <CardDescription>
                    Review and approve instructor account requests.
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
                        {filteredPendingInstructors.map((instructor) => (
                          <tr key={instructor.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">{instructor.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{instructor.email}</td>
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
                                      onClick={() => viewInstructor(instructor.id)}
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
                                      onClick={() => handleApprove(instructor.id)}
                                      className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve Instructor</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDecline(instructor.id)}
                                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Decline Instructor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredPendingInstructors.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              No pending instructors found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="inactive" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inactive Instructors</CardTitle>
                  <CardDescription>
                    View and reactivate previously deactivated instructors.
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
                        {filteredInactiveInstructors.map((instructor) => (
                          <tr key={instructor.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">{instructor.name}</td>
                            <td className="px-4 py-3 text-muted-foreground">{instructor.email}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="bg-red-500/10 text-red-500 hover:bg-red-500/10 hover:text-red-500">
                                Inactive
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => viewInstructor(instructor.id)}
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
                                      onClick={() => handleActivate(instructor.id)}
                                      className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Activate Instructor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredInactiveInstructors.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              No inactive instructors found matching your search.
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
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default AdminInstructors;
