
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const InstructorClasses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  // Mock class data with week numbers and individual students
  const classes = [
    {
      id: '1',
      week: 'Week 1',
      title: 'Beat Matching 101',
      date: 'April 7, 2025',
      time: '6:00 PM',
      duration: '90 min',
      room: 'Room 1',
      student: { id: '1', name: 'Alex Johnson', initials: 'AJ' }
    },
    {
      id: '2',
      week: 'Week 1',
      title: 'Beat Matching 101',
      date: 'April 7, 2025',
      time: '6:00 PM',
      duration: '90 min',
      room: 'Room 1',
      student: { id: '2', name: 'Maria Smith', initials: 'MS' }
    },
    {
      id: '3',
      week: 'Week 1',
      title: 'Beat Matching 101',
      date: 'April 7, 2025',
      time: '6:00 PM',
      duration: '90 min',
      room: 'Room 1',
      student: { id: '3', name: 'James Brown', initials: 'JB' }
    },
    {
      id: '4',
      week: 'Week 3',
      title: 'Advanced Scratching',
      date: 'April 9, 2025',
      time: '5:30 PM',
      duration: '120 min',
      room: 'Room 2',
      student: { id: '4', name: 'Chris Martin', initials: 'CM' }
    },
    {
      id: '5',
      week: 'Week 3',
      title: 'Advanced Scratching',
      date: 'April 9, 2025',
      time: '5:30 PM',
      duration: '120 min',
      room: 'Room 2',
      student: { id: '5', name: 'David Wang', initials: 'DW' }
    },
    {
      id: '6',
      week: 'Week 3',
      title: 'Advanced Scratching',
      date: 'April 9, 2025',
      time: '5:30 PM',
      duration: '120 min',
      room: 'Room 2',
      student: { id: '6', name: 'Sara Miller', initials: 'SM' }
    },
    {
      id: '7',
      week: 'Week 5',
      title: 'Music Theory for DJs',
      date: 'April 15, 2025',
      time: '4:30 PM',
      duration: '90 min',
      room: 'Room 3',
      student: { id: '7', name: 'Emma Wilson', initials: 'EW' }
    },
    {
      id: '8',
      week: 'Week 5',
      title: 'Music Theory for DJs',
      date: 'April 15, 2025',
      time: '4:30 PM',
      duration: '90 min',
      room: 'Room 3',
      student: { id: '8', name: 'Michael Clark', initials: 'MC' }
    }
  ];

  // Filter classes based on search and filter
  const filterClasses = (classes) => {
    return classes.filter(cls => 
      cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.week.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.student.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).filter(cls => {
      if (filter === 'all') return true;
      return cls.week === filter;
    });
  };

  const filteredClasses = filterClasses(classes);

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-2">
            Manage your upcoming DJ classes
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
                <SelectValue placeholder="Filter by Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                <SelectItem value="Week 1">Week 1</SelectItem>
                <SelectItem value="Week 2">Week 2</SelectItem>
                <SelectItem value="Week 3">Week 3</SelectItem>
                <SelectItem value="Week 4">Week 4</SelectItem>
                <SelectItem value="Week 5">Week 5</SelectItem>
                <SelectItem value="Week 6">Week 6</SelectItem>
                <SelectItem value="Week 7">Week 7</SelectItem>
                <SelectItem value="Week 8">Week 8</SelectItem>
                <SelectItem value="Week 9">Week 9</SelectItem>
                <SelectItem value="Week 10">Week 10</SelectItem>
                <SelectItem value="Week 11">Week 11</SelectItem>
                <SelectItem value="Week 12">Week 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Class Room</TableHead>
                  <TableHead>Class Week</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls) => (
                    <TableRow key={cls.id} className="py-4">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted">
                              {cls.student.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span>{cls.student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">{cls.date}</TableCell>
                      <TableCell className="py-4">{cls.time} ({cls.duration})</TableCell>
                      <TableCell className="py-4">{cls.room}</TableCell>
                      <TableCell className="py-4">{cls.week}</TableCell>
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
      </div>
    </DashboardLayout>
  );
};

export default InstructorClasses;
