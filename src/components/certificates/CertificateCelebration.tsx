import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award } from 'lucide-react';
import { useCertificates, useMarkCertificateSeen, StudentCertificate } from '@/hooks/useCertificates';
import { CertificateViewerDialog } from './CertificateViewerDialog';

const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.2 + Math.random() * 1.8,
        size: 5 + Math.random() * 6,
        hue: i % 3,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-10%] rounded-[1px] animate-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            background:
              p.hue === 0 ? 'hsl(var(--cert-gold))' : p.hue === 1 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
          }}
        />
      ))}
    </div>
  );
};

export const CertificateCelebration = ({ studentId, studentName }: { studentId?: string; studentName: string }) => {
  const { data: certs = [] } = useCertificates(studentId);
  const markSeen = useMarkCertificateSeen();
  const pending = certs.filter((c) => c.unseen);
  const current = pending[pending.length - 1];
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [viewing, setViewing] = useState<StudentCertificate | null>(null);

  const open = !!current && dismissed !== current.id && !viewing;

  const markAllSeen = () => pending.forEach((c) => markSeen.mutate(c.id));

  useEffect(() => setDismissed(null), [current?.id]);

  if (!current && !viewing) return null;
  const first = studentName.split(' ')[0] || 'there';

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && current) {
            setDismissed(current.id);
            markAllSeen();
          }
        }}
      >
        <DialogContent className="max-w-md overflow-hidden text-center backdrop-blur-xl p-0">
          <Confetti />
          <div className="relative px-6 pt-10 pb-6 space-y-5">
            <div className="mx-auto h-24 w-24 rounded-full bg-[hsl(var(--cert-gold)/0.15)] ring-4 ring-[hsl(var(--cert-gold)/0.4)] flex items-center justify-center animate-badge-pop">
              <Award className="h-12 w-12 text-[hsl(var(--cert-gold))]" />
            </div>
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[hsl(var(--cert-gold))]">Level complete</p>
            <DialogTitle className="text-2xl leading-snug">
              Congratulations {first}! You've officially graduated from {current?.course_level}!
            </DialogTitle>
            <DialogDescription className="text-base">
              Your instructor{current?.instructor_name ? `, ${current.instructor_name},` : ''} has passed you to the next level.
              Your official Deckademics certificate is ready.
            </DialogDescription>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  if (!current) return;
                  markAllSeen();
                  setViewing(current);
                }}
              >
                Reveal My Certificate
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (!current) return;
                  setDismissed(current.id);
                  markAllSeen();
                }}
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <CertificateViewerDialog cert={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </>
  );
};
