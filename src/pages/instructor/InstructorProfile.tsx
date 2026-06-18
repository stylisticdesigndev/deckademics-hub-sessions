import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User, Calendar, UserCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { DAY_ORDER, sanitizeScheduleItems, CLASS_SLOTS } from '@/utils/instructorSchedule';
import { PasskeyManager } from '@/components/profile/PasskeyManager';
import NotificationPreferencesCard from '@/components/student/profile/NotificationPreferencesCard';

type TeachingScheduleItem = {
  day: string;
  hours: string;
};

const fallbackSchedule: TeachingScheduleItem[] = [];

const InstructorProfile = () => {
  const { toast } = useToast();
  const { userData, session, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instructorData, setInstructorData] = useState<any>(null);
  const [teachingSchedule, setTeachingSchedule] = useState<TeachingScheduleItem[]>(fallbackSchedule);

  const [profile, setProfile] = useState({
    firstName: '', lastName: '', djName: '', email: '', phone: '', pronouns: '', bio: '', startDate: '', expertiseAreas: '',
  });
  const [formData, setFormData] = useState({ ...profile });
  const [privacy, setPrivacy] = useState({ hidePhone: false, hideEmail: false });
  const [initialPrivacy, setInitialPrivacy] = useState({ hidePhone: false, hideEmail: false });
  const privacyDirty = privacy.hidePhone !== initialPrivacy.hidePhone || privacy.hideEmail !== initialPrivacy.hideEmail;

  useEffect(() => {
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
        const loadedPrivacy = {
          hidePhone: !!(instrData as any)?.hide_phone,
          hideEmail: !!(instrData as any)?.hide_email,
        };
        setPrivacy(loadedPrivacy);
        setInitialPrivacy(loadedPrivacy);

        try {
          // Derive teaching schedule from assigned students' class_day/class_time
          const { data: studentRows } = await supabase
            .from('students')
            .select('class_day, class_time')
            .eq('instructor_id', session.user.id);

          if (studentRows && studentRows.length > 0) {
            const dayMap = new Map<string, Set<string>>();
            for (const s of studentRows) {
              if (!s.class_day || !s.class_time) continue;
              if (!dayMap.has(s.class_day)) dayMap.set(s.class_day, new Set());
              dayMap.get(s.class_day)!.add(s.class_time);
            }
            const items: TeachingScheduleItem[] = Array.from(dayMap.entries()).map(([day, slots]) => ({
              day,
              hours: Array.from(slots)
                .sort((a, b) => CLASS_SLOTS.indexOf(a as any) - CLASS_SLOTS.indexOf(b as any))
                .join(', '),
            }));
            setTeachingSchedule(sanitizeScheduleItems(items));
          } else {
            setTeachingSchedule(fallbackSchedule);
          }
        } catch { setTeachingSchedule(fallbackSchedule); }

        const profileObj = {
          firstName: userData?.profile?.first_name || session.user?.user_metadata?.first_name || '',
          lastName: userData?.profile?.last_name || session.user?.user_metadata?.last_name || '',
          djName: (userData?.profile as any)?.dj_name || session.user?.user_metadata?.dj_name || '',
          email: userData?.profile?.email || session.user?.email || '',
          phone: (userData?.profile as any)?.phone || '',
          pronouns: (userData?.profile as any)?.pronouns || '',
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
  }, [session, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        dj_name: formData.djName.trim() || null,
        phone: formData.phone,
        pronouns: formData.pronouns,
      } as any);
      if (session?.user?.id) {
        const { error } = await supabase.from('instructors').update({
          bio: formData.bio,
          specialties: formData.expertiseAreas.split(',').map(s => s.trim()).filter(s => s !== ''),
          hide_phone: privacy.hidePhone,
          hide_email: privacy.hideEmail,
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

  const isLoading = loading;

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your personal information and schedule</p>
        </div>
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
                    <AvatarUpload
                      currentUrl={userData?.profile?.avatar_url}
                      onUpload={async (url) => { try { await updateProfile({ avatar_url: url }); } catch (e) { console.error('Error updating avatar:', e); } }}
                      initials={getInitials(`${profile.firstName} ${profile.lastName}`.trim())}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="firstName" name="firstName" placeholder="First name" className="pl-10" value={formData.firstName} onChange={handleChange} disabled={!isEditing} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="lastName" name="lastName" placeholder="Last name" className="pl-10" value={formData.lastName} onChange={handleChange} disabled={!isEditing} />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="djName">DJ Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input id="djName" name="djName" placeholder="DJ Stagename" className="pl-10" value={formData.djName} onChange={handleChange} disabled={!isEditing} />
                        </div>
                        <p className="text-xs text-muted-foreground">This is the name students will see across the app.</p>
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
                        <Input id="phone" name="phone" className="pl-10" value={formData.phone} onChange={handleChange} disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pronouns">Pronouns</Label>
                      <div className="relative">
                        <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input id="pronouns" name="pronouns" placeholder="she/her, he/him, they/them..." className="pl-10" value={formData.pronouns} onChange={handleChange} disabled={!isEditing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} disabled={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expertiseAreas">Areas of Expertise</Label>
                      <Input id="expertiseAreas" name="expertiseAreas" value={formData.expertiseAreas} onChange={handleChange} disabled={!isEditing} />
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Schedule</CardTitle>
                <CardDescription>Auto-generated from assigned classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teachingSchedule.filter(s => s.hours && s.hours.trim() !== '').length > 0 ? (
                    teachingSchedule
                      .filter(s => s.hours && s.hours.trim() !== '')
                      .map((slot, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{slot.day}</p>
                          {slot.hours.split(', ').filter(Boolean).map((time, i) => (
                            <p key={i} className="text-sm text-muted-foreground">{time}</p>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 text-muted-foreground text-sm">No classes assigned yet. Your schedule will appear here once students are assigned.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy</CardTitle>
                <CardDescription>Control what students see on your profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="hide-phone" className="text-sm font-medium">Hide phone number</Label>
                    <p className="text-xs text-muted-foreground">Students won't see your phone</p>
                  </div>
                  <Switch
                    id="hide-phone"
                    checked={privacy.hidePhone}
                    onCheckedChange={(v) => setPrivacy(p => ({ ...p, hidePhone: !!v }))}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="hide-email" className="text-sm font-medium">Hide email address</Label>
                    <p className="text-xs text-muted-foreground">Students won't see your email</p>
                  </div>
                  <Switch
                    id="hide-email"
                    checked={privacy.hideEmail}
                    onCheckedChange={(v) => setPrivacy(p => ({ ...p, hideEmail: !!v }))}
                  />
                </div>
                <Button
                    type="button"
                    size="sm"
                    disabled={!privacyDirty}
                    onClick={async () => {
                      if (!session?.user?.id) return;
                      const { error } = await supabase.from('instructors').update({
                        hide_phone: privacy.hidePhone,
                        hide_email: privacy.hideEmail,
                      }).eq('id', session.user.id);
                      if (error) {
                        toast({ title: 'Error', description: 'Could not save privacy settings.', variant: 'destructive' });
                      } else {
                        setInitialPrivacy({ hidePhone: privacy.hidePhone, hideEmail: privacy.hideEmail });
                        toast({ title: 'Privacy updated', description: 'Your visibility settings have been saved.' });
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />Save Privacy
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <div className="max-w-2xl">
        <PasskeyManager />
      </div>
      <div className="max-w-2xl">
        <NotificationPreferencesCard />
      </div>
    </div>
  );
};

export default InstructorProfile;
