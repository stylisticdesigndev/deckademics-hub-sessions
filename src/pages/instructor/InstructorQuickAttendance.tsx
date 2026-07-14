import React, { useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { X, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useInstructorAttendance } from '@/hooks/instructor/useInstructorAttendance';
import { SwipeAttendanceStack } from '@/components/instructor/dashboard/SwipeAttendanceStack';
import VinylLoader from '@/components/ui/VinylLoader';

/**
 * Full-screen swipe attendance experience.
 *
 * Reached only via push-notification deep link:
 *   /instructor/attendance/quick?classTime=5:30 PM - 7:00 PM
 *
 * Mobile/tablet only — desktop viewports get a redirect prompt because
 * swipe UX doesn't translate well to a mouse.
 */
export default function InstructorQuickAttendance() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const classTimeFilter = params.get('classTime')?.trim() || null;

  const { userData } = useAuth();
  const instructorId = userData.user?.id || userData.profile?.id;
  const { todayStudents, saving, markAttendance, loading } = useInstructorAttendance(instructorId);

  // Lock body scroll while this full-screen view is mounted
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const filteredItems = useMemo(() => {
    if (!classTimeFilter) return todayStudents;
    return todayStudents.filter(i => i.student.classTime === classTimeFilter);
  }, [todayStudents, classTimeFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Desktop notice */}
      <div className="hidden md:flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Monitor className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Best on mobile or tablet</h1>
          <p className="text-muted-foreground">
            The swipe-to-mark attendance view is built for touch. Open this link on your phone
            or tablet, or manage attendance from the regular attendance page on desktop.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => navigate('/instructor/dashboard')}>
              Back to dashboard
            </Button>
            <Button asChild>
              <Link to="/instructor/attendance">Open attendance</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: full-screen swipe deck */}
      <div className="md:hidden min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
          <button
            type="button"
            onClick={() => navigate('/instructor/dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold">Quick Attendance</p>
            {classTimeFilter && (
              <p className="text-[11px] text-muted-foreground">{classTimeFilter}</p>
            )}
          </div>
          <div className="w-10" />
        </header>

        {/* Body */}
        <main className="flex-1 flex items-center justify-center p-4">
          {loading ? (
            <VinylLoader message="Loading students..." />
          ) : (
            <div className="w-full">
              <SwipeAttendanceStack
                items={filteredItems}
                saving={saving}
                onMark={markAttendance}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}