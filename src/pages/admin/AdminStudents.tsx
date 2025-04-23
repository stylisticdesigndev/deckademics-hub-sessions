
import React, { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Check, X, Eye, UserRound, Loader2 } from 'lucide-react';
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
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showViewStudentDialog, setShowViewStudentDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  
  const {
    activeStudents,
    pendingStudents,
    isLoading,
    approveStudent,
    declineStudent,
    deactivateStudent
  } = useAdminStudents();

  const handleApprove = (id: string) => {
    approveStudent.mutate(id);
  };

  const handleDecline = (id: string) => {
    declineStudent.mutate(id);
  };

  const handleDeactivate = (id: string) => {
    setSelectedStudent(id);
    setShowDeactivateDialog(true);
  };
  
  const confirmDeactivate = () => {
    if (!selectedStudent) return;
    deactivateStudent.mutate(selectedStudent);
    setShowDeactivateDialog(false);
    setSelectedStudent(null);
  };

  const handleView = (id: string) => {
    setSelectedStudent(id);
    setShowViewStudentDialog(true);
  };

  const getStudentById = (id: string) => {
    return activeStudents?.find(student => student.id === id) || 
           pendingStudents?.find(student => student.id === id);
  };

  const filteredActiveStudents = activeStudents?.filter(
    student => (
      student.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  const filteredPendingStudents = pendingStudents?.filter(
    student => (
      student.profile.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                            <td className="px-4 py-3 font-medium">
                              {student.profile.first_name} {student.profile.last_name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {student.profile.email}
                            </td>
                            <td className="px-4 py-3">
                              {student.instructor?.profile.first_name} {student.instructor?.profile.last_name}
                            </td>
                            <td className="px-4 py-3">{student.level}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="bg-green-500/10 text-green-500">
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
                            <td className="px-4 py-3 font-medium">
                              {student.profile.first_name} {student.profile.last_name}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {student.profile.email}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-500">
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

          {/* View Student Dialog */}
          <Dialog open={showViewStudentDialog} onOpenChange={setShowViewStudentDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
              </DialogHeader>
              {selectedStudent && (
                <div className="py-4">
                  {/* Student details will be displayed here */}
                  <p>Student ID: {selectedStudent}</p>
                  {/* Add more details as needed */}
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
