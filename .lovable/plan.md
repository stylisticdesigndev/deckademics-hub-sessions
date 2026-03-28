

# Add Image Sharing to Instructor Messages

## Summary
Add the ability for instructors to attach and send images in conversation threads. This requires a new storage bucket, a new `image_url` column on the `messages` table, and UI changes to the conversation thread component.

## Database Changes

### 1. Add `image_url` column to `messages` table
```sql
ALTER TABLE public.messages ADD COLUMN image_url text;
```

### 2. Create `message-attachments` storage bucket with RLS
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('message-attachments', 'message-attachments', true);

CREATE POLICY "Authenticated users can upload message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Anyone can view message attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'message-attachments');
```

## Code Changes

### `src/components/instructor/messages/ConversationThread.tsx`
- Add a hidden file input (`<input type="file" accept="image/*">`) and an image button (Paperclip or ImagePlus icon) next to the Send button
- When an image is selected, show a small preview thumbnail above the input area with a remove button
- On send: upload the image to `message-attachments/{sender_id}/{timestamp}-{filename}` via Supabase Storage, get the public URL, then pass both `content` and `imageUrl` to `onSendReply`
- Update the message bubble rendering: if `msg.image_url` exists, render an `<img>` tag inside the bubble (clickable to open full-size in a new tab)
- Update `onSendReply` prop signature to accept `(content: string, imageUrl?: string)`

### `src/pages/instructor/InstructorMessages.tsx`
- Update `handleSendReply` to accept an optional `imageUrl` parameter and include `image_url` in the Supabase insert
- Update the `Message` interface to include `image_url?: string | null`
- Update `ThreadMessage` interface in ConversationThread to include `image_url`

### `src/pages/student/StudentMessages.tsx`
- Update the student message display to render images when `image_url` is present on a message, so students can see images sent by instructors

## Files Changed
- SQL migration (add `image_url` column + storage bucket + policies)
- `src/components/instructor/messages/ConversationThread.tsx` — image picker, preview, upload, and display in bubbles
- `src/pages/instructor/InstructorMessages.tsx` — pass image_url through to Supabase insert
- `src/pages/student/StudentMessages.tsx` — render image attachments in student view

