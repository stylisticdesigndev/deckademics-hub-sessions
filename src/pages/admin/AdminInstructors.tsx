import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { useAdminInstructors } from '@/hooks/useAdminInstructors';
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
import { Search, UserPlus, Check, X, Eye, UserRound, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

const AdminInstructors = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewInstructorId, setViewInstructorId] = useState<string | null>(null);
  const [instructorToDeactivate, setInstructorToDeactivate] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    name: '',
    email: '',
    specialization: '',
  });
  
  // New state for student assignment
  const [studentAssignments, setStudentAssignments] = useState<{[key: number]: string}>({});
  const [showStudentReassignment, setShowStudentReassignment] = useState(false);
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [instructorToAssign, setInstructorToAssign] = useState<number | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  
  // State for unassigned students
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([
    { id: 201, name: 'Alex Miller', email: 'alex@example.com', level: 'Beginner', assignedTo: null },
    { id: 202, name: 'Blake Taylor', email: 'blake@example.com', level: 'Intermediate', assignedTo: null },
    { id: 203, name: 'Chris Jordan', email: 'chris@example.com', level: 'Advanced', assignedTo: null }
  ]);
  
  const {
    activeInstructors,
    pendingInstructors,
    inactiveInstructors,
    isLoading,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor
  } = useAdminInstructors();

  const handleApprove = (id: string) => {
    approveInstructor.mutate(id);
  };

  const handleDecline = (id: string) => {
    declineInstructor.mutate(id);
  };

  const handleDeactivate = (id: string) => {
    setInstructorToDeactivate(id);
    setShowDeactivateDialog(true);
  };

  const handleActivate = (id: string) => {
    activateInstructor.mutate(id);
  };

  const confirmDeactivate = () => {
    if (!instructorToDeactivate) return;
    deactivateInstructor.mutate(instructorToDeactivate);
    setShowDeactivateDialog(false);
    setInstructorToDeactivate(null);
  };

  const getInstructorById = (id: string) => {
    return activeInstructors?.find(instructor => instructor.id === id) ||
           pendingInstructors?.find(instructor => instructor.id === id) ||
           inactiveInstructors?.find(instructor => instructor.id === id);
  };

  const filteredActiveInstructors = activeInstructors?.filter(
    instructor => (
      instructor.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const filteredPendingInstructors = pendingInstructors?.filter(
    instructor => (
      instructor.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const filteredInactiveInstructors = inactiveInstructors?.filter(
    instructor => (
      instructor.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // Get active instructors for reassignment dropdown (exclude the one being deactivated)
  const availableInstructors = activeInstructors
    ?.filter(instructor => instructor.id !== instructorToDeactivate)
    .map(instructor => `${instructor.profile.first_name} ${instructor.profile.last_name}`) || [];

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
    
    // Reset form and close dialog
    setNewInstructor({ name: '', email: '', specialization: '' });
    setAddInstructorOpen(false);
    
    toast({
      title: 'Instructor Added',
      description: `${newInstructor.name} has been added as an instructor.`,
    });
  };

  const viewInstructor = (id: string) => {
    setViewInstructorId(id);
  };

  const closeViewInstructor = () => {
    setViewInstructorId(null);
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
    
    // Reset state
    setShowStudentAssignment(false);
    setInstructorToAssign(null);
    setStudentAssignments({});
    
    toast({
      title: 'Students Assigned',
      description: `Students have been assigned successfully.`,
    });
  };

  // New function to manually open the student assignment dialog for any instructor
  const handleOpenAssignStudents = (id: number) => {
    setInstructorToAssign(id);
    setShowStudentAssignment(true);
  };

  // Function to handle reassigning students when deactivating an instructor
  const handleReassignStudents = () => {
    if (!instructorToDeactivate) {
      toast({
        title: 'Error',
        description: 'No instructor selected for deactivation.',
        variant: 'destructive',
      });
      return;
    }
    
    // Complete the deactivation
    confirmDeactivate();
    setShowStudentReassignment(false);
    
    toast({
      title: 'Students Reassigned',
      description: 'Students have been reassigned successfully.',
    });
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
                    Please assign each student to a new instructor before deactivating.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No students to reassign</p>
                  </div>
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
                    Deactivate
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
                    Select students to assign to this instructor
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
                            <td className="px-4 py-3 font-medium">
                              {instructor.profile.first_name} {instructor.profile.last_name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {instructor.profile.email}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {instructor.students?.length || 0}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {/* You might want to implement class count */}
                              0
                            </td>
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
                                      onClick={() => handleOpenAssignStudents(Number(instructor.id))}
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
                            <td className="px-4 py-3 font-medium">
                              {instructor.profile.first_name} {instructor.profile.last_name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {instructor.profile.email}
                            </td>
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
                            <td className="px-4 py-3 font-medium">
                              {instructor.profile.first_name} {instructor.profile.last_name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {instructor.profile.email}
                            </td>
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

// Define a student type for instructor's students
interface Student {
  id: number;
  name: string;
  email: string;
  level: string;
  assignedTo?: number | null;
}

export default AdminInstructors;
