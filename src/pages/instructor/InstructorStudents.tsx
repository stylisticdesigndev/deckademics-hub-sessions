import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InstructorNavigation } from "@/components/navigation/InstructorNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X, Edit, User, Check } from 'lucide-react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { StudentNoteDialog } from '@/components/notes/StudentNoteDialog';
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

// --------- TYPES ---------
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
  notes?: string[];
  moduleProgress?: ModuleProgress[];
}

interface ModuleProgress {
  moduleId: string;
  moduleName: string; 
  progress: number;
  lessons: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

// --------- DATA FETCHING ---------
// All logic in a hook for clarity
function useInstructorStudents(instructorId: string | undefined) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instructorId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Find all classes taught by this instructor
        const { data: classes, error: classesError } = await supabase
          .from("classes")
          .select("id, start_time, title")
          .eq("instructor_id", instructorId);

        if (classesError) {
          console.error("Error loading classes:", classesError);
          setLoading(false);
          return;
        }

        const classIds = (classes ?? []).map((c) => c.id);
        if (!classIds.length) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // 2. Find all enrollments for those classes (= assigned students)
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select("student_id, enrollment_date, class_id")
          .in("class_id", classIds);

        if (enrollmentsError) {
          console.error("Error loading enrollments:", enrollmentsError);
          setLoading(false);
          return;
        }
        const uniqueStudentIds = [
          ...new Set((enrollments ?? []).map((e) => e.student_id)),
        ];

        if (!uniqueStudentIds.length) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // 3. Load profile (name/email) for each student (in public.profiles)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url")
          .in("id", uniqueStudentIds);

        if (profilesError) {
          console.error("Error loading profiles:", profilesError);
          setLoading(false);
          return;
        }
        const profilesById: { [id: string]: any } = {};
        profiles?.forEach((p) => {
          profilesById[p.id] = p;
        });

        // 4. Load student "level" from students table
        const { data: studentsTbl, error: studentsErr } = await supabase
          .from("students")
          .select("id, level")
          .in("id", uniqueStudentIds);

        if (studentsErr) {
          console.error("Error loading students:", studentsErr);
          setLoading(false);
          return;
        }
        const levelById: { [id: string]: string } = {};
        studentsTbl?.forEach((s) => {
          levelById[s.id] = s.level ?? "Novice";
        });

        // 5. For each student, compute average progress from all their skills
        // (skill proficiencies stored in student_progress)
        // We'll batch with .in()
        const { data: rawProgress, error: progressError } = await supabase
          .from("student_progress")
          .select("student_id, proficiency")
          .in("student_id", uniqueStudentIds);

        if (progressError) {
          console.error("Error loading student progress:", progressError);
          setLoading(false);
          return;
        }
        // Aggregate all progress by student_id
        const progressById: { [id: string]: number } = {};
        uniqueStudentIds.forEach((id) => {
          const records = (rawProgress ?? []).filter((row) => row.student_id === id);
          const profs = records.map((r) => r.proficiency || 0);
          // Average, fallback to 0 if no skills
          progressById[id] = profs.length
            ? Math.round(profs.reduce((a, b) => a + b, 0) / profs.length)
            : 0;
        });

        // 6. Compose Student objects (minimal dataset, no modules/notes)
        const dbStudents: Student[] = uniqueStudentIds.map((id) => {
          const prof = profilesById[id];
          return {
            id,
            name: [
              prof?.first_name ?? "",
              prof?.last_name ?? "",
            ].join(" ").trim() || prof?.email,
            email: prof?.email,
            avatar: prof?.avatar_url,
            progress: progressById[id] ?? 0,
            level: levelById[id] ?? "Novice",
            initials: (prof?.first_name?.[0] ?? "") + (prof?.last_name?.[0] ?? ""),
            // Use start_time of earliest enrollment as "enrollment date"
            enrollmentDate:
              enrollments
                ?.filter((e) => e.student_id === id)
                .sort((a, b) =>
                  (a.enrollment_date ?? "") > (b.enrollment_date ?? "") ? 1 : -1
                )[0]?.enrollment_date?.slice(0, 10) ?? "",
            // No real lastActive, nextClass in DB currently
            lastActive: "",
            nextClass: "",
          };
        });

        setStudents(dbStudents);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [instructorId]);

  return { students, loading };
}

const InstructorStudents = () => {
  const { toast } = useToast();
  const { userData, session } = useAuth();
  const instructorId = session?.user?.id;

  // fetch students for this instructor from supabase
  const { students: fetchedStudents, loading } = useInstructorStudents(instructorId);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isEditingLevel, setIsEditingLevel] = useState<string | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [lessonNoteText, setLessonNoteText] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLessonTitle, setSelectedLessonTitle] = useState<string | null>(null);
  const [detailedStudent, setDetailedStudent] = useState<Student | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showLessonNoteDialog, setShowLessonNoteDialog] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [selectedModule, setSelectedModule] = useState<ModuleProgress | null>(null);
  
  // Mock curriculum modules data - matching student progress page
  const curriculumModules = [
    {
      moduleId: '1',
      moduleName: 'Introduction to DJ Equipment',
      lessons: [
        { id: '1-1', title: 'Turntables & CDJs' },
        { id: '1-2', title: 'DJ Mixers & Controllers' },
        { id: '1-3', title: 'Headphones & Monitors' },
        { id: '1-4', title: 'Software Overview' },
      ]
    },
    {
      moduleId: '2',
      moduleName: 'Beat Matching Fundamentals',
      lessons: [
        { id: '2-1', title: 'Understanding BPM' },
        { id: '2-2', title: 'Manual Beat Matching' },
        { id: '2-3', title: 'Beat Matching with Software' },
        { id: '2-4', title: 'Troubleshooting Common Issues' },
      ]
    },
    {
      moduleId: '3',
      moduleName: 'Basic Mixing Techniques',
      lessons: [
        { id: '3-1', title: 'EQ Mixing' },
        { id: '3-2', title: 'Volume Fading' },
        { id: '3-3', title: 'Filter Effects' },
        { id: '3-4', title: 'Intro to Phrase Mixing' },
      ]
    },
    {
      moduleId: '4',
      moduleName: 'Scratching Basics',
      lessons: [
        { id: '4-1', title: 'Proper Handling of Vinyl' },
        { id: '4-2', title: 'Baby Scratch' },
        { id: '4-3', title: 'Forward & Back Scratch' },
        { id: '4-4', title: 'Scribble Scratch' },
      ]
    },
    {
      moduleId: '5',
      moduleName: 'Music Theory for DJs',
      lessons: [
        { id: '5-1', title: 'Key Matching' },
        { id: '5-2', title: 'Musical Phrasing' },
        { id: '5-3', title: 'Song Structure' },
        { id: '5-4', title: 'Harmonic Mixing' },
      ]
    },
  ];
  
  // Update students when fetched data changes
  useEffect(() => {
    if (fetchedStudents.length > 0) {
      setStudents(fetchedStudents);
    }
  }, [fetchedStudents]);

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    // Search term filter
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Level filter
    const matchesLevel = filterLevel === 'all' || student.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  const studentsByLevel = {
    Novice: filteredStudents.filter(s => s.level === 'Novice'),
    Intermediate: filteredStudents.filter(s => s.level === 'Intermediate'),
    Advanced: filteredStudents.filter(s => s.level === 'Advanced'),
  };
  
  const handleLevelChange = (studentId: string, newLevel: string) => {
    setStudents(prevStudents => prevStudents.map(student => 
      student.id === studentId ? { ...student, level: newLevel } : student
    ));
    setIsEditingLevel(null);
    
    toast({
      title: "Level updated",
      description: "Student level has been successfully updated.",
    });
  };
  
  const openStudentDetails = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setDetailedStudent(student);
      setShowStudentDetails(true);
    }
  };
  
  const handleAddNote = () => {
    if (!selectedStudent || !noteText.trim()) return;
    
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}`;
    const newNote = `${formattedDate}: ${noteText}`;
    
    setStudents(prevStudents => prevStudents.map(student => 
      student.id === selectedStudent 
        ? { ...student, notes: [newNote, ...(student.notes || [])] } 
        : student
    ));
    
    setShowNoteDialog(false);
    setSelectedStudent(null);
    setNoteText('');
    
    toast({
      title: "Note added",
      description: "Your note has been saved successfully.",
    });
  };
  
  const handleAddLessonNote = () => {
    if (!selectedStudent || !lessonNoteText.trim() || !selectedLessonTitle) return;
    
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}`;
    const newNote = `${formattedDate} - ${selectedLessonTitle}: ${lessonNoteText}`;
    
    setStudents(prevStudents => prevStudents.map(student => 
      student.id === selectedStudent 
        ? { ...student, notes: [newNote, ...(student.notes || [])] } 
        : student
    ));
    
    setShowLessonNoteDialog(false);
    setLessonNoteText('');
    
    toast({
      title: "Lesson note added",
      description: `Note for "${selectedLessonTitle}" has been saved.`,
    });
  };
  
  const openNoteDialog = (studentId: string) => {
    setSelectedStudent(studentId);
    setNoteText('');
    setShowNoteDialog(true);
  };
  
  const openLessonNoteDialog = (studentId: string, lessonId: string, lessonTitle: string) => {
    setSelectedStudent(studentId);
    setSelectedLessonId(lessonId);
    setSelectedLessonTitle(lessonTitle);
    setLessonNoteText('');
    setShowLessonNoteDialog(true);
  };

  const openProgressDialog = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(studentId);
      setProgressValue(student.progress);
      setShowProgressDialog(true);
    }
  };

  const handleProgressUpdate = () => {
    if (!selectedStudent) return;

    setStudents(prevStudents => prevStudents.map(student => 
      student.id === selectedStudent ? { ...student, progress: progressValue } : student
    ));
    
    setShowProgressDialog(false);
    
    toast({
      title: "Progress updated",
      description: "Student progress has been successfully updated.",
    });
  };

  const openModuleProgressDialog = (studentId: string, module: ModuleProgress) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(studentId);
      setSelectedModule(module);
      setProgressValue(module.progress);
      setShowProgressDialog(true);
    }
  };

  const handleModuleProgressUpdate = () => {
    if (!selectedStudent || !selectedModule) return;

    setStudents(prevStudents => prevStudents.map(student => {
      if (student.id === selectedStudent && student.moduleProgress) {
        const updatedModules = student.moduleProgress.map(module => 
          module.moduleId === selectedModule.moduleId 
            ? { ...module, progress: progressValue } 
            : module
        );
        
        // Recalculate overall progress based on module progress
        const totalModules = updatedModules.length;
        const overallProgress = Math.round(
          updatedModules.reduce((sum, module) => sum + module.progress, 0) / totalModules
        );
        
        return { 
          ...student, 
          moduleProgress: updatedModules,
          progress: overallProgress
        };
      }
      return student;
    }));
    
    setShowProgressDialog(false);
    setSelectedModule(null);
    
    toast({
      title: "Module progress updated",
      description: "Student module progress has been successfully updated.",
    });
  };

  const toggleLessonCompletion = (studentId: string, moduleId: string, lessonId: string) => {
    setStudents(prevStudents => prevStudents.map(student => {
      if (student.id === studentId && student.moduleProgress) {
        const updatedModules = student.moduleProgress.map(module => {
          if (module.moduleId === moduleId) {
            const updatedLessons = module.lessons.map(lesson => 
              lesson.id === lessonId ? { ...lesson, completed: !lesson.completed } : lesson
            );
            
            // Recalculate module progress
            const completedLessons = updatedLessons.filter(lesson => lesson.completed).length;
            const moduleProgress = Math.round((completedLessons / updatedLessons.length) * 100);
            
            return { 
              ...module, 
              lessons: updatedLessons,
              progress: moduleProgress
            };
          }
          return module;
        });
        
        // Recalculate overall progress
        const totalModules = updatedModules.length;
        const overallProgress = Math.round(
          updatedModules.reduce((sum, module) => sum + module.progress, 0) / totalModules
        );
        
        return { 
          ...student, 
          moduleProgress: updatedModules,
          progress: overallProgress
        };
      }
      return student;
    }));
    
    toast({
      title: "Lesson status updated",
      description: "Student lesson status has been successfully updated.",
    });
  };
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your students
          </p>
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
                      <SelectItem value="Novice">Novice</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
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
                <div className="rounded-md border">
                  {/* Header row - adjusted grid layout for progress closer to student */}
                  <div className="grid grid-cols-8 p-4 font-medium border-b text-xs sm:text-sm">
                    <div className="col-span-3">STUDENT</div>
                    <div className="col-span-2 pl-0 pr-4">PROGRESS</div>
                    <div className="col-span-1 text-center">LEVEL</div>
                    <div className="col-span-2 text-center">ACTIONS</div>
                  </div>
                  
                  {loading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading students...
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div>
                      {filteredStudents.map((student) => (
                        <div 
                          key={student.id}
                          className="grid grid-cols-8 p-4 border-b last:border-b-0 items-center text-xs sm:text-sm hover:bg-muted/30"
                        >
                          <div 
                            className="col-span-3 flex items-center gap-3 cursor-pointer"
                            onClick={() => openStudentDetails(student.id)}
                          >
                            <Avatar className="h-8 w-8">
                              {student.avatar ? (
                                <img src={student.avatar} alt={student.name} />
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
                          
                          {/* Progress column - removed padding, made it closer to student column */}
                          <div className="col-span-2 flex items-center gap-2 pl-0 pr-4">
                            <Progress value={student.progress} className="h-2 flex-grow" />
                            <span className="text-xs font-medium ml-2 w-8 text-right">
                              {student.progress}%
                            </span>
                          </div>
                          
                          {/* Level column */}
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
                                  <SelectItem value="Novice">Novice</SelectItem>
                                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                                  <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="outline" className={cn(
                                  student.level === 'Novice' && "border-green-500/50 text-green-500",
                                  student.level === 'Intermediate' && "border-blue-500/50 text-blue-500",
                                  student.level === 'Advanced' && "border-purple-500/50 text-purple-500"
                                )}>
                                  {student.level}
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
                          
                          {/* Actions column */}
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
                                      <img src={student.avatar} alt={student.name} />
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
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openProgressDialog(student.id)}
                                    className="text-xs px-2"
                                  >
                                    Update Progress
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

        {/* Student Note Dialog */}
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
              >
                Cancel
              </Button>
              <Button onClick={handleAddNote}>Save Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lesson Note Dialog */}
        <Dialog open={showLessonNoteDialog} onOpenChange={setShowLessonNoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Lesson Note</DialogTitle>
              <DialogDescription>
                {selectedLessonTitle && `Add a note for the lesson: ${selectedLessonTitle}`}
              </DialogDescription>
            </DialogHeader>
            <Textarea 
              value={lessonNoteText}
              onChange={(e) => setLessonNoteText(e.target.value)}
              placeholder="Enter your note about this lesson..."
              className="min-h-[120px]"
            />
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowLessonNoteDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddLessonNote}>Save Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Update Dialog */}
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedModule ? `Update Module Progress` : `Update Overall Progress`}
              </DialogTitle>
              <DialogDescription>
                {selectedModule 
                  ? `Adjust the progress for ${selectedModule.moduleName}.`
                  : 'Adjust the overall progress for this student.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <span>Progress: {progressValue}%</span>
              </div>
              <Slider
                value={[progressValue]}
                min={0}
                max={100}
                step={5}
                onValueChange={([value]) => setProgressValue(value)}
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowProgressDialog(false);
                  setSelectedModule(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={selectedModule ? handleModuleProgressUpdate : handleProgressUpdate}
              >
                Update Progress
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Student Details Dialog */}
        <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {detailedStudent && (
              <div className="space-y-6">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {detailedStudent.avatar ? (
                        <img src={detailedStudent.avatar} alt={detailedStudent.name} />
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
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
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
                          detailedStudent.level === 'Novice' && "border-green-500/50 text-green-500",
                          detailedStudent.level === 'Intermediate' && "border-blue-500/50 text-blue-500",
                          detailedStudent.level === 'Advanced' && "border-purple-500/50 text-purple-500"
                        )}>
                          {detailedStudent.level}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground">Last Active</h3>
                        <p>{detailedStudent.lastActive}</p>
                      </div>
                      {detailedStudent.nextClass && (
                        <div>
                          <h3 className="font-medium text-muted-foreground">Next Class</h3>
                          <p>{detailedStudent.nextClass}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Overall Progress</h3>
                      <div className="flex items-center gap-2">
                        <Progress value={detailedStudent.progress} className="h-2 flex-grow" />
                        <span className="text-sm font-medium w-10 text-right">
                          {detailedStudent.progress}%
                        </span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => openProgressDialog(detailedStudent.id)}
                        >
                          Update Progress
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="progress" className="space-y-6">
                    {detailedStudent.moduleProgress?.length ? (
                      detailedStudent.moduleProgress.map((module) => (
                        <div key={module.moduleId} className="border rounded-md p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{module.moduleName}</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{module.progress}%</span>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openModuleProgressDialog(detailedStudent.id, module)}
                              >
                                Update
                              </Button>
                            </div>
                          </div>
                          
                          <Progress value={module.progress} className="h-2" />
                          
                          <div className="space-y-2 mt-4">
                            {module.lessons.map((lesson) => (
                              <div key={lesson.id} className="flex items-center gap-2">
                                <Checkbox 
                                  checked={lesson.completed} 
                                  onCheckedChange={() => toggleLessonCompletion(
                                    detailedStudent.id, 
                                    module.moduleId, 
                                    lesson.id
                                  )}
                                  id={`lesson-${lesson.id}`}
                                />
                                <label 
                                  htmlFor={`lesson-${lesson.id}`}
                                  className={cn(
                                    "text-sm cursor-pointer flex-grow",
                                    lesson.completed && "line-through text-muted-foreground"
                                  )}
                                >
                                  {lesson.title}
                                </label>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => openLessonNoteDialog(
                                    detailedStudent.id,
                                    lesson.id,
                                    lesson.title
                                  )}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No progress data available for this student.
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
                        {detailedStudent.notes.map((note, index) => (
                          <div key={index} className="border rounded-md p-3 text-sm">
                            {note}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No notes have been added for this student yet.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default InstructorStudents;
