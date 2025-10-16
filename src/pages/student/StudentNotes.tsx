import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentNotes, StudentNote } from '@/hooks/student/useStudentNotes';
import { useNotesNotifications } from '@/hooks/student/useNotesNotifications';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { StickyNote, Calendar, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentNotes() {
  const [studentId, setStudentId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStudentId(user.id);
    });
  }, []);

  const { notes, isLoading, markAsRead } = useStudentNotes(studentId);
  useNotesNotifications(studentId);

  useEffect(() => {
    // Mark all notes as read when viewing the page
    const unreadNotes = notes.filter(note => !note.is_read);
    unreadNotes.forEach(note => {
      markAsRead(note.id);
    });
  }, [notes]);

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

  const groupedNotes = groupNotesByDate(notes);

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

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="container max-w-4xl py-6">
        <div className="flex items-center gap-3 mb-6">
          <StickyNote className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">My Notes</h1>
            <p className="text-muted-foreground">
              View notes from your instructors organized by date
            </p>
          </div>
        </div>

        {isLoading ? (
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
        ) : notes.length === 0 ? (
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
