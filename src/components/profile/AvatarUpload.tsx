
import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Loader2, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  required?: boolean;
  showError?: boolean;
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentUrl,
  onUpload,
  required = false,
  showError = false,
  initials = '?',
  size = 'md',
}) => {
  const { session } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a JPEG, PNG, or WebP image.', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be under 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({ title: 'Upload failed', description: error?.message || 'Could not upload photo. Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          {currentUrl ? (
            <AvatarImage src={currentUrl} alt="Profile photo" />
          ) : null}
          <AvatarFallback className={`${textSizeClasses[size]} bg-primary text-primary-foreground`}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <Camera className="h-4 w-4 mr-1" />
        {currentUrl ? 'Change Photo' : 'Upload Photo'}
      </Button>

      {required && showError && !currentUrl && (
        <p className="text-sm text-destructive">Profile photo is required</p>
      )}
    </div>
  );
};
