import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MilestoneChip } from '@/components/progress/MilestoneChip';
import {
  GraduationCap,
  ListChecks,
  MousePointerClick,
  Star,
  Trophy,
  ArrowUpCircle,
} from 'lucide-react';

interface Step {
  icon: React.ElementType;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: GraduationCap,
    title: "What's new: milestone grading",
    body: (
      <div className="space-y-3">
        <p>
          Grading no longer uses a 0–100% slider. Instead, you assess each skill on a simple
          4-point milestone scale. It's faster to enter and clearer for students.
        </p>
        <p className="text-muted-foreground">
          This quick walkthrough shows how it works. It takes about a minute.
        </p>
      </div>
    ),
  },
  {
    icon: ListChecks,
    title: "The 4 milestones",
    body: (
      <div className="space-y-3">
        <p>Every skill sits at one of these milestones:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <MilestoneChip value={0} />
            <span className="text-sm text-muted-foreground">Not yet graded.</span>
          </div>
          <div className="flex items-center gap-3">
            <MilestoneChip value={1} />
            <span className="text-sm text-muted-foreground">Still developing this skill.</span>
          </div>
          <div className="flex items-center gap-3">
            <MilestoneChip value={2} />
            <span className="text-sm text-muted-foreground">Can do it reliably.</span>
          </div>
          <div className="flex items-center gap-3">
            <MilestoneChip value={3} />
            <span className="text-sm text-muted-foreground">Fully mastered.</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: MousePointerClick,
    title: "How to grade a skill",
    body: (
      <div className="space-y-3">
        <p>
          Open a student from your dashboard or the <strong>Students</strong> page, then go to the{' '}
          <strong>Skills</strong> section. Each skill has a segmented control:
        </p>
        <div className="rounded-lg border p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-red-500 bg-red-500 py-1.5 text-center text-xs font-medium text-white">Needs Work</div>
            <div className="rounded-md border py-1.5 text-center text-xs font-medium text-muted-foreground">Proficient</div>
            <div className="rounded-md border py-1.5 text-center text-xs font-medium text-muted-foreground">Mastered</div>
          </div>
        </div>
        <p className="text-muted-foreground">
          Just tap the milestone that fits. It saves automatically — no submit button needed.
        </p>
      </div>
    ),
  },
  {
    icon: Star,
    title: "Core vs. Creative skills",
    body: (
      <div className="space-y-3">
        <p>Skills are split into two types, set by the admin:</p>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Core skills</strong> — the non-negotiables. A student must{' '}
            <span className="text-green-500 font-medium">Master</span> every Core skill.
          </li>
          <li>
            <strong>Creative skills</strong> — the extras. A student must reach at least{' '}
            <span className="text-amber-500 font-medium">Proficient</span> on each.
          </li>
        </ul>
        <p className="text-muted-foreground">
          You'll see a Core / Creative label on each skill so you know which bar to clear.
        </p>
      </div>
    ),
  },
  {
    icon: Trophy,
    title: "Overall progress = skills mastered",
    body: (
      <div className="space-y-3">
        <p>
          Instead of an average percentage, progress is now shown as a count of skills mastered —
          for example <strong>"7 of 12 Mastered"</strong>.
        </p>
        <p className="text-muted-foreground">
          This appears on your dashboard, the student list, and each student's detail view.
        </p>
      </div>
    ),
  },
  {
    icon: ArrowUpCircle,
    title: "Advancing a student",
    body: (
      <div className="space-y-3">
        <p>
          When a student clears the bar — all Core skills Mastered and all Creative skills at least
          Proficient — a <span className="text-green-500 font-medium">Ready to Advance</span> badge
          appears.
        </p>
        <p>
          Advancing is always your call. Use the <strong>Advance to [next level]</strong> button in
          the student's detail view to move them up. Nothing happens automatically.
        </p>
        <p className="text-muted-foreground">You're all set — happy grading!</p>
      </div>
    ),
  },
];

interface GradingWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export const GradingWalkthrough: React.FC<GradingWalkthroughProps> = ({ open, onOpenChange, onComplete }) => {
  const [step, setStep] = useState(0);

  // Reset to first step whenever the dialog is opened.
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  const finish = () => {
    onComplete?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Instructor grading walkthrough, step {step + 1} of {STEPS.length}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm leading-relaxed">{current.body}</div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={finish}>
              Skip
            </Button>
          )}
          {isLast ? (
            <Button onClick={finish}>Got it</Button>
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GradingWalkthrough;