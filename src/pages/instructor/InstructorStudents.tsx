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
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Student {
  id: string;
  name: string;
  level: string;
  progress: number;
  lastActive: string;
  avatar?: string;
  initials: string;
  overdue?: boolean;
  nextClass?: string;
  needsAttention?: boolean;
  email: string;
  enrollmentDate: string;
  tags: string[];
}

const InstructorStudents = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Mock students data
  const students: Student[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      level: 'Intermediate',
      progress: 68,
      lastActive: 'Today',
      initials: 'AJ',
      enrollmentDate: 'Jan 15, 2025',
      tags: ['Scratching', 'Beat Matching'],
      nextClass: 'April 7, 2025',
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
      tags: ['Fundamentals'],
      needsAttention: true,
      nextClass: 'April 8, 2025',
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
      tags: ['Advanced Techniques', 'Production'],
      nextClass: 'April 9, 2025',
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
      tags: ['Fundamentals'],
      overdue: true,
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
      tags: ['Beat Matching', 'EQ Mixing'],
      nextClass: 'April 12, 2025',
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
      tags: ['Fundamentals'],
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
      tags: ['Advanced Techniques', 'Performance'],
      nextClass: 'April 10, 2025',
    },
  ];

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    // Search term filter
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Level filter
    const matchesLevel = filterLevel === 'all' || student.level === filterLevel;
    
    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'attention') {
      matchesStatus = !!student.needsAttention;
    } else if (filterStatus === 'overdue') {
      matchesStatus = !!student.overdue;
    }
    
    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Group students by level for the level tab view
  const studentsByLevel = {
    Novice: filteredStudents.filter(s => s.level === 'Novice'),
    Intermediate: filteredStudents.filter(s => s.level === 'Intermediate'),
    Advanced: filteredStudents.filter(s => s.level === 'Advanced'),
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
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="attention">Needs Help</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
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
                  <div className="grid grid-cols-10 p-3 font-medium border-b text-xs sm:text-sm">
                    <div className="col-span-3">STUDENT</div>
                    <div className="col-span-2">PROGRESS</div>
                    <div className="col-span-1 text-center">LEVEL</div>
                    <div className="col-span-2">TAGS</div>
                    <div className="col-span-2 text-center">ACTIONS</div>
                  </div>
                  
                  {filteredStudents.length > 0 ? (
                    <div>
                      {filteredStudents.map((student) => (
                        <div 
                          key={student.id}
                          className={cn(
                            "grid grid-cols-10 p-3 border-b last:border-b-0 items-center text-xs sm:text-sm",
                            student.needsAttention && "bg-amber-500/5",
                            student.overdue && "bg-red-500/5"
                          )}
                        >
                          <div className="col-span-3 flex items-center gap-3">
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
                            {student.needsAttention && (
                              <Badge className="bg-amber-500 ml-2 hidden sm:flex">
                                Needs Help
                              </Badge>
                            )}
                            {student.overdue && (
                              <Badge className="bg-red-500 ml-2 hidden sm:flex">
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <div className="col-span-2 flex items-center gap-2">
                            <Progress value={student.progress} className="h-2" />
                            <span className="text-xs font-medium ml-2">
                              {student.progress}%
                            </span>
                          </div>
                          
                          <div className="col-span-1 text-center">
                            <Badge variant="outline" className={cn(
                              student.level === 'Novice' && "border-green-500/50 text-green-500",
                              student.level === 'Intermediate' && "border-blue-500/50 text-blue-500",
                              student.level === 'Advanced' && "border-purple-500/50 text-purple-500"
                            )}>
                              {student.level}
                            </Badge>
                          </div>
                          
                          <div className="col-span-2 flex flex-wrap gap-1">
                            {student.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {student.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{student.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="col-span-2 flex justify-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/instructor/students/${student.id}`)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => navigate(`/instructor/students/${student.id}/update`)}
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
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
                          <div className="space-y-3">
                            {students.map((student) => (
                              <div 
                                key={student.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-md",
                                  student.needsAttention && "bg-amber-500/5",
                                  student.overdue && "bg-red-500/5",
                                  !student.needsAttention && !student.overdue && "bg-muted/30"
                                )}
                              >
                                <div className="flex items-center gap-3">
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
                                    <div className="font-medium flex items-center gap-2">
                                      {student.name}
                                      {student.needsAttention && (
                                        <Badge className="bg-amber-500">Needs Help</Badge>
                                      )}
                                      {student.overdue && (
                                        <Badge className="bg-red-500">Overdue</Badge>
                                      )}
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
                                    onClick={() => navigate(`/instructor/students/${student.id}`)}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => navigate(`/instructor/students/${student.id}/update`)}
                                  >
                                    Update
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            No {level.toLowerCase()} students found matching your filters.
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
      </div>
    </DashboardLayout>
  );
};

export default InstructorStudents;
