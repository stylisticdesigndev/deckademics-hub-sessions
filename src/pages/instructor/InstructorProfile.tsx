
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InstructorNavigation } from '@/components/navigation/InstructorNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

const fallbackSchedule = [
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
  const [teachingSchedule, setTeachingSchedule] = useState(fallbackSchedule);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    startDate: '',
    expertiseAreas: '',
  });

  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);

        // Fetch instructor specific data
        const { data: instructorData, error: instructorError } = await supabase
          .from('instructors')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (instructorError && instructorError.code !== 'PGRST116') {
          console.error('Error fetching instructor data:', instructorError);
        }

        // Set instructor data if available
        if (instructorData) {
          setInstructorData(instructorData);

          // Teaching schedule: if a schedule column is implemented/future-proofed, you could store per-user JSON schedule.
          // Fallback to hardcoded (mock) otherwise.
          if (instructorData.schedule && Array.isArray(instructorData.schedule)) {
            setTeachingSchedule(instructorData.schedule);
          } else {
            setTeachingSchedule(fallbackSchedule);
          }
        } else {
          setTeachingSchedule(fallbackSchedule);
        }

        const name = userData?.profile
          ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim()
          : session.user?.user_metadata
            ? `${session.user.user_metadata.first_name || ''} ${session.user.user_metadata.last_name || ''}`.trim()
            : '';

        setProfile(prev => ({
          ...prev,
          name: name || 'Instructor',
          email: userData?.profile?.email || session.user?.email || '',
          phone: userData?.profile?.phone || '',
          bio: instructorData?.bio || 'No bio provided yet.',
          expertiseAreas: instructorData?.specialties ? instructorData.specialties.join(', ') : '',
        }));

        setFormData(prev => ({
          ...prev,
          name: name || 'Instructor',
          email: userData?.profile?.email || session.user?.email || '',
          phone: userData?.profile?.phone || '',
          bio: instructorData?.bio || 'No bio provided yet.',
          expertiseAreas: instructorData?.specialties ? instructorData.specialties.join(', ') : '',
        }));
      } catch (error) {
        console.error('Error in fetchInstructorData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Extract first and last name from the full name
      const nameParts = formData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update user profile
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone,
      });

      // Update instructor specific data
      if (session?.user?.id) {
        const { error: instructorError } = await supabase
          .from('instructors')
          .update({
            bio: formData.bio,
            specialties: formData.expertiseAreas.split(',').map(s => s.trim()).filter(s => s !== '')
          })
          .eq('id', session.user.id);

        if (instructorError) {
          console.error('Error updating instructor data:', instructorError);
          throw instructorError;
        }
      }

      setProfile({ ...formData });
      setIsEditing(false);

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error updating profile',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout sidebarContent={<InstructorNavigation />} userType="instructor">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Instructor Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and schedule
          </p>
        </section>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-2">
              <form onSubmit={handleSubmit}>
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your profile details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center pb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="text-2xl bg-deckademics-accent text-primary-foreground">
                          {getInitials(profile.name)}
                        </AvatarFallback>
                      </Avatar>

                      {isEditing ? (
                        <Button type="button" variant="outline">
                          Upload New Photo
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="name"
                              name="name"
                              placeholder="Your name"
                              className="pl-10"
                              value={formData.name}
                              onChange={handleChange}
                              disabled={!isEditing}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="Your email"
                              className="pl-10"
                              value={formData.email}
                              onChange={handleChange}
                              disabled={true}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="phone"
                            name="phone"
                            placeholder="Your phone number"
                            className="pl-10"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          placeholder="Tell us about your DJ experience and teaching philosophy"
                          rows={4}
                          value={formData.bio}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expertiseAreas">Areas of Expertise</Label>
                        <Input
                          id="expertiseAreas"
                          name="expertiseAreas"
                          placeholder="List your areas of expertise (comma separated)"
                          value={formData.expertiseAreas}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button type="button" variant="outline" onClick={() => {
                          setIsEditing(false);
                          setFormData({ ...profile });
                        }}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </form>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Schedule</CardTitle>
                  <CardDescription>
                    Your weekly hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teachingSchedule.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{slot.day}</p>
                          <p className="text-sm text-muted-foreground">{slot.hours}</p>
                        </div>
                      </div>
                    ))}

                    <Button variant="outline" className="w-full">
                      Edit Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorProfile;

