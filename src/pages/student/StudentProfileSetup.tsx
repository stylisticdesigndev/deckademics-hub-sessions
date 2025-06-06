
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const StudentProfileSetup = () => {
  const { userData, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: userData.profile?.first_name || '',
    last_name: userData.profile?.last_name || '',
    email: userData.profile?.email || '',
    bio: '',
    phone: ''
  });
  
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
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        bio: formData.bio
      });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been set up successfully!',
      });
      
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSkip = () => {
    navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-deckademics-dark">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome to Deckademics!</CardTitle>
              <CardDescription>
                Complete your profile to get started
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center pb-6">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarFallback className="text-2xl bg-deckademics-primary text-primary-foreground">
                      {formData.first_name && formData.last_name 
                        ? formData.first_name[0] + formData.last_name[0] 
                        : 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <Button type="button" variant="outline">
                    Upload Photo
                  </Button>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input 
                      id="first_name" 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleChange}
                      placeholder="Your first name" 
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input 
                      id="last_name" 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleChange}
                      placeholder="Your last name" 
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={formData.email}
                    disabled
                    placeholder="Your email" 
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    placeholder="Your phone number" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange}
                    placeholder="Tell us about yourself and your DJ interests" 
                    rows={4} 
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button type="button" variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button type="submit">
                  Save & Continue
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileSetup;
