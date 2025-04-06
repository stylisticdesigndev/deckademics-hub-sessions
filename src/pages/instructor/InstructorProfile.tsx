
import React, { useState } from 'react';
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

const InstructorProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Prof. Smith',
    email: 'prof.smith@deckademics.com',
    phone: '(555) 234-5678',
    bio: 'Professional DJ with over 10 years of experience. Specialized in hip-hop and electronic music production. Passionate about teaching the next generation of DJs.',
    startDate: 'January 5, 2023',
    expertiseAreas: 'Beat Matching, Scratching, Music Production',
    schedule: [
      { day: 'Monday', hours: '2:00 PM - 8:00 PM' },
      { day: 'Wednesday', hours: '2:00 PM - 8:00 PM' },
      { day: 'Friday', hours: '3:00 PM - 9:00 PM' },
    ]
  });

  const [formData, setFormData] = useState({...profile});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({...formData});
    setIsEditing(false);
    
    toast({
      title: 'Profile updated',
      description: 'Your profile has been updated successfully.',
    });
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
                        {profile.name.split(' ').map(n => n[0]).join('')}
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
                            disabled={!isEditing} 
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
                        placeholder="List your areas of expertise"
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
                <CardTitle>Teaching Schedule</CardTitle>
                <CardDescription>
                  Your weekly hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.schedule.map((slot, index) => (
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
      </div>
    </DashboardLayout>
  );
};

export default InstructorProfile;
