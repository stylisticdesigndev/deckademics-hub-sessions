import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminInstructors } from '@/hooks/useAdminInstructors';
import { useMockUsers } from '@/hooks/useMockUsers';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useStudentAssignment } from '@/hooks/useStudentAssignment';
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
import { Search, Check, X, Eye, Users, Loader2, AlertCircle, Info, MessageSquare, DollarSign, Clock, Award } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator as SeparatorUI } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AdminInstructors = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInstructorTab = searchParams.get('tab') === 'pending' ? 'pending' : 'active';
  const [searchQuery, setSearchQuery] = useState('');
  const [viewInstructorId, setViewInstructorId] = useState<string | null>(null);
  const [instructorToDeactivate, setInstructorToDeactivate] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  
  // State for student assignment
  const [showStudentAssignment, setShowStudentAssignment] = useState(false);
  const [instructorToAssign, setInstructorToAssign] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[]>([]);
  const [showBulkDeactivateInstructors, setShowBulkDeactivateInstructors] = useState(false);
  const {
    activeInstructors,
    pendingInstructors,
    inactiveInstructors,
    isLoading,
    approveInstructor,
    declineInstructor,
    deactivateInstructor,
    activateInstructor,
  } = useAdminInstructors();
  const { settings } = useAppSettings();
  const { setMockFlag } = useMockUsers();
  const hideMocks = settings?.hide_mock_users === true;

  const {
    unassignedStudents,
    assignedStudents,
    isLoadingStudents,
    isLoadingAssigned,
    assignStudentsToInstructor,
    unassignStudent,
  } = useStudentAssignment(instructorToAssign);

  // Get instructor by ID now works with the correct types
  const getInstructorById = (id: string) => {
    return (activeInstructors as InstructorWithProfile[]).find(instructor => instructor.id === id) ||
           (pendingInstructors as InstructorWithProfile[]).find(instructor => instructor.id === id) ||
           (inactiveInstructors as InstructorWithProfile[]).find(instructor => instructor.id === id);
  };

  const filteredActiveInstructors = (activeInstructors as InstructorWithProfile[])?.filter(
    instructor => (
      (
        instructor.profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) && (!hideMocks || !instructor.profile.is_mock)
    )
  ) || [];

  const filteredPendingInstructors = (pendingInstructors as InstructorWithProfile[])?.filter(
    instructor => (
      (
        instructor.profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) && (!hideMocks || !instructor.profile.is_mock)
    )
  ) || [];

  const filteredInactiveInstructors = (inactiveInstructors as InstructorWithProfile[])?.filter(
    instructor => (
      (
        instructor.profile.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.profile.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instructor.profile.email.toLowerCase().includes(searchQuery.toLowerCase())
      ) && (!hideMocks || !instructor.profile.is_mock)
    )
  ) || [];


  // Bulk action helpers for instructors
  const toggleInstructorSelectAll = () => {
    if (selectedInstructorIds.length === filteredActiveInstructors.length) {
      setSelectedInstructorIds([]);
    } else {
      setSelectedInstructorIds(filteredActiveInstructors.map(i => i.id));
    }
  };

  const toggleInstructorSelect = (id: string) => {
    setSelectedInstructorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkDeactivateInstructors = async () => {
    for (const id of selectedInstructorIds) {
      await deactivateInstructor.mutateAsync(id);
    }
    setSelectedInstructorIds([]);
    setShowBulkDeactivateInstructors(false);
  };

  const handleBulkMessageInstructors = () => {
    const recipientIds = selectedInstructorIds.join(',');
    navigate(`/admin/messages?recipients=${recipientIds}`);
  };

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

  // Fetch students assigned to instructor being deactivated
  const { data: deactivateAssignedStudents = [], isLoading: isLoadingDeactivateStudents } = useQuery({
    queryKey: ['admin', 'deactivate-assigned-students', instructorToDeactivate],
    queryFn: async () => {
      if (!instructorToDeactivate) return [];
      const { data, error } = await supabase
        .from('students')
        .select(`id, level, enrollment_status, instructor_id, profiles ( first_name, last_name, email )`)
        .eq('enrollment_status', 'active' as any)
        .eq('instructor_id', instructorToDeactivate as any);
      if (error) return [];
      return (data || []).map((s: any) => ({
        id: s.id,
        first_name: s.profiles?.first_name || '',
        last_name: s.profiles?.last_name || '',
      }));
    },
    enabled: !!instructorToDeactivate && showDeactivateDialog,
  });

  const confirmDeactivate = async () => {
    if (!instructorToDeactivate) return;
    // Unassign all students first
    if (deactivateAssignedStudents.length > 0) {
      for (const student of deactivateAssignedStudents) {
        await supabase
          .from('students')
          .update({ instructor_id: null } as any)
          .eq('id', student.id as any);
      }
    }
    deactivateInstructor.mutate(instructorToDeactivate);
    setShowDeactivateDialog(false);
    setInstructorToDeactivate(null);
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
          There are no instructor records. Instructors can self-register at the instructor sign-up page.
        </AlertDescription>
      </Alert>
    );
  };

  // Add deactivate instructor dialog
  // View Details Sheet data
  const viewedInstructor = viewInstructorId ? getInstructorById(viewInstructorId) : null;
  const { data: viewAssignedStudents = [], isLoading: isLoadingViewStudents } = useQuery({
    queryKey: ['admin', 'view-assigned-students', viewInstructorId],
    queryFn: async () => {
      if (!viewInstructorId) return [];
      const { data, error } = await supabase
        .from('students')
        .select(`id, level, enrollment_status, instructor_id, profiles ( first_name, last_name, email )`)
        .eq('instructor_id', viewInstructorId as any);
      if (error) return [];
      return (data || []).map((s: any) => ({
        id: s.id,
        first_name: s.profiles?.first_name || '',
        last_name: s.profiles?.last_name || '',
        email: s.profiles?.email || '',
        level: s.level || 'beginner',
        enrollment_status: s.enrollment_status,
      }));
    },
    enabled: !!viewInstructorId,
  });

  const DeactivateInstructorDialog = () => {
    const deactivatingInstructor = instructorToDeactivate ? getInstructorById(instructorToDeactivate) : null;
    return (
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Instructor</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{' '}
              {deactivatingInstructor ? `${deactivatingInstructor.profile.first_name} ${deactivatingInstructor.profile.last_name}` : 'this instructor'}?
              They will no longer be able to access the system.
            </DialogDescription>
          </DialogHeader>
          {isLoadingDeactivateStudents ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : deactivateAssignedStudents.length > 0 ? (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>This instructor has {deactivateAssignedStudents.length} assigned student{deactivateAssignedStudents.length !== 1 ? 's' : ''}</AlertTitle>
              <AlertDescription>
                The following students will become unassigned:
                <ul className="mt-2 list-disc list-inside text-sm">
                  {deactivateAssignedStudents.map(s => (
                    <li key={s.id}>{s.first_name} {s.last_name}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate} disabled={isLoadingDeactivateStudents}>
              {deactivateAssignedStudents.length > 0 ? 'Unassign Students & Deactivate' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Instructors Management</h1>
              <p className="text-muted-foreground">
                Manage all instructors, approve new requests, and assign students.
              </p>
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
              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Manage Student Assignments</DialogTitle>
                  <DialogDescription>
                    View currently assigned students and assign new ones.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto space-y-6 py-4">
                  {/* Currently Assigned Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Currently Assigned ({assignedStudents.length})</h3>
                    {isLoadingAssigned ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : assignedStudents.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignedStudents.map(student => (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{student.first_name} {student.last_name}</div>
                                  <div className="text-sm text-muted-foreground">{student.email}</div>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{student.level}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => unassignStudent.mutate(student.id)}
                                  disabled={unassignStudent.isPending}
                                >
                                  Unassign
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">No students currently assigned.</p>
                    )}
                  </div>

                  {/* Available (Unassigned) Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Available Students ({unassignedStudents.length})</h3>
                    {isLoadingStudents ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
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
                                <Checkbox
                                  checked={selectedStudentIds.includes(student.id)}
                                  onCheckedChange={() => toggleStudentSelection(student.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{student.first_name} {student.last_name}</div>
                                  <div className="text-sm text-muted-foreground">{student.email}</div>
                                </div>
                              </TableCell>
                              <TableCell className="capitalize">{student.level}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">No unassigned students available.</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => { setShowStudentAssignment(false); setInstructorToAssign(null); setSelectedStudentIds([]); }}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={handleAssignStudents}
                    disabled={isLoadingStudents || selectedStudentIds.length === 0 || assignStudentsToInstructor.isPending}
                  >
                    {assignStudentsToInstructor.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</>
                    ) : (
                      `Assign ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`
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

          {/* Instructor View Details Sheet */}
          <Sheet open={!!viewInstructorId} onOpenChange={(open) => !open && closeViewInstructor()}>
            <SheetContent className="sm:max-w-lg overflow-auto">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {viewedInstructor?.profile.avatar_url && <AvatarImage src={viewedInstructor.profile.avatar_url} alt={`${viewedInstructor?.profile.first_name} ${viewedInstructor?.profile.last_name}`} />}
                    <AvatarFallback className="text-lg">
                      {(viewedInstructor?.profile.first_name?.[0] || '')}{(viewedInstructor?.profile.last_name?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>
                      {viewedInstructor ? `${viewedInstructor.profile.first_name} ${viewedInstructor.profile.last_name}` : 'Instructor Details'}
                    </SheetTitle>
                    <SheetDescription>
                      {viewedInstructor?.profile.email}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              {viewedInstructor && (
                <div className="space-y-6 mt-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      viewedInstructor.status === 'active' ? 'bg-green-500/10 text-green-500' :
                      viewedInstructor.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    }>
                      {viewedInstructor.status}
                    </Badge>
                    {viewedInstructor.profile?.is_mock && (
                      <Badge variant="outline" className="border-amber-500/50 text-amber-500">Mock</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Hourly Rate</p>
                      <p className="text-sm font-medium">${viewedInstructor.hourly_rate || 0}/hr</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="text-sm font-medium">{viewedInstructor.years_experience || 0} years</p>
                    </div>
                  </div>

                  {viewedInstructor.specialties && viewedInstructor.specialties.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {viewedInstructor.specialties.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewedInstructor.bio && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Bio</p>
                      <p className="text-sm">{viewedInstructor.bio}</p>
                    </div>
                  )}

                  <SeparatorUI />

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Assigned Students ({viewAssignedStudents.length})</h4>
                    {isLoadingViewStudents ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : viewAssignedStudents.length > 0 ? (
                      <div className="space-y-2">
                        {viewAssignedStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div>
                              <p className="text-sm font-medium">{student.first_name} {student.last_name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">{student.level}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No students assigned.</p>
                    )}
                  </div>

                  <SeparatorUI />

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded-md border p-3 mb-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="mock-flag-instructor" className="text-sm">Mark as mock user</Label>
                        <p className="text-xs text-muted-foreground">Test/seed account. Hidden when "Hide mock users" is on.</p>
                      </div>
                      <Switch
                        id="mock-flag-instructor"
                        checked={!!viewedInstructor.profile?.is_mock}
                        disabled={setMockFlag.isPending}
                        onCheckedChange={(checked) =>
                          setMockFlag.mutate({ userIds: [viewedInstructor.id], isMock: checked })
                        }
                      />
                    </div>
                    {viewedInstructor.status === 'active' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { closeViewInstructor(); handleOpenAssignStudents(viewInstructorId!); }}>
                          <Users className="h-4 w-4 mr-2" /> Assign Students
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { closeViewInstructor(); navigate(`/admin/messages?recipient=${viewInstructorId}`); }}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { closeViewInstructor(); handleDeactivate(viewInstructorId!); }}>
                          <X className="h-4 w-4 mr-2" /> Deactivate
                        </Button>
                      </>
                    )}
                    {viewedInstructor.status === 'inactive' && (
                      <Button size="sm" onClick={() => { closeViewInstructor(); handleActivate(viewInstructorId!); }}>
                        <Check className="h-4 w-4 mr-2" /> Reactivate
                      </Button>
                    )}
                    {viewedInstructor.status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { closeViewInstructor(); handleApprove(viewInstructorId!); }}>
                          <Check className="h-4 w-4 mr-2" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { closeViewInstructor(); handleDecline(viewInstructorId!); }}>
                          <X className="h-4 w-4 mr-2" /> Decline
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          
          <Tabs defaultValue={initialInstructorTab}>
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
              {/* Bulk Action Toolbar */}
              {selectedInstructorIds.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{selectedInstructorIds.length} selected</span>
                  <Button size="sm" variant="outline" onClick={handleBulkMessageInstructors}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Message
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowBulkDeactivateInstructors(true)}>
                    Deactivate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedInstructorIds([])}>
                    Clear
                  </Button>
                </div>
              )}
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
                          <th className="px-4 py-3 text-left w-10">
                            <Checkbox
                              checked={filteredActiveInstructors.length > 0 && selectedInstructorIds.length === filteredActiveInstructors.length}
                              onCheckedChange={toggleInstructorSelectAll}
                            />
                          </th>
                          <th className="px-4 py-3 text-left font-medium">Name</th>
                          <th className="px-4 py-3 text-left font-medium">Email</th>
                          <th className="px-4 py-3 text-center font-medium">Status</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredActiveInstructors && filteredActiveInstructors.length > 0 ? (
                          filteredActiveInstructors.map((instructor) => (
                            <tr key={instructor.id} className={`border-b last:border-0 ${selectedInstructorIds.includes(instructor.id) ? 'bg-muted' : ''}`}>
                              <td className="px-4 py-3">
                                <Checkbox
                                  checked={selectedInstructorIds.includes(instructor.id)}
                                  onCheckedChange={() => toggleInstructorSelect(instructor.id)}
                                />
                              </td>
                              <td className="px-4 py-3 font-medium">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    {instructor.profile.avatar_url && <AvatarImage src={instructor.profile.avatar_url} alt={`${instructor.profile.first_name} ${instructor.profile.last_name}`} />}
                                    <AvatarFallback className="text-xs">
                                      {(instructor.profile.first_name?.[0] || '')}{(instructor.profile.last_name?.[0] || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{instructor.profile.first_name} {instructor.profile.last_name}</span>{instructor.profile.is_mock && (<Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-500">Mock</Badge>)}
                                </div>
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
                                        <Users className="h-4 w-4" />
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
                           <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
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
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    {instructor.profile.avatar_url && <AvatarImage src={instructor.profile.avatar_url} alt={`${instructor.profile.first_name} ${instructor.profile.last_name}`} />}
                                    <AvatarFallback className="text-xs">
                                      {(instructor.profile.first_name?.[0] || '')}{(instructor.profile.last_name?.[0] || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{instructor.profile.first_name} {instructor.profile.last_name}</span>{instructor.profile.is_mock && (<Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-500">Mock</Badge>)}
                                </div>
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
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    {instructor.profile.avatar_url && <AvatarImage src={instructor.profile.avatar_url} alt={`${instructor.profile.first_name} ${instructor.profile.last_name}`} />}
                                    <AvatarFallback className="text-xs">
                                      {(instructor.profile.first_name?.[0] || '')}{(instructor.profile.last_name?.[0] || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{instructor.profile.first_name} {instructor.profile.last_name}</span>{instructor.profile.is_mock && (<Badge variant="outline" className="ml-2 text-[10px] border-amber-500/50 text-amber-500">Mock</Badge>)}
                                </div>
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

          {/* Bulk Deactivate Instructors Dialog */}
          <Dialog open={showBulkDeactivateInstructors} onOpenChange={setShowBulkDeactivateInstructors}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Deactivate {selectedInstructorIds.length} Instructors</DialogTitle>
                <DialogDescription>
                  Are you sure you want to deactivate all selected instructors?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkDeactivateInstructors(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleBulkDeactivateInstructors} disabled={deactivateInstructor.isPending}>
                  Deactivate All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </>
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
    avatar_url?: string | null;
    is_mock?: boolean;
  };
}

export default AdminInstructors;
