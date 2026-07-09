import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MilestoneSelectorProps {
  value: number; // 0–3
  onChange: (value: number) => void;
  className?: string;
}

const OPTIONS: { value: number; label: string; active: string }[] = [
  { value: 1, label: 'Needs Work', active: 'bg-red-500 hover:bg-red-500 text-white border-red-500' },
  { value: 2, label: 'Proficient', active: 'bg-amber-500 hover:bg-amber-500 text-white border-amber-500' },
  { value: 3, label: 'Mastered', active: 'bg-green-500 hover:bg-green-500 text-white border-green-500' },
];

/** Segmented control to assign a skill's 3-point milestone (with a Clear/Not-Assessed option). */
export const MilestoneSelector = ({ value, onChange, className }: MilestoneSelectorProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              size="sm"
              className={cn('text-xs', isActive && opt.active)}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
      {value > 0 && (
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => onChange(0)}
        >
          Clear (Not Assessed)
        </button>
      )}
    </div>
  );
};