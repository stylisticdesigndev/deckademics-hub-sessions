import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ChevronRight, Lock } from 'lucide-react';
import { CERT_LEVELS, StudentCertificate, formatCertDate, useCertificates } from '@/hooks/useCertificates';
import { CertificateViewerDialog } from './CertificateViewerDialog';

/** Full list of certificates for the Skills page. */
export const EarnedCertificates = ({ studentId }: { studentId?: string }) => {
  const { data: certs = [] } = useCertificates(studentId);
  const [viewing, setViewing] = useState<StudentCertificate | null>(null);

  return (
    <Card id="certificates">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-[hsl(var(--cert-gold))]" /> Earned Certifications
        </CardTitle>
        <CardDescription>Your official record of every level you've passed.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {CERT_LEVELS.map((level) => {
          const c = certs.find((x) => x.course_level === level);
          return c ? (
            <div key={level} className="rounded-lg border border-[hsl(var(--cert-gold)/0.4)] bg-[hsl(var(--cert-gold)/0.06)] p-4 flex flex-col gap-2 hover-scale">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-[hsl(var(--cert-gold)/0.2)] flex items-center justify-center">
                  <Award className="h-5 w-5 text-[hsl(var(--cert-gold))]" />
                </div>
                <span className="font-semibold">{level === 'Advanced' ? 'Master DJ' : level}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>Issued {formatCertDate(c.issued_date)}</div>
                {c.instructor_name && <div>Instructor: {c.instructor_name}</div>}
                <div className="font-mono">{c.certificate_id}</div>
              </div>
              <Button size="sm" variant="outline" className="mt-auto" onClick={() => setViewing(c)}>
                View / Download
              </Button>
            </div>
          ) : (
            <div key={level} className="rounded-lg border border-dashed p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground min-h-[150px]">
              <Lock className="h-5 w-5" />
              <span className="text-sm">{level === 'Advanced' ? 'Master DJ' : level}</span>
              <span className="text-xs">Not yet earned</span>
            </div>
          );
        })}
      </CardContent>
      <CertificateViewerDialog cert={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </Card>
  );
};

/** Compact dashboard widget. */
export const CertificatesWidget = ({ studentId }: { studentId?: string }) => {
  const { data: certs = [] } = useCertificates(studentId);
  const latest = certs[certs.length - 1];
  return (
    <Link to="/student/progress#certificates" className="block">
      <Card className="hover:border-[hsl(var(--cert-gold)/0.6)] transition-colors">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-[hsl(var(--cert-gold)/0.15)] flex items-center justify-center">
            <Award className="h-6 w-6 text-[hsl(var(--cert-gold))]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">Certificates · {certs.length} of {CERT_LEVELS.length}</div>
            <div className="text-sm text-muted-foreground truncate">
              {latest ? `Latest: ${latest.course_level} · ${formatCertDate(latest.issued_date)}` : 'Pass your first level to earn a certificate'}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
};
