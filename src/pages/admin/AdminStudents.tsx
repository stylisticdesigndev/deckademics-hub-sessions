import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminStudents } from '@/hooks/useAdminStudents';
import { useMockUsers } from '@/hooks/useMockUsers';
import { useAppSettings } from '@/hooks/useAppSettings';
import { InstructorAssignmentDialog } from '@/components/admin/instructor-assignment/InstructorAssignmentDialog';
import ScheduleRequestsList from '@/components/admin/schedule-requests/ScheduleRequestsList';
import { useScheduleChangeRequests } from '@/hooks/useScheduleChangeRequests';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
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
import { Search, Check, X, Eye, UserRound, Loader2, MessageSquare, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VinylLoader from '@/components/ui/VinylLoader';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
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
import { toast } from '@/hooks/use-toast';

const STUDENTS_PER_PAGE = 10;

const AdminStudents = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [studentToDeactivate, setStudentToDeactivate] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'pending' ? 'pending' : searchParams.get('tab') === 'inactive' ? 'inactive' : 'active';
  const [selectedTabValue, setSelectedTabValue] = useState(initialTab);
  const [processingStudentId, setProcessingStudentId] = useState<string | null>(null);
  const [editingLevelStudentId, setEditingLevelStudentId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkLevelDialog, setShowBulkLevelDialog] = useState(false);
  const [bulkLevel, setBulkLevel] = useState('novice');
  const [showBulkDeactivateDialog, setShowBulkDeactivateDialog] = useState(false);
  const [activePage, setActivePage] = useState(1);

  const {
    activeStudents,
    pendingStudents,
    inactiveStudents,
    isLoading,
    approveStudent,
    declineStudent,
    deactivateStudent,
    reactivateStudent,
    updateStudentLevel,
    updateStudentSchedule,
    refetchData
  } = useAdminStudents();

  const { pendingRequests } = useScheduleChangeRequests('admin');
  const { settings } = useAppSettings();
  const { setMockFlag } = useMockUsers();
  const hideMocks = settings?.hide_mock_users === true;

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_SLOTS = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedTabValue]);

  // Reset pagination when search changes
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery]);

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
      toast.error('Failed to approve student. Please try again.');
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
      toast.error('Failed to decline student. Please try again.');
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
      toast.error('Failed to deactivate student. Please try again.');
    } finally {
      setProcessingStudentId(null);
      setShowDeactivateDialog(false);
      setStudentToDeactivate(null);
    }
  };

  const handleReactivate = useCallback(async (id: string) => {
    try {
      setProcessingStudentId(id);
      await reactivateStudent.mutateAsync(id);
      await refetchData();
      setTimeout(async () => { await refetchData(); }, 1000);
    } catch (error: any) {
      toast.error('Failed to reactivate student. Please try again.');
    } finally {
      setProcessingStudentId(null);
    }
  }, [reactivateStudent, refetchData]);

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
           pendingStudents?.find(s => s.id === id) ||
           inactiveStudents?.find(s => s.id === id);
  };

  const filterStudents = (students: typeof activeStudents) => {
    return students?.filter(
      student => (
        (
          student.profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          !searchQuery
        ) && (!hideMocks || !student.profile?.is_mock)
      )
    ) || [];
  };

  const filteredActiveStudents = filterStudents(activeStudents);
  const filteredPendingStudents = filterStudents(pendingStudents);
  const filteredInactiveStudents = filterStudents(inactiveStudents);

  // Pagination for active students
  const totalActivePages = Math.max(1, Math.ceil(filteredActiveStudents.length / STUDENTS_PER_PAGE));
  const paginatedActiveStudents = useMemo(() => {
    const start = (activePage - 1) * STUDENTS_PER_PAGE;
    return filteredActiveStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredActiveStudents, activePage]);

  // Clamp page if data changes
  useEffect(() => {
    if (activePage > totalActivePages) setActivePage(totalActivePages);
  }, [totalActivePages, activePage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedActiveStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedActiveStudents.map(s => s.id));
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
    return <VinylLoader message="Loading students..." />;
  }

  const viewedStudent = viewStudentId ? getStudentById(viewStudentId) : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500">Pending</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Inactive</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Students Management</h1>
        <p className="text-muted-foreground">
          Manage all students, approve new registrations, and track progress.
        </p>
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
        <TabsList className="flex-wrap">
          <TabsTrigger value="active">
            Active ({filteredActiveStudents.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filteredPendingStudents.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({filteredInactiveStudents.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Schedule Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {pendingRequests.length}
              </Badge>
            )}
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
              <Button size="sm" variant="outline" onClick={() => setMockFlag.mutate({ userIds: selectedIds, isMock: true })} disabled={setMockFlag.isPending}>
                Mark as Mock
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
                          checked={paginatedActiveStudents.length > 0 && selectedIds.length === paginatedActiveStudents.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActiveStudents.length > 0 ? (
                      paginatedActiveStudents.map((student) => (
                        <TableRow key={student.id} data-state={selectedIds.includes(student.id) ? 'selected' : undefined}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(student.id)}
                              onCheckedChange={() => toggleSelect(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                {student.profile?.avatar_url && <AvatarImage src={student.profile.avatar_url} alt={`${student.profile?.first_name} ${student.profile?.last_name}`} />}
                                <AvatarFallback className="text-xs">
                                  {(student.profile?.first_name?.[0] || '')}{(student.profile?.last_name?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.profile?.first_name} {student.profile?.last_name}</span>{student.profile?.is_mock && (<Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-500">Mock</Badge>)}
                            </div>
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
                          <TableCell className="text-sm text-muted-foreground">
                            {(student as any).class_day || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {(student as any).class_time || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge('active')}
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
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No active students found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              {totalActivePages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {activePage} of {totalActivePages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivePage(p => Math.max(1, p - 1))}
                      disabled={activePage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActivePage(p => Math.min(totalActivePages, p + 1))}
                      disabled={activePage === totalActivePages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                {student.profile?.avatar_url && <AvatarImage src={student.profile.avatar_url} alt={`${student.profile?.first_name} ${student.profile?.last_name}`} />}
                                <AvatarFallback className="text-xs">
                                  {(student.profile?.first_name?.[0] || '')}{(student.profile?.last_name?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.profile?.first_name} {student.profile?.last_name}</span>{student.profile?.is_mock && (<Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-500">Mock</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.profile?.email}
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge('pending')}
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
                                    disabled={processingStudentId === student.id}
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
                                    disabled={processingStudentId === student.id}
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
                          No pending students.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inactive Students Tab */}
        <TabsContent value="inactive" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Students</CardTitle>
              <CardDescription>Deactivated and declined students. You can reactivate them.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInactiveStudents.length > 0 ? (
                      filteredInactiveStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                {student.profile?.avatar_url && <AvatarImage src={student.profile.avatar_url} alt={`${student.profile?.first_name} ${student.profile?.last_name}`} />}
                                <AvatarFallback className="text-xs">
                                  {(student.profile?.first_name?.[0] || '')}{(student.profile?.last_name?.[0] || '')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.profile?.first_name} {student.profile?.last_name}</span>{student.profile?.is_mock && (<Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-500">Mock</Badge>)}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.profile?.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">{student.level}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(student.enrollment_status)}
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
                                    onClick={() => handleReactivate(student.id)}
                                    className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-600/10"
                                    disabled={processingStudentId === student.id}
                                  >
                                    {processingStudentId === student.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Reactivate Student</p></TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No inactive students.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Requests Tab */}
        <TabsContent value="requests" className="space-y-4 pt-4">
          <ScheduleRequestsList />
        </TabsContent>
      </Tabs>

      {/* Student Detail Sheet */}
      <Sheet open={!!viewStudentId} onOpenChange={(open) => !open && setViewStudentId(null)}>
        <SheetContent className="sm:max-w-lg overflow-auto">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                {viewedStudent?.profile?.avatar_url && <AvatarImage src={viewedStudent.profile.avatar_url} alt={`${viewedStudent.profile?.first_name} ${viewedStudent.profile?.last_name}`} />}
                <AvatarFallback className="text-lg">
                  {(viewedStudent?.profile?.first_name?.[0] || '')}{(viewedStudent?.profile?.last_name?.[0] || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle>
                  {viewedStudent ? `${viewedStudent.profile?.first_name} ${viewedStudent.profile?.last_name}` : 'Student Details'}
                </SheetTitle>
                <SheetDescription>
                  {viewedStudent?.profile?.email}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          {viewedStudent && (
            <div className="space-y-6 mt-6">
              <div className="flex items-center gap-2">
                {getStatusBadge(viewedStudent.enrollment_status)}
                <Badge variant="outline" className="capitalize">{viewedStudent.level}</Badge>
                {viewedStudent.profile?.is_mock && (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-500">Mock</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Level</p>
                  <Select
                    value={viewedStudent.level === 'beginner' ? 'novice' : (viewedStudent.level || 'novice')}
                    onValueChange={(value) => handleLevelChange(viewedStudent.id, value)}
                    disabled={updateStudentLevel.isPending}
                  >
                    <SelectTrigger className="w-full pointer-events-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[60] pointer-events-auto" position="popper">
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="amateur">Amateur</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal", !(viewedStudent as any).start_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(viewedStudent as any).start_date ? format(new Date((viewedStudent as any).start_date), 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={(viewedStudent as any).start_date ? new Date((viewedStudent as any).start_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            updateStudentSchedule.mutate({
                              studentId: viewedStudent.id,
                              start_date: format(date, 'yyyy-MM-dd'),
                            });
                          }
                        }}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Class Day</p>
                  <Select
                    value={(viewedStudent as any).class_day || ''}
                    onValueChange={(value) => updateStudentSchedule.mutate({ studentId: viewedStudent.id, class_day: value })}
                    disabled={updateStudentSchedule.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Class Time</p>
                  <Select
                    value={(viewedStudent as any).class_time || ''}
                    onValueChange={(value) => updateStudentSchedule.mutate({ studentId: viewedStudent.id, class_time: value })}
                    disabled={updateStudentSchedule.isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="two-way-msg" className="text-sm">Two-way messaging</Label>
                  <p className="text-xs text-muted-foreground">Controlled by the assigned instructor.</p>
                </div>
                <Badge
                  variant="outline"
                  className={(viewedStudent as any).two_way_messaging === false
                    ? "border-yellow-500/50 text-yellow-500"
                    : "border-green-500/50 text-green-500"}
                >
                  {(viewedStudent as any).two_way_messaging === false ? 'Read-only' : 'Enabled'}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="mock-flag-student" className="text-sm">Mark as mock user</Label>
                  <p className="text-xs text-muted-foreground">Test/seed account. Hidden when "Hide mock users" is on.</p>
                </div>
                <Switch
                  id="mock-flag-student"
                  checked={!!viewedStudent.profile?.is_mock}
                  disabled={setMockFlag.isPending}
                  onCheckedChange={(checked) =>
                    setMockFlag.mutate({ userIds: [viewedStudent.id], isMock: checked })
                  }
                />
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
                {(viewedStudent.enrollment_status === 'inactive' || viewedStudent.enrollment_status === 'declined') && (
                  <Button size="sm" className="w-full justify-start bg-green-600 hover:bg-green-700" onClick={() => { setViewStudentId(null); handleReactivate(viewStudentId!); }}>
                    <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
                  </Button>
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
              Are you sure you want to deactivate this student? You can reactivate them later from the Inactive tab.
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
