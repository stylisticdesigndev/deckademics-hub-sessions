
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { MessageReplyForm } from './MessageReplyForm';

interface DirectMessage {
  id: string;
  subject: string | null;
  content: string;
  sent_at: string;
  read_at: string | null;
  sender_id: string;
  senderName: string;
  senderInitials: string;
  image_url?: string | null;
}

interface MessageCardProps {
  message: DirectMessage;
  onMarkAsRead: (id: string) => void;
  onReply: (messageId: string, content: string) => Promise<void>;
  isDemoMode: boolean;
}

export const MessageCard = ({ message, onMarkAsRead, onReply, isDemoMode }: MessageCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (!message.read_at) {
      onMarkAsRead(message.id);
    }
    setExpanded(!expanded);
  };

  return (
    <Card
      className={`cursor-pointer transition-colors ${!message.read_at ? 'border-primary/50 bg-primary/5' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {message.senderInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{message.senderName}</span>
              {!message.read_at && (
                <Badge variant="default" className="text-xs px-1.5 py-0">New</Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                {format(new Date(message.sent_at), 'MMM d, yyyy h:mm a')}
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </span>
            </div>
            {message.subject && (
              <p className="font-medium text-sm mt-1">{message.subject}</p>
            )}
            {message.image_url && (
              <a href={message.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                <img src={message.image_url} alt="Attachment" className="rounded-lg max-w-full max-h-48 object-cover" />
              </a>
            )}
            <p className={`text-sm text-muted-foreground mt-1 ${expanded ? '' : 'line-clamp-2'}`}>
              {message.content}
            </p>
            {expanded && (
              <MessageReplyForm
                messageId={message.id}
                sentAt={message.sent_at}
                onReply={onReply}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
