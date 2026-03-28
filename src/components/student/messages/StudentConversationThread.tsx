import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Clock, Bookmark, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, differenceInDays } from 'date-fns';

const REPLY_WINDOW_DAYS = 7;

interface ThreadMessage {
  id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  subject: string | null;
  image_url?: string | null;
}

interface StudentConversationThreadProps {
  currentUserId: string;
  instructorName: string;
  instructorInitials: string;
  instructorAvatarUrl?: string | null;
  messages: ThreadMessage[];
  onSendReply: (content: string) => Promise<void>;
  onBack: () => void;
  sending?: boolean;
  onSaveToNotes?: (message: ThreadMessage) => void;
  savedMessageIds?: Set<string>;
}

const StudentConversationThread: React.FC<StudentConversationThreadProps> = ({
  currentUserId,
  instructorName,
  instructorInitials,
  instructorAvatarUrl,
  messages,
  onSendReply,
  onBack,
  sending = false,
  onSaveToNotes,
  savedMessageIds = new Set(),
}) => {
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Find last instructor message to calculate reply window
  const lastInstructorMsg = [...messages]
    .reverse()
    .find(m => m.sender_id !== currentUserId);

  const daysSinceLastInstructor = lastInstructorMsg
    ? differenceInDays(new Date(), new Date(lastInstructorMsg.sent_at))
    : Infinity;

  const canReply = daysSinceLastInstructor < REPLY_WINDOW_DAYS;
  const daysRemaining = REPLY_WINDOW_DAYS - daysSinceLastInstructor;

  const handleSend = async () => {
    if (!replyText.trim() || sending || !canReply) return;
    await onSendReply(replyText.trim());
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          {instructorAvatarUrl && <AvatarImage src={instructorAvatarUrl} alt={instructorName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {instructorInitials}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold">{instructorName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
              <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <Avatar className="h-7 w-7 shrink-0">
                    {instructorAvatarUrl && <AvatarImage src={instructorAvatarUrl} alt={instructorName} />}
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {instructorInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                    }`}
                  >
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                        <img
                          src={msg.image_url}
                          alt="Attachment"
                          className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer"
                        />
                      </a>
                    )}
                    {msg.content && msg.content}
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : ''}`}>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(msg.sent_at), 'MMM d, h:mm a')}
                    </p>
                    {!isMe && onSaveToNotes && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                                savedMessageIds.has(msg.id) ? 'opacity-100 text-primary' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!savedMessageIds.has(msg.id)) {
                                  onSaveToNotes(msg);
                                }
                              }}
                              disabled={savedMessageIds.has(msg.id)}
                            >
                              {savedMessageIds.has(msg.id) ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Bookmark className="h-3 w-3" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{savedMessageIds.has(msg.id) ? 'Saved to notes' : 'Save to notes'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input or expired notice */}
      {canReply ? (
        <div className="border-t pt-3 space-y-1.5">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[42px] max-h-[120px] resize-none"
            />
            <Button
              onClick={handleSend}
              disabled={!replyText.trim() || sending}
              size="icon"
              className="shrink-0 h-[42px] w-[42px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
            <Clock className="h-3 w-3" />
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left to reply
          </p>
        </div>
      ) : (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>Reply window has expired. You can reply when your instructor sends a new message.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentConversationThread;
