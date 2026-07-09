import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen, StickyNote, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, capitalizeLevel, formatDateUS } from '@/lib/utils';
import type { CalendarClass } from '@/hooks/instructor/useInstructorCalendar';
import { useStudentClassDetail } from '@/hooks/instructor/useStudentClassDetail';
import { MilestoneChip } from '@/components/progress/MilestoneChip';
import { MilestoneSummary } from '@/components/progress/MilestoneSummary';

const levelBadgeClass = (level: string) =>
  cn(
    level === 'novice' && 'border-green-500/50 text-green-500',
    level === 'amateur' && 'border-yellow-500/50 text-yellow-500',
    level === 'intermediate' && 'border-blue-500/50 text-blue-500',
    level === 'advanced' && 'border-purple-500/50 text-purple-500',
  );

interface CalendarClassDetailProps {
  classItem: CalendarClass | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTES_PER_PAGE = 4;

export function CalendarClassDetail({ classItem, open, onOpenChange }: CalendarClassDetailProps) {
  const { data, isLoading } = useStudentClassDetail(classItem?.studentId, classItem?.level);
  const [notesPage, setNotesPage] = React.useState(0);

  // Reset pagination whenever a different student/class is opened.
  React.useEffect(() => {
    setNotesPage(0);
  }, [classItem?.studentId, classItem?.level]);

  const notes = data?.notes ?? [];
  const totalNotePages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
  const currentNotePage = Math.min(notesPage, totalNotePages - 1);
  const paginatedNotes = notes.slice(
    currentNotePage * NOTES_PER_PAGE,
    currentNotePage * NOTES_PER_PAGE + NOTES_PER_PAGE,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {classItem && (
          <>
            <SheetHeader className="p-6 pb-4 border-b space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-3.5 w-3.5" />
                Read-only view
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {classItem.avatarUrl && <AvatarImage src={classItem.avatarUrl} alt={classItem.studentName} />}
                  <AvatarFallback className="bg-muted">{classItem.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-left">{classItem.studentName}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={levelBadgeClass(classItem.level)}>
                      {capitalizeLevel(classItem.level)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {classItem.classDay} · {classItem.classTime}
                    </span>
                  </div>
                </div>
              </div>
              {classItem.instructors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {classItem.instructors.map((i) => (
                    <Badge key={i.id} variant="secondary" className="font-normal">
                      {i.name}
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {i.role}
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Skills */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-deckademics-primary" />
                    <h3 className="font-medium">Skill Progress</h3>
                    {!isLoading && data && (
                      <MilestoneSummary
                        className="ml-auto text-muted-foreground"
                        masteredCount={data.masteredCount}
                        skillTotal={data.skillTotal}
                        isReady={data.isReady}
                      />
                    )}
                  </div>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : data && data.skills.length > 0 ? (
                    <div className="space-y-3">
                      {data.skills.map((skill) => (
                        <div key={skill.skillId} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-1.5">
                            {skill.skillName}
                            {skill.isCore && (
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Core</span>
                            )}
                          </span>
                          <MilestoneChip value={skill.proficiency} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skills defined for this student's level yet.
                    </p>
                  )}
                </section>

                {/* Notes */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-deckademics-primary" />
                    <h3 className="font-medium">Instructor Notes</h3>
                    {!isLoading && notes.length > 0 && (
                      <span className="ml-auto text-sm text-muted-foreground">
                        {notes.length} total
                      </span>
                    )}
                  </div>
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : notes.length > 0 ? (
                    <div className="space-y-3">
                      {paginatedNotes.map((note) => (
                        <div key={note.id} className="rounded-md border p-3 space-y-1">
                          {note.title && <p className="text-sm font-medium">{note.title}</p>}
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                            {note.content}
                          </p>
                          <p className="text-[11px] text-muted-foreground pt-1">
                            {note.authorName} · {formatDateUS(note.created_at)}
                          </p>
                        </div>
                      ))}
                      {totalNotePages > 1 && (
                        <div className="flex items-center justify-between pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotesPage((p) => Math.max(0, p - 1))}
                            disabled={currentNotePage === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Page {currentNotePage + 1} of {totalNotePages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNotesPage((p) => Math.min(totalNotePages - 1, p + 1))}
                            disabled={currentNotePage >= totalNotePages - 1}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No notes for this student yet.</p>
                  )}
                </section>
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}