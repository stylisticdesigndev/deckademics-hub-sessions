import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { useAdminInstructors } from '@/hooks/useAdminInstructors';
import { useStudentAssignment, StudentForAssignment } from '@/hooks/useStudentAssignment';
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
import { toast } from 'sonner';
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
import { Search, UserPlus, Check, X, Eye, UserRound, Loader2, AlertCircle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminInstructors = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewInstructorId, setViewInstructorId] = useState<string | null>(null);
  const [instructorToDeactivate, setInstructorToDeactivate] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [addInstructorOpen, setAddInstructorOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialties: '',
    hourlyRate: '25',
  });
  
  // New state for manual instructor creation
  const [showCreateInstructorDialog, setShowCreateInstructorDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  // State for student assignment
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [instructorToAssign, setInstructorToAssign] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const {
    activeInstructors,
    pendingInstructors,
    inactiveInstructors,
    allUsers,
    isLoading,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor,
    createInstructor,
    addNewInstructor
  } = useAdminInstructors();
  
  // Use the new hook for student assignment
  const {
    unassignedStudents,
    isLoadingStudents,
    assignStudentsToInstructor
  } = useStudentAssignment();

  // Get instructor by ID now works with the correct types
  const getInstructorById = (id: string) => {
    return (activeInstructors as InstructorWithProfile[]).find(instructor => instructor.id === id) ||
           (pendingInstructors as InstructorWithProfile[]).find(instructor => instructor.id === id) ||
           (inactiveInstructors as InstructorWithProfile[]).find(instructor => instructor.id === id);
  };

  const filteredActiveInstructors = (activeInstructors as InstructorWithProfile[])?.filter(
    instructor => (
      instructor.profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const filteredPendingInstructors = (pendingInstructors as InstructorWithProfile[])?.filter(
    instructor => (
      instructor.profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const filteredInactiveInstructors = (inactiveInstructors as InstructorWithProfile[])?.filter(
    instructor => (
      instructor.profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // Get eligible users who don't have instructor records yet
  const eligibleUsers = (allUsers || []).filter(user => {
    // Check if this user doesn't already have an instructor record
    const isAlreadyInstructor = 
      (activeInstructors as InstructorWithProfile[] || []).some(instructor => instructor.id === user.id) ||
      (pendingInstructors as InstructorWithProfile[] || []).some(instructor => instructor.id === user.id) ||
      (inactiveInstructors as InstructorWithProfile[] || []).some(instructor => instructor.id === user.id);
    
    return !isAlreadyInstructor;
  });

  // Log debugging information when data changes
  useEffect(() => {
    console.log("Debug - All users:", allUsers);
    console.log("Debug - Active instructors:", activeInstructors);
    console.log("Debug - Pending instructors:", pendingInstructors);
    console.log("Debug - Inactive instructors:", inactiveInstructors);
  }, [allUsers, activeInstructors, pendingInstructors, inactiveInstructors]);

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

  const handleCreateInstructor = () => {
    if (!selectedUserId) {
      toast.error("Please select a user to convert to instructor.");
      return;
    }
    
    createInstructor.mutate(selectedUserId);
    setShowCreateInstructorDialog(false);
    setSelectedUserId('');
  };

  const handleAddInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newInstructor.firstName || !newInstructor.lastName || !newInstructor.email) {
      toast.error("Please fill in all required fields (first name, last name, and email).");
      return;
    }
    
    // Parse specialties
    const specialtiesArray = newInstructor.specialties
      ? newInstructor.specialties.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // Parse hourly rate
    const hourlyRate = parseFloat(newInstructor.hourlyRate) || 25;

    addNewInstructor.mutate({
      email: newInstructor.email,
      firstName: newInstructor.firstName,
      lastName: newInstructor.lastName,
      specialties: specialtiesArray,
      hourlyRate
    }, {
      onSuccess: () => {
        // Reset form and close dialog
        setNewInstructor({ 
          firstName: '', 
          lastName: '', 
          email: '', 
          specialties: '', 
          hourlyRate: '25' 
        });
        setAddInstructorOpen(false);
      }
    });
  };

  const viewInstructor = (id: string) => {
    setViewInstructorId(id);
  };

  const closeViewInstructor = () => {
    setViewInstructorId(null);
  };

  // New function to handle opening the student assignment dialog
  const handleOpenAssignStudents = (id: string) => {
    setInstructorToAssign(id);
    setSelectedStudentIds([]);
    setShowStudentAssignment(true);
  };

  // New function to handle assigning students to an instructor
  const handleAssignStudents = () => {
    if (!instructorToAssign || selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to assign");
      return;
    }
    
    assignStudentsToInstructor.mutate({
      instructorId: instructorToAssign,
      studentIds: selectedStudentIds
    }, {
      onSuccess: () => {
        setShowStudentAssignment(false);
        setInstructorToAssign(null);
        setSelectedStudentIds([]);
      }
    });
  };

  // Toggle student selection for assignment
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const showNoInstructorsMessage = () => {
    return (
      <Alert className="mt-4 mb-2">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No instructor records found</AlertTitle>
        <AlertDescription>
          There are no instructor records. 
          Use the "Convert User to Instructor" feature to create instructor records for existing users.
        </AlertDescription>
      </Alert>
    );
  };

  // Add deactivate instructor dialog
  const DeactivateInstructorDialog = () => (
    <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Instructor</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate this instructor? They will no longer be able to access the system.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDeactivate}>
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
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
            
            <div className="flex gap-2">
              <Dialog open={showCreateInstructorDialog} onOpenChange={setShowCreateInstructorDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserRound className="mr-2 h-4 w-4" />
                    Convert User to Instructor
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Convert User to Instructor</DialogTitle>
                    <DialogDescription>
                      Create an instructor record for an existing user account.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {eligibleUsers && eligibleUsers.length > 0 ? (
                    <div className="py-4">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="userId">Select User</Label>
                          <Select 
                            value={selectedUserId} 
                            onValueChange={setSelectedUserId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a user" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibleUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.first_name} {user.last_name} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      No eligible users found. All users already have instructor records.
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCreateInstructorDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateInstructor} 
                      disabled={!selectedUserId || !eligibleUsers || eligibleUsers.length === 0}
                    >
                      Create Instructor
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                        Create a new instructor account with user authentication. A password reset email will be sent automatically to the instructor's email address.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName" className="text-left">First Name *</Label>
                        <Input
                          id="firstName"
                          value={newInstructor.firstName}
                          onChange={(e) => setNewInstructor({...newInstructor, firstName: e.target.value})}
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName" className="text-left">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={newInstructor.lastName}
                          onChange={(e) => setNewInstructor({...newInstructor, lastName: e.target.value})}
                          placeholder="Enter last name"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-left">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newInstructor.email}
                          onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                          placeholder="Enter email address"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="specialties" className="text-left">Specialties</Label>
                        <Input
                          id="specialties"
                          value={newInstructor.specialties}
                          onChange={(e) => setNewInstructor({...newInstructor, specialties: e.target.value})}
                          placeholder="E.g., Turntablism, Scratching (comma-separated)"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hourlyRate" className="text-left">Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          min="0"
                          step="0.01"
                          value={newInstructor.hourlyRate}
                          onChange={(e) => setNewInstructor({...newInstructor, hourlyRate: e.target.value})}
                          placeholder="25.00"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAddInstructorOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addNewInstructor.isPending}>
                        {addNewInstructor.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Add Instructor'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Individual Student Reassignment Dialog - Updated to handle empty student lists */}
            <Dialog open={false} onOpenChange={() => {}}>
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
                      setShowDeactivateDialog(false);
                      setInstructorToDeactivate(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => {}}>
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
                  {isLoadingStudents ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : unassignedStudents.length > 0 ? (
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
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => toggleStudentSelection(student.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {student.email}
                                </div>
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
                      setSelectedStudentIds([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignStudents} 
                    disabled={isLoadingStudents || selectedStudentIds.length === 0 || assignStudentsToInstructor.isPending}
                  >
                    {assignStudentsToInstructor.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Students'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {activeInstructors?.length === 0 && pendingInstructors?.length === 0 && inactiveInstructors?.length === 0 && showNoInstructorsMessage()}

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

          <DeactivateInstructorDialog />
          
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active Instructors ({filteredActiveInstructors?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Approval ({filteredPendingInstructors?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive Instructors ({filteredInactiveInstructors?.length || 0})
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
                          <th className="px-4 py-3 text-center font-medium">Status</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActiveInstructors && filteredActiveInstructors.length > 0 ? (
                          filteredActiveInstructors.map((instructor) => (
                            <tr key={instructor.id} className="border-b last:border-0">
                              <td className="px-4 py-3 font-medium">
                                {instructor.profile.first_name} {instructor.profile.last_name}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {instructor.profile.email}
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              No active instructors found.
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
                        {filteredPendingInstructors && filteredPendingInstructors.length > 0 ? (
                          filteredPendingInstructors.map((instructor) => (
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              No pending instructors found.
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
                        {filteredInactiveInstructors && filteredInactiveInstructors.length > 0 ? (
                          filteredInactiveInstructors.map((instructor) => (
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                              No inactive instructors found.
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

// Define the InstructorWithProfile interface
interface InstructorWithProfile {
  id: string;
  status: string;
  specialties: string[];
  bio: string | null;
  hourly_rate: number;
  years_experience: number;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default AdminInstructors;
