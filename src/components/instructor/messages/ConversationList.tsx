import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDateUS } from '@/lib/utils';

export interface Conversation {
  studentId: string;
  studentName: string;
  initials: string;
  avatarUrl?: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (studentId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, onSelect }) => {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No conversations yet. Send a message to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((convo) => (
        <button
          key={convo.studentId}
          onClick={() => onSelect(convo.studentId)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left"
        >
          <Avatar className="h-10 w-10 shrink-0">
            {convo.avatarUrl && <AvatarImage src={convo.avatarUrl} alt={convo.studentName} />}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {convo.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate">{convo.studentName}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateUS(convo.lastMessageAt)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
              {convo.unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs shrink-0">
                  {convo.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConversationList;
