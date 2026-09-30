import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { StudentCertificate } from '@/hooks/useCertificates';
import { CertificateDocument } from './CertificateDocument';

interface Props {
  cert: StudentCertificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Fixed render size (11 x 8.5 at 100px/in) so the PDF looks identical on every device.
const W = 1100;
const H = 850;

export const CertificateViewerDialog = ({ cert, open, onOpenChange }: Props) => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  if (!cert) return null;

  const download = async () => {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      const { toPng } = await import('html-to-image');
      await document.fonts?.ready;
      const dataUrl = await toPng(captureRef.current, { width: W, height: H, pixelRatio: 2, cacheBust: true });
      const base = `Deckademics-${cert.course_level}-Certificate-${cert.student_display_name.replace(/[^a-z0-9]+/gi, '-')}`;
      const isTouch = window.matchMedia('(pointer: coarse)').matches;

      // Phones/tablets: open the share sheet with the image so it can be saved to Photos / Gallery.
      if (isTouch && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${base}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${cert.course_level} Certificate` });
          } catch (err: any) {
            if (err?.name !== 'AbortError') throw err;
          }
          return;
        }
      }

      if (isTouch) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${base}.png`;
        a.click();
        return;
      }

      // Desktop: save a print-ready PDF.
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: 'letter' });
      pdf.addImage(dataUrl, 'PNG', 0, 0, 11, 8.5);
      pdf.save(`${base}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error('Could not save certificate. Please try again.');
    } finally {
      setBusy(false);
    }
  };

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
          <Button onClick={download} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {busy ? 'Preparing…' : 'Save Certificate'}
          </Button>
        </div>
        {open &&
          createPortal(
            <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, width: W, pointerEvents: 'none' }}>
              <div ref={captureRef} style={{ width: W, height: H }}>
                <CertificateDocument cert={cert} />
              </div>
            </div>,
            document.body,
          )}
      </DialogContent>
    </Dialog>
  );
};
