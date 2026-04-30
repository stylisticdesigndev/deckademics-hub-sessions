import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatDateTimeUS } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { renderTextWithLinks } from '@/utils/renderTextWithLinks';

interface ThreadMessage {
  id: string;
  sender_id: string;
  content: string;
  sent_at: string;
  subject: string | null;
  image_url?: string | null;
}

interface ConversationThreadProps {
  currentUserId: string;
  studentName: string;
  studentInitials: string;
  studentAvatarUrl?: string | null;
  messages: ThreadMessage[];
  onSendReply: (content: string, imageUrl?: string) => Promise<void>;
  onBack: () => void;
  sending?: boolean;
  twoWayMessaging?: boolean;
  onToggleTwoWayMessaging?: (next: boolean) => Promise<void> | void;
  canToggleTwoWayMessaging?: boolean;
}

const ConversationThread: React.FC<ConversationThreadProps> = ({
  currentUserId,
  studentName,
  studentInitials,
  studentAvatarUrl,
  messages,
  onSendReply,
  onBack,
  sending = false,
  twoWayMessaging = true,
  onToggleTwoWayMessaging,
  canToggleTwoWayMessaging = true,
}) => {
  const [replyText, setReplyText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max 5MB allowed.' });
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${currentUserId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('message-attachments').upload(path, file);
    if (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
      return null;
    }
    const { data } = supabase.storage.from('message-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSend = async () => {
    if ((!replyText.trim() && !selectedImage) || sending || uploading) return;
    
    let imageUrl: string | undefined;
    if (selectedImage) {
      setUploading(true);
      const url = await uploadImage(selectedImage);
      setUploading(false);
      if (!url) return;
      imageUrl = url;
    }

    await onSendReply(replyText.trim() || (imageUrl ? '' : ''), imageUrl);
    setReplyText('');
    removeImage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBusy = sending || uploading;
  const showReplyToggle = !!onToggleTwoWayMessaging;

  const handleToggle = async (checked: boolean) => {
    if (!onToggleTwoWayMessaging) return;
    setSavingToggle(true);
    try {
      await onToggleTwoWayMessaging(checked);
    } finally {
      setSavingToggle(false);
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
          {studentAvatarUrl && <AvatarImage src={studentAvatarUrl} alt={studentName} />}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
            {studentInitials}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold truncate">{studentName}</span>
        {showReplyToggle && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Label htmlFor="two-way-msg-thread" className="text-xs text-muted-foreground cursor-pointer">
              Allow replies
            </Label>
            <Switch
              id="two-way-msg-thread"
              checked={twoWayMessaging}
              onCheckedChange={handleToggle}
              disabled={savingToggle || !canToggleTwoWayMessaging}
            />
          </div>
        )}
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
                    {studentAvatarUrl && <AvatarImage src={studentAvatarUrl} alt={studentName} />}
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
                    {msg.image_url && (
                      <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                        <img
                          src={msg.image_url}
                          alt="Attachment"
                          className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer"
                        />
                      </a>
                    )}
                    {msg.content && renderTextWithLinks(msg.content, { isSentByMe: isMe })}
                  </div>
                  <p className={`text-[11px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                    {formatDateTimeUS(msg.sent_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-2 pb-2">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border object-cover" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Reply input */}
      <div className="border-t pt-3 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-[42px] w-[42px]"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
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
          disabled={(!replyText.trim() && !selectedImage) || isBusy}
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
