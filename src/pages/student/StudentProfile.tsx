
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User } from 'lucide-react';

const StudentProfile = () => {
  const { toast } = useToast();
  const { userData, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: userData.profile ? `${userData.profile.first_name || ''} ${userData.profile.last_name || ''}`.trim() : '',
    email: userData.profile?.email || '',
    phone: userData.profile?.phone || '',
    bio: userData.profile?.bio || 'No bio provided yet.',
  });

  const [formData, setFormData] = useState({...profile});
  
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
      
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone,
        bio: formData.bio
      });
      
      setProfile({...formData});
      setIsEditing(false);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout sidebarContent={<StudentNavigation />} userType="student">
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your personal information
          </p>
        </section>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Manage your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center pb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback className="text-2xl bg-deckademics-primary text-primary-foreground">
                        {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
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
                        placeholder="Tell us about yourself and your DJ interests" 
                        rows={4} 
                        value={formData.bio} 
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
                        setFormData({...profile});
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
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Your course details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center flex-col py-8 text-center">
                  <p className="text-muted-foreground">
                    No course information available yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Course details will appear here once you're enrolled.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
                <CardDescription>
                  Your assigned instructor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center flex-col py-8 text-center">
                  <p className="text-muted-foreground">
                    No instructor assigned yet.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Instructor information will appear here once assigned.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
