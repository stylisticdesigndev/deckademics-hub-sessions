import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X, Edit, Eye, EyeOff, Pencil, Plus, Trash2, CalendarClock, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { mockInstructorStudents } from '@/data/mockInstructorData';
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/providers/AuthProvider";
import { useInstructorStudentsSimple } from "@/hooks/instructor/useInstructorStudentsSimple";
import { SkillProgress } from "@/hooks/instructor/useInstructorStudentsSimple";
import { supabase } from "@/integrations/supabase/client";
import { useScheduleChangeRequests } from "@/hooks/useScheduleChangeRequests";

// --------- TYPES ---------
interface StudentNote {
  id: string;
  content: string;
  title?: string | null;
  created_at: string;
}

interface Student {
  id: string;
  name: string;
  level: string;
  progress: number;
  lastActive: string;
  avatar?: string;
  initials: string;
  nextClass?: string;
  email: string;
  enrollmentDate: string;
  notes?: StudentNote[];
  skillProgress?: SkillProgress[];
  classDay?: string;
  classTime?: string;
}
import { Checkbox } from "@/components/ui/checkbox";

const InstructorStudents = () => {
  const { toast } = useToast();
  const { userData, session } = useAuth();
  const instructorId = session?.user?.id;

  // Use the simplified hook to fetch students
  const { students: fetchedStudents, loading, refetch, setStudents: updateStudents } = useInstructorStudentsSimple(instructorId);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isEditingLevel, setIsEditingLevel] = useState<string | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [detailedStudent, setDetailedStudent] = useState<Student | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [editNoteText, setEditNoteText] = useState('');
  
  // Tasks state
  const [studentTasks, setStudentTasks] = useState<{id: string; title: string; description: string | null; completed: boolean; created_at: string; order_index: number}[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  // Schedule change request state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleNewDay, setScheduleNewDay] = useState('');
  const [scheduleNewTime, setScheduleNewTime] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const TIME_SLOTS = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];

  const { createRequest, pendingRequests } = useScheduleChangeRequests('instructor');

  const fetchStudentTasks = async (studentId: string) => {
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('student_tasks' as any)
        .select('id, title, description, completed, created_at')
        .eq('instructor_id', instructorId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setStudentTasks((data || []) as any);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
    setLoadingTasks(false);
  };
  
  // Skill proficiency update state
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [skillProficiency, setSkillProficiency] = useState(0);
  
  // Update students when fetched data changes
  useEffect(() => {
    if (demoMode) {
      setStudents(mockInstructorStudents as unknown as Student[]);
    } else {
      setStudents(fetchedStudents);
      // Keep detailedStudent in sync
      if (detailedStudent) {
        const updated = fetchedStudents.find(s => s.id === detailedStudent.id);
        if (updated) setDetailedStudent(updated);
      }
    }
  }, [fetchedStudents, demoMode]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize levels for filtering
    const normalizedStudentLevel = student.level.toLowerCase();
    const normalizedFilterLevel = filterLevel.toLowerCase();
    
    const matchesLevel = filterLevel === 'all' || normalizedStudentLevel === normalizedFilterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const studentsByLevel = {
    Novice: filteredStudents.filter(s => s.level.toLowerCase() === 'novice'),
    Amateur: filteredStudents.filter(s => s.level.toLowerCase() === 'amateur'),
    Intermediate: filteredStudents.filter(s => s.level.toLowerCase() === 'intermediate'),
    Advanced: filteredStudents.filter(s => s.level.toLowerCase() === 'advanced'),
  };
  
  const handleLevelChange = async (studentId: string, newLevel: string) => {
    try {
      // Map display value to database value - simplified
      const dbLevel = newLevel.toLowerCase();
      
      if (import.meta.env.DEV) console.log('Updating level:', { studentId, newLevel, dbLevel });
      
      // Update in database first
      const { error } = await supabase
        .from('students')
        .update({ level: dbLevel })
        .eq('id', studentId);

      if (error) {
        console.error('Error updating student level:', error);
        toast({
          title: "Error updating level",
          description: "Failed to update student level. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setIsEditingLevel(null);
      
      toast({
        title: "Level updated",
        description: "Student level has been successfully updated.",
      });
      
      // Refresh data from database
      await refetch();
    } catch (error) {
      console.error('Unexpected error updating level:', error);
      toast({
        title: "Error updating level",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const openStudentDetails = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setDetailedStudent(student);
      setShowStudentDetails(true);
      fetchStudentTasks(studentId);
    }
  };
  
  const handleAddNote = async () => {
    if (!selectedStudent || !noteText.trim() || !instructorId) return;
    
    setIsAddingNote(true);
    if (import.meta.env.DEV) console.log('Adding note for student:', selectedStudent, 'by instructor:', instructorId, 'Note:', noteText);
    
    try {
      const { error } = await supabase
        .from('student_notes')
        .insert({
          student_id: selectedStudent,
          instructor_id: instructorId,
          content: noteText.trim(),
          title: null,
        });

      if (error) {
        console.error('Error saving note to student_notes:', error);
        toast({
          title: "Error saving note",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (import.meta.env.DEV) console.log('Note saved successfully to student_notes table');
      
      setShowNoteDialog(false);
      setSelectedStudent(null);
      setNoteText('');
      
      toast({
        title: "Note added",
        description: "Your note has been saved and will appear on the student's Notes page.",
      });

      await refetch();

    } catch (error) {
      console.error('Unexpected error saving note:', error);
      toast({
        title: "Error saving note",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };
  const openNoteDialog = (studentId: string) => {
    setSelectedStudent(studentId);
    setNoteText('');
    setShowNoteDialog(true);
  };


  const handleSkillProficiencyUpdate = async (studentId: string, skillName: string, proficiency: number, existingRecordId?: string) => {
    try {
      if (existingRecordId) {
        const { error } = await supabase
          .from('student_progress')
          .update({
            proficiency,
            assessment_date: new Date().toISOString(),
            assessor_id: instructorId
          })
          .eq('id', existingRecordId);
        if (error) {
          toast({ title: "Error updating skill", description: "Something went wrong. Please try again.", variant: "destructive" });
          return;
        }
      } else {
        // Look up an available course for this student
        const { data: courseData } = await supabase
          .from('courses')
          .select('id')
          .limit(1)
          .single();
        const courseId = courseData?.id;
        if (!courseId) {
          toast({ title: "Error", description: "No course found. Please create a course first.", variant: "destructive" });
          return;
        }
        const { error } = await supabase
          .from('student_progress')
          .insert({
            student_id: studentId,
            course_id: courseId,
            skill_name: skillName,
            proficiency,
            assessment_date: new Date().toISOString(),
            assessor_id: instructorId
          });
        if (error) {
          toast({ title: "Error updating skill", description: "Something went wrong. Please try again.", variant: "destructive" });
          return;
        }
      }
      
      setUpdatingSkillId(null);
      toast({ title: "Skill updated", description: `${skillName} proficiency set to ${proficiency}%` });
      await refetch();
    } catch (error) {
      console.error('Error updating skill proficiency:', error);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };

  
  return (
    <>
      <div className="space-y-6">
        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>Showing sample student data. Click "Live Data" to switch back.</AlertDescription>
          </Alert>
        )}

        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Student Management</h1>
            <p className="text-muted-foreground mt-2">View and manage all your students</p>
          </div>
          <Button
            variant={demoMode ? "default" : "outline"} size="sm"
            onClick={() => setDemoMode(!demoMode)} className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>All Students ({students.length})</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search students..."
                    className="pl-10 pr-10 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-0"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-[130px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Level</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="amateur">Amateur</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="level">By Level</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list">
                {/* Desktop table view */}
                <div className="rounded-md border hidden md:block">
                  <div className="grid grid-cols-8 p-4 font-medium border-b text-sm">
                    <div className="col-span-3">STUDENT</div>
                    <div className="col-span-2 pl-0 pr-4">PROGRESS</div>
                    <div className="col-span-1 text-center">LEVEL</div>
                    <div className="col-span-2 text-center">ACTIONS</div>
                  </div>
                  
                  {!demoMode && loading ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div>
                      {filteredStudents.map((student) => (
                        <div 
                          key={student.id}
                          className="grid grid-cols-8 p-4 border-b last:border-b-0 items-center text-sm hover:bg-muted/30"
                        >
                          <div 
                            className="col-span-3 flex items-center gap-3 cursor-pointer"
                            onClick={() => openStudentDetails(student.id)}
                          >
                            <Avatar className="h-8 w-8">
                              {student.avatar ? (
                                <AvatarImage src={student.avatar} alt={student.name} />
                              ) : (
                                <AvatarFallback className="text-xs">
                                  {student.initials}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-muted-foreground text-xs">
                                {student.email}
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center gap-2 pl-0 pr-4">
                            <Progress value={student.progress} className="h-2 flex-grow" />
                            <span className="text-xs font-medium ml-2 w-8 text-right">
                              {student.progress}%
                            </span>
                          </div>
                          
                          <div className="col-span-1 flex justify-center">
                            {isEditingLevel === student.id ? (
                              <Select 
                                defaultValue={student.level} 
                                onValueChange={(value) => handleLevelChange(student.id, value)}
                                onOpenChange={(open) => {
                                  if (!open && isEditingLevel === student.id) {
                                    setIsEditingLevel(null);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="novice">Novice</SelectItem>
                                  <SelectItem value="amateur">Amateur</SelectItem>
                                  <SelectItem value="intermediate">Intermediate</SelectItem>
                                  <SelectItem value="advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline" className={cn(
                                  student.level.toLowerCase() === 'novice' && "border-green-500/50 text-green-500",
                                  student.level.toLowerCase() === 'amateur' && "border-yellow-500/50 text-yellow-500",
                                  student.level.toLowerCase() === 'intermediate' && "border-blue-500/50 text-blue-500",
                                  student.level.toLowerCase() === 'advanced' && "border-purple-500/50 text-purple-500"
                                )}>
                                  {student.level.charAt(0).toUpperCase() + student.level.slice(1)}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={() => setIsEditingLevel(student.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="col-span-2 flex justify-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openNoteDialog(student.id)}
                              className="text-xs px-2"
                            >
                              Add Note
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No students found matching your filters.
                    </div>
                  )}
                </div>

                {/* Mobile card view */}
                <div className="md:hidden space-y-3">
                  {!demoMode && loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <Card key={student.id} className="overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => openStudentDetails(student.id)}
                          >
                            <Avatar className="h-10 w-10">
                              {student.avatar ? (
                                <AvatarImage src={student.avatar} alt={student.name} />
                              ) : (
                                <AvatarFallback className="text-sm">
                                  {student.initials}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{student.name}</div>
                              <div className="text-muted-foreground text-xs truncate">{student.email}</div>
                            </div>
                            <Badge variant="outline" className={cn(
                              "shrink-0",
                              student.level.toLowerCase() === 'novice' && "border-green-500/50 text-green-500",
                              student.level.toLowerCase() === 'amateur' && "border-yellow-500/50 text-yellow-500",
                              student.level.toLowerCase() === 'intermediate' && "border-blue-500/50 text-blue-500",
                              student.level.toLowerCase() === 'advanced' && "border-purple-500/50 text-purple-500"
                            )}>
                              {student.level.charAt(0).toUpperCase() + student.level.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={student.progress} className="h-2 flex-grow" />
                            <span className="text-xs font-medium w-8 text-right">{student.progress}%</span>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openNoteDialog(student.id)}
                              className="text-xs flex-1"
                            >
                              Add Note
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setIsEditingLevel(student.id)}
                              className="text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" /> Level
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No students found matching your filters.
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="level">
                <div className="grid gap-6 grid-cols-1">
                  {Object.entries(studentsByLevel).map(([level, students]) => (
                    <Card key={level}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {level}
                            <Badge variant="outline" className={cn(
                              level === 'Novice' && "border-green-500/50 text-green-500",
                              level === 'Amateur' && "border-yellow-500/50 text-yellow-500",
                              level === 'Intermediate' && "border-blue-500/50 text-blue-500",
                              level === 'Advanced' && "border-purple-500/50 text-purple-500"
                            )}>
                              {students.length} Students
                            </Badge>
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {students.length > 0 ? (
                          <div className="space-y-4">
                            {students.map((student) => (
                              <div 
                                key={student.id}
                                className="flex items-center justify-between p-4 rounded-md bg-muted/30"
                              >
                                <div 
                                  className="flex items-center gap-3 cursor-pointer"
                                  onClick={() => openStudentDetails(student.id)}
                                >
                                  <Avatar className="h-8 w-8">
                                    {student.avatar ? (
                                      <AvatarImage src={student.avatar} alt={student.name} />
                                    ) : (
                                      <AvatarFallback className="text-xs">
                                        {student.initials}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">
                                      {student.name}
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                      Progress: {student.progress}%
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => openNoteDialog(student.id)}
                                    className="text-xs px-2"
                                  >
                                    Add Note
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            No students in this level yet.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add a note for this student. The note will be saved with today's date.
              </DialogDescription>
            </DialogHeader>
            <Textarea 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              className="min-h-[120px]"
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowNoteDialog(false)}
                disabled={isAddingNote}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddNote}
                disabled={isAddingNote}
              >
                {isAddingNote ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {detailedStudent && (
              <div className="space-y-6">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                    <Avatar
                      className={cn("h-12 w-12", detailedStudent.avatar && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all")}
                      onClick={() => detailedStudent.avatar && setEnlargedPhoto(detailedStudent.avatar)}
                    >
                      {detailedStudent.avatar ? (
                        <AvatarImage src={detailedStudent.avatar} alt={detailedStudent.name} />
                      ) : (
                        <AvatarFallback className="text-lg">
                          {detailedStudent.initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{detailedStudent.name}</DialogTitle>
                      <DialogDescription>{detailedStudent.email}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <Tabs defaultValue="info">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="progress">Skills</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <h3 className="font-medium text-muted-foreground">Enrollment Date</h3>
                        <p>{detailedStudent.enrollmentDate}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground">Level</h3>
                        <Badge variant="outline" className={cn(
                          detailedStudent.level.toLowerCase() === 'novice' && "border-green-500/50 text-green-500",
                          detailedStudent.level.toLowerCase() === 'amateur' && "border-yellow-500/50 text-yellow-500",
                          detailedStudent.level.toLowerCase() === 'intermediate' && "border-blue-500/50 text-blue-500",
                          detailedStudent.level.toLowerCase() === 'advanced' && "border-purple-500/50 text-purple-500"
                        )}>
                          {detailedStudent.level.charAt(0).toUpperCase() + detailedStudent.level.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground">Class Day</h3>
                        <p>{detailedStudent.classDay || 'Not assigned'}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground">Class Time</h3>
                        <p>{detailedStudent.classTime || 'Not assigned'}</p>
                      </div>
                      {detailedStudent.nextClass && (
                        <div>
                          <h3 className="font-medium text-muted-foreground">Next Class</h3>
                          <p>{detailedStudent.nextClass}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4 space-y-3">
                      <h3 className="font-medium mb-2">Overall Progress</h3>
                      <div className="flex items-center gap-2">
                        <Progress value={detailedStudent.progress} className="h-2 flex-grow" />
                        <span className="text-sm font-medium w-10 text-right">
                          {detailedStudent.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setScheduleNewDay('');
                          setScheduleNewTime('');
                          setScheduleReason('');
                          setShowScheduleDialog(true);
                        }}
                        disabled={pendingRequests.some(r => r.student_id === detailedStudent.id)}
                      >
                        <CalendarClock className="h-4 w-4 mr-2" />
                        {pendingRequests.some(r => r.student_id === detailedStudent.id)
                          ? 'Schedule Change Pending'
                          : 'Request Schedule Change'}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="progress" className="space-y-6">
                    {/* Admin-defined Skills */}
                    {detailedStudent.skillProgress && detailedStudent.skillProgress.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-medium text-base">Skills</h3>
                        {detailedStudent.skillProgress.map((skill) => (
                          <div key={skill.skillId} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{skill.skillName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{skill.proficiency}%</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => {
                                    setUpdatingSkillId(skill.skillId);
                                    setSkillProficiency(skill.proficiency);
                                    setSelectedStudent(detailedStudent.id);
                                  }}
                                >
                                  Update
                                </Button>
                              </div>
                            </div>
                            <Progress value={skill.proficiency} className="h-2" />
                            
                            {updatingSkillId === skill.skillId && (
                              <div className="pt-2 space-y-3">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-muted-foreground">Proficiency</span>
                                  <span className="font-medium">{skillProficiency}%</span>
                                </div>
                                <Slider
                                  value={[skillProficiency]}
                                  min={0}
                                  max={100}
                                  step={5}
                                  onValueChange={([v]) => setSkillProficiency(v)}
                                  className="[&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-500 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&>span:first-child]:bg-gray-200 [&>span:first-child]:dark:bg-gray-700 [&>span:first-child>span]:bg-green-500"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setUpdatingSkillId(null)}>
                                    Cancel
                                  </Button>
                                  <Button size="sm" onClick={() => handleSkillProficiencyUpdate(
                                    detailedStudent.id,
                                    skill.skillName,
                                    skillProficiency,
                                    skill.progressRecordId
                                  )}>
                                    Save
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!detailedStudent.skillProgress?.length && (
                      <div className="text-center py-8 text-muted-foreground">
                        No skills have been defined for this student's level yet.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <div className="flex justify-end mb-2">
                      <Button onClick={() => openNoteDialog(detailedStudent.id)}>
                        Add New Note
                      </Button>
                    </div>
                    
                    {detailedStudent.notes?.length ? (
                      <div className="space-y-3">
                        {detailedStudent.notes.map((note) => (
                          <div 
                            key={note.id} 
                            className="border rounded-md p-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors group"
                            onClick={() => {
                              setEditingNote(note);
                              setEditNoteText(note.content);
                              setShowEditNoteDialog(true);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                {note.title && (
                                  <p className="font-medium text-foreground mb-1">{note.title}</p>
                                )}
                                <p className="text-muted-foreground">{note.content}</p>
                              </div>
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {(() => { try { return format(new Date(note.created_at), 'MM/dd/yyyy h:mm a'); } catch { return note.created_at || 'Unknown date'; } })()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No notes have been added for this student yet.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Student Tasks</h3>
                      <Button size="sm" onClick={() => setShowAddTask(true)} className="gap-1">
                        <Plus className="h-3 w-3" /> Add Task
                      </Button>
                    </div>
                    
                    {showAddTask && (
                      <div className="border rounded-md p-3 space-y-3">
                        <Input
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optional)..."
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          className="min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskDescription(''); }}>
                            Cancel
                          </Button>
                          <Button size="sm" disabled={!newTaskTitle.trim()} onClick={async () => {
                            if (!detailedStudent || !instructorId || !newTaskTitle.trim()) return;
                            try {
                              const { error } = await supabase
                                .from('student_tasks' as any)
                                .insert({
                                  student_id: detailedStudent.id,
                                  instructor_id: instructorId,
                                  title: newTaskTitle.trim(),
                                  description: newTaskDescription.trim() || null,
                                } as any);
                              if (error) {
                                toast({ title: "Error adding task", description: error.message, variant: "destructive" });
                                return;
                              }
                              toast({ title: "Task added", description: "Task has been assigned to the student." });
                              setNewTaskTitle('');
                              setNewTaskDescription('');
                              setShowAddTask(false);
                              // Refresh tasks
                              fetchStudentTasks(detailedStudent.id);
                            } catch (err) {
                              console.error('Error adding task:', err);
                            }
                          }}>
                            Add Task
                          </Button>
                        </div>
                      </div>
                    )}

                    {loadingTasks ? (
                      <div className="space-y-2">
                        {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                      </div>
                    ) : studentTasks.length > 0 ? (
                      <div className="space-y-2">
                        {[...studentTasks]
                          .sort((a, b) => {
                            if (a.completed !== b.completed) return a.completed ? 1 : -1;
                            const dateA = new Date(a.created_at).getTime() || 0;
                            const dateB = new Date(b.created_at).getTime() || 0;
                            return dateB - dateA;
                          })
                          .map((task) => (
                          <div key={task.id} className="flex items-start gap-3 border rounded-md p-3 group">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('student_tasks' as any)
                                    .update({ completed: !task.completed } as any)
                                    .eq('id', task.id);
                                  if (error) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                    return;
                                  }
                                  setStudentTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                } catch (err) {
                                  console.error('Error toggling task:', err);
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className={cn("text-xs text-muted-foreground mt-1", task.completed && "line-through")}>
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('student_tasks' as any)
                                    .delete()
                                    .eq('id', task.id);
                                  if (error) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                    return;
                                  }
                                  setStudentTasks(prev => prev.filter(t => t.id !== task.id));
                                  toast({ title: "Task deleted" });
                                } catch (err) {
                                  console.error('Error deleting task:', err);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No tasks assigned to this student yet.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

        {/* Edit Note Dialog */}
        <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              {editingNote?.title && (
                <DialogDescription>{editingNote.title}</DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4">
              <Textarea
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                placeholder="Edit note content..."
                className="min-h-[150px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditNoteDialog(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!editingNote || !editNoteText.trim()) return;
                try {
                  const { error } = await supabase
                    .from('student_notes')
                    .update({ content: editNoteText.trim() })
                    .eq('id', editingNote.id);
                  if (error) {
                    toast({ title: "Error updating note", description: error.message, variant: "destructive" });
                    return;
                  }
                  toast({ title: "Note updated", description: "Note has been updated successfully." });
                  setShowEditNoteDialog(false);
                  setEditingNote(null);
                  await refetch();
                  // Also update detailedStudent locally
                  if (detailedStudent) {
                    setDetailedStudent(prev => prev ? {
                      ...prev,
                      notes: prev.notes?.map(n => n.id === editingNote.id ? { ...n, content: editNoteText.trim() } : n)
                    } : prev);
                  }
                } catch (err) {
                  console.error('Error updating note:', err);
                  toast({ title: "Error", description: "Failed to update note.", variant: "destructive" });
                }
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Schedule Change Request Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Request Schedule Change</DialogTitle>
              <DialogDescription>
                Submit a schedule change request for {detailedStudent?.name}. An admin will review and approve it.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Day</label>
                <Select value={scheduleNewDay} onValueChange={setScheduleNewDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Time Slot</label>
                <Select value={scheduleNewTime} onValueChange={setScheduleNewTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Textarea
                  value={scheduleReason}
                  onChange={(e) => setScheduleReason(e.target.value)}
                  placeholder="Why does the schedule need to change?"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
              <Button
                disabled={!scheduleNewDay || !scheduleNewTime || createRequest.isPending}
                onClick={async () => {
                  if (!detailedStudent) return;
                  await createRequest.mutateAsync({
                    student_id: detailedStudent.id,
                    prev_day: null,
                    prev_time: null,
                    new_day: scheduleNewDay,
                    new_time: scheduleNewTime,
                    reason: scheduleReason,
                  });
                  setShowScheduleDialog(false);
                }}
              >
                {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Enlarged photo dialog */}
        <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
          <DialogContent className="max-w-md flex items-center justify-center p-2">
            {enlargedPhoto && (
              <img
                src={enlargedPhoto}
                alt="Student profile"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
    </>
  );
};

export default InstructorStudents;
