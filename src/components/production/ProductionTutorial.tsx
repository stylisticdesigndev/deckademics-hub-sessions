import { useRef, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type TutorialChapter = { title: string; seconds: number };
type Props = { role: 'instructor' | 'student'; videoUrl: string; chapters: TutorialChapter[]; captionUrl?: string };
const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function ProductionTutorial({ role, videoUrl, chapters, captionUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const activeChapter = chapters.reduce((active, chapter, index) => currentTime >= chapter.seconds ? index : active, 0);
  const changeOpen = (value: boolean) => {
    if (!value) video.current?.pause();
    setOpen(value);
  };
  return <>
    <Button variant="outline" onClick={() => { setError(false); setReady(false); setCurrentTime(0); setOpen(true); }}><PlayCircle className="h-4 w-4" />Watch Tutorial</Button>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pr-8"><DialogTitle className="tracking-normal">Music Production · {role === 'instructor' ? 'Instructor' : 'Student'} Tutorial</DialogTitle><DialogDescription>{role === 'instructor' ? 'Lessons, student reviews, attendance, and teaching tools' : 'Lessons, homework, feedback, and your learning workspace'}</DialogDescription></DialogHeader>
        <video ref={video} src={videoUrl} controls playsInline preload="metadata" aria-label={`${role} Production tutorial`} className="w-full aspect-video rounded-md bg-muted" onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={() => { setCurrentTime(0); setReady(true); }} onError={() => { setError(true); setReady(false); }}>
          {captionUrl && <track kind="captions" src={captionUrl} srcLang="en" label="English" />}
        </video>
        {error && <p role="alert" className="text-sm text-destructive">The tutorial couldn’t be loaded. Please close it and try again.</p>}
        <nav aria-label="Tutorial chapters" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter, index) => <Button key={chapter.title} disabled={!ready} variant={index === activeChapter ? 'default' : 'ghost'} className="h-auto min-h-11 justify-start whitespace-normal text-left gap-3" aria-current={index === activeChapter ? 'step' : undefined} onClick={() => { const player = video.current; if (!player) return; player.currentTime = chapter.seconds; setCurrentTime(chapter.seconds); void player.play().catch(() => {}); }}><span className={`font-mono text-xs shrink-0 ${index === activeChapter ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{timeLabel(chapter.seconds)}</span><span>{chapter.title}</span></Button>)}
        </nav>
      </DialogContent>
    </Dialog>
  </>;
}