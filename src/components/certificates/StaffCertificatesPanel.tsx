import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Award, Lock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CERT_LEVELS, StudentCertificate, useCertificates, useIssueCertificate } from '@/hooks/useCertificates';
import { CertificateViewerDialog } from './CertificateViewerDialog';

const rank = (l: string) => {
  const v = l.toLowerCase() === 'beginner' ? 'novice' : l.toLowerCase();
  return CERT_LEVELS.findIndex((x) => x.toLowerCase() === v);
};

/** Staff view: shows certificates and lets staff issue/backfill any level up to the student's current one. */
export const StaffCertificatesPanel = ({ studentId, currentLevel }: { studentId: string; currentLevel: string }) => {
  const { data: certs = [] } = useCertificates(studentId);
  const issue = useIssueCertificate();
  const [viewing, setViewing] = useState<StudentCertificate | null>(null);
  const cur = rank(currentLevel || 'novice');

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Award className="h-4 w-4 text-[hsl(var(--cert-gold))]" /> Certificates
      </h3>
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
        {CERT_LEVELS.map((level, i) => {
          const c = certs.find((x) => x.course_level === level);
          if (c)
            return (
              <Button
                key={level}
                variant="outline"
                aria-label={`View ${level} certificate`}
                className="relative h-auto py-2 flex-col border-[hsl(var(--cert-gold)/0.5)] bg-[hsl(var(--cert-gold)/0.06)]"
                onClick={() => setViewing(c)}
              >
                <ArrowUpRight className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-[hsl(var(--cert-gold))]" />
                <span className="font-medium">{level}</span>
                <span className="text-[10px] text-muted-foreground">
                  Issued {new Date(c.issued_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </span>
              </Button>
            );
          const eligible = i < cur || (level === 'Advanced' && cur === 3);
          if (!eligible)
            return (
              <div
                key={level}
                aria-disabled="true"
                className="relative rounded-md border border-dashed py-2 flex flex-col items-center justify-center text-sm opacity-60 text-muted-foreground"
              >
                <Lock className="absolute top-1.5 right-1.5 h-3.5 w-3.5" />
                <span className="font-medium">{level}</span>
                <span className="text-[10px]">Not reached</span>
              </div>
            );
          return (
            <Button
              key={level}
              variant="ghost"
              className="h-auto py-2 flex-col border border-dashed"
              disabled={issue.isPending}
              onClick={async () => {
                try {
                  await issue.mutateAsync({ studentId, level });
                  toast.success(`${level} certificate issued`);
                } catch (e: any) {
                  toast.error(e?.message || 'Could not issue certificate');
                }
              }}
            >
              <span className="font-medium flex items-center gap-1"><Plus className="h-3 w-3" />{level}</span>
              <span className="text-[10px] text-muted-foreground">Issue / Backfill</span>
            </Button>
          );
        })}
      </div>
      <CertificateViewerDialog cert={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </div>
  );
};
