import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, X, Edit, User, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { StudentNoteDialog } from '@/components/notes/StudentNoteDialog';

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

const InstructorStudents = () => {
  const { toast } = useToast();
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
  
  // Mock students data with notes array and module progress
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      level: 'Intermediate',
      progress: 68,
      lastActive: 'Today',
      initials: 'AJ',
      enrollmentDate: 'Jan 15, 2025',
      nextClass: 'April 7, 2025',
      notes: [
        'April 1: Showing good progress with beat matching skills.',
        'March 28: Needs to work on timing.'
      ],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 100,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
            { id: '1-3', title: 'Headphones & Monitors', completed: true },
            { id: '1-4', title: 'Software Overview', completed: true },
          ]
        },
        {
          moduleId: '2',
          moduleName: 'Beat Matching Fundamentals',
          progress: 80,
          lessons: [
            { id: '2-1', title: 'Understanding BPM', completed: true },
            { id: '2-2', title: 'Manual Beat Matching', completed: true },
            { id: '2-3', title: 'Beat Matching with Software', completed: true },
            { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
          ]
        },
        {
          moduleId: '3',
          moduleName: 'Basic Mixing Techniques',
          progress: 20,
          lessons: [
            { id: '3-1', title: 'EQ Mixing', completed: true },
            { id: '3-2', title: 'Volume Fading', completed: false },
            { id: '3-3', title: 'Filter Effects', completed: false },
            { id: '3-4', title: 'Intro to Phrase Mixing', completed: false },
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Taylor Smith',
      email: 'tsmith@example.com',
      level: 'Novice',
      progress: 32,
      lastActive: 'Yesterday',
      initials: 'TS',
      enrollmentDate: 'Feb 3, 2025',
      nextClass: 'April 8, 2025',
      notes: [],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 60,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
            { id: '1-3', title: 'Headphones & Monitors', completed: false },
            { id: '1-4', title: 'Software Overview', completed: false },
          ]
        },
        {
          moduleId: '2',
          moduleName: 'Beat Matching Fundamentals',
          progress: 10,
          lessons: [
            { id: '2-1', title: 'Understanding BPM', completed: false },
            { id: '2-2', title: 'Manual Beat Matching', completed: false },
            { id: '2-3', title: 'Beat Matching with Software', completed: false },
            { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Jordan Lee',
      email: 'jlee@example.com',
      level: 'Advanced',
      progress: 87,
      lastActive: '3 days ago',
      initials: 'JL',
      enrollmentDate: 'Nov 10, 2024',
      nextClass: 'April 9, 2025',
      notes: [
        'April 2: Ready to move to performance techniques.',
        'March 25: Excellent work on transition techniques.'
      ],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 100,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
            { id: '1-3', title: 'Headphones & Monitors', completed: true },
            { id: '1-4', title: 'Software Overview', completed: true },
          ]
        },
        {
          moduleId: '2',
          moduleName: 'Beat Matching Fundamentals',
          progress: 100,
          lessons: [
            { id: '2-1', title: 'Understanding BPM', completed: true },
            { id: '2-2', title: 'Manual Beat Matching', completed: true },
            { id: '2-3', title: 'Beat Matching with Software', completed: true },
            { id: '2-4', title: 'Troubleshooting Common Issues', completed: true },
          ]
        },
        {
          moduleId: '3',
          moduleName: 'Basic Mixing Techniques',
          progress: 90,
          lessons: [
            { id: '3-1', title: 'EQ Mixing', completed: true },
            { id: '3-2', title: 'Volume Fading', completed: true },
            { id: '3-3', title: 'Filter Effects', completed: true },
            { id: '3-4', title: 'Intro to Phrase Mixing', completed: false },
          ]
        }
      ]
    },
    {
      id: '4',
      name: 'Morgan Rivera',
      email: 'morgan.r@example.com',
      level: 'Novice',
      progress: 15,
      lastActive: '1 week ago',
      initials: 'MR',
      enrollmentDate: 'Feb 20, 2025',
      notes: [],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 30,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: false },
            { id: '1-3', title: 'Headphones & Monitors', completed: false },
            { id: '1-4', title: 'Software Overview', completed: false },
          ]
        }
      ]
    },
    {
      id: '5',
      name: 'Casey Williams',
      email: 'c.williams@example.com',
      level: 'Intermediate',
      progress: 52,
      lastActive: '2 days ago',
      initials: 'CW',
      enrollmentDate: 'Dec 12, 2024',
      nextClass: 'April 12, 2025',
      notes: [],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 80,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
            { id: '1-3', title: 'Headphones & Monitors', completed: true },
            { id: '1-4', title: 'Software Overview', completed: false },
          ]
        },
        {
          moduleId: '2',
          moduleName: 'Beat Matching Fundamentals',
          progress: 40,
          lessons: [
            { id: '2-1', title: 'Understanding BPM', completed: true },
            { id: '2-2', title: 'Manual Beat Matching', completed: false },
            { id: '2-3', title: 'Beat Matching with Software', completed: false },
            { id: '2-4', title: 'Troubleshooting Common Issues', completed: false },
          ]
        }
      ]
    },
    {
      id: '6',
      name: 'Jamie Roberts',
      email: 'jroberts@example.com',
      level: 'Novice',
      progress: 28,
      lastActive: 'Yesterday',
      initials: 'JR',
      enrollmentDate: 'Mar 5, 2025',
      notes: [],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 50,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
            { id: '1-3', title: 'Headphones & Monitors', completed: false },
            { id: '1-4', title: 'Software Overview', completed: false },
          ]
        }
      ]
    },
    {
      id: '7',
      name: 'Drew Parker',
      email: 'dparker@example.com',
      level: 'Advanced',
      progress: 92,
      lastActive: 'Today',
      initials: 'DP',
      enrollmentDate: 'Oct 3, 2024',
      nextClass: 'April 10, 2025',
      notes: [
        'March 29: Excellent turntable control.',
        'March 22: Working well with complex transitions.',
        'March 15: Showing mastery of beat juggling techniques.'
      ],
      moduleProgress: [
        {
          moduleId: '1',
          moduleName: 'Introduction to DJ Equipment',
          progress: 100,
          lessons: [
            { id: '1-1', title: 'Turntables & CDJs', completed: true },
            { id: '1-2', title: 'DJ Mixers & Controllers', completed: true },
            { id: '1-3', title: 'Headphones & Monitors', completed: true },
            { id: '1-4', title: 'Software Overview', completed: true },
          ]
        },
        {
          moduleId: '2',
          moduleName: 'Beat Matching Fundamentals',
          progress: 100,
          lessons: [
            { id: '2-1', title: 'Understanding BPM', completed: true },
            { id: '2-2', title: 'Manual Beat Matching', completed: true },
            { id: '2-3', title: 'Beat Matching with Software', completed: true },
            { id: '2-4', title: 'Troubleshooting Common Issues', completed: true },
          ]
        },
        {
          moduleId: '3',
          moduleName: 'Basic Mixing Techniques',
          progress: 100,
          lessons: [
            { id: '3-1', title: 'EQ Mixing', completed: true },
            { id: '3-2', title: 'Volume Fading', completed: true },
            { id: '3-3', title: 'Filter Effects', completed: true },
            { id: '3-4', title: 'Intro to Phrase Mixing', completed: true },
          ]
        }
      ]
    },
  ]);

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
                  
                  {filteredStudents.length > 0 ? (
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
