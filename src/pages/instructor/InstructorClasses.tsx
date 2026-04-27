
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Eye, EyeOff } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';

interface StudentSchedule {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  level: string;
  classDay: string;
  classTime: string;
}

const InstructorClasses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schedules, setSchedules] = useState<StudentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const { session } = useAuth();
  
  const instructorId = session?.user?.id;

  useEffect(() => {
    if (demoMode) return;

    const fetchSchedules = async () => {
      if (!instructorId) return;
      
      try {
        setLoading(true);
        
        // Fetch students assigned to this instructor with schedule info
        const { data: students, error } = await supabase
          .from('students')
          .select(`
            id,
            level,
            class_day,
            class_time,
            profiles!inner(first_name, last_name, email, avatar_url)
          `)
          .eq('instructor_id', instructorId)
          .eq('enrollment_status', 'active');
          
        if (error) {
          console.error("Error fetching student schedules:", error);
          return;
        }
        
        if (!students || students.length === 0) {
          setSchedules([]);
          return;
        }
        
        const formatted: StudentSchedule[] = (students as any[])
          .filter(s => s.class_day && s.class_time)
          .map(s => {
            const profile = s.profiles;
            const firstName = profile?.first_name || '';
            const lastName = profile?.last_name || '';
            return {
              id: s.id,
              name: `${firstName} ${lastName}`.trim() || 'Unknown Student',
              initials: (firstName[0] || '') + (lastName[0] || ''),
              avatarUrl: profile?.avatar_url || null,
              level: s.level || 'novice',
              classDay: s.class_day,
              classTime: s.class_time,
            };
          });

        // Sort by day of week
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        formatted.sort((a, b) => dayOrder.indexOf(a.classDay) - dayOrder.indexOf(b.classDay));
        
        setSchedules(formatted);
      } catch (error) {
        console.error("Error in fetchSchedules:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchedules();
  }, [instructorId, demoMode]);

  // Demo data
  const demoSchedules: StudentSchedule[] = [
    { id: '1', name: 'Goku Son', initials: 'GS', level: 'intermediate', classDay: 'Monday', classTime: '3:30 PM - 5:00 PM' },
    { id: '2', name: 'Vegeta Prince', initials: 'VP', level: 'advanced', classDay: 'Wednesday', classTime: '5:30 PM - 7:00 PM' },
    { id: '3', name: 'Gohan Son', initials: 'GS', level: 'novice', classDay: 'Friday', classTime: '3:30 PM - 5:00 PM' },
  ];

  const activeSchedules = demoMode ? demoSchedules : schedules;
  const isLoading = !demoMode && loading;

  const filteredSchedules = activeSchedules.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classDay.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classTime.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by day
  const schedulesByDay = filteredSchedules.reduce((acc, s) => {
    if (!acc[s.classDay]) acc[s.classDay] = [];
    acc[s.classDay].push(s);
    return acc;
  }, {} as Record<string, StudentSchedule[]>);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = Object.keys(schedulesByDay).sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>Showing sample class data. Click "Live Data" to switch back.</AlertDescription>
          </Alert>
        )}

        <section className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Class Schedule</h1>
            <p className="text-muted-foreground mt-2">Your student class assignments</p>
          </div>
          <Button
            variant={demoMode ? "default" : "outline"} size="sm"
            onClick={() => setDemoMode(!demoMode)} className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search by student, day, or time..." className="pl-10 pr-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          {searchTerm && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-0" onClick={() => setSearchTerm('')}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Clear Search</p></TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : sortedDays.length > 0 ? (
          <div className="space-y-6">
            {sortedDays.map(day => (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Mobile: vertical stacked list */}
                  <div className="md:hidden divide-y divide-border">
                    {schedulesByDay[day].map(s => (
                      <div key={s.id} className="py-3 flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {s.avatarUrl && <AvatarImage src={s.avatarUrl} alt={s.name} />}
                          <AvatarFallback className="text-xs bg-muted">{s.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.classTime}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "shrink-0",
                          s.level === 'novice' && "border-green-500/50 text-green-500",
                          s.level === 'amateur' && "border-yellow-500/50 text-yellow-500",
                          s.level === 'intermediate' && "border-blue-500/50 text-blue-500",
                          s.level === 'advanced' && "border-purple-500/50 text-purple-500"
                        )}>
                          {s.level.charAt(0).toUpperCase() + s.level.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table className="table-fixed w-full">
                      <colgroup>
                        <col className="w-1/3" />
                        <col className="w-1/3" />
                        <col className="w-1/3" />
                      </colgroup>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedulesByDay[day].map(s => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  {s.avatarUrl && <AvatarImage src={s.avatarUrl} alt={s.name} />}
                                  <AvatarFallback className="text-xs bg-muted">{s.initials}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{s.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap tabular-nums">{s.classTime}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className={cn(
                                "inline-flex min-w-24 justify-center",
                                s.level === 'novice' && "border-green-500/50 text-green-500",
                                s.level === 'amateur' && "border-yellow-500/50 text-yellow-500",
                                s.level === 'intermediate' && "border-blue-500/50 text-blue-500",
                                s.level === 'advanced' && "border-purple-500/50 text-purple-500"
                              )}>
                                {s.level.charAt(0).toUpperCase() + s.level.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {activeSchedules.length === 0
                ? "No students have been assigned class days and times yet."
                : "No schedules match your search."}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default InstructorClasses;
