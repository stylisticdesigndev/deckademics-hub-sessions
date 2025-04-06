
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const InstructorClasses = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock class data with week numbers and students list
  const classes = [
    {
      id: '1',
      week: 'Week 1',
      title: 'Beat Matching 101',
      date: 'April 7, 2025',
      time: '6:00 PM',
      duration: '90 min',
      room: 'Studio A',
      students: [
        { id: '1', name: 'Alex Johnson', initials: 'AJ' },
        { id: '2', name: 'Maria Smith', initials: 'MS' },
        { id: '3', name: 'James Brown', initials: 'JB' }
      ],
      status: 'scheduled'
    },
    {
      id: '2',
      week: 'Week 3',
      title: 'Advanced Scratching',
      date: 'April 9, 2025',
      time: '5:30 PM',
      duration: '120 min',
      room: 'Main Studio',
      students: [
        { id: '4', name: 'Chris Martin', initials: 'CM' },
        { id: '5', name: 'David Wang', initials: 'DW' },
        { id: '6', name: 'Sara Miller', initials: 'SM' }
      ],
      status: 'scheduled'
    },
    {
      id: '3',
      week: 'Week 2',
      title: 'Music Theory for DJs',
      date: 'March 28, 2025',
      time: '4:30 PM',
      duration: '90 min',
      room: 'Classroom 2',
      students: [
        { id: '7', name: 'Emma Wilson', initials: 'EW' },
        { id: '8', name: 'Michael Clark', initials: 'MC' }
      ],
      status: 'completed'
    }
  ];

  // Filter classes based on search and filter
  const filterClasses = (classes) => {
    return classes
      .filter(cls => 
        cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.week.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(cls => {
        if (filter === 'all') return true;
        return cls.status === filter;
      });
  };

  const scheduledClasses = filterClasses(classes.filter(cls => cls.status === 'scheduled'));
  const completedClasses = filterClasses(classes.filter(cls => cls.status === 'completed'));

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-2">
            Manage your upcoming and past DJ classes
          </p>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search classes..."
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

          <div className="w-full sm:w-auto min-w-[200px]">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="scheduled">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="scheduled" className="flex gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Classes
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Classes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Week</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Class Room</TableHead>
                      <TableHead>Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledClasses.length > 0 ? (
                      scheduledClasses.map((cls) => (
                        <TableRow key={cls.id} className="py-4">
                          <TableCell className="font-medium py-4">{cls.week} - {cls.title}</TableCell>
                          <TableCell className="py-4">{cls.date}</TableCell>
                          <TableCell className="py-4">{cls.time} ({cls.duration})</TableCell>
                          <TableCell className="py-4">{cls.room}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center -space-x-2">
                              {cls.students.map((student) => (
                                <Avatar key={student.id} className="border-2 border-background h-8 w-8 hover:z-10 transition-all">
                                  <AvatarFallback className="bg-muted text-xs">
                                    {student.initials}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              <span className="pl-4 text-muted-foreground text-sm">
                                {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No scheduled classes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Past Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class Week</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Class Room</TableHead>
                      <TableHead>Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedClasses.length > 0 ? (
                      completedClasses.map((cls) => (
                        <TableRow key={cls.id} className="py-4">
                          <TableCell className="font-medium py-4">{cls.week} - {cls.title}</TableCell>
                          <TableCell className="py-4">{cls.date}</TableCell>
                          <TableCell className="py-4">{cls.time} ({cls.duration})</TableCell>
                          <TableCell className="py-4">{cls.room}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center -space-x-2">
                              {cls.students.map((student) => (
                                <Avatar key={student.id} className="border-2 border-background h-8 w-8 hover:z-10 transition-all">
                                  <AvatarFallback className="bg-muted text-xs">
                                    {student.initials}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              <span className="pl-4 text-muted-foreground text-sm">
                                {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No completed classes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default InstructorClasses;
