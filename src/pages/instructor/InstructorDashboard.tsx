
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
import { Calendar, CheckCircle, Search, Star, Users, X } from 'lucide-react';
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
}

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock students data
  const students: Student[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      level: 'Intermediate',
      progress: 68,
      lastActive: 'Today',
      initials: 'AJ',
      nextClass: 'April 7, 2025',
    },
    {
      id: '2',
      name: 'Taylor Smith',
      level: 'Beginner',
      progress: 32,
      lastActive: 'Yesterday',
      initials: 'TS',
      needsAttention: true,
      nextClass: 'April 8, 2025',
    },
    {
      id: '3',
      name: 'Jordan Lee',
      level: 'Advanced',
      progress: 87,
      lastActive: '3 days ago',
      initials: 'JL',
      nextClass: 'April 9, 2025',
    },
    {
      id: '4',
      name: 'Morgan Rivera',
      level: 'Beginner',
      progress: 15,
      lastActive: '1 week ago',
      initials: 'MR',
      overdue: true,
    },
    {
      id: '5',
      name: 'Casey Williams',
      level: 'Intermediate',
      progress: 52,
      lastActive: '2 days ago',
      initials: 'CW',
      nextClass: 'April 12, 2025',
    },
  ];

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.level.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Upcoming classes calculation
  const upcomingClassCount = students.filter(student => student.nextClass).length;
  
  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section className="space-y-3">
          <h1 className="text-2xl font-bold">Welcome, DJ Smith</h1>
          <p className="text-muted-foreground">
            Here's an overview of your students and upcoming classes.
          </p>
        </section>

        <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard 
            title="Total Students"
            value={students.length}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 10, isPositive: true }}
          />
          <StatsCard 
            title="Average Progress"
            value="56%"
            icon={<CheckCircle className="h-5 w-5" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatsCard 
            title="Upcoming Classes"
            value={upcomingClassCount}
            icon={<Calendar className="h-5 w-5" />}
            description="In the next 7 days"
          />
          <StatsCard 
            title="Instructor Rating"
            value="4.8"
            icon={<Star className="h-5 w-5" />}
            description="Based on student feedback"
          />
        </section>

        <section>
          <Card>
            <CardHeader className="flex-row justify-between items-center pb-4">
              <CardTitle>Your Students</CardTitle>
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
                <div className="grid grid-cols-7 p-3 font-medium border-b text-xs sm:text-sm">
                  <div className="col-span-3">STUDENT</div>
                  <div className="col-span-2">PROGRESS</div>
                  <div className="col-span-1 text-center">LEVEL</div>
                  <div className="col-span-1 text-center">ACTIONS</div>
                </div>
                
                {filteredStudents.length > 0 ? (
                  <div>
                    {filteredStudents.map((student) => (
                      <div 
                        key={student.id}
                        className={cn(
                          "grid grid-cols-7 p-3 border-b last:border-b-0 items-center text-xs sm:text-sm",
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
                              Last active: {student.lastActive}
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
                            size="sm"
                            onClick={() => navigate(`/instructor/students/${student.id}`)}
                          >
                            View
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
    </DashboardLayout>
  );
};

export default InstructorDashboard;
