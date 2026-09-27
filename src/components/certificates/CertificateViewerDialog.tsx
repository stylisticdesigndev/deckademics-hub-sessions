import React from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { StudentCertificate } from '@/hooks/useCertificates';
import { CertificateDocument } from './CertificateDocument';

interface Props {
  cert: StudentCertificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CertificateViewerDialog = ({ cert, open, onOpenChange }: Props) => {
  if (!cert) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] animate-scale-in">
        <DialogHeader>
          <DialogTitle>{cert.course_level} Certificate</DialogTitle>
          <DialogDescription>Certificate ID {cert.certificate_id}</DialogDescription>
        </DialogHeader>
        <div className="shadow-2xl">
          <CertificateDocument cert={cert} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4 mr-2" /> Download PDF / Print
          </Button>
        </div>
        {open &&
          createPortal(
            <div id="certificate-print-root">
              <CertificateDocument cert={cert} />
            </div>,
            document.body,
          )}
      </DialogContent>
    </Dialog>
  );
};
