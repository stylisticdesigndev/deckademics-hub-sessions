
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminNavigation } from '@/components/navigation/AdminNavigation';
import { useAdminStudents } from '@/hooks/useAdminStudents';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus, Check, X, Eye, UserRound, Loader2, RefreshCcw } from 'lucide-react';
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
import { toast } from '@/components/ui/use-toast';

const AdminStudents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showViewStudentDialog, setShowViewStudentDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    activeStudents,
    pendingStudents,
    isLoading,
    approveStudent,
    declineStudent,
    deactivateStudent,
    createDemoStudent,
    debugFetchStudents,
    refetchData
  } = useAdminStudents();

  // Add useEffect to log data whenever it changes
  useEffect(() => {
    console.log("AdminStudents - Active Students Updated:", activeStudents);
    console.log("AdminStudents - Pending Students Updated:", pendingStudents);
  }, [activeStudents, pendingStudents]);

  // Auto-fetch debug data on first load
  useEffect(() => {
    handleDebugRefresh();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      console.log("Approving student with ID:", id);
      await approveStudent.mutateAsync(id);
      toast({
        title: "Success",
        description: "Student approved successfully",
      });
      // Refresh the data after approval
      refetchData();
    } catch (error) {
      console.error("Error in handleApprove:", error);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      console.log("Declining student with ID:", id);
      await declineStudent.mutateAsync(id);
      toast({
        title: "Success",
        description: "Student declined successfully",
      });
      // Refresh the data after declining
      refetchData();
    } catch (error) {
      console.error("Error in handleDecline:", error);
    }
  };

  const handleDeactivate = (id: string) => {
    setSelectedStudent(id);
    setShowDeactivateDialog(true);
  };
  
  const confirmDeactivate = async () => {
    if (!selectedStudent) return;
    
    try {
      console.log("Deactivating student with ID:", selectedStudent);
      await deactivateStudent.mutateAsync(selectedStudent);
      toast({
        title: "Success",
        description: "Student deactivated successfully",
      });
      // Refresh the data after deactivation
      refetchData();
    } catch (error) {
      console.error("Error in confirmDeactivate:", error);
    } finally {
      setShowDeactivateDialog(false);
      setSelectedStudent(null);
    }
  };

  const handleView = (id: string) => {
    setSelectedStudent(id);
    setShowViewStudentDialog(true);
  };

  const getStudentById = (id: string) => {
    return activeStudents?.find(student => student.id === id) || 
           pendingStudents?.find(student => student.id === id);
  };

  const handleDebugRefresh = async () => {
    setIsRefreshing(true);
    try {
      const debug = await debugFetchStudents();
      console.log("Debug data received:", debug);
      setDebugInfo(debug);
      // Also refresh the UI data
      refetchData();
    } catch (error) {
      console.error("Error fetching debug data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateDemoStudent = async () => {
    setIsCreatingDemo(true);
    try {
      await createDemoStudent();
      toast({
        title: "Success",
        description: "Demo student created successfully",
      });
      // Add explicit refresh after a delay
      setTimeout(() => {
        handleDebugRefresh();
      }, 3000);
    } catch (error) {
      console.error("Error creating demo student:", error);
      toast({
        title: "Error",
        description: "Failed to create demo student",
        variant: "destructive",
      });
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const filteredActiveStudents = activeStudents?.filter(
    student => (
      student.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      !searchQuery
    )
  ) || [];

  const filteredPendingStudents = pendingStudents?.filter(
    student => (
      student.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      !searchQuery
    )
  ) || [];

  if (isLoading) {
    return (
      <DashboardLayout sidebarContent={<AdminNavigation />} userType="admin">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const selectedStudentData = selectedStudent ? getStudentById(selectedStudent) : null;

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
            <div className="flex gap-2">
              <Button 
                onClick={handleDebugRefresh} 
                variant="outline" 
                size="icon" 
                disabled={isRefreshing}
                title="Refresh Data"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </Button>
              <Button 
                onClick={handleCreateDemoStudent} 
                variant="outline"
                disabled={isCreatingDemo}
              >
                {isCreatingDemo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Demo Student</>
                )}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a new student to the system</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
          </div>

          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="active">
                Active Students ({filteredActiveStudents.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending Approval ({filteredPendingStudents.length})
              </TabsTrigger>
              <TabsTrigger value="debug">
                Debug Info
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActiveStudents.length > 0 ? (
                        filteredActiveStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.profile?.first_name} {student.profile?.last_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.profile?.email}
                            </TableCell>
                            <TableCell>
                              {student.instructor ? 
                                `${student.instructor.profile?.first_name} ${student.instructor.profile?.last_name}` : 
                                'Not assigned'}
                            </TableCell>
                            <TableCell>{student.level}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                Active
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => {}}
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
                                    <p>View Student Details</p>
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
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            No active students found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingStudents.length > 0 ? (
                        filteredPendingStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.profile?.first_name} {student.profile?.last_name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.profile?.email}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
                                Pending
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleApprove(student.id)}
                                  className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDecline(student.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No pending students found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="debug" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                  <CardDescription>
                    Database details for debugging purposes
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-96 overflow-auto">
                  {debugInfo ? (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Profiles in Database:</h3>
                      <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                        {JSON.stringify(debugInfo.allProfiles, null, 2)}
                      </pre>
                      
                      <h3 className="text-lg font-medium mt-4 mb-2">Students in Database:</h3>
                      <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                        {JSON.stringify(debugInfo.allStudents, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="mb-4 text-muted-foreground">Click refresh to load debug info</p>
                      <Button onClick={handleDebugRefresh} disabled={isRefreshing}>
                        {isRefreshing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Load Debug Data
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* View Student Dialog */}
          <Dialog open={showViewStudentDialog} onOpenChange={setShowViewStudentDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
              </DialogHeader>
              {selectedStudentData && (
                <div className="py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedStudentData.profile?.first_name} {selectedStudentData.profile?.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedStudentData.profile?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Level</p>
                      <p className="font-medium">{selectedStudentData.level || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">{selectedStudentData.enrollment_status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Instructor</p>
                      <p className="font-medium">
                        {selectedStudentData.instructor
                          ? `${selectedStudentData.instructor.profile?.first_name} ${selectedStudentData.instructor.profile?.last_name}`
                          : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setShowViewStudentDialog(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Deactivate Confirmation Dialog */}
          <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Deactivate Student</DialogTitle>
                <DialogDescription>
                  Are you sure you want to deactivate this student account? This action cannot be undone.
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
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export default AdminStudents;
