import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;
const URL_PART_REGEX = /^https?:\/\/[^\s<]+$/i;
const TRAILING_PUNCT = /[.,;:!?)]+$/;

/**
 * Strips common trailing punctuation that gets accidentally captured by the URL regex.
 */
function cleanUrl(raw: string): { url: string; trailing: string } {
  const match = raw.match(TRAILING_PUNCT);
  if (match) {
    return { url: raw.slice(0, -match[0].length), trailing: match[0] };
  }
  return { url: raw, trailing: '' };
}

/**
 * Render text with clickable links. Uses native anchor behavior (no preventDefault)
 * so links work reliably even inside iframes.
 *
 * @param isSentByMe - when true, links use foreground-friendly colors for the
 *                     primary-colored chat bubble. When false, links use text-primary.
 */
export function renderTextWithLinks(
  text: string,
  options: { isSentByMe?: boolean; keyPrefix?: string } = {}
): React.ReactNode[] {
  const { isSentByMe = false, keyPrefix = '' } = options;
  const parts = text.split(URL_REGEX);

  const linkClass = isSentByMe
    ? 'underline underline-offset-2 break-all text-primary-foreground/90 hover:text-primary-foreground'
    : 'underline underline-offset-2 break-all text-primary hover:text-primary/80';

  return parts.map((part, i) => {
    if (URL_PART_REGEX.test(part)) {
      const { url, trailing } = cleanUrl(part);
      return (
        <span key={`${keyPrefix}${i}`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {url}
          </a>
          {trailing && <span>{trailing}</span>}
        </span>
      );
    }
    return <span key={`${keyPrefix}${i}`}>{part}</span>;
  });
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?[^\s]*)?$/i;
const IMAGE_NOTE_PATTERN = /📎\s*Image:\s*(https?:\/\/[^\s<]+)/g;

/**
 * Render note content with inline images for image URLs and the 📎 Image: pattern.
 * Uses native anchor behavior for all links.
 */
export function renderNoteContent(content: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const imageMatches = [...content.matchAll(IMAGE_NOTE_PATTERN)];

  if (imageMatches.length > 0) {
    imageMatches.forEach((match, idx) => {
      const before = content.slice(lastIndex, match.index);
      if (before) parts.push(...renderNoteTextWithLinks(before, `before-${idx}`));
      parts.push(
        <a
          key={`img-${idx}`}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="block my-2 cursor-pointer"
        >
          <img src={match[1]} alt="Attachment" className="rounded-lg max-w-full max-h-64 object-cover" />
        </a>
      );
      lastIndex = match.index! + match[0].length;
    });
    const remaining = content.slice(lastIndex);
    if (remaining) parts.push(...renderNoteTextWithLinks(remaining, 'remaining'));
    return <>{parts}</>;
  }

  return <>{renderNoteTextWithLinks(content, 'content')}</>;
}

function renderNoteTextWithLinks(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_PART_REGEX.test(part)) {
      const { url, trailing } = cleanUrl(part);
      if (IMAGE_EXTENSIONS.test(url)) {
        return (
          <span key={`${keyPrefix}-${i}`}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="block my-2 cursor-pointer">
              <img src={url} alt="Attachment" className="rounded-lg max-w-full max-h-64 object-cover" />
            </a>
            {trailing && <span>{trailing}</span>}
          </span>
        );
      }
      return (
        <span key={`${keyPrefix}-${i}`}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all text-primary hover:text-primary/80"
          >
            {url}
          </a>
          {trailing && <span>{trailing}</span>}
        </span>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}
