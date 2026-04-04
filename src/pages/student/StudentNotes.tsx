import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStudentNotes, StudentNote } from '@/hooks/student/useStudentNotes';
import { useStudentPersonalNotes, PersonalNote } from '@/hooks/student/useStudentPersonalNotes';
import { useNotesNotifications } from '@/hooks/student/useNotesNotifications';
import { PersonalNoteDialog } from '@/components/student/notes/PersonalNoteDialog';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { StickyNote, Calendar, User, Eye, EyeOff, Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { mockNotes, mockPersonalNotes } from '@/data/mockDashboardData';

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?[^\s]*)?$/i;
const IMAGE_NOTE_PATTERN = /📎\s*Image:\s*(https?:\/\/[^\s<]+)/g;

function renderNoteContent(content: string) {
  // First, extract image patterns like "📎 Image: <url>"
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const imageMatches = [...content.matchAll(IMAGE_NOTE_PATTERN)];

  if (imageMatches.length > 0) {
    imageMatches.forEach((match, i) => {
      const before = content.slice(lastIndex, match.index);
      if (before) parts.push(...renderTextWithLinks(before, `before-${i}`));
      parts.push(
        <a key={`img-${i}`} href={match[1]} target="_blank" rel="noopener noreferrer" className="block my-2">
          <img src={match[1]} alt="Attachment" className="rounded-lg max-w-full max-h-64 object-cover" />
        </a>
      );
      lastIndex = match.index! + match[0].length;
    });
    const remaining = content.slice(lastIndex);
    if (remaining) parts.push(...renderTextWithLinks(remaining, 'remaining'));
    return <>{parts}</>;
  }

  // No image patterns — just render text with clickable links + inline images for image URLs
  return <>{renderTextWithLinks(content, 'content')}</>;
}

function renderTextWithLinks(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      if (IMAGE_EXTENSIONS.test(part)) {
        return (
          <a key={`${keyPrefix}-${i}`} href={part} target="_blank" rel="noopener noreferrer" className="block my-2">
            <img src={part} alt="Attachment" className="rounded-lg max-w-full max-h-64 object-cover" />
          </a>
        );
      }
      return (
        <a key={`${keyPrefix}-${i}`} href={part} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 break-all">
          {part}
        </a>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

function truncateText(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

type CombinedNote =
  | { type: 'instructor'; data: StudentNote; created_at: string }
  | { type: 'personal'; data: PersonalNote; created_at: string };

function groupByDate<T extends { created_at: string }>(items: T[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { today: [] as T[], yesterday: [] as T[], thisWeek: [] as T[], earlier: [] as T[] };

  items.forEach(item => {
    const d = new Date(item.created_at);
    if (d.toDateString() === today.toDateString()) groups.today.push(item);
    else if (d.toDateString() === yesterday.toDateString()) groups.yesterday.push(item);
    else if (d > weekAgo) groups.thisWeek.push(item);
    else groups.earlier.push(item);
  });

  return groups;
}

export default function StudentNotes() {
  const [studentId, setStudentId] = useState<string | undefined>();
  const [demoMode, setDemoMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [viewingNote, setViewingNote] = useState<CombinedNote | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStudentId(user.id);
    });
  }, []);

  const { notes: instructorNotes, isLoading: instructorLoading, markAsRead } = useStudentNotes(studentId);
  const { notes: personalNotes, isLoading: personalLoading, createNote, updateNote, deleteNote } = useStudentPersonalNotes(studentId);
  useNotesNotifications(studentId);

  useEffect(() => {
    if (demoMode) return;
    instructorNotes.filter(n => !n.is_read).forEach(n => markAsRead(n.id));
  }, [instructorNotes, demoMode]);

  const isLoading = instructorLoading || personalLoading;

  const activeInstructorNotes: StudentNote[] = demoMode
    ? mockNotes.map(n => ({ ...n, instructor: n.instructor })) as StudentNote[]
    : instructorNotes;

  const activePersonalNotes: PersonalNote[] = demoMode
    ? mockPersonalNotes as PersonalNote[]
    : personalNotes;

  const combinedNotes: CombinedNote[] = [
    ...activeInstructorNotes.map(n => ({ type: 'instructor' as const, data: n, created_at: n.created_at })),
    ...activePersonalNotes.map(n => ({ type: 'personal' as const, data: n, created_at: n.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleCreateNote = (data: { title?: string; content: string }) => {
    if (demoMode) {
      toast({ title: 'Demo mode', description: 'Creating notes is disabled in demo mode.' });
      return;
    }
    createNote.mutate(data, {
      onSuccess: () => toast({ title: 'Note created', description: 'Your note has been saved.' }),
    });
  };

  const handleUpdateNote = (data: { title?: string; content: string }) => {
    if (!editingNote) return;
    if (demoMode) {
      toast({ title: 'Demo mode', description: 'Editing notes is disabled in demo mode.' });
      return;
    }
    updateNote.mutate({ id: editingNote.id, ...data }, {
      onSuccess: () => {
        toast({ title: 'Note updated' });
        setEditingNote(null);
      },
    });
  };

  const handleDeleteNote = (id: string) => {
    if (demoMode) {
      toast({ title: 'Demo mode', description: 'Deleting notes is disabled in demo mode.' });
      return;
    }
    deleteNote.mutate(id, {
      onSuccess: () => toast({ title: 'Note deleted' }),
    });
  };

  const getPlainText = (content: string) => {
    // Strip image patterns for preview
    return content.replace(IMAGE_NOTE_PATTERN, '[Image]').trim();
  };

  const renderInstructorNoteCard = (note: StudentNote) => (
    <Card
      key={note.id}
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${!note.is_read ? 'border-primary' : ''}`}
      onClick={() => setViewingNote({ type: 'instructor', data: note, created_at: note.created_at })}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">Instructor Note</span>
            </div>
            {note.title && <CardTitle className="text-lg">{note.title}</CardTitle>}
            <CardDescription className="flex items-center gap-2 mt-1">
              <User className="h-3 w-3" />
              {note.instructor?.first_name} {note.instructor?.last_name}
              <Calendar className="h-3 w-3 ml-2" />
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          {!note.is_read && <Badge variant="default">New</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{truncateText(getPlainText(note.content))}</p>
      </CardContent>
    </Card>
  );

  const renderPersonalNoteCard = (note: PersonalNote) => (
    <Card
      key={note.id}
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => setViewingNote({ type: 'personal', data: note, created_at: note.created_at })}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">My Note</span>
            </div>
            {note.title && <CardTitle className="text-lg">{note.title}</CardTitle>}
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingNote(note); setDialogOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteNote(note.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{truncateText(getPlainText(note.content))}</p>
      </CardContent>
    </Card>
  );

  const renderCombinedCard = (item: CombinedNote) =>
    item.type === 'instructor'
      ? renderInstructorNoteCard(item.data as StudentNote)
      : renderPersonalNoteCard(item.data as PersonalNote);

  const renderGrouped = <T extends { created_at: string }>(items: T[], renderFn: (item: T) => React.ReactNode) => {
    const groups = groupByDate(items);
    const sections = [
      { title: 'Today', items: groups.today },
      { title: 'Yesterday', items: groups.yesterday },
      { title: 'This Week', items: groups.thisWeek },
      { title: 'Earlier', items: groups.earlier },
    ];

    const hasAny = sections.some(s => s.items.length > 0);
    if (!hasAny) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No notes yet</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {sections.map(s => s.items.length === 0 ? null : (
          <div key={s.title} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{s.title}</h3>
            <div className="space-y-3">{s.items.map(renderFn)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderViewDialog = () => {
    if (!viewingNote) return null;
    const isInstructor = viewingNote.type === 'instructor';
    const note = viewingNote.data;

    return (
      <Dialog open={!!viewingNote} onOpenChange={(open) => { if (!open) setViewingNote(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              {isInstructor ? <BookOpen className="h-4 w-4 text-primary" /> : <StickyNote className="h-4 w-4 text-muted-foreground" />}
              <span className="text-xs font-medium">{isInstructor ? 'Instructor Note' : 'My Note'}</span>
            </div>
            <DialogTitle>{note.title || 'Untitled Note'}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isInstructor && (
                <>
                  <User className="h-3 w-3" />
                  {(note as StudentNote).instructor?.first_name} {(note as StudentNote).instructor?.last_name}
                </>
              )}
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </div>
          </DialogHeader>
          <div className="text-sm whitespace-pre-wrap mt-2">
            {renderNoteContent(note.content)}
          </div>
          {!isInstructor && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  setEditingNote(note as PersonalNote);
                  setDialogOpen(true);
                  setViewingNote(null);
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => {
                  handleDeleteNote(note.id);
                  setViewingNote(null);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <section className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Notes</h1>
            <p className="text-muted-foreground mt-1">Your notes and notes from your instructors</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { setEditingNote(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
            <Button
              variant={demoMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDemoMode(!demoMode)}
              className="flex items-center gap-2"
            >
              {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {demoMode ? 'Live Data' : 'Demo'}
            </Button>
          </div>
        </section>

        {demoMode && (
          <Alert className="bg-warning/10 border-warning/30">
            <Eye className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
            <AlertDescription>Showing sample data. Click "Live Data" to switch back.</AlertDescription>
          </Alert>
        )}

        {!demoMode && isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/4 mt-2" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="my-notes">My Notes</TabsTrigger>
              <TabsTrigger value="instructor">Instructor Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {renderGrouped(combinedNotes, renderCombinedCard)}
            </TabsContent>

            <TabsContent value="my-notes" className="mt-4">
              {renderGrouped(activePersonalNotes, renderPersonalNoteCard)}
            </TabsContent>

            <TabsContent value="instructor" className="mt-4">
              {renderGrouped(activeInstructorNotes, renderInstructorNoteCard)}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {renderViewDialog()}

      <PersonalNoteDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingNote(null); }}
        onSave={editingNote ? handleUpdateNote : handleCreateNote}
        initialTitle={editingNote?.title || ''}
        initialContent={editingNote?.content || ''}
        isEdit={!!editingNote}
      />
    </>
  );
}
