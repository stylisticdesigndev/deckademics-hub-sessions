import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import { computeRequirements, type ReadinessSkill } from '@/lib/skillMilestones';

interface RequirementsChecklistProps {
  skills: ReadinessSkill[];
  className?: string;
}

/**
 * Shows exactly what is left for a student to advance a level:
 *   - every Core skill must be Mastered
 *   - every Creative skill must be at least Proficient
 */
export const RequirementsChecklist = ({ skills, className }: RequirementsChecklistProps) => {
  const req = computeRequirements(skills);

  const Row = ({
    label,
    met,
    total,
    verb,
  }: { label: string; met: number; total: number; verb: string }) => {
    if (total === 0) return null;
    const done = met >= total;
    const remaining = total - met;
    return (
      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          {done ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={cn(done ? 'text-muted-foreground' : 'text-foreground')}>{label}</span>
        </span>
        <span className={cn('pl-5 tabular-nums font-medium sm:pl-0', done ? 'text-green-500' : 'text-foreground')}>
          {met} of {total} {verb}
          {remaining > 0 && (
            <span className="text-muted-foreground font-normal"> · {remaining} to go</span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className={cn('rounded-md border bg-muted/30 p-3 space-y-2', className)}>
      <p className="text-xs font-medium text-muted-foreground">Required to move on</p>
      <Row label="Core skills Mastered" met={req.coreMet} total={req.coreTotal} verb="Mastered" />
      <Row label="Creative skills Proficient" met={req.creativeMet} total={req.creativeTotal} verb="Proficient" />
    </div>
  );
};
