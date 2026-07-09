import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'message-attachments';

/**
 * Accepts either a stored storage path (e.g. "userId/123.jpg") or a legacy
 * full public URL and returns the object path inside the bucket.
 */
export function extractAttachmentPath(value: string): string {
  if (!value) return value;
  const marker = `/${BUCKET}/`;
  const idx = value.indexOf(marker);
  if (idx !== -1) return value.slice(idx + marker.length);
  return value;
}

/**
 * Creates a short-lived signed URL for a private message attachment.
 * Returns null if the current user is not permitted to read the file.
 */
export async function getSignedAttachmentUrl(
  value: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const path = extractAttachmentPath(value);
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}

/** React hook that resolves a stored attachment value to a signed URL. */
export function useSignedAttachmentUrl(value?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!value) {
      setUrl(null);
      return;
    }
    getSignedAttachmentUrl(value).then((signed) => {
      if (active) setUrl(signed);
    });
    return () => {
      active = false;
    };
  }, [value]);

  return url;
}
