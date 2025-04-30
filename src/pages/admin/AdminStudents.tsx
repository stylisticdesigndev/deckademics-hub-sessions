import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedTabValue, setSelectedTabValue] = useState('pending');
  const [processingStudentId, setProcessingStudentId] = useState<string | null>(null);
  
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

  // Enhanced effect to ensure we have fresh data when changing tabs
  useEffect(() => {
    const fetchData = async () => {
      setIsRefreshing(true);
      console.log(`Fetching fresh data after tab change to ${selectedTabValue}`);
      try {
        await refetchData();
        console.log(`Data refreshed for ${selectedTabValue} tab`);
      } catch (error) {
        console.error("Error refreshing data after tab change:", error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchData();
  }, [selectedTabValue, refetchData]);

  // Memoized handler for approving a student with better error handling
  const handleApprove = useCallback(async (id: string) => {
    try {
      setProcessingStudentId(id);
      console.log("Approving student with ID:", id);
      
      // Show toast for better feedback
      toast.info("Approving student enrollment...");
      
      await approveStudent.mutateAsync(id);
      
      console.log("Approval complete, switching to active tab");
      
      // Switch to active tab to see the newly approved student
      setSelectedTabValue('active');
      
      // Schedule multiple data refreshes to ensure UI consistency
      setTimeout(async () => {
        console.log("First check after approval");
        await refetchData();
        
        // Second check after a longer delay
        setTimeout(async () => {
          console.log("Second verification check after approval");
          await refetchData();
        }, 1000);
      }, 500);
      
    } catch (error: any) {
      console.error("Error in handleApprove:", error);
      toast.error(`Failed to approve student: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingStudentId(null);
    }
  }, [approveStudent, refetchData]);

  // Memoized handler for declining a student with verification
  const handleDecline = useCallback(async (id: string) => {
    try {
      setProcessingStudentId(id);
      console.log("Declining student with ID:", id);
      
      // Show toast for better feedback
      toast.info("Declining student enrollment...");
      
      await declineStudent.mutateAsync(id);
      
      // Multiple data refreshes to ensure UI consistency
      console.log("Refreshing data after decline");
      await refetchData();
      
      // Second verification check
      setTimeout(async () => {
        console.log("Second verification check after declining");
        await refetchData();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error in handleDecline:", error);
      toast.error(`Failed to decline student: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingStudentId(null);
    }
  }, [declineStudent, refetchData]);

  const handleDeactivate = (id: string) => {
    setSelectedStudent(id);
    setShowDeactivateDialog(true);
  };
  
  // Updated deactivation confirmation with verification
  const confirmDeactivate = async () => {
    if (!selectedStudent) return;
    
    try {
      setProcessingStudentId(selectedStudent);
      console.log("Deactivating student with ID:", selectedStudent);
      
      toast.info("Deactivating student account...");
      
      await deactivateStudent.mutateAsync(selectedStudent);
      
      // Multiple refreshes for UI consistency
      console.log("Refreshing data after deactivation");
      await refetchData();
      
      // Second verification check
      setTimeout(async () => {
        console.log("Second verification check after deactivation");
        await refetchData();
      }, 1000);
      
    } catch (error: any) {
      console.error("Error in confirmDeactivate:", error);
      toast.error(`Failed to deactivate student: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingStudentId(null);
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

  // Enhanced debug refresh with better error handling
  const handleDebugRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log("Fetching debug data and refreshing UI...");
      const debug = await debugFetchStudents();
      console.log("Debug data received:", debug);
      setDebugInfo(debug);
      
      // Also refresh the UI data
      await refetchData();
      console.log("UI data refreshed");
    } catch (error) {
      console.error("Error fetching debug data:", error);
      toast.error("Failed to fetch debug data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateDemoStudent = async () => {
    setIsCreatingDemo(true);
    try {
      const result = await createDemoStudent();
      
      if (result) {
        toast.success("Demo student created successfully");
        
        // Add explicit refresh after a delay
        setTimeout(async () => {
          await handleDebugRefresh();
        }, 1000);
      } else {
        toast.error("Failed to create demo student");
      }
    } catch (error) {
      console.error("Error creating demo student:", error);
      toast.error("Failed to create demo student");
    } finally {
      setIsCreatingDemo(false);
    }
  };
  
  // Add a forced data refresh function for UI buttons
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log("Force refreshing all student data");
      await refetchData();
      toast.success("Student data refreshed successfully");
    } catch (error) {
      console.error("Error during force refresh:", error);
    } finally {
      setIsRefreshing(false);
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
                onClick={handleForceRefresh} 
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
                disabled={isCreatingDemo || isRefreshing}
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
                  <Button disabled={isRefreshing}>
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

          <Tabs value={selectedTabValue} onValueChange={setSelectedTabValue}>
            <TabsList>
              <TabsTrigger value="active" disabled={isRefreshing}>
                Active Students ({filteredActiveStudents.length})
                {isRefreshing && selectedTabValue === 'active' && (
                  <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" disabled={isRefreshing}>
                Pending Approval ({filteredPendingStudents.length})
                {isRefreshing && selectedTabValue === 'pending' && (
                  <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
              <TabsTrigger value="debug" disabled={isRefreshing}>
                Debug Info
                {isRefreshing && selectedTabValue === 'debug' && (
                  <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                )}
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
                                      disabled={processingStudentId === student.id}
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
                                      disabled={processingStudentId === student.id}
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
                                      disabled={processingStudentId === student.id}
                                    >
                                      {processingStudentId === student.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
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
                            {isRefreshing ? (
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p>Loading active students...</p>
                              </div>
                            ) : (
                              <>
                                No active students found matching your search.
                                <div className="mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleForceRefresh}
                                    className="mx-auto"
                                    disabled={isRefreshing}
                                  >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Refresh Data
                                  </Button>
                                </div>
                              </>
                            )}
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
                                  disabled={processingStudentId === student.id || isRefreshing}
                                >
                                  {processingStudentId === student.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDecline(student.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={processingStudentId === student.id || isRefreshing}
                                >
                                  {processingStudentId === student.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            {isRefreshing ? (
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <p>Loading pending students...</p>
                              </div>
                            ) : (
                              <>
                                No pending students found matching your search.
                                <div className="mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleForceRefresh}
                                    className="mx-auto"
                                    disabled={isRefreshing}
                                  >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Refresh Data
                                  </Button>
                                </div>
                              </>
                            )}
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
                  {isRefreshing ? (
                    <div className="flex justify-center py-12">
                      <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p>Loading debug information...</p>
                      </div>
                    </div>
                  ) : debugInfo ? (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Profiles in Database:</h3>
                      <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                        {JSON.stringify(debugInfo.allProfiles, null, 2)}
                      </pre>
                      
                      <h3 className="text-lg font-medium mt-4 mb-2">Students in Database:</h3>
                      <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto">
                        {JSON.stringify(debugInfo.allStudents, null, 2)}
                      </pre>
                      
                      <div className="mt-4">
                        <Button 
                          onClick={handleDebugRefresh} 
                          variant="outline"
                          disabled={isRefreshing}
                        >
                          {isRefreshing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Refreshing...
                            </>
                          ) : (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Refresh Debug Data
                            </>
                          )}
                        </Button>
                      </div>
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
                <Button 
                  variant="destructive" 
                  onClick={confirmDeactivate}
                  disabled={processingStudentId !== null}
                >
                  {processingStudentId !== null ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Deactivate'
                  )}
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
