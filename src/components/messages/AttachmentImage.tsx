import React from 'react';
import { useSignedAttachmentUrl } from '@/lib/attachmentUrl';

interface AttachmentImageProps {
  value: string;
  imgClassName?: string;
  wrapperClassName?: string;
}

/**
 * Renders a private message attachment via a short-lived signed URL.
 * Returns nothing until the signed URL resolves (or if access is denied).
 */
const AttachmentImage: React.FC<AttachmentImageProps> = ({
  value,
  imgClassName,
  wrapperClassName,
}) => {
  const signedUrl = useSignedAttachmentUrl(value);
  if (!signedUrl) return null;
  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={wrapperClassName}
    >
      <img src={signedUrl} alt="Attachment" className={imgClassName} />
    </a>
  );
};

export default AttachmentImage;
