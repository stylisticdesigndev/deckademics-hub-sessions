

## Fix: Copy Bug Report with Screenshot

### Problem
The `ClipboardItem` API with mixed MIME types (`text/plain` + `text/html` with embedded `<img>`) is unreliable across browsers. The `fetch` for the screenshot likely fails due to CORS restrictions on the Supabase storage URL, and the silent `catch` block swallows the error, falling back to text-only copy — but even the fallback may not clearly indicate the screenshot wasn't included.

### Solution
Simplify the copy approach — instead of trying to embed the actual image blob into the clipboard (which has broad browser compatibility issues), always copy the text content including the screenshot URL, and use the `text/html` format to make the URL a clickable link. This is reliable and works everywhere.

### Changes

**File: `src/pages/admin/AdminBugReports.tsx`** — Replace `handleCopy` function:
- Build plain text with title, description, device type, and screenshot URL
- Build HTML version with the screenshot URL as a clickable `<a>` tag and an inline `<img>` tag (so pasting into rich-text apps like Slack/email shows the image)
- Use `navigator.clipboard.write()` with both `text/plain` and `text/html` blobs — no fetching the image blob, just reference it by URL
- If `clipboard.write()` fails, fall back to `clipboard.writeText()` with plain text

This avoids CORS issues entirely since we're not fetching the image — just referencing it in HTML.

