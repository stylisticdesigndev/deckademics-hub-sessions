import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { SwipeAttendanceStack, SwipeItem } from '@/components/instructor/dashboard/SwipeAttendanceStack';

const items: SwipeItem[] = [
  { student: { id: '1', name: 'Maya Rodriguez', initials: 'MR', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=900&auto=format&fit=crop', level: 'intermediate', classTime: '5:30 PM - 7:00 PM' }, dateStr: '2026-07-14', status: null },
  { student: { id: '2', name: 'Jordan Blake', initials: 'JB', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=900&auto=format&fit=crop', level: 'amateur', classTime: '5:30 PM - 7:00 PM' }, dateStr: '2026-07-14', status: null },
  { student: { id: '3', name: 'Priya Shah', initials: 'PS', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=900&auto=format&fit=crop', level: 'novice', classTime: '5:30 PM - 7:00 PM' }, dateStr: '2026-07-14', status: null },
];

export default function PreviewQuickAttendance() {
  const [progress, setProgress] = useState({ decided: 0, total: 0, currentTime: null as string | null });
  const onProgress = useCallback((info: typeof progress) => setProgress(info), []);
  const counter = progress.total > 0
    ? progress.decided >= progress.total
      ? `${progress.total} of ${progress.total} · all done`
      : `${progress.decided + 1} of ${progress.total} · swipe or tap`
    : null;
  const topTime = progress.currentTime || '5:30 PM - 7:00 PM';
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 py-2.5 bg-background/95 backdrop-blur sticky top-0 z-10 shrink-0">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="text-center leading-tight">
            <p className="text-sm font-bold">Quick Attendance</p>
            <p className="text-[11px] text-muted-foreground">{topTime}{counter ? ` · ${counter}` : ''}</p>
          </div>
          <div className="w-10" />
        </header>
        <main className="flex-1 min-h-0 flex flex-col px-3 pb-3 pt-1">
          <SwipeAttendanceStack items={items} saving={false} onMark={async () => {}} fullScreen onProgress={onProgress} />
        </main>
      </div>
    </div>
  );
}