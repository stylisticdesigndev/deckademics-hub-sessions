import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface MilestoneSummaryProps {
  masteredCount: number;
  total: number;
  isReady?: boolean;
  showReadyBadge?: boolean;
  className?: string;
}

/** Compact "X of Y Mastered" summary with an optional "Ready to Advance" badge. */
export const MilestoneSummary = ({
  masteredCount,
  total,
  isReady = false,
  showReadyBadge = true,
  className,
}: MilestoneSummaryProps) => {
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs', className)}>
      <span className="font-medium tabular-nums">
        {masteredCount} of {total} Mastered
      </span>
      {showReadyBadge && isReady && (
        <span className="inline-flex items-center gap-1 rounded-full border border-green-500/50 px-2 py-0.5 font-medium text-green-500">
          <Sparkles className="h-3 w-3" />
          Ready to Advance
        </span>
      )}
    </span>
  );
};