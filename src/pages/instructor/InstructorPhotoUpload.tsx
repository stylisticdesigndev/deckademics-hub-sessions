import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { useAuth } from '@/providers/AuthProvider';
import { Camera, Loader2 } from 'lucide-react';

const InstructorPhotoUpload = () => {
  const { userData, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userData?.profile?.avatar_url || null);
  const [saving, setSaving] = useState(false);

  const initials = `${userData?.profile?.first_name?.[0] || ''}${userData?.profile?.last_name?.[0] || ''}`.toUpperCase() || '?';

  const handleUpload = (url: string) => {
    setAvatarUrl(url);
  };

  const handleContinue = async () => {
    if (!avatarUrl || saving) return;
    setSaving(true);
    try {
      await updateProfile({ avatar_url: avatarUrl });
      navigate('/instructor/dashboard', { replace: true });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Camera className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Upload Your Photo</CardTitle>
          <CardDescription>
            Please upload a profile photo before continuing. This helps students and admins identify you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <AvatarUpload
            currentUrl={avatarUrl}
            onUpload={handleUpload}
            required
            showError={false}
            initials={initials}
            size="lg"
          />
          <Button
            className="w-full"
            size="lg"
            disabled={!avatarUrl || saving}
            onClick={handleContinue}
          >
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Continue to Dashboard'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorPhotoUpload;
