import React from 'react';
import { cn } from '@/lib/utils';
import { MILESTONE_BADGE_CLASS, milestoneLabel } from '@/lib/skillMilestones';

interface MilestoneChipProps {
  value: number; // 0–3
  className?: string;
}

/** A small colored badge showing a skill's milestone label (Needs Work / Proficient / Mastered). */
export const MilestoneChip = ({ value, className }: MilestoneChipProps) => {
  const v = Math.max(0, Math.min(3, value ?? 0));
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        MILESTONE_BADGE_CLASS[v],
        className,
      )}
    >
      {milestoneLabel(v)}
    </span>
  );
};