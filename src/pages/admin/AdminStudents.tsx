import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStudents } from '@/hooks/useAdminStudents';
import { InstructorAssignmentDialog } from '@/components/admin/instructor-assignment/InstructorAssignmentDialog';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Check, X, Eye, UserRound, Loader2, Edit2, MessageSquare } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

const AdminStudents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [studentToDeactivate, setStudentToDeactivate] = useState<string | null>(null);
  
  
  const [selectedTabValue, setSelectedTabValue] = useState('active');
  const [processingStudentId, setProcessingStudentId] = useState<string | null>(null);
  const [editingLevelStudentId, setEditingLevelStudentId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkLevelDialog, setShowBulkLevelDialog] = useState(false);
  const [bulkLevel, setBulkLevel] = useState('novice');
  const [showBulkDeactivateDialog, setShowBulkDeactivateDialog] = useState(false);
  
  const {
    activeStudents,
    pendingStudents,
    isLoading,
    approveStudent,
    declineStudent,
    deactivateStudent,
    updateStudentLevel,
    refetchData
  } = useAdminStudents();

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedTabValue]);




  const handleApprove = useCallback(async (id: string) => {
    try {
      setProcessingStudentId(id);
      await approveStudent.mutateAsync(id);
      setSelectedTabValue('active');
      setTimeout(async () => {
        await refetchData();
        setTimeout(async () => { await refetchData(); }, 1000);
      }, 500);
    } catch (error: any) {
      toast.error(`Failed to approve student: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingStudentId(null);
    }
  }, [approveStudent, refetchData]);

  const handleDecline = useCallback(async (id: string) => {
    try {
      setProcessingStudentId(id);
      await declineStudent.mutateAsync(id);
      await refetchData();
      setTimeout(async () => { await refetchData(); }, 1000);
    } catch (error: any) {
      toast.error(`Failed to decline student: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingStudentId(null);
    }
  }, [declineStudent, refetchData]);

  const handleDeactivate = (id: string) => {
    setStudentToDeactivate(id);
    setShowDeactivateDialog(true);
  };
  
  const confirmDeactivate = async () => {
    if (!studentToDeactivate) return;
    try {
      setProcessingStudentId(studentToDeactivate);
      await deactivateStudent.mutateAsync(studentToDeactivate);
      await refetchData();
      setTimeout(async () => { await refetchData(); }, 1000);
    } catch (error: any) {
      toast.error(`Failed to deactivate student: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingStudentId(null);
      setShowDeactivateDialog(false);
      setStudentToDeactivate(null);
    }
  };

  const handleLevelChange = async (studentId: string, newLevel: string) => {
    try {
      await updateStudentLevel.mutateAsync({ studentId, level: newLevel });
      setEditingLevelStudentId(null);
      await refetchData();
    } catch (error) {
      console.error('Error updating level:', error);
    }
  };

  const getStudentById = (id: string) => {
    return activeStudents?.find(s => s.id === id) || 
           pendingStudents?.find(s => s.id === id);
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredActiveStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredActiveStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkLevelChange = async () => {
    for (const id of selectedIds) {
      await updateStudentLevel.mutateAsync({ studentId: id, level: bulkLevel });
    }
    setSelectedIds([]);
    setShowBulkLevelDialog(false);
    await refetchData();
  };

  const handleBulkDeactivate = async () => {
    for (const id of selectedIds) {
      await deactivateStudent.mutateAsync(id);
    }
    setSelectedIds([]);
    setShowBulkDeactivateDialog(false);
    await refetchData();
  };

  const handleBulkMessage = () => {
    const recipientIds = selectedIds.join(',');
    navigate(`/admin/messages?recipients=${recipientIds}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const viewedStudent = viewStudentId ? getStudentById(viewStudentId) : null;

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Students Management</h1>
          <p className="text-muted-foreground">
            Manage all students, approve new registrations, and track progress.
          </p>
        </div>
        </div>
      </div>

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

      <Tabs value={selectedTabValue} onValueChange={setSelectedTabValue}>
        <TabsList>
          <TabsTrigger value="active" disabled={isRefreshing}>
            Active Students ({filteredActiveStudents.length})
          </TabsTrigger>
          <TabsTrigger value="pending" disabled={isRefreshing}>
            Pending Approval ({filteredPendingStudents.length})
          </TabsTrigger>
        </TabsList>

        {/* Active Students Tab */}
        <TabsContent value="active" className="space-y-4 pt-4">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Button size="sm" variant="outline" onClick={() => setShowBulkLevelDialog(true)}>
                Change Level
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkMessage}>
                <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setShowBulkDeactivateDialog(true)}>
                Deactivate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Active Students</CardTitle>
              <CardDescription>Currently enrolled students.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={filteredActiveStudents.length > 0 && selectedIds.length === filteredActiveStudents.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
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
                        <TableRow key={student.id} data-state={selectedIds.includes(student.id) ? 'selected' : undefined}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(student.id)}
                              onCheckedChange={() => toggleSelect(student.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.profile?.first_name} {student.profile?.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.profile?.email}
                          </TableCell>
                          <TableCell>
                            {student.instructor ? 
                              `${student.instructor.profile?.first_name} ${student.instructor.profile?.last_name}` : 
                              <span className="text-muted-foreground">Unassigned</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{student.level}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <InstructorAssignmentDialog
                                      studentId={student.id}
                                      studentName={`${student.profile?.first_name} ${student.profile?.last_name}`}
                                      currentInstructorId={student.instructor_id}
                                    >
                                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={processingStudentId === student.id}>
                                        <UserRound className="h-4 w-4" />
                                      </Button>
                                    </InstructorAssignmentDialog>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent><p>Assign Instructor</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setViewStudentId(student.id)}
                                    className="h-8 w-8"
                                    disabled={processingStudentId === student.id}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View Details</p></TooltipContent>
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
                                <TooltipContent><p>Deactivate Student</p></TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {isRefreshing ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <p>Loading students...</p>
                            </div>
                          ) : (
                            'No active students found.'
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Students Tab */}
        <TabsContent value="pending" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Students</CardTitle>
              <CardDescription>Review and approve student registration requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
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
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500">Pending</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setViewStudentId(student.id)}
                                    className="h-8 w-8"
                                    disabled={processingStudentId === student.id}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View Details</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent><p>Approve Student</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
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
                                </TooltipTrigger>
                                <TooltipContent><p>Decline Student</p></TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {isRefreshing ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <p>Loading pending students...</p>
                            </div>
                          ) : (
                            'No pending students.'
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Detail Sheet */}
      <Sheet open={!!viewStudentId} onOpenChange={(open) => !open && setViewStudentId(null)}>
        <SheetContent className="sm:max-w-lg overflow-auto">
          <SheetHeader>
            <SheetTitle>
              {viewedStudent ? `${viewedStudent.profile?.first_name} ${viewedStudent.profile?.last_name}` : 'Student Details'}
            </SheetTitle>
            <SheetDescription>
              {viewedStudent?.profile?.email}
            </SheetDescription>
          </SheetHeader>
          {viewedStudent && (
            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  viewedStudent.enrollment_status === 'active' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-amber-500/10 text-amber-500'
                }>
                  {viewedStudent.enrollment_status}
                </Badge>
                <Badge variant="outline" className="capitalize">{viewedStudent.level}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Level</p>
                  <Select
                    value={viewedStudent.level === 'beginner' ? 'novice' : (viewedStudent.level || 'novice')}
                    onValueChange={(value) => handleLevelChange(viewedStudent.id, value)}
                    disabled={updateStudentLevel.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="amateur">Amateur</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium">{(viewedStudent as any).start_date || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Instructor</p>
                  <p className="text-sm font-medium">
                    {viewedStudent.instructor
                      ? `${viewedStudent.instructor.profile?.first_name} ${viewedStudent.instructor.profile?.last_name}`
                      : 'Unassigned'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium capitalize">{viewedStudent.enrollment_status}</p>
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                {viewedStudent.enrollment_status === 'active' && (
                  <>
                    <InstructorAssignmentDialog
                      studentId={viewedStudent.id}
                      studentName={`${viewedStudent.profile?.first_name} ${viewedStudent.profile?.last_name}`}
                      currentInstructorId={viewedStudent.instructor_id}
                    >
                      <Button size="sm" variant="outline" className="w-full justify-start">
                        <UserRound className="h-4 w-4 mr-2" /> Assign Instructor
                      </Button>
                    </InstructorAssignmentDialog>
                    <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => { setViewStudentId(null); navigate(`/admin/messages?recipient=${viewStudentId}`); }}>
                      <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                    </Button>
                    <Button size="sm" variant="destructive" className="w-full justify-start" onClick={() => { setViewStudentId(null); handleDeactivate(viewStudentId!); }}>
                      <X className="h-4 w-4 mr-2" /> Deactivate
                    </Button>
                  </>
                )}
                {viewedStudent.enrollment_status === 'pending' && (
                  <>
                    <Button size="sm" className="w-full justify-start bg-green-600 hover:bg-green-700" onClick={() => { setViewStudentId(null); handleApprove(viewStudentId!); }}>
                      <Check className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="w-full justify-start" onClick={() => { setViewStudentId(null); handleDecline(viewStudentId!); }}>
                      <X className="h-4 w-4 mr-2" /> Decline
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deactivate Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeactivate}
              disabled={processingStudentId !== null}
            >
              {processingStudentId !== null ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                'Deactivate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Level Dialog */}
      <Dialog open={showBulkLevelDialog} onOpenChange={setShowBulkLevelDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Level for {selectedIds.length} Students</DialogTitle>
            <DialogDescription>All selected students will be updated to the chosen level.</DialogDescription>
          </DialogHeader>
          <Select value={bulkLevel} onValueChange={setBulkLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="novice">Novice</SelectItem>
              <SelectItem value="amateur">Amateur</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkLevelDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkLevelChange} disabled={updateStudentLevel.isPending}>
              {updateStudentLevel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Deactivate Dialog */}
      <Dialog open={showBulkDeactivateDialog} onOpenChange={setShowBulkDeactivateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Deactivate {selectedIds.length} Students</DialogTitle>
            <DialogDescription>Are you sure you want to deactivate all selected students?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeactivateDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDeactivate} disabled={deactivateStudent.isPending}>
              Deactivate All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default AdminStudents;
