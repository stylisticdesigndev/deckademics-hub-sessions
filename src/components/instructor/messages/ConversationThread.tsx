import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface ThreadMessage {
  id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  subject: string | null;
}

interface ConversationThreadProps {
  currentUserId: string;
  studentName: string;
  studentInitials: string;
  messages: ThreadMessage[];
  onSendReply: (content: string) => Promise<void>;
  onBack: () => void;
  sending?: boolean;
}

const ConversationThread: React.FC<ConversationThreadProps> = ({
  currentUserId,
  studentName,
  studentInitials,
  messages,
  onSendReply,
  onBack,
  sending = false,
}) => {
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
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
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {studentInitials}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold">{studentName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {studentInitials}
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
                    {msg.content}
                  </div>
                  <p className={`text-[11px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                    {format(new Date(msg.sent_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="border-t pt-3 flex gap-2">
        <Textarea
          placeholder="Type a message..."
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
    </div>
  );
};

export default ConversationThread;
