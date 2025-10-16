import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudentNotes } from '@/hooks/student/useStudentNotes';
import { StickyNote, ArrowRight, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotesSectionProps {
  studentId: string | undefined;
}

export const NotesSection = ({ studentId }: NotesSectionProps) => {
  const navigate = useNavigate();
  const { notes, isLoading, unreadCount } = useStudentNotes(studentId);
  
  // Show only the 3 most recent notes
  const recentNotes = notes.slice(0, 3);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              <CardTitle>Recent Notes</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <CardTitle>Recent Notes</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} new</Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/student/notes')}
            className="gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Notes from your instructor about your lessons
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs">Your instructor will add notes here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotes.map(note => (
              <div 
                key={note.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  !note.is_read ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => navigate('/student/notes')}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  {note.title && (
                    <h4 className="font-medium text-sm">{note.title}</h4>
                  )}
                  {!note.is_read && (
                    <Badge variant="default" className="text-xs">New</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  {note.instructor?.first_name && (
                    <>
                      <span>•</span>
                      <span>
                        {note.instructor.first_name} {note.instructor.last_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
