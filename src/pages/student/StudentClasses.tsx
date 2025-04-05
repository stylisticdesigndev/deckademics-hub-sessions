
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { UpcomingClassCard, ClassSession } from '@/components/cards/UpcomingClassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StudentClasses = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock class data
  const classSessions: ClassSession[] = [
    {
      id: '1',
      title: 'Beat Matching 101',
      instructor: 'DJ Rhythm',
      date: 'April 7, 2025',
      time: '6:00 PM',
      duration: '90 min',
      location: 'Studio A',
      attendees: 8,
      isUpcoming: true,
      topic: 'Understanding tempo and phrase matching',
    },
    {
      id: '2',
      title: 'Advanced Scratching',
      instructor: 'DJ Scratch Master',
      date: 'April 9, 2025',
      time: '5:30 PM',
      duration: '120 min',
      location: 'Main Studio',
      attendees: 6,
      isUpcoming: true,
      topic: 'Baby scratches and transforms',
    },
    {
      id: '3',
      title: 'Music Theory for DJs',
      instructor: 'Professor Beat',
      date: 'April 12, 2025',
      time: '4:00 PM',
      duration: '120 min',
      location: 'Classroom 2',
      attendees: 10,
      isUpcoming: true,
      topic: 'Key matching and harmonic mixing',
    },
    {
      id: '4',
      title: 'Basics of Scratching',
      instructor: 'DJ Scratch Master',
      date: 'March 28, 2025',
      time: '4:30 PM',
      duration: '90 min',
      location: 'Main Studio',
      attendees: 8,
      isUpcoming: false,
      topic: 'Introduction to scratching techniques',
    },
    {
      id: '5',
      title: 'Mixing Techniques Workshop',
      instructor: 'DJ Rhythm',
      date: 'March 21, 2025',
      time: '6:00 PM',
      duration: '120 min',
      location: 'Studio A',
      attendees: 12,
      isUpcoming: false,
      topic: 'EQ mixing and smooth transitions',
    },
    {
      id: '6',
      title: 'DJ Equipment Maintenance',
      instructor: 'Tech Master Tim',
      date: 'March 14, 2025',
      time: '5:00 PM',
      duration: '90 min',
      location: 'Workshop Room',
      attendees: 6,
      isUpcoming: false,
      topic: 'How to care for your equipment',
    },
  ];

  const handleAddToCalendar = (id: string) => {
    toast({
      title: 'Added to calendar',
      description: 'The class has been added to your calendar.',
    });
  };

  // Filter classes based on search and filter
  const filterClasses = (classes: ClassSession[]) => {
    return classes
      .filter(session => 
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(session => {
        if (filter === 'all') return true;
        return session.instructor.toLowerCase().includes(filter.toLowerCase());
      });
  };

  const upcomingClasses = filterClasses(classSessions.filter(session => session.isUpcoming));
  const pastClasses = filterClasses(classSessions.filter(session => !session.isUpcoming));

  // Get unique instructors for filter
  const instructors = [...new Set(classSessions.map(session => session.instructor))];

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Class Schedule</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your upcoming and past DJ classes
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
                <SelectValue placeholder="Filter by Instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instructors</SelectItem>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor} value={instructor}>
                    {instructor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming" className="flex gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Classes
            </TabsTrigger>
            <TabsTrigger value="past" className="flex gap-2">
              <CheckCircle className="h-4 w-4" />
              Past Classes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {upcomingClasses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingClasses.map(session => (
                  <UpcomingClassCard 
                    key={session.id} 
                    session={session} 
                    onAddToCalendar={handleAddToCalendar} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No upcoming classes found.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {pastClasses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pastClasses.map(session => (
                  <UpcomingClassCard key={session.id} session={session} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No past classes found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StudentClasses;
