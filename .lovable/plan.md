
Fix message link handling from the ground up so YouTube links work reliably and sent link-only messages stay readable.

What I found
- Both message threads currently use the same custom link opener (`preventDefault` + `window.open()` + fallback to `window.top.location.href`).
- That fallback is likely the reason YouTube still shows as blocked in preview: when popup opening fails, the app tries to load YouTube in the preview frame/top frame, and YouTube refuses iframe-style embedding.
- The instructor thread also hardcodes link text as `text-primary` even inside the sender’s green bubble. So if a sent message is mostly or entirely a URL, it can look like an empty green bubble because the link color blends into the bubble.

Plan
1. Remove the current custom external-link opener logic
- Delete the `openExternalLink` flow from the instructor thread, student thread, and the student notes page.
- Stop preventing the anchor’s default behavior for normal message links.
- Use native external anchors instead: real `<a href="..." target="_blank" rel="noopener noreferrer">`.
- This gives the browser the cleanest, most reliable “open in new tab” behavior for YouTube links.

2. Create one shared message/note link renderer
- Extract the duplicated URL parsing/rendering into one shared helper/component.
- Use it in both:
  - `src/components/instructor/messages/ConversationThread.tsx`
  - `src/components/student/messages/StudentConversationThread.tsx`
- Also apply it in `src/pages/student/StudentNotes.tsx` so saved links behave the same way everywhere.

3. Make link colors bubble-aware
- For sent messages (`isMe` / green bubble), links should use the same readable foreground color as the bubble text, not `text-primary`.
- For received messages, keep the existing primary-colored link styling.
- Ensure plain text remains inherited from the bubble and long URLs wrap cleanly.

4. Harden URL rendering a bit
- Normalize detected URLs before rendering so common trailing punctuation does not get included in the link.
- Keep `whitespace-pre-wrap` and add safe wrapping behavior for long URLs.

5. QA after implementation
- Send a plain YouTube link from instructor to student.
- Open it from both the instructor thread and student thread and confirm it opens in a real browser tab/window instead of the preview frame.
- Verify a URL-only sent message is visible inside the green bubble on the instructor side.
- Re-check regular text messages, mixed text+URL messages, and inline image attachments.

Files likely changed
- `src/components/instructor/messages/ConversationThread.tsx`
- `src/components/student/messages/StudentConversationThread.tsx`
- `src/pages/student/StudentNotes.tsx`
- one new shared link-rendering helper/component

No database changes are needed for this fix.
