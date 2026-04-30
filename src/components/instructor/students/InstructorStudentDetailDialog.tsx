import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Calendar, Clock, CheckCircle2, BookOpen, User as UserIcon, CalendarClock, Pencil, Plus, Trash2, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { cn, capitalizeLevel } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScheduleChangeRequests } from "@/hooks/useScheduleChangeRequests";
import type { Student, StudentNote } from "@/hooks/instructor/useInstructorStudentsSimple";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  instructorId: string | undefined;
  refetch: () => Promise<void> | void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['3:30 PM - 5:00 PM', '5:30 PM - 7:00 PM', '7:30 PM - 9:00 PM'];

export const InstructorStudentDetailDialog: React.FC<Props> = ({ open, onOpenChange, student, instructorId, refetch }) => {
  const { toast } = useToast();
  const { createRequest, pendingRequests } = useScheduleChangeRequests('instructor');

  // Local mirror so optimistic edits survive parent refetch latency
  const [detailedStudent, setDetailedStudent] = useState<Student | null>(student);
  useEffect(() => { setDetailedStudent(student); }, [student]);

  // Tasks state
  const [studentTasks, setStudentTasks] = useState<{id: string; title: string; description: string | null; completed: boolean; created_at: string; order_index: number}[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<{id: string; title: string; description: string} | null>(null);

  // Note dialogs
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<StudentNote | null>(null);
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  const [editNoteText, setEditNoteText] = useState('');

  // Schedule change
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleNewDay, setScheduleNewDay] = useState('');
  const [scheduleNewTime, setScheduleNewTime] = useState('');
  const [scheduleReason, setScheduleReason] = useState('');

  // Skill update
  const [updatingSkillId, setUpdatingSkillId] = useState<string | null>(null);
  const [skillProficiency, setSkillProficiency] = useState(0);

  // Enlarged photo
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  const fetchStudentTasks = async (studentId: string) => {
    if (!instructorId) return;
    setLoadingTasks(true);
    const { data, error } = await supabase
      .from('student_tasks' as any)
      .select('id, title, description, completed, created_at, order_index')
      .eq('instructor_id', instructorId)
      .eq('student_id', studentId)
      .order('order_index', { ascending: true });
    if (!error) setStudentTasks((data || []) as any);
    setLoadingTasks(false);
  };

  useEffect(() => {
    if (open && detailedStudent?.id) fetchStudentTasks(detailedStudent.id);
  }, [open, detailedStudent?.id, instructorId]);

  const handleAddNote = async () => {
    if (!detailedStudent || !noteText.trim() || !instructorId) return;
    setIsAddingNote(true);
    const { error } = await supabase.from('student_notes').insert({
      student_id: detailedStudent.id,
      instructor_id: instructorId,
      content: noteText.trim(),
      title: null,
    });
    setIsAddingNote(false);
    if (error) {
      toast({ title: "Error saving note", description: "Something went wrong. Please try again.", variant: "destructive" });
      return;
    }
    setShowNoteDialog(false);
    setNoteText('');
    toast({ title: "Note added", description: "Your note has been saved." });
    await refetch();
  };

  const handleSkillProficiencyUpdate = async (studentId: string, skillName: string, proficiency: number, existingRecordId?: string) => {
    if (existingRecordId) {
      const { error } = await supabase
        .from('student_progress')
        .update({ proficiency, assessment_date: new Date().toISOString(), assessor_id: instructorId })
        .eq('id', existingRecordId);
      if (error) {
        toast({ title: "Error updating skill", description: "Something went wrong.", variant: "destructive" });
        return;
      }
    } else {
      const { data: courseData } = await supabase.from('courses').select('id').limit(1).single();
      const courseId = courseData?.id;
      if (!courseId) {
        toast({ title: "Error", description: "No course found. Please create a course first.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from('student_progress').insert({
        student_id: studentId,
        course_id: courseId,
        skill_name: skillName,
        proficiency,
        assessment_date: new Date().toISOString(),
        assessor_id: instructorId,
      });
      if (error) {
        toast({ title: "Error updating skill", description: "Something went wrong.", variant: "destructive" });
        return;
      }
    }
    setUpdatingSkillId(null);
    toast({ title: "Skill updated", description: `${skillName} proficiency set to ${proficiency}%` });
    await refetch();
  };

  if (!detailedStudent) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6">
            <DialogHeader>
              <div className="flex items-start gap-4 text-left">
                <Avatar
                  className={cn("h-16 w-16 shrink-0", detailedStudent.avatar && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all")}
                  onClick={() => detailedStudent.avatar && setEnlargedPhoto(detailedStudent.avatar)}
                >
                  {detailedStudent.avatar ? (
                    <AvatarImage src={detailedStudent.avatar} alt={detailedStudent.name} />
                  ) : (
                    <AvatarFallback className="text-lg">{detailedStudent.initials}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <DialogTitle className="text-xl">{detailedStudent.name}</DialogTitle>
                    {detailedStudent.pronouns && (
                      <DialogDescription className="text-xs mt-0.5">{detailedStudent.pronouns}</DialogDescription>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={cn(
                      detailedStudent.level.toLowerCase() === 'novice' && "border-green-500/50 text-green-500",
                      detailedStudent.level.toLowerCase() === 'amateur' && "border-yellow-500/50 text-yellow-500",
                      detailedStudent.level.toLowerCase() === 'intermediate' && "border-blue-500/50 text-blue-500",
                      detailedStudent.level.toLowerCase() === 'advanced' && "border-purple-500/50 text-purple-500"
                    )}>
                      {capitalizeLevel(detailedStudent.level)}
                    </Badge>
                    {detailedStudent.enrollmentStatus && (
                      <Badge variant="outline" className={cn(
                        "capitalize",
                        detailedStudent.enrollmentStatus === 'active' && "border-green-500/50 text-green-500",
                        detailedStudent.enrollmentStatus === 'pending' && "border-yellow-500/50 text-yellow-500",
                        detailedStudent.enrollmentStatus === 'inactive' && "border-muted-foreground/50 text-muted-foreground"
                      )}>
                        {detailedStudent.enrollmentStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-sm pt-1">
                    {detailedStudent.email && (
                      <a href={`mailto:${detailedStudent.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{detailedStudent.email}</span>
                      </a>
                    )}
                    {detailedStudent.phone && (
                      <a href={`tel:${detailedStudent.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{detailedStudent.phone}</span>
                      </a>
                    )}
                  </div>
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

              <TabsContent value="info" className="space-y-6 pt-4">
                <section className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>Enrollment</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pl-6">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Status</p>
                      <p className="text-sm font-medium capitalize">{detailedStudent.enrollmentStatus || 'Pending'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Start Date</p>
                      <p className="text-sm font-medium">{detailedStudent.enrollmentDate || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Class Day</p>
                      <p className="text-sm font-medium">{detailedStudent.classDay || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Class Time</p>
                      <p className="text-sm font-medium">{detailedStudent.classTime || 'Not assigned'}</p>
                    </div>
                    {detailedStudent.nextClass && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Next Class</p>
                        <p className="text-sm font-medium">{detailedStudent.nextClass}</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>About</span>
                  </div>
                  <p className="text-sm pl-6 whitespace-pre-wrap text-foreground/90">
                    {detailedStudent.bio || <span className="text-muted-foreground italic">No bio provided yet.</span>}
                  </p>
                </section>

                <section className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <span>Overall Progress</span>
                    <span className="text-foreground">{detailedStudent.progress}%</span>
                  </div>
                  <Progress value={detailedStudent.progress} className="h-2" />
                </section>

                <section className="space-y-3 border-t pt-4">
                  <div className="text-sm font-medium text-muted-foreground">Actions</div>
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
                </section>
              </TabsContent>

              <TabsContent value="progress" className="space-y-6">
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
                              <Button variant="outline" size="sm" onClick={() => setUpdatingSkillId(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => handleSkillProficiencyUpdate(detailedStudent.id, skill.skillName, skillProficiency, skill.progressRecordId)}>Save</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!detailedStudent.skillProgress?.length && (
                  <div className="text-center py-8 text-muted-foreground">No skills have been defined for this student's level yet.</div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex justify-end mb-2">
                  <Button onClick={() => { setNoteText(''); setShowNoteDialog(true); }}>Add New Note</Button>
                </div>
                {detailedStudent.notes?.length ? (
                  <div className="space-y-3">
                    {detailedStudent.notes.map((note) => (
                      <div
                        key={note.id}
                        className="border rounded-md p-3 text-sm cursor-pointer hover:bg-accent/50 transition-colors group"
                        onClick={() => { setEditingNote(note); setEditNoteText(note.content); setShowEditNoteDialog(true); }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            {note.title && <p className="font-medium text-foreground mb-1">{note.title}</p>}
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
                  <div className="text-center py-8 text-muted-foreground">No notes have been added for this student yet.</div>
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
                    <Input placeholder="Task title..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                    <Textarea placeholder="Description (optional)..." value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} className="min-h-[60px]" />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskDescription(''); }}>Cancel</Button>
                      <Button size="sm" disabled={!newTaskTitle.trim()} onClick={async () => {
                        if (!instructorId || !newTaskTitle.trim()) return;
                        const { error } = await supabase.from('student_tasks' as any).insert({
                          student_id: detailedStudent.id,
                          instructor_id: instructorId,
                          title: newTaskTitle.trim(),
                          description: newTaskDescription.trim() || null,
                          order_index: studentTasks.length,
                        } as any);
                        if (error) { toast({ title: "Error adding task", description: error.message, variant: "destructive" }); return; }
                        toast({ title: "Task added" });
                        setNewTaskTitle(''); setNewTaskDescription(''); setShowAddTask(false);
                        fetchStudentTasks(detailedStudent.id);
                      }}>Add Task</Button>
                    </div>
                  </div>
                )}

                {loadingTasks ? (
                  <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : studentTasks.length > 0 ? (
                  <DragDropContext onDragEnd={async (result: DropResult) => {
                    if (!result.destination) return;
                    const srcIdx = result.source.index;
                    const destIdx = result.destination.index;
                    if (srcIdx === destIdx) return;
                    const incomplete = studentTasks.filter(t => !t.completed);
                    const completed = studentTasks.filter(t => t.completed);
                    const reordered = Array.from(incomplete);
                    const [moved] = reordered.splice(srcIdx, 1);
                    reordered.splice(destIdx, 0, moved);
                    const updatedIncomplete = reordered.map((t, i) => ({ ...t, order_index: i }));
                    const updatedAll = [...updatedIncomplete, ...completed.map((t, i) => ({ ...t, order_index: updatedIncomplete.length + i }))];
                    setStudentTasks(updatedAll);
                    await Promise.all(updatedAll.map(t => supabase.from('student_tasks' as any).update({ order_index: t.order_index } as any).eq('id', t.id)));
                  }}>
                    <div className="space-y-1">
                      <Droppable droppableId="tasks">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                            {studentTasks.filter(t => !t.completed).sort((a, b) => a.order_index - b.order_index).map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} className={cn("flex items-start gap-2 border rounded-md p-3 group bg-background", snapshot.isDragging && "shadow-lg ring-2 ring-primary/20")}>
                                    <div {...provided.dragHandleProps} className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <Checkbox
                                      checked={task.completed}
                                      onCheckedChange={async () => {
                                        const { error } = await supabase.from('student_tasks' as any).update({ completed: !task.completed } as any).eq('id', task.id);
                                        if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                                        setStudentTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                      }}
                                      className="mt-0.5"
                                    />
                                    {editingTask?.id === task.id ? (
                                      <div className="flex-1 min-w-0 space-y-2">
                                        <Input value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Task title..." className="h-8 text-sm" />
                                        <Textarea value={editingTask.description} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} placeholder="Description (optional)..." className="min-h-[50px] text-sm" />
                                        <div className="flex justify-end gap-2">
                                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingTask(null)}>Cancel</Button>
                                          <Button size="sm" className="h-7 text-xs" disabled={!editingTask.title.trim()} onClick={async () => {
                                            const { error } = await supabase.from('student_tasks' as any).update({ title: editingTask.title.trim(), description: editingTask.description.trim() || null } as any).eq('id', editingTask.id);
                                            if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                                            setStudentTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, title: editingTask.title.trim(), description: editingTask.description.trim() || null } : t));
                                            setEditingTask(null);
                                            toast({ title: "Task updated" });
                                          }}>Save</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium">{task.title}</p>
                                          {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => setEditingTask({ id: task.id, title: task.title, description: task.description || '' })}>
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={async () => {
                                          const { error } = await supabase.from('student_tasks' as any).delete().eq('id', task.id);
                                          if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                                          setStudentTasks(prev => prev.filter(t => t.id !== task.id));
                                          toast({ title: "Task deleted" });
                                        }}>
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {studentTasks.filter(t => t.completed).length > 0 && (
                        <div className="space-y-2 pt-2 border-t mt-3">
                          <p className="text-xs text-muted-foreground font-medium">Completed</p>
                          {studentTasks.filter(t => t.completed).sort((a, b) => a.order_index - b.order_index).map((task) => (
                            <div key={task.id} className="flex items-start gap-2 border rounded-md p-3 group opacity-60">
                              <div className="w-4" />
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={async () => {
                                  const { error } = await supabase.from('student_tasks' as any).update({ completed: !task.completed } as any).eq('id', task.id);
                                  if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                                  setStudentTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                }}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-through text-muted-foreground">{task.title}</p>
                                {task.description && <p className="text-xs text-muted-foreground mt-1 line-through">{task.description}</p>}
                              </div>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={async () => {
                                const { error } = await supabase.from('student_tasks' as any).delete().eq('id', task.id);
                                if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
                                setStudentTasks(prev => prev.filter(t => t.id !== task.id));
                                toast({ title: "Task deleted" });
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DragDropContext>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No tasks assigned to this student yet.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note for {detailedStudent.name}.</DialogDescription>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Type your note..." className="min-h-[120px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)} disabled={isAddingNote}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={isAddingNote || !noteText.trim()}>{isAddingNote ? "Saving..." : "Save Note"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit note dialog */}
      <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            {editingNote?.title && <DialogDescription>{editingNote.title}</DialogDescription>}
          </DialogHeader>
          <div className="py-4">
            <Textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} placeholder="Edit note content..." className="min-h-[150px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditNoteDialog(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editingNote || !editNoteText.trim()) return;
              const { error } = await supabase.from('student_notes').update({ content: editNoteText.trim() }).eq('id', editingNote.id);
              if (error) { toast({ title: "Error updating note", description: error.message, variant: "destructive" }); return; }
              toast({ title: "Note updated" });
              setShowEditNoteDialog(false);
              setEditingNote(null);
              setDetailedStudent(prev => prev ? { ...prev, notes: prev.notes?.map(n => n.id === editingNote.id ? { ...n, content: editNoteText.trim() } : n) } : prev);
              await refetch();
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule change dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Schedule Change</DialogTitle>
            <DialogDescription>Submit a schedule change request for {detailedStudent.name}. An admin will review and approve it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Day</label>
              <Select value={scheduleNewDay} onValueChange={setScheduleNewDay}>
                <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New Time Slot</label>
              <Select value={scheduleNewTime} onValueChange={setScheduleNewTime}>
                <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                <SelectContent>{TIME_SLOTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea value={scheduleReason} onChange={(e) => setScheduleReason(e.target.value)} placeholder="Why does the schedule need to change?" className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button
              disabled={!scheduleNewDay || !scheduleNewTime || createRequest.isPending}
              onClick={async () => {
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

      {/* Enlarged photo */}
      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-md flex items-center justify-center p-2">
          {enlargedPhoto && (
            <img src={enlargedPhoto} alt="Student profile" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};