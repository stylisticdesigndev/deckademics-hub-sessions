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
import { Search, UserPlus, Check, X, Eye, CheckCircle, AlertCircle } from 'lucide-react';

// Define a student type for instructor's students
interface Student {
  id: number;
  name: string;
  email: string;
  level: string;
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
  
  // New state for student reassignment
  const [studentAssignments, setStudentAssignments] = useState<{[key: number]: string}>({});
  const [showStudentReassignment, setShowStudentReassignment] = useState(false);
  
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

  const handleDeactivate = (id: number) => {
    const instructor = instructors.find(i => i.id === id);
    
    if (instructor && instructor.students > 0) {
      // If instructor has students, show student reassignment dialog
      setInstructorToDeactivate(id);
      
      // Initialize the student assignments
      if (instructor.studentsList) {
        const initialAssignments: {[key: number]: string} = {};
        instructor.studentsList.forEach(student => {
          initialAssignments[student.id] = '';
        });
        setStudentAssignments(initialAssignments);
      }
      
      setShowStudentReassignment(true);
    } else {
      // If no students, just deactivate
      completeDeactivation(id);
    }
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
    
    if (!deactivatingInstructor || !deactivatingInstructor.studentsList) {
      completeDeactivation(instructorToDeactivate);
      return;
    }
    
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
    
    // Now complete the deactivation
    setInstructors(newInstructors);
    completeDeactivation(instructorToDeactivate);
  };

  const handleActivate = (id: number) => {
    setInstructors(instructors.map(instructor => {
      if (instructor.id === id) {
        toast({
          title: 'Instructor Activated',
          description: 'The instructor account has been activated.',
        });
        
        return { ...instructor, status: 'active' };
      }
      return instructor;
    }));
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
          
          {/* Individual Student Reassignment Dialog */}
          <Dialog open={showStudentReassignment} onOpenChange={setShowStudentReassignment}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Reassign Students Individually</DialogTitle>
                <DialogDescription>
                  Please assign each student to a new instructor before deactivating.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>New Instructor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructorToDeactivate && instructors.find(i => i.id === instructorToDeactivate)?.studentsList?.map(student => (
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
                <Button onClick={handleReassignStudents}>Reassign & Deactivate</Button>
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
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewInstructor(instructor.id)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDeactivate(instructor.id)}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Deactivate
                              </Button>
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
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewInstructor(instructor.id)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleApprove(instructor.id)}
                                className="bg-green-500 text-white hover:bg-green-600"
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleDecline(instructor.id)}
                              >
                                <X className="mr-1 h-4 w-4" />
                                Decline
                              </Button>
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
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => viewInstructor(instructor.id)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleActivate(instructor.id)}
                                className="bg-green-500 text-white hover:bg-green-600"
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Activate
                              </Button>
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

      {/* Instructor Details Sheet */}
      <Sheet open={viewInstructorId !== null} onOpenChange={closeViewInstructor}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Instructor Details</SheetTitle>
            <SheetDescription>
              View instructor information and statistics
            </SheetDescription>
          </SheetHeader>
          {currentViewedInstructor && (
            <div className="space-y-6 py-6">
              <div className="flex flex-col space-y-4">
                <div className="h-24 w-24 rounded-full bg-deckademics-primary/20 mx-auto flex items-center justify-center">
                  <span className="text-2xl font-bold text-deckademics-primary">
                    {currentViewedInstructor.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <div className="space-y-1 text-center">
                  <h3 className="text-xl font-bold">{currentViewedInstructor.name}</h3>
                  <p className="text-muted-foreground">{currentViewedInstructor.email}</p>
                  <Badge 
                    variant="outline" 
                    className={
                      currentViewedInstructor.status === 'active' 
                        ? "bg-green-500/10 text-green-500" 
                        : currentViewedInstructor.status === 'pending'
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                    }
                  >
                    {currentViewedInstructor.status === 'active' 
                      ? 'Active' 
                      : currentViewedInstructor.status === 'pending'
                      ? 'Pending'
                      : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium mb-2">Specialization</h4>
                  <p>{currentViewedInstructor.specialization || 'Not specified'}</p>
                </div>
                
                {currentViewedInstructor.status === 'active' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <div className="text-2xl font-bold">{currentViewedInstructor.students}</div>
                        <div className="text-sm text-muted-foreground">Students</div>
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-2xl font-bold">{currentViewedInstructor.classes}</div>
                        <div className="text-sm text-muted-foreground">Classes</div>
                      </div>
                    </div>
                    
                    {/* Show students list if available */}
                    {currentViewedInstructor.studentsList && currentViewedInstructor.studentsList.length > 0 && (
                      <div className="pt-4">
                        <h4 className="text-sm font-medium mb-2">Students</h4>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="px-3 py-2 text-left font-medium">Name</th>
                                <th className="px-3 py-2 text-left font-medium">Email</th>
                                <th className="px-3 py-2 text-right font-medium">Level</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentViewedInstructor.studentsList.map((student) => (
                                <tr key={student.id} className="border-b last:border-0">
                                  <td className="px-3 py-2">{student.name}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{student.email}</td>
                                  <td className="px-3 py-2 text-right">{student.level}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Action buttons for the instructor in the sheet view */}
                <div className="pt-4">
                  {currentViewedInstructor.status === 'active' ? (
                    <Button 
                      onClick={() => {
                        handleDeactivate(currentViewedInstructor.id);
                        closeViewInstructor();
                      }}
                      variant="destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Deactivate Instructor
                    </Button>
                  ) : currentViewedInstructor.status === 'inactive' ? (
                    <Button 
                      onClick={() => {
                        handleActivate(currentViewedInstructor.id);
                        closeViewInstructor();
                      }}
                      className="bg-green-500 text-white hover:bg-green-600"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate Instructor
                    </Button>
                  ) : null}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-end">
                <Button onClick={closeViewInstructor}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default AdminInstructors;
