
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentNavigation } from '@/components/navigation/StudentNavigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AtSign, Phone, Save, User } from 'lucide-react';

const StudentProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '(555) 123-4567',
    bio: 'Aspiring DJ with a passion for electronic music and hip-hop. Currently focused on improving scratching and beat matching skills.',
    startDate: 'January 15, 2025',
    level: 'Intermediate',
    instructor: {
      name: 'DJ Rhythm',
      email: 'dj.rhythm@deckademics.com',
      phone: '(555) 987-6543',
      scheduleLink: '#'
    }
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
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{profile.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                  <p className="font-medium">{profile.level}</p>
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
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-deckademics-accent/20 text-deckademics-accent">
                      DR
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.instructor.name}</p>
                    <p className="text-xs text-muted-foreground">Primary Instructor</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.instructor.email}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.instructor.phone}</p>
                </div>
                
                <Button variant="outline" className="w-full">
                  View Schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
