import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Save, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

const AdminProfile = () => {
  const { toast } = useToast();
  const { userData, session, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({ name: '', email: '', bio: '' });
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);

    const name = userData?.profile
      ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim()
      : '';

    const profileObj = {
      name: name || 'Admin',
      email: userData?.profile?.email || session.user?.email || '',
      bio: userData?.profile?.bio || '',
    };
    setProfile(profileObj);
    setFormData(profileObj);
    setLoading(false);
  }, [session, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nameParts = formData.name.split(' ');
      await updateProfile({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        bio: formData.bio,
      });
      setProfile({ ...formData });
      setIsEditing(false);
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error updating profile', description: 'Failed to update profile. Please try again.', variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Admin Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information</p>
      </section>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center pb-4">
                <AvatarUpload
                  currentUrl={userData?.profile?.avatar_url}
                  onUpload={async (url) => {
                    try { await updateProfile({ avatar_url: url }); } catch (e) { console.error('Error updating avatar:', e); }
                  }}
                  initials={getInitials(profile.name)}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="name" name="name" placeholder="Your name" className="pl-10" value={formData.name} onChange={handleChange} disabled={!isEditing} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input id="email" name="email" type="email" className="pl-10" value={formData.email} disabled={true} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} disabled={!isEditing} placeholder="Tell us about yourself..." />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ ...profile }); }}>Cancel</Button>
                  <Button type="submit"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
