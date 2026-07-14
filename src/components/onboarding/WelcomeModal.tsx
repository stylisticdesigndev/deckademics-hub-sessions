import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { welcomeIdForRole, type Role } from '@/lib/tour/tours';
import { Sparkles, Compass, LifeBuoy } from 'lucide-react';

interface WelcomeModalProps {
  role: Role;
  /** Called when the user clicks "Start tour" on the last slide, so the caller can trigger the dashboard tour. */
  onStartTour?: () => void;
}

const COPY: Record<Role, { title: string; blurb: string }[]> = {
  student: [
    { title: 'Welcome to Deckademics', blurb: 'Your DJ education, all in one place — classes, skills, notes, and messaging with your instructor.' },
    { title: 'Everything is in the sidebar', blurb: 'Dashboard, Skills, Curriculum, Classes, Notes, Messages, Announcements. Explore any time.' },
    { title: 'Need a refresher?', blurb: 'You can replay any walkthrough from your Profile page. Ready to see the dashboard tour?' },
  ],
  instructor: [
    { title: 'Welcome, instructor', blurb: 'Manage your roster, log attendance, track skills, and get paid — all from one dashboard.' },
    { title: 'Everything is in the sidebar', blurb: 'Students, Attendance, Classes, Calendar, Curriculum, Payment, Messages, Announcements.' },
    { title: 'Need a refresher?', blurb: 'Replay any walkthrough from your Profile. Ready to tour the dashboard?' },
  ],
  admin: [
    { title: 'Welcome, admin', blurb: 'The full school in one console — instructors, students, curriculum, skills, payments, and reports.' },
    { title: 'Everything is in the sidebar', blurb: 'Approve signups, edit the curriculum, run payroll, and respond to bug reports and feature requests.' },
    { title: 'Need a refresher?', blurb: 'Replay any walkthrough from your Profile. Ready to tour the dashboard?' },
  ],
};

const ICONS = [Sparkles, Compass, LifeBuoy];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ role, onStartTour }) => {
  const { hasSeen, markSeen, loaded } = useOnboardingState();
  const welcomeId = welcomeIdForRole(role);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!loaded) return;
    if (!hasSeen(welcomeId)) setOpen(true);
  }, [loaded, hasSeen, welcomeId]);

  const slides = COPY[role];
  const Icon = ICONS[step] ?? Sparkles;
  const isLast = step === slides.length - 1;

  const finish = async (startTour: boolean) => {
    await markSeen(welcomeId);
    setOpen(false);
    setStep(0);
    if (startTour) onStartTour?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) void finish(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{slides[step].title}</DialogTitle>
          <DialogDescription className="text-center pt-1">
            {slides[step].blurb}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-1.5 pt-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => void finish(false)}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button onClick={() => void finish(true)}>Start tour</Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;