
import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { differenceInDays, formatDistanceToNow } from 'date-fns';

interface MessageReplyFormProps {
  messageId: string;
  sentAt: string;
  onReply: (messageId: string, content: string) => Promise<void>;
}

const REPLY_WINDOW_DAYS = 7;

export const MessageReplyForm = ({ messageId, sentAt, onReply }: MessageReplyFormProps) => {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const daysSinceSent = differenceInDays(new Date(), new Date(sentAt));
  const canReply = daysSinceSent < REPLY_WINDOW_DAYS;
  const daysRemaining = REPLY_WINDOW_DAYS - daysSinceSent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !canReply) return;
    setSending(true);
    try {
      await onReply(messageId, replyText.trim());
      setReplyText('');
    } finally {
      setSending(false);
    }
  };

  if (!canReply) {
    return (
      <div className="flex items-center gap-2 mt-3 p-3 rounded-md bg-muted/50 text-muted-foreground text-xs">
        <Clock className="h-3.5 w-3.5" />
        <span>Reply window expired ({formatDistanceToNow(new Date(sentAt))} ago)</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
      <Textarea
        placeholder="Write a reply..."
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        className="min-h-[60px] text-sm resize-none"
        rows={2}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left to reply
        </span>
        <Button type="submit" size="sm" disabled={!replyText.trim() || sending}>
          <Send className="h-3.5 w-3.5 mr-1" />
          {sending ? 'Sending...' : 'Reply'}
        </Button>
      </div>
    </form>
  );
};
