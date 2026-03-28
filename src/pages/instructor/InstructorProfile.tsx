import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User, Calendar, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { ScheduleEditor } from '@/components/instructor/ScheduleEditor';
import { mockInstructorProfile } from '@/data/mockInstructorData';

type TeachingScheduleItem = {
  day: string;
  hours: string;
};

const fallbackSchedule: TeachingScheduleItem[] = [
  { day: 'Monday', hours: '2:00 PM - 8:00 PM' },
  { day: 'Wednesday', hours: '2:00 PM - 8:00 PM' },
  { day: 'Friday', hours: '3:00 PM - 9:00 PM' },
];

const InstructorProfile = () => {
  const { toast } = useToast();
  const { userData, session, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instructorData, setInstructorData] = useState<any>(null);
  const [teachingSchedule, setTeachingSchedule] = useState<TeachingScheduleItem[]>(fallbackSchedule);
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', bio: '', startDate: '', expertiseAreas: '',
  });
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    if (demoMode) {
      setProfile({
        name: mockInstructorProfile.name,
        email: mockInstructorProfile.email,
        phone: mockInstructorProfile.phone,
        bio: mockInstructorProfile.bio,
        startDate: '',
        expertiseAreas: mockInstructorProfile.expertiseAreas,
      });
      setFormData({
        name: mockInstructorProfile.name,
        email: mockInstructorProfile.email,
        phone: mockInstructorProfile.phone,
        bio: mockInstructorProfile.bio,
        startDate: '',
        expertiseAreas: mockInstructorProfile.expertiseAreas,
      });
      setTeachingSchedule(mockInstructorProfile.schedule);
      setLoading(false);
      return;
    }

    const fetchInstructorData = async () => {
      if (!session?.user?.id) return;
      try {
        setLoading(true);
        const { data: instrData, error: instructorError } = await supabase
          .from('instructors').select('*').eq('id', session.user.id).maybeSingle();
        if (instructorError && instructorError.code !== 'PGRST116') {
          console.error('Error fetching instructor data:', instructorError);
        }
        setInstructorData(instrData);

        try {
          const { data: scheduleRows } = await supabase
            .from('instructor_schedules').select('day,hours').eq('instructor_id', session.user.id);
          if (scheduleRows && Array.isArray(scheduleRows) && scheduleRows.length > 0) {
            setTeachingSchedule(scheduleRows.map(s => ({ day: s.day, hours: s.hours })));
          } else {
            setTeachingSchedule(fallbackSchedule);
          }
        } catch { setTeachingSchedule(fallbackSchedule); }

        const name = userData?.profile
          ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim()
          : session.user?.user_metadata
            ? `${session.user.user_metadata.first_name || ''} ${session.user.user_metadata.last_name || ''}`.trim()
            : '';

        const profileObj = {
          name: name || 'Instructor',
          email: userData?.profile?.email || session.user?.email || '',
          phone: (userData?.profile as any)?.phone || '',
          bio: instrData?.bio || 'No bio provided yet.',
          startDate: '',
          expertiseAreas: instrData?.specialties ? instrData.specialties.join(', ') : '',
        };
        setProfile(profileObj);
        setFormData(profileObj);
      } catch (error) {
        console.error('Error in fetchInstructorData:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructorData();
  }, [session, userData, demoMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoMode) {
      toast({ title: 'Demo Mode', description: 'Changes are not saved in demo mode.' });
      return;
    }
    try {
      const nameParts = formData.name.split(' ');
      await updateProfile({ first_name: nameParts[0] || '', last_name: nameParts.slice(1).join(' ') || '', phone: formData.phone });
      if (session?.user?.id) {
        const { error } = await supabase.from('instructors').update({
          bio: formData.bio,
          specialties: formData.expertiseAreas.split(',').map(s => s.trim()).filter(s => s !== '')
        }).eq('id', session.user.id);
        if (error) throw error;
      }
      setProfile({ ...formData });
      setIsEditing(false);
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error updating profile', description: 'Failed to update profile. Please try again.', variant: 'destructive' });
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const isLoading = !demoMode && loading;

  return (
    <div className="space-y-6">
      {demoMode && (
        <Alert className="bg-warning/10 border-warning/30">
          <Eye className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Demo Mode Active</AlertTitle>
          <AlertDescription>Showing sample profile. Click "Live Data" to switch back.</AlertDescription>
        </Alert>
      )}

      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your personal information and schedule</p>
        </div>
        <Button
          variant={demoMode ? "default" : "outline"} size="sm"
          onClick={() => { setDemoMode(!demoMode); setIsEditing(false); }} className="flex items-center gap-2"
        >
          {demoMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {demoMode ? 'Live Data' : 'Demo'}
        </Button>
      </section>

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <Skeleton className="h-[400px] md:col-span-2 rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center pb-4">
                    {isEditing && !demoMode ? (
                      <AvatarUpload
                        currentUrl={userData?.profile?.avatar_url}
                        onUpload={async (url) => { try { await updateProfile({ avatar_url: url }); } catch (e) { console.error('Error updating avatar:', e); } }}
                        initials={getInitials(profile.name)}
                      />
                    ) : (
                      <Avatar className="h-24 w-24">
                        {!demoMode && userData?.profile?.avatar_url ? <AvatarImage src={userData.profile.avatar_url} alt="Profile photo" /> : null}
                        <AvatarFallback className="text-2xl bg-deckademics-accent text-primary-foreground">{getInitials(profile.name)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="name" name="name" placeholder="Your name" className="pl-10" value={formData.name} onChange={handleChange} disabled={!isEditing || demoMode} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="email" name="email" type="email" className="pl-10" value={formData.email} disabled={true} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input id="phone" name="phone" className="pl-10" value={formData.phone} onChange={handleChange} disabled={!isEditing || demoMode} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} disabled={!isEditing || demoMode} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expertiseAreas">Areas of Expertise</Label>
                      <Input id="expertiseAreas" name="expertiseAreas" value={formData.expertiseAreas} onChange={handleChange} disabled={!isEditing || demoMode} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  {!demoMode && (isEditing ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setFormData({ ...profile }); }}>Cancel</Button>
                      <Button type="submit"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  ))}
                </CardFooter>
              </Card>
            </form>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Schedule</CardTitle>
                <CardDescription>Your weekly hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teachingSchedule.length > 0 ? (
                    teachingSchedule.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{slot.day}</p>
                          <p className="text-sm text-muted-foreground">{slot.hours}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 text-muted-foreground">No teaching schedule set up yet.</div>
                  )}
                  {!demoMode && (
                    <Button variant="outline" className="w-full" onClick={() => setIsScheduleEditorOpen(true)}>Edit Schedule</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!demoMode && (
        <ScheduleEditor
          open={isScheduleEditorOpen}
          onOpenChange={setIsScheduleEditorOpen}
          scheduleItems={teachingSchedule}
          instructorId={session?.user?.id || ''}
          onScheduleUpdated={(newSchedule) => setTeachingSchedule(newSchedule)}
        />
      )}
    </div>
  );
};

export default InstructorProfile;
