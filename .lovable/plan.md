

# Make Instructor Messages Conversational

## Problem
The current instructor messages page looks like an email client — separate Inbox/Sent tabs, clicking a message shows a single card with no reply option. When a student replies, there's no way to see the conversation thread or respond back.

## Solution
Replace the Inbox/Sent split with a **conversation list + chat thread view**. Group all messages between the instructor and each student into conversations. Clicking a conversation opens a chat-like thread with bubbles (instructor messages right-aligned, student messages left-aligned) and a reply input at the bottom.

## Changes

### 1. Restructure `src/pages/instructor/InstructorMessages.tsx`

**Tabs become**: Conversations | Compose

**Conversations tab** (default):
- Fetch ALL messages where `sender_id = user.id OR receiver_id = user.id`
- Group by the "other person" (the student) into conversation threads
- Show a list of student names with last message preview, timestamp, and unread badge
- Clicking a conversation opens the thread view

**Thread view** (replaces the current single-message card):
- Show student name and avatar at the top with a back button
- Render all messages between instructor and that student in chronological order
- Instructor messages: right-aligned bubbles with a different background color
- Student messages: left-aligned bubbles
- Each bubble shows content + timestamp
- Reply input at the bottom (Textarea + Send button) — always available since instructor initiates conversations
- Auto-mark unread messages as read when opening the thread

**Compose tab**: Keep as-is for starting new conversations with students.

### 2. Create `src/components/instructor/messages/ConversationThread.tsx`

New component for the chat thread view:
- Props: `studentId`, `studentName`, `messages[]`, `onSendReply`, `onBack`
- Renders messages as chat bubbles using `flex` + `justify-end` / `justify-start`
- Instructor bubbles: `bg-primary text-primary-foreground rounded-2xl` (right side)
- Student bubbles: `bg-muted rounded-2xl` (left side)
- Timestamps shown as small text below each bubble
- Sticky reply input at the bottom with textarea and send button
- Auto-scroll to bottom on load

### 3. Create `src/components/instructor/messages/ConversationList.tsx`

New component for the conversation list:
- Groups messages by student ID
- Shows avatar, student name, last message preview (truncated), timestamp
- Unread count badge per conversation
- Sorted by most recent message

### No database changes needed
The `messages` table already supports two-way messaging with proper RLS policies (users can send where `sender_id = auth.uid()`, view where sender or receiver is them).

### Files Changed
- `src/pages/instructor/InstructorMessages.tsx` — restructure to conversations + thread model
- `src/components/instructor/messages/ConversationThread.tsx` — new chat thread component
- `src/components/instructor/messages/ConversationList.tsx` — new conversation list component

