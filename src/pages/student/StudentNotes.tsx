import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useStudentNotes, StudentNote } from '@/hooks/student/useStudentNotes';
import { useNotesNotifications } from '@/hooks/student/useNotesNotifications';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { StickyNote, Calendar, User, Eye, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function getMockNotes(): StudentNote[] {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const threeWeeksAgo = new Date(now);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

  return [
    {
      id: 'demo-1',
      student_id: 'demo',
      instructor_id: 'demo-instructor',
      title: 'Great progress on beat matching!',
      content: 'You nailed the tempo sync today. Keep practicing with different BPM ranges (120-130) to build consistency. Try mixing two tracks with a 5 BPM difference and work your way up.',
      is_read: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      instructor: { first_name: 'DJ', last_name: 'Marcus' },
    },
    {
      id: 'demo-2',
      student_id: 'demo',
      instructor_id: 'demo-instructor',
      title: 'EQ transition technique',
      content: 'Remember the bass swap method we practiced: bring the incoming track\'s bass down, then swap bass frequencies at the phrase break. This creates a clean, seamless transition without frequency clashing.',
      is_read: true,
      created_at: yesterday.toISOString(),
      updated_at: yesterday.toISOString(),
      instructor: { first_name: 'DJ', last_name: 'Marcus' },
    },
    {
      id: 'demo-3',
      student_id: 'demo',
      instructor_id: 'demo-instructor',
      title: 'Homework: Build a 30-min set',
      content: 'For next week, put together a 30-minute mix using at least 6 tracks. Focus on smooth transitions and maintaining energy flow. Record it and we\'ll review together in class.',
      is_read: true,
      created_at: threeDaysAgo.toISOString(),
      updated_at: threeDaysAgo.toISOString(),
      instructor: { first_name: 'DJ', last_name: 'Marcus' },
    },
    {
      id: 'demo-4',
      student_id: 'demo',
      instructor_id: 'demo-instructor',
      title: 'Scratching fundamentals review',
      content: 'We covered baby scratches and forward scratches today. Your crossfader technique is improving. Practice the chirp scratch pattern we went over — start slow at 90 BPM before speeding up.',
      is_read: true,
      created_at: twoWeeksAgo.toISOString(),
      updated_at: twoWeeksAgo.toISOString(),
      instructor: { first_name: 'DJ', last_name: 'Marcus' },
    },
    {
      id: 'demo-5',
      student_id: 'demo',
      instructor_id: 'demo-instructor',
      title: 'Welcome to the program!',
      content: 'Welcome to Deckademics! I\'m excited to be your instructor. We\'ll start with the fundamentals — understanding your equipment, basic mixing concepts, and ear training. See you next week!',
      is_read: true,
      created_at: threeWeeksAgo.toISOString(),
      updated_at: threeWeeksAgo.toISOString(),
      instructor: { first_name: 'DJ', last_name: 'Marcus' },
    },
  ];
}

export default function StudentNotes() {
  const [studentId, setStudentId] = useState<string | undefined>();
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStudentId(user.id);
    });
  }, []);

  const { notes, isLoading, markAsRead } = useStudentNotes(studentId);
  useNotesNotifications(studentId);

  useEffect(() => {
    if (demoMode) return;
    const unreadNotes = notes.filter(note => !note.is_read);
    unreadNotes.forEach(note => {
      markAsRead(note.id);
    });
  }, [notes, demoMode]);

  const activeNotes = demoMode ? getMockNotes() : notes;

  const groupNotesByDate = (notesList: StudentNote[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [] as StudentNote[],
      yesterday: [] as StudentNote[],
      thisWeek: [] as StudentNote[],
      earlier: [] as StudentNote[],
    };

    notesList.forEach(note => {
      const noteDate = new Date(note.created_at);
      const isToday = noteDate.toDateString() === today.toDateString();
      const isYesterday = noteDate.toDateString() === yesterday.toDateString();
      const isThisWeek = noteDate > weekAgo;

      if (isToday) groups.today.push(note);
      else if (isYesterday) groups.yesterday.push(note);
      else if (isThisWeek) groups.thisWeek.push(note);
      else groups.earlier.push(note);
    });

    return groups;
  };

  const groupedNotes = groupNotesByDate(activeNotes);

  const renderNoteCard = (note: StudentNote) => (
    <Card key={note.id} className={!note.is_read ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {note.title && (
              <CardTitle className="text-lg">{note.title}</CardTitle>
            )}
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="h-3 w-3" />
              {note.instructor?.first_name} {note.instructor?.last_name}
              <Calendar className="h-3 w-3 ml-2" />
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          {!note.is_read && (
            <Badge variant="default">New</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
      </CardContent>
    </Card>
  );

  const renderGroup = (title: string, groupNotes: StudentNote[]) => {
    if (groupNotes.length === 0) return null;
    
    return (
      <div key={title} className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="space-y-3">
          {groupNotes.map(renderNoteCard)}
        </div>
      </div>
    );
  };

  const showContent = demoMode || (!isLoading && activeNotes.length > 0);

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Notes</h1>
            <p className="text-muted-foreground mt-1">
              View notes from your instructors organized by date
            </p>
          </div>
          <Button
            variant={demoMode ? "default" : "outline"}
            size="sm"
            onClick={() => setDemoMode(!demoMode)}
            className="flex items-center gap-2"
          >
            {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {demoMode ? 'Live Data' : 'Demo'}
          </Button>
        </section>

        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>
              Showing sample instructor notes. Click "Live Data" to switch back.
            </AlertDescription>
          </Alert>
        )}

        {!demoMode && isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !showContent ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm text-muted-foreground">
                Your instructor will add notes about your lessons here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {renderGroup('Today', groupedNotes.today)}
            {renderGroup('Yesterday', groupedNotes.yesterday)}
            {renderGroup('This Week', groupedNotes.thisWeek)}
            {renderGroup('Earlier', groupedNotes.earlier)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
