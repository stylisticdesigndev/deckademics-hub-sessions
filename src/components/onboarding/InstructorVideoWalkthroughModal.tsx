import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import walkthroughAsset from '@/assets/instructor-walkthrough.mp4.asset.json';

export const INSTRUCTOR_WALKTHROUGH_VIDEO_ID = 'instructor-walkthrough-video-v1';

interface Props {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const InstructorVideoWalkthroughModal: React.FC<Props> = ({ forceOpen, onClose }) => {
  const { hasSeen, markSeen, loaded } = useOnboardingState();
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    if (!loaded) return;
    if (!hasSeen(INSTRUCTOR_WALKTHROUGH_VIDEO_ID)) setOpen(true);
  }, [loaded, hasSeen, forceOpen]);

  const finish = async () => {
    await markSeen(INSTRUCTOR_WALKTHROUGH_VIDEO_ID);
    try { videoRef.current?.pause(); } catch { /* noop */ }
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) void finish(); }}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Welcome to Deckademics</DialogTitle>
          <DialogDescription>
            A short walkthrough for instructors — dashboard, students, classes, attendance,
            skills, notes & messages, and your payment page.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-black">
          <video
            ref={videoRef}
            src={walkthroughAsset.url}
            controls
            playsInline
            className="w-full h-auto max-h-[70vh]"
          />
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 flex-row justify-between gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground self-center">
            You can rewatch this anytime from your Profile page.
          </p>
          <Button onClick={() => void finish()}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorVideoWalkthroughModal;