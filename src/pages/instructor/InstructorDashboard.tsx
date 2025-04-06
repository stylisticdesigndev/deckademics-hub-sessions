
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/cards/StatsCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, MessageSquare, Search, Users, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { StudentNoteDialog } from '@/components/notes/StudentNoteDialog';
import { Toaster } from '@/components/ui/toaster';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface Student {
  id: string;
  name: string;
  level: string;
  progress: number;
  lastActive: string;
  avatar?: string;
  initials: string;
  nextClass?: string;
  note?: string;
  email?: string;
  enrollmentDate?: string;
  notes?: string[];
}

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [detailedStudent, setDetailedStudent] = useState<Student | null>(null);
  
  // Mock students data - only showing today's students
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      level: 'Intermediate',
      progress: 68,
      lastActive: 'Today',
      initials: 'AJ',
      nextClass: 'Today, 2:00 PM',
      note: '',
      enrollmentDate: 'Jan 15, 2025',
      notes: [
        'April 1: Showing good progress with beat matching skills.'
      ]
    },
    {
      id: '2',
      name: 'Taylor Smith',
      email: 'tsmith@example.com',
      level: 'Beginner',
      progress: 32,
      lastActive: 'Yesterday',
      initials: 'TS',
      nextClass: 'Today, 3:30 PM',
      note: '',
      enrollmentDate: 'Feb 3, 2025',
      notes: []
    },
    {
      id: '5',
      name: 'Casey Williams',
      email: 'c.williams@example.com',
      level: 'Intermediate',
      progress: 52,
      lastActive: '2 days ago',
      initials: 'CW',
      nextClass: 'Today, 5:00 PM',
      note: '',
      enrollmentDate: 'Dec 12, 2024',
      notes: []
    },
  ]);

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openStudentDetails = (student: Student) => {
    setDetailedStudent(student);
    setShowStudentDetails(true);
  };

  const handleOpenNoteDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = (studentId: string, note: string) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId ? { ...student, note } : student
      )
    );

    // Also update the notes array for the student details view
    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleString('default', { month: 'short' })} ${currentDate.getDate()}`;
    const newNote = `${formattedDate}: ${note}`;
    
    setStudents(prevStudents => prevStudents.map(student => 
      student.id === studentId 
        ? { 
            ...student, 
            notes: [newNote, ...(student.notes || [])] 
          } 
        : student
    ));
  };

  // Upcoming classes calculation
  const upcomingClassCount = students.length;
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, DJ Smith</h1>
          <p className="text-muted-foreground">
            Here's an overview of your students and upcoming classes.
          </p>
        </section>

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard 
            title="Today's Classes"
            value={upcomingClassCount}
            icon={<Calendar className="h-5 w-5" />}
            description="Scheduled for today"
          />
          <StatsCard 
            title="Average Progress"
            value="56%"
            icon={<CheckCircle className="h-5 w-5" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard 
            title="Total Students"
            value={students.length}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 10, isPositive: true }}
          />
        </section>

        <section>
          <Card>
            <CardHeader className="flex-row justify-between items-center pb-4">
              <CardTitle>Today's Students</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  className="pl-10 pr-10"
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
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-6 p-3 font-medium border-b text-xs sm:text-sm">
                  <div className="col-span-3">STUDENT</div>
                  <div className="col-span-1">PROGRESS</div>
                  <div className="col-span-1 text-center">LEVEL</div>
                  <div className="col-span-1 text-center">NOTES</div>
                </div>
                
                {filteredStudents.length > 0 ? (
                  <div>
                    {filteredStudents.map((student) => (
                      <div 
                        key={student.id}
                        className="grid grid-cols-6 p-3 border-b last:border-b-0 items-center text-xs sm:text-sm"
                      >
                        <div 
                          className="col-span-3 flex items-center gap-3 cursor-pointer"
                          onClick={() => openStudentDetails(student)}
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
                              Next class: {student.nextClass}
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-span-1 flex items-center gap-2">
                          <Progress value={student.progress} className="h-2" />
                          <span className="text-xs font-medium sm:ml-2">
                            {student.progress}%
                          </span>
                        </div>
                        
                        <div className="col-span-1 text-center">
                          <Badge variant="outline" className={cn(
                            student.level === 'Beginner' && "border-green-500/50 text-green-500",
                            student.level === 'Intermediate' && "border-blue-500/50 text-blue-500",
                            student.level === 'Advanced' && "border-purple-500/50 text-purple-500"
                          )}>
                            {student.level}
                          </Badge>
                        </div>

                        <div className="col-span-1 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenNoteDialog(student);
                            }}
                            className="p-2 hover:bg-muted rounded-full"
                            aria-label="Add or edit note"
                          >
                            <MessageSquare 
                              className={cn(
                                "h-4 w-4", 
                                student.note ? "text-deckademics-primary" : "text-muted-foreground"
                              )} 
                            />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No students found matching "{searchTerm}".
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-right">
                <Button onClick={() => navigate('/instructor/students')}>
                  View All Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {selectedStudent && (
        <StudentNoteDialog
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          open={isNoteDialogOpen}
          onOpenChange={setIsNoteDialogOpen}
          existingNote={selectedStudent.note}
          onSaveNote={handleSaveNote}
        />
      )}
      
      {/* Student Details Dialog */}
      <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Details
            </DialogTitle>
          </DialogHeader>
          
          {detailedStudent && (
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                  {detailedStudent.avatar ? (
                    <img src={detailedStudent.avatar} alt={detailedStudent.name} />
                  ) : (
                    <AvatarFallback className="text-xl">
                      {detailedStudent.initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{detailedStudent.name}</h3>
                  <p className="text-sm text-muted-foreground">{detailedStudent.email}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className={cn(
                      detailedStudent.level === 'Beginner' && "border-green-500/50 text-green-500",
                      detailedStudent.level === 'Intermediate' && "border-blue-500/50 text-blue-500",
                      detailedStudent.level === 'Advanced' && "border-purple-500/50 text-purple-500"
                    )}>
                      {detailedStudent.level}
                    </Badge>
                    <span className="text-sm">Enrolled: {detailedStudent.enrollmentDate || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Progress</h4>
                <div className="flex items-center gap-3">
                  <Progress value={detailedStudent.progress} className="h-2 flex-grow" />
                  <span className="font-medium">{detailedStudent.progress}%</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Instructor Notes</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowStudentDetails(false);
                      setTimeout(() => {
                        handleOpenNoteDialog(detailedStudent);
                      }, 100);
                    }}
                  >
                    Add Note
                  </Button>
                </div>
                
                {detailedStudent.notes && detailedStudent.notes.length > 0 ? (
                  <div className="space-y-3">
                    {detailedStudent.notes.map((note, index) => (
                      <div key={index} className="p-3 rounded-md bg-muted text-sm">
                        {note}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center p-4 text-muted-foreground text-sm bg-muted/30 rounded-md">
                    No notes have been added yet.
                  </p>
                )}
              </div>
              
              <div className="pt-2">
                <h4 className="font-medium mb-2">Next Class</h4>
                <p className="text-sm">
                  {detailedStudent.nextClass || "No upcoming classes scheduled"}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowStudentDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </DashboardLayout>
  );
};

export default InstructorDashboard;
