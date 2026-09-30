import React from 'react';
import { StudentCertificate, formatCertDate } from '@/hooks/useCertificates';

const LOGO = '/lovable-uploads/22a8ecc1-e830-4e13-9ae9-a41f938c8809.png';

/** Landscape 11 x 8.5 certificate. Scales with its container width. */
export const CertificateDocument = ({ cert }: { cert: StudentCertificate }) => {
  const isMaster = cert.course_level === 'Advanced';
  return (
    <div className="certificate-doc relative w-full aspect-[11/8.5] overflow-hidden rounded-sm bg-[hsl(var(--cert-ink))] text-[hsl(var(--cert-paper))] [container-type:inline-size]">
      {/* record grooves */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background:
            'repeating-radial-gradient(circle at 50% 55%, hsl(var(--cert-gold)) 0 1px, transparent 1px 6px)',
        }}
      />
      <div className="absolute inset-[2.2cqw] border-[0.35cqw] border-[hsl(var(--cert-gold))]" />
      <div className="absolute inset-[3.2cqw] border-[0.12cqw] border-[hsl(var(--cert-gold)/0.6)]" />

      <div className="relative h-full flex flex-col items-center text-center px-[9cqw] pt-[5cqw] pb-[4.5cqw]">
        <img src={LOGO} alt="Deckademics" className="h-[9cqw] w-auto" />
        <p className="mt-[1.2cqw] font-cert tracking-[0.4em] text-[1.3cqw] text-[hsl(var(--cert-gold))]">
          DECKADEMICS DJ SCHOOL
        </p>
        <h2 className="mt-[1.4cqw] font-cert text-[4cqw] leading-none">
          {isMaster ? 'Master DJ Certification' : `${cert.course_level} DJ Certification`}
        </h2>
        <p className="mt-[2.2cqw] text-[1.4cqw] italic opacity-80">This certifies that</p>
        <p className="mt-[0.6cqw] font-script text-[6cqw] leading-tight text-[hsl(var(--cert-gold))]">
          {cert.student_display_name}
        </p>
        <div className="w-[45cqw] h-[0.12cqw] bg-[hsl(var(--cert-gold)/0.6)]" />
        <p className="mt-[1.6cqw] max-w-[68cqw] text-[1.45cqw] leading-relaxed opacity-90">
          {isMaster
            ? `Having demonstrated complete artistic mastery, technical excellence, and dedication to the craft, ${cert.student_display_name} is hereby awarded the Deckademics Master DJ Certification.`
            : `has successfully completed the ${cert.course_level} DJ Curriculum and demonstrated mastery of all its core competencies and requirements.`}
        </p>

        <div className="mt-auto w-full grid grid-cols-3 items-end gap-[3cqw]">
          <div className="flex flex-col items-center">
            {cert.instructor_signature_url ? (
              <img src={cert.instructor_signature_url} alt="Instructor signature" className="h-[4.5cqw] object-contain" />
            ) : (
              <span className="font-script text-[3.2cqw] leading-none">{cert.instructor_name || 'Deckademics Faculty'}</span>
            )}
            <div className="w-full h-[0.1cqw] bg-[hsl(var(--cert-gold)/0.7)] mt-[0.6cqw]" />
            <span className="mt-[0.5cqw] text-[1.05cqw] tracking-widest uppercase opacity-75">Primary Instructor</span>
          </div>
          <div className="text-[1.05cqw] leading-relaxed opacity-80">
            <div>Issued {formatCertDate(cert.issued_date)}</div>
            <div>Indianapolis, IN</div>
            <div className="font-mono text-[hsl(var(--cert-gold))]">{cert.certificate_id}</div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-script text-[3.2cqw] leading-none">Deckademics</span>
            <div className="w-full h-[0.1cqw] bg-[hsl(var(--cert-gold)/0.7)] mt-[0.6cqw]" />
            <span className="mt-[0.5cqw] text-[1.05cqw] tracking-widest uppercase opacity-75">Academy Director</span>
          </div>
        </div>
      </div>
    </div>
  );
};
